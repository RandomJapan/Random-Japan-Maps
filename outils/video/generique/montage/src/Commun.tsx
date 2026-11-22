// Les pièces communes du « générique d'animé » : un plan (une vidéo cadrée sur un plan 3D qui flotte, son entrée sur le temps),
// et la grammaire d'un opening de shōnen : traits de vitesse (集中線), éclairs de couleur, trame, paroles japonaises verticales qui
// se remplissent quand elles sont chantées, mots anglais du refrain, crédits.
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, entre, expoEntree, expoSortie, FPS, hasard, houle, PAROLE, POLICE, rebond } from "./theme";

export const FOUET = 12; // (images) un panoramique éclair : la moitié avant la coupe, la moitié après

/** Un plan, de l'image `de` à l'image `a` : une vidéo (t0 : sa seconde au début du plan, v : sa vitesse), zoom [début, fin], centre
 *  [x, y] (0 à 1), son entrée ; gel : figé à sa première image ; filtre : un filtre CSS (couleurs poussées…). */
export type UnPlan = {
  de: number; a: number; src: string; t0?: number; v?: number; zoom?: [number, number]; centre?: [number, number];
  entree?: "punch" | "fouet" | "flash" | "sec" | "rouge"; sort?: boolean; gel?: boolean; filtre?: string;
};

const Image_: React.FC<{ p: UnPlan; decalage: number }> = ({ p, decalage }) => {
  const f = useCurrentFrame();
  const duree = p.a - p.de + decalage;
  const [z0, z1] = p.zoom ?? [1.05, 1.0];
  const u = entre(f, 0, duree);
  const z = z0 + (z1 - z0) * (u * 0.6 + expoSortie(u) * 0.4);
  const m = 0.5 / z, ce = p.centre ?? [0.5, 0.5];
  const cx = Math.min(1 - m, Math.max(m, ce[0])), cy = Math.min(1 - m, Math.max(m, ce[1]));
  const v = p.v ?? 1;
  const video = (
    <OffthreadVideo src={staticFile(p.src)} muted trimBefore={Math.max(0, Math.round(((p.t0 ?? 0) - (decalage / FPS) * v) * FPS))} playbackRate={v} style={{
      position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transformOrigin: "50% 50%",
      transform: `scale(${z.toFixed(5)}) translate(${((0.5 - cx) * 100).toFixed(3)}%, ${((0.5 - cy) * 100).toFixed(3)}%)`,
    }} />
  );
  return p.gel ? <Freeze frame={0}>{video}</Freeze> : video;
};

const LePlan: React.FC<{ p: UnPlan; avant: number; z: number }> = ({ p, avant, z }) => {
  const f = useCurrentFrame();
  const g = f - avant, duree = p.a - p.de;
  let x = 0, ry = 0, sc = 1;
  if (p.entree === "fouet") {
    const u = expoSortie(entre(g, -FOUET / 2, FOUET * 0.45));
    x = 1300 * (1 - u); ry = -22 * (1 - u);
  }
  if (p.sort) {
    const u = expoEntree(entre(g, duree - FOUET / 2, duree + FOUET * 0.2));
    x -= 1300 * u; ry += 22 * u;
  }
  if (p.entree === "punch" || p.entree === "flash" || p.entree === "rouge") sc = 1 + 0.12 * (1 - rebond(g, 0, 320, 20));
  const fort = p.entree === "flash" || p.entree === "rouge" ? 20 : p.entree === "sec" ? 0 : 9;
  const sec = g >= 0 ? fort * Math.exp(-g / 4) : 0;
  const rx = 1.6 * houle(f, 3.1), ryH = 1.3 * houle(f, 3.9, 1), rz = 0.4 * houle(f, 4.7, 2);
  return (
    <AbsoluteFill style={{ zIndex: z, perspective: 2400 }}>
      <AbsoluteFill style={{
        transform: `translate(${(x + sec * Math.sin(g * 2.3)).toFixed(1)}px, ${(sec * Math.cos(g * 3.1)).toFixed(1)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${(ry + ryH).toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${(1.06 * sc).toFixed(5)})`,
        filter: p.filtre,
      }}>
        <Image_ p={p} decalage={avant} />
      </AbsoluteFill>
      {p.entree === "flash" && <AbsoluteFill style={{ background: "#fff", opacity: 0.85 * (1 - entre(g, 0, 7)) }} />}
      {p.entree === "rouge" && <AbsoluteFill style={{ background: C.rouge, mixBlendMode: "multiply", opacity: 1 - entre(g, 1, 6) }} />}
    </AbsoluteFill>
  );
};

