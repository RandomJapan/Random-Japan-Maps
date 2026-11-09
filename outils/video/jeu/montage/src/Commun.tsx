// Les pièces communes des deux vidéos du jeu (reprises de la vidéo « sceau ») : un plan (une prise ou un vrai plan, sur un plan 3D qui
// flotte, avec son entrée sur le temps), un plan fixe (une capture), les mots à la façon de TikTok, la trame, les crédits, le son.
import React from "react";
import { AbsoluteFill, Audio, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, entre, expoEntree, expoSortie, FPS, houle, POLICE, rebond, s } from "./theme";
import DUREES from "./durees.json";

export const FOUET = 12; // (images) un panoramique éclair : la moitié avant la coupe, la moitié après

/** Un plan, de l'image `de` à l'image `a` : une vidéo ou une image (img), t0 : sa seconde au début du plan, v : sa vitesse, zoom [début, fin],
 *  centre [x, y] (0 à 1), son entrée ; gel : son image de fin figée en trame ; flou : px. */
export type UnPlan = {
  de: number; a: number; src: string; img?: boolean; t0?: number; v?: number; zoom?: [number, number]; centre?: [number, number];
  entree?: "punch" | "fouet" | "flash" | "sec"; sort?: boolean; gel?: boolean; flou?: number; flou2?: number; assombrir?: number;
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
  const style: React.CSSProperties = {
    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transformOrigin: "50% 50%",
    transform: `scale(${z.toFixed(5)}) translate(${((0.5 - cx) * 100).toFixed(3)}%, ${((0.5 - cy) * 100).toFixed(3)}%)`,
  };
  return p.img
    ? <Img src={staticFile(p.src)} style={style} />
    : <OffthreadVideo src={staticFile(p.src)} muted trimBefore={Math.max(0, Math.round(((p.t0 ?? 0) - (decalage / FPS) * v) * FPS))} playbackRate={v} style={style} />;
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
  const rx = 1.4 * houle(f, 3.1), ryH = 1.1 * houle(f, 3.9, 1), rz = 0.35 * houle(f, 4.7, 2);
  const image = <Image_ p={p} decalage={avant} />;
  const flou = p.flou2 !== undefined ? (p.flou ?? 0) + (p.flou2 - (p.flou ?? 0)) * expoSortie(entre(g, 0, 22)) : p.flou ?? 0;
  return (
    <AbsoluteFill style={{ zIndex: z, perspective: 2400 }}>
      <AbsoluteFill style={{
        transform: `translate(${(x + sec * Math.sin(g * 2.3)).toFixed(1)}px, ${(sec * Math.cos(g * 3.1)).toFixed(1)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${(ry + ryH).toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${(1.05 * sc).toFixed(5)})`,
        filter: flou > 0.05 || p.assombrir ? `brightness(${1 - (p.assombrir ?? 0)}) blur(${flou.toFixed(2)}px)` : undefined,
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

/** Des mots à la façon de TikTok : blancs cernés d'encre, en capitales, qui claquent ; le mot entre * sur une pastille ; \n coupe la ligne.
 *  pose : déjà en place dès la première image (la première image de la vidéo est aussi sa couverture). */
export const Mots: React.FC<{ texte: string; de: number; a: number; y?: number; taille?: number; couleur?: string; pose?: boolean }> = ({ texte, de, a, y = 290, taille = 104, couleur = C.rouge, pose }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const v = pose ? 1 : rebond(f, de, 420, 22);
  return (
    <div style={{
      position: "absolute", left: 40, right: 40, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 90,
      transform: `scale(${(1.3 - 0.3 * v).toFixed(4)}) rotate(${(-6 * (1 - v) - 2).toFixed(2)}deg)`, transformOrigin: "50% 40%",
      opacity: pose ? 1 : Math.min(1, (f - de + 1) / 2),
    }}>
      {texte.split("\n").map((l, i) => (
        <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: taille, lineHeight: 1.06, textAlign: "center", letterSpacing: -1, whiteSpace: "nowrap" }}>
          {l.split("*").map((m, j) => j % 2
            ? <span key={j} style={{ background: couleur, color: "#fff", padding: "0 20px", borderRadius: 18, border: `7px solid ${C.encre}`, boxShadow: "0 8px 0 rgba(0,0,0,.35)", display: "inline-block", transform: "rotate(-2deg)", margin: "0 4px" }}>{m}</span>
            : <span key={j} style={{ color: "#fff", WebkitTextStroke: `14px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 24px rgba(0,0,0,.45)" }}>{m}</span>)}
        </div>
      ))}
    </div>
  );
};

/** Les crédits de la carte, sur les images de la carte. */
export const Credits: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div style={{ position: "absolute", left: 30, bottom: 8, zIndex: 85, fontFamily: POLICE, fontSize: 23, fontWeight: 700, color: "rgba(255,255,255,.92)", textShadow: "0 1px 4px rgba(0,0,0,.75)", opacity: visible ? 1 : 0 }}>
    © Mapterhorn · © OpenStreetMap · Natural Earth
  </div>
);

/** La fin : la carte floue et assombrie, le logo dans ses rayons de lumière, puis le titre, le bouton et l'adresse. */
export const Fin: React.FC<{ de: number; de2: number; titre: React.ReactNode; sous: string; bouton?: string; fond: string; t0: number }> = ({ de, de2, titre, sous, bouton = "FREE · LINK IN BIO", fond, t0 }) => {
  const f = useCurrentFrame();
  if (f < de) return null;
  const g = f - de;
  const vLogo = rebond(f, de, 300, 16), vTitre = rebond(f, de + 6), vSous = rebond(f, de + 16), vBouton = rebond(f, de2, 420, 20), vAdr = rebond(f, de2 + 8);
  const rayons = expoSortie(entre(g, 0, 18));
  return (
    <AbsoluteFill style={{ zIndex: 100 }}>
      <AbsoluteFill style={{ filter: "blur(12px) brightness(.5)", transform: "scale(1.1)" }}>
        <Freeze frame={0}><OffthreadVideo src={staticFile(fond)} muted trimBefore={s(t0)} style={{ width: "100%", height: "100%" }} /></Freeze>
      </AbsoluteFill>
      <AbsoluteFill style={{
        background: "repeating-conic-gradient(from 0deg at 50% 560px, rgba(255,246,220,.55) 0deg 7deg, rgba(255,246,220,0) 7deg 18deg)",
        WebkitMaskImage: "radial-gradient(circle at 50% 560px, #000 0, rgba(0,0,0,.6) 380px, transparent 900px)",
        opacity: rayons, transform: `rotate(${(g * 0.25).toFixed(2)}deg) scale(${(0.6 + 0.4 * rayons).toFixed(3)})`, transformOrigin: "50% 560px",
      }} />
      <AbsoluteFill style={{ background: "#fff", opacity: 0.85 * (1 - entre(g, 0, 8)) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        <div style={{
          width: 300, height: 300, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center",
          boxShadow: "0 30px 90px rgba(0,0,0,.6), 0 0 0 12px rgba(255,255,255,.18)",
          transform: `scale(${Math.max(0, 0.2 + 0.8 * vLogo).toFixed(4)}) rotate(${(-18 * (1 - vLogo)).toFixed(2)}deg)`,
        }}>
          <Img src={staticFile("ui/logo.jpg")} style={{ width: 270, height: 270, borderRadius: "50%" }} />
        </div>
        <div style={{
          fontFamily: POLICE, fontWeight: 900, fontSize: 104, lineHeight: 1.02, textAlign: "center", color: "#fff", padding: "0 50px",
          WebkitTextStroke: `14px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 30px rgba(0,0,0,.5)",
          opacity: f >= de + 6 ? 1 : 0, transform: `translateY(${(60 * (1 - vTitre)).toFixed(1)}px) scale(${(0.7 + 0.3 * vTitre).toFixed(4)})`,
        }}>{titre}</div>
        <div style={{
          fontFamily: POLICE, fontWeight: 900, fontSize: 58, color: "#fff", WebkitTextStroke: `10px ${C.encre}`, paintOrder: "stroke fill", textAlign: "center",
          opacity: f >= de + 16 ? 1 : 0, transform: `translateY(${(40 * (1 - vSous)).toFixed(1)}px)`,
        }}>{sous}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: f >= de2 ? 1 : 0 }}>
          <div style={{
            fontFamily: POLICE, fontWeight: 900, fontSize: 64, color: "#fff", background: C.rouge, border: `7px solid ${C.encre}`, borderRadius: 999,
            padding: "14px 56px", boxShadow: `0 9px 0 ${C.rougeFonce}, 0 9px 0 7px ${C.encre}, 0 30px 60px rgba(0,0,0,.45)`,
            transform: `scale(${(1.6 - 0.6 * vBouton).toFixed(4)}) rotate(${(-3 * (1 - vBouton) - 1.5).toFixed(2)}deg)`,
          }}>{bouton}</div>
          <div style={{
            fontFamily: POLICE, fontWeight: 800, fontSize: 44, color: C.encre, background: C.papier, border: `6px solid ${C.encre}`, borderRadius: 999,
            padding: "10px 36px", opacity: f >= de2 + 8 ? 1 : 0, transform: `translateY(${(40 * (1 - vAdr)).toFixed(1)}px)`,
          }}>map.randomjapanplace.com</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- le son
const AVANCE = 2; // l'AAC du MP4 retarde le son d'autant
// (mesuré sur le premier rendu, mesure_son.py : la voix était 4 à 8 dB SOUS la musique ; il la faut 10 dB au-dessus)
const GAIN_VOIX = 1.6;
const MUSIQUE_SOUS_VOIX = 0.32; // la musique s'efface quand la voix parle
/** [seconde, fichier, volume, durée (s) : coupé et fondu au bout] */
export type Effet = [number, string, number, number?];
/** [seconde, morceau de voix, volume] */
export type Voix = [number, string, number?];

export const Son: React.FC<{ bgm: boolean; musique: string; volume: number; voix: Voix[]; effets: Effet[] }> = ({ bgm, musique, volume, voix, effets }) => {
  const { durationInFrames: duree } = useVideoConfig();
  const durees = DUREES as Record<string, number>;
  // une ligne ne doit pas couvrir la suivante, ni finir après la vidéo
  [...voix].sort((a, b) => a[0] - b[0]).forEach(([d, n], i, l) => {
    if (durees[n] === undefined) throw new Error(`voix sans durée : ${n}`);
    if (i + 1 < l.length && d + durees[n] > l[i + 1][0] + 0.02) throw new Error(`voix qui se chevauchent : ${n} (${(d + durees[n]).toFixed(2)}) et ${l[i + 1][1]} (${l[i + 1][0].toFixed(2)})`);
    if (d + durees[n] > duree / FPS - 0.4) throw new Error(`voix trop près de la fin : ${n}`);
  });
  const fenetres = voix.map(([d, n]) => [s(d), s(d + durees[n])]);
  const baisse = (f: number) => fenetres.reduce((k, [a, z]) => Math.min(k, 1 - (1 - MUSIQUE_SOUS_VOIX) * Math.min(entre(f, a - 5, a), 1 - entre(f, z, z + 10))), 1);
  return (
    <>
      {bgm && <Audio src={staticFile(musique)} volume={(f) => volume * baisse(f)} />}
      {voix.map(([d, n, v], i) => (
        <Sequence key={`v${i}`} from={Math.max(0, s(d) - AVANCE)} durationInFrames={s(durees[n]) + 6} layout="none">
          <Audio src={staticFile(`voix/${n}.wav`)} volume={(v ?? 1) * GAIN_VOIX} />
        </Sequence>
      ))}
      {effets.map(([a, nom, v, d], i) => (
        <Sequence key={i} from={Math.max(0, s(a) - AVANCE)} durationInFrames={Math.min(s(d ?? 3), duree)} layout="none">
          <Audio src={staticFile(`sfx/${nom}`)} volume={d === undefined ? v : (f) => v * interpolate(f, [s(d) - 12, s(d)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </Sequence>
      ))}
    </>
  );
};
