// Les pièces communes de la vidéo « sceau » (reprises de la vidéo « jarre ») : un plan (une prise de la carte ou de la balade, cadrée, sur un plan 3D qui flotte,
// avec son entrée sur le temps : coup de zoom, panoramique éclair, éclair blanc), le flou à bascule, le doigt, les mots (à la
// façon de TikTok : blancs cernés d'encre, le mot entre * sur une pastille rouge, le rouge du sceau de la carte), les crédits.
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, entre, expoEntree, expoSortie, FPS, houle, POLICE, rebond, s } from "./theme";

export const FOUET = 12; // (images) un panoramique éclair : la moitié avant la coupe, la moitié après

/** Un plan, de l'image `de` à l'image `a` : une vidéo (t0 : sa seconde au début du plan, v : sa vitesse), zoom [début, fin],
 *  centre [x, y] (0 à 1), son entrée, s'il sort en panoramique ; gel : l'image de sa fin, figée en trame. */
export type UnPlan = {
  de: number; a: number; src: string; t0?: number; v?: number; zoom?: [number, number]; centre?: [number, number];
  entree?: "punch" | "fouet" | "flash" | "sec"; sort?: boolean; gel?: boolean; assombrir?: number; flou?: number;
};

const Image_: React.FC<{ p: UnPlan; decalage: number }> = ({ p, decalage }) => {
  const f = useCurrentFrame();
  const duree = p.a - p.de + decalage;
  const [z0, z1] = p.zoom ?? [1.05, 1.0];
  const u = entre(f, 0, duree);
  const z = z0 + (z1 - z0) * (u * 0.6 + expoSortie(u) * 0.4);
  const m = 0.5 / z, c = p.centre ?? [0.5, 0.5];
  const cx = Math.min(1 - m, Math.max(m, c[0])), cy = Math.min(1 - m, Math.max(m, c[1]));
  const v = p.v ?? 1;
  return (
    <OffthreadVideo src={staticFile(p.src)} muted trimBefore={Math.max(0, Math.round(((p.t0 ?? 0) - (decalage / FPS) * v) * FPS))} playbackRate={v} style={{
      position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transformOrigin: "50% 50%",
      transform: `scale(${z.toFixed(5)}) translate(${((0.5 - cx) * 100).toFixed(3)}%, ${((0.5 - cy) * 100).toFixed(3)}%)`,
    }} />
  );
};

