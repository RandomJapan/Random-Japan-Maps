// Le captcha « puzzle » (générique, aucun logo) : une fenêtre sombre, l'accroche en blanc et une croix, l'image avec trois trous en
// forme de pièce (assombris, cerclés de blanc) et les trois pièces à côté ; le doigt en porte deux à leur place, la dernière
// glisse avec le curseur du bas (comme le vrai). Puis l'accroche devient « Verified ✓ » en vert et le curseur se remplit de vert.
import React from "react";
import { Img, staticFile } from "remotion";
import { cadrage } from "./Intro";
import { Alerte, Casque, Coche, Croix, Fleche, Recharger } from "./Icones";
import { ajuster } from "./texte";
import { borne, contourPiece, EMOJI, glisse, lerp, Piece, PropsIntro, ressort, TIKTOK } from "./theme";

const FOND = "#1f1f1f", PISTE = "#3a3a3a", POIGNEE = "#5b5b5b", VERT = "#2bbf62";
const POLICE = `${TIKTOK}, ${EMOJI}, sans-serif`;

/** Où est la pièce à l'instant t (repère de la zone), et si le doigt la tient. */
function position(pc: Piece, t: number) {
  const u = glisse(borne((t - pc.t0) / (pc.t1 - pc.t0)));
  return { x: lerp(pc.px, pc.hx, u), y: lerp(pc.py, pc.hy, u), tenue: t >= pc.t0 && t < pc.t1, posee: t >= pc.t1 ? t - pc.t1 : -1 };
}

export const Puzzle: React.FC<{ p: PropsIntro; t: number }> = ({ p, t }) => {
  const f = p.fenetre, z = p.zone, s = p.cote ?? 176, m = Math.round(s * 0.3);
  const pieces = p.pieces ?? [];
  const src = staticFile(p.image);
  const { k, x: ix, y: iy } = cadrage(p);
  const v = p.temps.verifie;
  const vert = borne((t - v) / 0.1);
  const derniere = Math.max(...pieces.map((pc) => pc.t1));
  const traits = 1 - borne((t - derniere - 0.04) / 0.16); // les contours blancs s'effacent une fois tout en place
  const finie = traits <= 0;
  const g = ajuster(p.accroche, z.w - 96, 72, 50, 0.55);
  const pad = z.x - f.x;
  const cur = p.curseur!;
  const glissee = pieces.find((pc) => pc.curseur);
  const avance = glissee ? position(glissee, t).x - glissee.px : 0;
  const poignee = 150;

  return (
    <>
      <div style={{ position: "absolute", left: f.x, top: f.y, width: f.w, height: f.h, background: FOND, borderRadius: 30,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }} />
      {/* l'accroche et la croix, puis « Verified ✓ » */}
      <div style={{ position: "absolute", left: z.x, top: f.y + 26, width: z.w - 80, height: z.y - f.y - 38, display: "flex",
        flexDirection: "column", justifyContent: "center", color: "#fff", fontFamily: POLICE, fontWeight: 700, opacity: t >= v ? 0 : 1 }}>
        {g.lignes.map((ligne, n) => <div key={n} style={{ fontSize: g.taille, lineHeight: 1.08, whiteSpace: "nowrap" }}>{ligne}</div>)}
      </div>
      {t >= v && (
        <div style={{ position: "absolute", left: z.x, top: f.y + 26, height: z.y - f.y - 38, display: "flex", alignItems: "center", gap: 18,
          color: VERT, fontFamily: POLICE, fontWeight: 900, fontSize: 84, transform: `scale(${0.7 + 0.3 * ressort(t - v)})`,
          transformOrigin: "0% 50%", opacity: borne(ressort(t - v) * 1.5) }}>
          Verified
          <Coche taille={86} couleur={VERT} epaisseur={3.6} />
        </div>
      )}
      <div style={{ position: "absolute", left: f.x + f.w - pad - 50, top: f.y + 38 }}>
        <Croix taille={50} couleur="#e8e8e8" />
      </div>

      {/* l'image, ses trous, ses pièces */}
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

      {/* le curseur : la poignée suit la dernière pièce, puis tout passe au vert */}
      <div style={{ position: "absolute", left: cur.x, top: cur.y, width: cur.w, height: cur.h, borderRadius: cur.h / 2, background: PISTE, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: cur.h, width: poignee + avance, borderRadius: cur.h / 2,
          background: vert > 0 ? VERT : "rgba(255,255,255,0.06)" }} />
      </div>
      <div style={{ position: "absolute", left: cur.x + avance, top: cur.y, width: poignee, height: cur.h, borderRadius: cur.h / 2,
        background: vert > 0 ? "#fff" : POIGNEE, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 3px 10px rgba(0,0,0,0.35)" }}>
        {vert > 0 ? <Coche taille={52} couleur={VERT} epaisseur={3.4} /> : <Fleche taille={50} couleur="#fff" />}
      </div>

      {/* le bas : l'audio, un code, recharger, l'alerte */}
      <div style={{ position: "absolute", left: z.x, top: cur.y + cur.h + 22, width: z.w, height: 52, display: "flex", alignItems: "center",
        color: "#fff", fontFamily: POLICE, fontWeight: 700, fontSize: 34 }}>
        <Casque taille={44} couleur="#fff" />
        <span style={{ marginLeft: 14 }}>Audio</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: "#8b8b8b", fontSize: 19, fontWeight: 500, letterSpacing: 0.5, marginRight: 22 }}>{p.code ?? ""}</span>
        <Recharger taille={44} couleur="#fff" />
        <span style={{ width: 22 }} />
        <Alerte taille={44} couleur="#fff" />
      </div>
    </>
  );
};
