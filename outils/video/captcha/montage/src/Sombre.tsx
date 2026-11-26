// La fenêtre sombre des captchas « puzzle » et « rond » (générique, aucun logo) : l'accroche en blanc et une croix, la place de
// l'image (ce que chaque style y met), le curseur du bas (sa poignée avance de « avance » px), puis « Verified ✓ » en vert et le
// curseur qui se remplit de vert ; en bas, l'audio, un code, recharger, l'alerte.
import React from "react";
import { Alerte, Casque, Coche, Croix, Fleche, Recharger } from "./Icones";
import { ajuster } from "./texte";
import { borne, EMOJI, PropsIntro, ressort, TIKTOK } from "./theme";

const FOND = "#1f1f1f", PISTE = "#3a3a3a", POIGNEE = "#5b5b5b";
export const VERT = "#2bbf62";
export const POIGNEE_L = 150;
const POLICE = `${TIKTOK}, ${EMOJI}, sans-serif`;

export const CadreSombre: React.FC<{ p: PropsIntro; t: number; avance: number; children: React.ReactNode }> = ({ p, t, avance, children }) => {
  const f = p.fenetre, b = p.bloc ?? p.zone;
  const v = p.temps.verifie;
  const vert = borne((t - v) / 0.1);
  const g = ajuster(p.accroche, b.w - 96, 72, 50, 0.55);
  const pad = b.x - f.x;
  const cur = p.curseur!;
  return (
    <>
      <div style={{ position: "absolute", left: f.x, top: f.y, width: f.w, height: f.h, background: FOND, borderRadius: 30,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }} />
      {/* l'accroche et la croix, puis « Verified ✓ » (l'accroche disparaît d'un coup : un fondu se lisait comme deux textes) */}
      <div style={{ position: "absolute", left: b.x, top: f.y + 26, width: b.w - 80, height: b.y - f.y - 38, display: "flex",
        flexDirection: "column", justifyContent: "center", color: "#fff", fontFamily: POLICE, fontWeight: 700, opacity: t >= v ? 0 : 1 }}>
        {g.lignes.map((ligne, n) => <div key={n} style={{ fontSize: g.taille, lineHeight: 1.08, whiteSpace: "nowrap" }}>{ligne}</div>)}
      </div>
      {t >= v && (
        <div style={{ position: "absolute", left: b.x, top: f.y + 26, height: b.y - f.y - 38, display: "flex", alignItems: "center", gap: 18,
          color: VERT, fontFamily: POLICE, fontWeight: 900, fontSize: 84, transform: `scale(${0.7 + 0.3 * ressort(t - v)})`,
          transformOrigin: "0% 50%", opacity: borne(ressort(t - v) * 1.5) }}>
          Verified
          <Coche taille={86} couleur={VERT} epaisseur={3.6} />
        </div>
      )}
      <div style={{ position: "absolute", left: f.x + f.w - pad - 50, top: f.y + 38 }}>
        <Croix taille={50} couleur="#e8e8e8" />
      </div>

      {children}

      <div style={{ position: "absolute", left: cur.x, top: cur.y, width: cur.w, height: cur.h, borderRadius: cur.h / 2, background: PISTE, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: cur.h, width: POIGNEE_L + avance, borderRadius: cur.h / 2,
          background: vert > 0 ? VERT : "rgba(255,255,255,0.06)" }} />
      </div>
      <div style={{ position: "absolute", left: cur.x + avance, top: cur.y, width: POIGNEE_L, height: cur.h, borderRadius: cur.h / 2,
        background: vert > 0 ? "#fff" : POIGNEE, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 3px 10px rgba(0,0,0,0.35)" }}>
        {vert > 0 ? <Coche taille={52} couleur={VERT} epaisseur={3.4} /> : <Fleche taille={50} couleur="#fff" />}
      </div>

      <div style={{ position: "absolute", left: b.x, top: cur.y + cur.h + 22, width: b.w, height: 52, display: "flex", alignItems: "center",
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
