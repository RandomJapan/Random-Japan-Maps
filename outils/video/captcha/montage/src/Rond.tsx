// Le captcha « rond » (dans la fenêtre sombre, Sombre.tsx), comme « Drag the slider to fit the puzzle » : l'image dans un grand
// rond, et son milieu (un rond plus petit) tourné ; le doigt tire le curseur en trois fois (trop loin, puis il corrige) et le milieu
// tourne avec lui jusqu'à retrouver sa place. Un clic à chaque fois que le doigt lâche.
import React from "react";
import { Img, staticFile } from "remotion";
import { cadrage } from "./Intro";
import { CadreSombre } from "./Sombre";
import { borne, glisse, lerp, PropsIntro, ressort } from "./theme";

/** Où en est le curseur (0 au départ, 1 quand le milieu est à sa place) à l'instant t. */
export function progression(etapes: { t0: number; t1: number; de: number; a: number }[], t: number) {
  let p = etapes[0].de;
  for (const e of etapes) {
    if (t < e.t0) break;
    p = lerp(e.de, e.a, glisse(borne((t - e.t0) / (e.t1 - e.t0))));
  }
  return p;
}

export const Rond: React.FC<{ p: PropsIntro; t: number }> = ({ p, t }) => {
  const z = p.zone, r = p.rond!;
  const src = staticFile(p.image);
  const { k, x: ix, y: iy } = cadrage(p);
  const avancee = progression(r.etapes, t);
  const angle = r.angle0 * (1 - avancee);
  const derniere = r.etapes[r.etapes.length - 1].t1;
  const posee = t - derniere;
  const traits = 1 - borne((posee - 0.04) / 0.16);
  const finie = traits <= 0;
  const di = z.w * r.interieur, o = (z.w - di) / 2;
  const rebond = posee >= 0 && posee < 0.3 ? 1 + 0.035 * (1 - ressort(posee, 520, 22)) : 1;
  const eclat = posee >= 0 ? 0.3 * (1 - borne(posee / 0.16)) : 0;

  return (
    <CadreSombre p={p} t={t} avance={avancee * r.course}>
      <div style={{ position: "absolute", left: z.x, top: z.y, width: z.w, height: z.h, borderRadius: "50%", overflow: "hidden" }}>
        <Img src={src} style={{ position: "absolute", left: ix, top: iy, width: 1080 * k, height: 1920 * k, maxWidth: "none" }} />
        {!finie && (
          <>
            <div style={{ position: "absolute", left: o, top: o, width: di, height: di, borderRadius: "50%",
              boxShadow: `0 0 34px 6px rgba(0,0,0,${0.55 * traits})` }} />
            <div style={{ position: "absolute", left: o, top: o, width: di, height: di, borderRadius: "50%", overflow: "hidden",
              transform: `rotate(${angle}deg) scale(${rebond})` }}>
              <Img src={src} style={{ position: "absolute", left: ix - o, top: iy - o, width: 1080 * k, height: 1920 * k, maxWidth: "none" }} />
              {eclat > 0 && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: eclat }} />}
            </div>
            <div style={{ position: "absolute", left: o, top: o, width: di, height: di, borderRadius: "50%", boxSizing: "border-box",
              border: `3px solid rgba(255,255,255,${0.9 * traits})` }} />
          </>
        )}
      </div>
    </CadreSombre>
  );
};
