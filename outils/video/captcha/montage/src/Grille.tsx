// Le captcha « grille » (générique, aucun logo) : une fenêtre blanche, l'en-tête bleu (« Select all squares with » en petit, le
// reste en grand, ou toute l'accroche en grand), l'image coupée en 4 × 4 cases séparées d'un filet blanc, dont quelques-unes sont
// échangées ; le doigt les fait glisser chez elles une à une. Puis l'en-tête passe au vert : « Verified ✓ ».
import React from "react";
import { Img, staticFile } from "remotion";
import { cadrage } from "./Intro";
import { Casque, Coche, Info, Recharger } from "./Icones";
import { ajuster } from "./texte";
import { borne, glisse, lerp, PropsIntro, ressort, ROBOTO } from "./theme";

const BLEU = "#3b7ddd", VERT = "#1e9e57";
const GRIS = "#6f6f6f";
const FILET = 6;

/** L'en-tête : l'accroche, puis « Verified ✓ ». */
const EnTete: React.FC<{ p: PropsIntro; t: number; x: number; y: number; l: number; h: number }> = ({ p, t, x, y, l, h }) => {
  const v = p.temps.verifie;
  const vert = borne((t - v) / 0.1);
  const m = /^select all (squares|images) with\s+/i.exec(p.accroche);
  const petit = m ? p.accroche.slice(0, m[0].length).trim() : null;
  const grand = m ? p.accroche.slice(m[0].length) : p.accroche;
  const g = ajuster(grand, l - 64, petit ? 80 : 74, 46, 0.57);
  const pop = ressort(t - v);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: l, height: h, background: BLEU, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: VERT, opacity: vert }} />
      <div style={{ position: "absolute", left: 32, right: 32, top: 0, bottom: 0, display: "flex", flexDirection: "column",
        justifyContent: "center", color: "#fff", fontFamily: ROBOTO, opacity: t >= v ? 0 : 1 }}>
        {petit && <div style={{ fontSize: 36, fontWeight: 400, lineHeight: 1.15, marginBottom: 4 }}>{petit}</div>}
        {g.lignes.map((ligne, k) => (
          <div key={k} style={{ fontSize: g.taille, fontWeight: 700, lineHeight: 1.08, whiteSpace: "nowrap" }}>{ligne}</div>
        ))}
      </div>
      {t >= v && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 22, paddingLeft: 40, color: "#fff",
          fontFamily: ROBOTO, fontWeight: 700, fontSize: 88, transform: `scale(${0.7 + 0.3 * pop})`, transformOrigin: "30% 50%", opacity: borne(pop * 1.5) }}>
          Verified
          <Coche taille={92} couleur="#fff" epaisseur={3.4} />
        </div>
      )}
    </div>
  );
};

export const Grille: React.FC<{ p: PropsIntro; t: number }> = ({ p, t }) => {
  const f = p.fenetre, z = p.zone, n = p.n ?? 4, c = z.w / n;
  const echanges = p.echanges ?? [];
  const src = staticFile(p.image);
  const { k, x: ix, y: iy } = cadrage(p);
  const derniere = Math.max(...echanges.map((e) => e.t1));
  const filet = FILET * (1 - borne((t - derniere - 0.02) / 0.1));
  const finie = t >= derniere + 0.14;
  const hautEnTete = z.y - f.y - 24 - 12;
  const basGrille = z.y + z.h;

  // où est chaque morceau : chez lui, sauf ceux des échanges (le morceau de b part de a et glisse en b, porté par le doigt ;
  // celui de a part de b et rentre en a dessous, un peu en retard)
  const morceaux = Array.from({ length: n * n }, (_, m) => {
    let cx = m % n, cy = Math.floor(m / n), leve = 0, pose = -1, dessus = false;
    for (const e of echanges) {
      if (m !== e.a && m !== e.b) continue;
      const porte = m === e.b;
      const de = porte ? e.a : e.b;
      const u = porte ? glisse(borne((t - e.t0) / (e.t1 - e.t0))) : glisse(borne((t - e.t0 - 0.03) / (e.t1 - e.t0)));
      cx = lerp(de % n, m % n, u);
      cy = lerp(Math.floor(de / n), Math.floor(m / n), u);
      if (porte && t >= e.t0 && t < e.t1) { leve = 1; dessus = true; }
      if (t >= e.t1) pose = t - e.t1;
    }
    return { m, cx, cy, leve, pose, dessus };
  });
  morceaux.sort((a, b) => Number(a.dessus) - Number(b.dessus));

  return (
    <>
      <div style={{ position: "absolute", left: f.x, top: f.y, width: f.w, height: f.h, background: "#fff", borderRadius: 6,
        boxShadow: "0 20px 70px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.25)" }} />
      <EnTete p={p} t={t} x={z.x} y={f.y + 24} l={z.w} h={hautEnTete} />
      {/* l'image : en cases tant qu'elle n'est pas finie, puis d'un seul morceau (sans filet) */}
      <div style={{ position: "absolute", left: z.x, top: z.y, width: z.w, height: z.h, background: "#fff" }}>
        {finie ? (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <Img src={src} style={{ position: "absolute", left: ix, top: iy, width: 1080 * k, height: 1920 * k, maxWidth: "none" }} />
          </div>
        ) : (
          morceaux.map(({ m, cx, cy, leve, pose }) => {
            const hx = (m % n) * c, hy = Math.floor(m / n) * c;
            const rebond = pose >= 0 && pose < 0.3 ? 1 + 0.06 * (1 - ressort(pose, 520, 22)) : 1;
            const echelle = leve ? 1.07 : rebond;
            const eclat = pose >= 0 ? 0.28 * (1 - borne(pose / 0.16)) : 0;
            return (
              <div key={m} style={{ position: "absolute", left: cx * c + filet / 2, top: cy * c + filet / 2, width: c - filet, height: c - filet,
                overflow: "hidden", transform: `scale(${echelle})`, boxShadow: leve ? "0 14px 34px rgba(0,0,0,0.5)" : "none",
                outline: leve ? "4px solid #fff" : "none" }}>
                <Img src={src} style={{ position: "absolute", left: ix - hx - filet / 2, top: iy - hy - filet / 2, width: 1080 * k, height: 1920 * k, maxWidth: "none" }} />
                {eclat > 0 && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: eclat }} />}
              </div>
            );
          })
        )}
      </div>
      {/* le bas : le filet gris, les trois icônes, le bouton */}
      <div style={{ position: "absolute", left: f.x, width: f.w, top: basGrille + 12, height: 1, background: "#dcdcdc" }} />
      <div style={{ position: "absolute", left: z.x + 4, top: basGrille + 12, height: f.y + f.h - basGrille - 12, display: "flex", alignItems: "center", gap: 30 }}>
        <Recharger taille={46} couleur={GRIS} />
        <Casque taille={46} couleur={GRIS} />
        <Info taille={46} couleur={GRIS} />
      </div>
      {(() => {
        const v = borne((t - p.temps.verifie) / 0.1);
        const h = 70, l = 196, x = z.x + z.w - l, y = basGrille + 12 + (f.y + f.h - basGrille - 12 - h) / 2;
        return (
          <div style={{ position: "absolute", left: x, top: y, width: l, height: h, borderRadius: 4, background: v > 0 ? VERT : BLEU,
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: ROBOTO, fontWeight: 500,
            fontSize: 32, letterSpacing: 1 }}>
            {v > 0 ? <Coche taille={46} couleur="#fff" /> : "VERIFY"}
          </div>
        );
      })()}
    </>
  );
};
