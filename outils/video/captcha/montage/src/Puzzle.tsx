// Le captcha « puzzle » (dans la fenêtre sombre, Sombre.tsx) : l'image avec trois trous en forme de pièce (assombris, cerclés de
// blanc) et les trois pièces à côté ; le doigt en porte deux à leur place, la dernière glisse avec le curseur du bas (comme le vrai).
import React from "react";
import { Img, staticFile } from "remotion";
import { cadrage } from "./Intro";
import { CadreSombre } from "./Sombre";
import { borne, contourPiece, glisse, lerp, Piece, PropsIntro, ressort } from "./theme";

/** Où est la pièce à l'instant t (repère de la zone), et si le doigt la tient. */
function position(pc: Piece, t: number) {
  const u = glisse(borne((t - pc.t0) / (pc.t1 - pc.t0)));
  return { x: lerp(pc.px, pc.hx, u), y: lerp(pc.py, pc.hy, u), tenue: t >= pc.t0 && t < pc.t1, posee: t >= pc.t1 ? t - pc.t1 : -1 };
}

export const Puzzle: React.FC<{ p: PropsIntro; t: number }> = ({ p, t }) => {
  const z = p.zone, s = p.cote ?? 176, m = Math.round(s * 0.3);
  const pieces = p.pieces ?? [];
  const src = staticFile(p.image);
  const { k, x: ix, y: iy } = cadrage(p);
  const derniere = Math.max(...pieces.map((pc) => pc.t1));
  const traits = 1 - borne((t - derniere - 0.04) / 0.16); // les contours blancs s'effacent une fois tout en place
  const finie = traits <= 0;
  const glissee = pieces.find((pc) => pc.curseur);
  const avance = glissee ? position(glissee, t).x - glissee.px : 0;

  return (
    <CadreSombre p={p} t={t} avance={avance}>
      <div style={{ position: "absolute", left: z.x, top: z.y, width: z.w, height: z.h, borderRadius: 14, overflow: "hidden" }}>
        <Img src={src} style={{ position: "absolute", left: ix, top: iy, width: 1080 * k, height: 1920 * k, maxWidth: "none" }} />
        {!finie && (
          <svg width={z.w} height={z.h} style={{ position: "absolute", left: 0, top: 0 }}>
            {pieces.map((pc, n) => (
              <path key={n} d={contourPiece(s, m, pc.bords)} transform={`translate(${pc.hx - m} ${pc.hy - m})`}
                fill="rgba(10,14,22,0.55)" stroke="#fff" strokeOpacity={0.9 * (t >= pc.t1 ? traits : 1)} strokeWidth={3} />
            ))}
          </svg>
        )}
        {!finie && pieces.map((pc, n) => ({ pc, n, ...position(pc, t) }))
          .sort((a, b) => Number(a.tenue) - Number(b.tenue))
          .map(({ pc, n, x, y, tenue, posee }) => {
            const d = contourPiece(s, m, pc.bords);
            const rebond = posee >= 0 && posee < 0.3 ? 1 + 0.07 * (1 - ressort(posee, 520, 22)) : 1;
            const echelle = tenue && !pc.curseur ? 1.06 : rebond;
            const eclat = posee >= 0 ? 0.3 * (1 - borne(posee / 0.16)) : 0;
            const ombre = posee >= 0 ? 0.55 * traits * (1 - borne(posee / 0.2)) : 0.55;
            return (
              <div key={n} style={{ position: "absolute", left: x - m, top: y - m, width: s + 2 * m, height: s + 2 * m,
                transform: `scale(${echelle})`, filter: ombre > 0.01 ? `drop-shadow(0 10px 16px rgba(0,0,0,${ombre}))` : "none" }}>
                <div style={{ position: "absolute", inset: 0, clipPath: `path("${d}")` }}>
                  <Img src={src} style={{ position: "absolute", left: ix - (pc.hx - m), top: iy - (pc.hy - m), width: 1080 * k, height: 1920 * k, maxWidth: "none" }} />
                  {eclat > 0 && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: eclat }} />}
                </div>
                <svg width={s + 2 * m} height={s + 2 * m} style={{ position: "absolute", left: 0, top: 0, opacity: traits }}>
                  <path d={d} fill="none" stroke="#fff" strokeWidth={3.5} />
                </svg>
              </div>
            );
          })}
      </div>
    </CadreSombre>
  );
};