/** La trame : noir et blanc, des points dont la taille suit l'ombre (l'arrêt sur image de la vidéo « éclat »). */
const Trame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ filter: "brightness(1.6) contrast(8)", backgroundColor: "#fff", isolation: "isolate" }}>
    <AbsoluteFill style={{ filter: "grayscale(1) contrast(1.3)" }}>{children}</AbsoluteFill>
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(circle, #000 0px, #fff 8.5px)", backgroundSize: "12px 12px", mixBlendMode: "multiply" }} />
  </AbsoluteFill>
);

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
  if (p.entree === "punch" || p.entree === "flash") sc = 1 + 0.1 * (1 - rebond(g, 0, 320, 20));
  if (p.gel) sc = 1 + 0.06 * expoSortie(entre(g, 0, duree));
  const fort = p.entree === "flash" || p.gel ? 18 : p.entree === "sec" ? 0 : 8;
  const sec = g >= 0 ? fort * Math.exp(-g / 4) : 0;
  const rx = 2 * houle(f, 3.1), ryH = 1.6 * houle(f, 3.9, 1), rz = 0.5 * houle(f, 4.7, 2);
  const image = <Image_ p={p} decalage={avant} />;
  return (
    <AbsoluteFill style={{ zIndex: z, perspective: 2400 }}>
      <AbsoluteFill style={{
        transform: `translate(${(x + sec * Math.sin(g * 2.3)).toFixed(1)}px, ${(sec * Math.cos(g * 3.1)).toFixed(1)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${(ry + ryH).toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${(1.06 * sc).toFixed(5)})`,
        filter: p.assombrir || p.flou ? `brightness(${1 - (p.assombrir ?? 0)}) blur(${p.flou ?? 0}px)` : undefined,
      }}>
        {p.gel ? <Trame><Freeze frame={0}>{image}</Freeze></Trame> : image}
      </AbsoluteFill>
      {(p.entree === "flash" || p.gel) && <AbsoluteFill style={{ background: "#fff", opacity: (p.gel ? 0.7 : 0.8) * (1 - entre(g, 0, 7)) }} />}
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

/** Le flou à bascule : la carte est floue en haut et en bas, nette dans une bande au milieu (net : 0 = tout flou). */
export const TiltShift: React.FC<{ flou: number; net: number; z?: number }> = ({ flou, net, z }) => {
  if (flou < 0.2) return null;
  const c2 = Math.max(0, 50 - net * 100), c3 = Math.min(100, 50 + net * 100);
  const masque = net <= 0.001 ? "linear-gradient(#000, #000)"
    : `linear-gradient(#000 0%, #000 ${Math.max(0, c2 - 18)}%, transparent ${c2}%, transparent ${c3}%, #000 ${Math.min(100, c3 + 18)}%, #000 100%)`;
  return <AbsoluteFill style={{ zIndex: z, backdropFilter: `blur(${flou.toFixed(2)}px)`, WebkitMaskImage: masque, maskImage: masque }} />;
};

/** Le doigt (le rond d'un enregistrement d'écran) : il glisse jusqu'à (x, y), touche à `appui`. */
export const Doigt: React.FC<{ de: number; appui: number; x0: number; y0: number; x: number; y: number }> = ({ de, appui, x0, y0, x, y }) => {
  const f = useCurrentFrame();
  if (f < de || f > appui + s(0.42)) return null;
  const u = expoSortie(entre(f, de, appui - 2));
  const presse = f >= appui && f < appui + 5 ? 0.78 : f >= appui + 5 ? 0.78 + 0.22 * rebond(f, appui + 5) : 1;
  const apparition = Math.min(1, (f - de) / 5), depart = f > appui + s(0.25) ? 1 - (f - appui - s(0.25)) / s(0.17) : 1;
  const onde = entre(f, appui, appui + s(0.36));
  return (
    <div style={{ position: "absolute", left: x0 + (x - x0) * u, top: y0 + (y - y0) * u, opacity: Math.max(0, Math.min(apparition, depart)), zIndex: 80 }}>
      {f >= appui && (
        <div style={{
          position: "absolute", left: 0, top: 0, width: 100 + 220 * expoSortie(onde), height: 100 + 220 * expoSortie(onde), borderRadius: "50%",
          transform: "translate(-50%, -50%)", border: "6px solid rgba(255,255,255,.9)", opacity: 1 - onde,
        }} />
      )}
      <div style={{
        position: "absolute", left: 0, top: 0, width: 110, height: 110, borderRadius: "50%", transform: `translate(-50%, -50%) scale(${presse})`,
        background: "rgba(255,255,255,.42)", border: "5px solid rgba(255,255,255,.98)", boxShadow: "0 14px 34px rgba(0,0,0,.4)",
      }} />
    </div>
  );
};

/** Des mots à la façon de TikTok : blancs cernés d'encre, en capitales, qui claquent en arrivant ; le mot entre * sur une
 *  pastille rouge ; \n coupe la ligne. */
export const Mots: React.FC<{ texte: string; de: number; a: number; y?: number; taille?: number }> = ({ texte, de, a, y = 270, taille = 104 }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const v = rebond(f, de, 420, 22);
  return (
    <div style={{
      position: "absolute", left: 70, right: 70, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 90,
      transform: `scale(${(1.3 - 0.3 * v).toFixed(4)}) rotate(${(-6 * (1 - v) - 2).toFixed(2)}deg)`, transformOrigin: "50% 40%",
      opacity: Math.min(1, (f - de + 1) / 2),
    }}>
      {texte.split("\n").map((l, i) => (
        <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: taille, lineHeight: 1.04, textAlign: "center", letterSpacing: -1, whiteSpace: "nowrap" }}>
          {l.split("*").map((m, j) => j % 2
            ? <span key={j} style={{ background: C.rouge, color: "#fff", padding: "0 18px", borderRadius: 18, border: `7px solid ${C.encre}`, boxShadow: "0 8px 0 rgba(0,0,0,.35)", display: "inline-block", transform: "rotate(-2deg)", margin: "0 4px" }}>{m}</span>
            : <span key={j} style={{ color: "#fff", WebkitTextStroke: `14px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 24px rgba(0,0,0,.45)" }}>{m}</span>)}
        </div>
      ))}
    </div>
  );
};

/** Les crédits de la carte, toujours sur les images de la carte. */
export const Credits: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div style={{ position: "absolute", left: 30, bottom: 8, zIndex: 85, fontFamily: POLICE, fontSize: 23, fontWeight: 700, color: "rgba(255,255,255,.92)", textShadow: "0 1px 4px rgba(0,0,0,.75)", opacity: visible ? 1 : 0 }}>
    © Mapterhorn · © OpenStreetMap · Natural Earth
  </div>
);