/** Tous les plans, chacun dans sa séquence (un panoramique déborde d'une demi-durée de part et d'autre de la coupe). */
export const Plans: React.FC<{ plans: UnPlan[] }> = ({ plans }) => (
  <AbsoluteFill>
    {plans.map((p, i) => {
      const suivant = plans[i + 1];
      const avant = p.entree === "fouet" ? FOUET / 2 : 0;
      const apres = suivant?.entree === "fouet" || p.sort ? FOUET / 2 : 0;
      return (
        <Sequence key={i} from={p.de - avant} durationInFrames={p.a - p.de + avant + apres} layout="none">
          <LePlan p={{ ...p, sort: p.sort || suivant?.entree === "fouet" }} avant={avant} z={i} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

/** Les traits de vitesse (集中線) : des pointes fines venues des bords vers (cx, cy), qui laissent un ovale libre au milieu ; ils
 *  changent toutes les deux images, comme dessinés à la main. */
export const Vitesse: React.FC<{ de: number; a: number; cx?: number; cy?: number; rx?: number; ry?: number; couleur?: string; n?: number; force?: number; z?: number }> = (
  { de, a, cx = 540, cy = 900, rx = 330, ry = 480, couleur = "#fff", n = 90, force = 1, z = 60 },
) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const pas = Math.floor(f / 2);
  const op = Math.min(entre(f, de, de + 4), 1 - entre(f, a - 5, a)) * force;
  const traits: string[] = [];
  for (let i = 0; i < n; i++) {
    const ang = ((i + hasard(i, pas) * 0.8) / n) * Math.PI * 2;
    const long = 0.55 + 0.45 * hasard(i, pas + 999);
    const larg = 0.006 + 0.016 * hasard(i + 50, pas);
    const R = 1500; // loin hors de l'écran
    const x1 = cx + Math.cos(ang) * R, y1 = cy + Math.sin(ang) * R;
    const fin = 1 + (1 - long) * 1.4;
    const x2 = cx + Math.cos(ang) * rx * fin, y2 = cy + Math.sin(ang) * ry * fin;
    const xa = cx + Math.cos(ang + larg) * R, ya = cy + Math.sin(ang + larg) * R;
    traits.push(`M${x1.toFixed(0)} ${y1.toFixed(0)}L${x2.toFixed(0)} ${y2.toFixed(0)}L${xa.toFixed(0)} ${ya.toFixed(0)}Z`);
  }
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, zIndex: z, opacity: op, pointerEvents: "none" }}>
      <path d={traits.join("")} fill={couleur} />
    </svg>
  );
};

/** Des éclairs de couleur, une ou deux images chacun (rouge, noir, blanc), comme entre deux plans d'un opening. */
export const Eclairs: React.FC<{ liste: { f: number; c: string; d?: number; o?: number }[]; z?: number }> = ({ liste, z = 95 }) => {
  const f = useCurrentFrame();
  const e = liste.find((x) => f >= x.f && f < x.f + (x.d ?? 2));
  if (!e) return null;
  return <AbsoluteFill style={{ background: e.c, opacity: e.o ?? 1, zIndex: z }} />;
};

/** Une trame de points (la trame des mangas), par-dessus une image. */
export const Trame: React.FC<{ couleur?: string; opacite?: number; taille?: number; angle?: number; masque?: string }> = (
  { couleur = "rgba(0,0,0,.55)", opacite = 1, taille = 14, angle = 30, masque },
) => (
  <AbsoluteFill style={{
    backgroundImage: `radial-gradient(circle, ${couleur} 0 ${(taille * 0.24).toFixed(1)}px, transparent ${(taille * 0.3).toFixed(1)}px)`,
    backgroundSize: `${taille}px ${taille}px`, transform: `rotate(${angle}deg) scale(1.6)`, opacity: opacite,
    WebkitMaskImage: masque, maskImage: masque, pointerEvents: "none",
  }} />
);

/** Une ligne de paroles japonaises, en grand et à la verticale (lue de haut en bas), à gauche de l'écran : elle s'écrit au début du
 *  chant, puis se remplit de rouge à mesure qu'elle est chantée (de `de` à `fin`) ; sa traduction anglaise en bas, au-dessus de la légende
 *  de TikTok. */
export const Parole: React.FC<{ jp: string; en: string; de: number; fin: number; a: number; x?: number; y?: number; taille?: number }> = (
  { jp, en, de, fin, a, x = 56, y = 250, taille = 92 },
) => {
  const f = useCurrentFrame();
  if (f < de - 2 || f >= a) return null;
  const sortie = expoEntree(entre(f, a - 6, a));
  const cars = [...jp];
  const remplis = entre(f, de, fin) * cars.length;
  return (
    <>
      <div style={{
        position: "absolute", left: x, top: y, zIndex: 88, writingMode: "vertical-rl", fontFamily: PAROLE, fontWeight: 800, fontSize: taille,
        lineHeight: 1, letterSpacing: 4, opacity: 1 - sortie, transform: `translateY(${(-60 * sortie).toFixed(1)}px)`,
      }}>
        {cars.map((ch, i) => {
          const v = rebond(f, de - 2 + i * 1.2, 520, 24);
          const plein = Math.max(0, Math.min(1, remplis - i));
          return (
            <span key={i} style={{
              display: "inline-block", opacity: f >= de - 2 + i * 1.2 ? 1 : 0, transform: `scale(${(1.5 - 0.5 * v).toFixed(3)})`,
              color: ch === " " ? "transparent" : plein >= 1 ? C.rouge : "#fff",
              WebkitTextStroke: `11px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 6px 18px rgba(0,0,0,.5)",
              marginBottom: ch === " " ? taille * 0.25 : 0,
            }}>{ch === " " ? "" : ch}</span>
          );
        })}
      </div>
      <div style={{
        position: "absolute", left: 60, right: 60, top: 1372, zIndex: 88, textAlign: "center", fontFamily: POLICE, fontWeight: 800, fontStyle: "italic",
        fontSize: 44, color: "#fff", opacity: Math.min(1, (f - de) / 6) * (1 - sortie), WebkitTextStroke: `8px ${C.encre}`, paintOrder: "stroke fill",
        textShadow: "0 4px 14px rgba(0,0,0,.6)",
      }}>{en}</div>
    </>
  );
};

/** Les mots anglais du refrain : blancs cernés d'encre, en capitales, penchés ; le mot entre * sur une pastille rouge ; \n coupe
 *  la ligne. Ils claquent au début du chant et une bande rouge les souligne à mesure qu'ils sont chantés (de `de` à `fin`). */
export const Mots: React.FC<{ texte: string; de: number; fin: number; a: number; y?: number; taille?: number }> = ({ texte, de, fin, a, y = 250, taille = 104 }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const v = rebond(f, de, 420, 22);
  const sortie = expoEntree(entre(f, a - 5, a));
  const u = entre(f, de, fin);
  return (
    <div style={{
      position: "absolute", left: 50, right: 50, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, zIndex: 90,
      transform: `scale(${(1.35 - 0.35 * v + 0.3 * sortie).toFixed(4)}) rotate(${(-7 * (1 - v) - 4).toFixed(2)}deg) skewX(-6deg)`, transformOrigin: "50% 40%",
      opacity: Math.min(1, (f - de + 1) / 2) * (1 - sortie),
    }}>
      {texte.split("\n").map((l, i) => (
        <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: taille, lineHeight: 1.02, textAlign: "center", letterSpacing: -1, whiteSpace: "nowrap", position: "relative" }}>
          {l.split("*").map((m, j) => j % 2
            ? <span key={j} style={{ background: C.rouge, color: "#fff", padding: "0 18px", borderRadius: 14, border: `7px solid ${C.encre}`, boxShadow: `6px 8px 0 ${C.encre}`, display: "inline-block", transform: "rotate(-2deg)", margin: "0 4px" }}>{m}</span>
            : <span key={j} style={{ color: "#fff", WebkitTextStroke: `14px ${C.encre}`, paintOrder: "stroke fill", textShadow: `6px 8px 0 ${C.rouge}` }}>{m}</span>)}
        </div>
      ))}
      <div style={{ height: 14, width: `${(86 * u).toFixed(1)}%`, background: C.rouge, border: `5px solid ${C.encre}`, borderRadius: 8, marginTop: 10 }} />
    </div>
  );
};

/** Un petit crédit, comme dans un vrai générique (le rôle en japonais, le nom dessous), en haut à droite. */
export const Credit: React.FC<{ role: string; nom: string; de: number; a: number }> = ({ role, nom, de, a }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const op = Math.min(entre(f, de, de + 8), 1 - entre(f, a - 8, a));
  return (
    <div style={{ position: "absolute", right: 150, top: 236, zIndex: 86, textAlign: "right", opacity: op, color: "#fff", textShadow: "0 0 4px #000, 0 2px 10px rgba(0,0,0,.8)" }}>
      <div style={{ fontFamily: PAROLE, fontWeight: 800, fontSize: 30, letterSpacing: 6 }}>{role}</div>
      <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 32, marginTop: 4 }}>{nom}</div>
    </div>
  );
};

/** Les crédits de la carte, toujours sur les images de la carte. */
export const Sources: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div style={{ position: "absolute", left: 30, bottom: 8, zIndex: 85, fontFamily: POLICE, fontSize: 23, fontWeight: 700, color: "rgba(255,255,255,.92)", textShadow: "0 1px 4px rgba(0,0,0,.75)", opacity: visible ? 1 : 0 }}>
    © Mapterhorn · © OpenStreetMap · Natural Earth
  </div>
);
