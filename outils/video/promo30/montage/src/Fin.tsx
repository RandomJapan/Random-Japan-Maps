// La fin (outro-group-photo-launch) : un élément de chaque fonction montrée vole de tous les côtés et se pose autour
// du nom (la fiche de Himeji, celle de Kinkaku-ji, la bulle d'Orochi, les favoris, le dé, un temps de trajet, le
// cœur, un yōkai, la lanterne du défilé, une feuille d'érable) ; le logo tombe comme un sceau, le nom se presse
// lettre à lettre, l'adresse arrive sur son ruban rouge. Puis tout se tient immobile plus d'une seconde.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
// @ts-expect-error : un module JavaScript du site, sans types
import { DEFILE, YOKAI } from "../../../../../site/halloween-dessins.js";
import { Coeur, De3D, Lettres } from "./parts";
import { C, de, FILET, FRAPPE, GRAIN, hasard, lin, POSE, SANS, TITRE } from "./theme";

const borne = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type El = { cle: string; x: number; y: number; w: number; rot: number; dx: number; dy: number; cue: number; rendu: (w: number) => React.ReactNode };
const img = (src: string, ratio: number) => (w: number) => <Img src={staticFile(src)} style={{ width: w, height: w * ratio, display: "block", boxShadow: "0 14px 30px rgba(40,26,14,.35)" }} />;
const svg = (html: string, ratio: number) => (w: number) => <div className="lg" style={{ width: w, height: w * ratio }} dangerouslySetInnerHTML={{ __html: html }} />;

const ELS: El[] = [
  { cle: "himeji", x: 285, y: 300, w: 220, rot: -6, dx: -520, dy: -80, cue: 2, rendu: img("ui/fiche-himeji.png", 644 / 400) },
  { cle: "kinkaku", x: 1635, y: 300, w: 220, rot: 5, dx: 520, dy: -80, cue: 4, rendu: img("ui/fiche-kinkaku.png", 644 / 400) },
  { cle: "orochi", x: 330, y: 845, w: 300, rot: 3, dx: -460, dy: 300, cue: 6, rendu: img("ui/bulle-orochi.png", 259.2 / 300) },
  { cle: "favoris", x: 1600, y: 850, w: 170, rot: -4, dx: 460, dy: 320, cue: 8, rendu: img("ui/panneau-favoris.png", 568 / 340) },
  { cle: "de", x: 640, y: 130, w: 96, rot: 0, dx: -120, dy: -300, cue: 10, rendu: (w) => <div style={{ position: "relative", width: w, height: w }}><De3D s={w} rx={-24} ry={36} /></div> },
  { cle: "temps", x: 1290, y: 130, w: 170, rot: -3, dx: 160, dy: -300, cue: 12, rendu: img("ui/temps-2.png", 26 / 66) },
  { cle: "coeur", x: 700, y: 965, w: 74, rot: -8, dx: -60, dy: 320, cue: 14, rendu: (w) => <Coeur taille={w} /> },
  { cle: "enma", x: 1235, y: 955, w: 130, rot: 4, dx: 80, dy: 320, cue: 16, rendu: svg(YOKAI.enma, 60 / 64) },
  { cle: "lanterne", x: 1815, y: 565, w: 120, rot: 6, dx: 380, dy: 0, cue: 18, rendu: svg(DEFILE.chochin, 1) },
  { cle: "erable", x: 108, y: 565, w: 96, rot: -12, dx: -380, dy: 0, cue: 20, rendu: (w) => <div style={{ font: `${w}px/1 ${SANS}` }}>🍁</div> },
];
const POUSSIERE = Array.from({ length: 22 }, (_, i) => ({ x: (i * 439 + 137) % 1920, y0: (i * 613 + 271) % 1080, monte: 0.4 + (i % 5) * 0.14, amp: 9 + (i % 4) * 5, taille: 3 + (i % 3), op: 0.2 + ((i * 7) % 5) * 0.06 }));

export const Fin: React.FC<{ credit?: string }> = ({ credit }) => {
  const f = useCurrentFrame();
  const SCEAU = 20; // le logo frappe pendant que la voix dit « Random Japan Place »
  const grue = de(f, 0, 40, [0, 1], Easing.bezier(0.3, 0, 0.2, 1));
  const pousse = lin(f, 40, 89);
  const recul = lin(f, SCEAU, SCEAU + 8);
  const chute = de(f, SCEAU - 5, SCEAU, [0, 1], FRAPPE);
  const kLogo = f < SCEAU ? 2.4 - 1.4 * chute : 1 - 0.05 * Math.exp(-(f - SCEAU) / 3) * Math.sin((f - SCEAU) * 1.4);
  const secousse = f >= SCEAU && f < SCEAU + 6 ? 14 * Math.exp(-(f - SCEAU) / 1.8) : 0;
  const ruban = de(f, 36, 48, [0, 1], POSE);
  const scene = interpolate(f, [SCEAU - 2, SCEAU + 2, SCEAU + 10], [0, 0.45, 0.2], borne);
  return (
    <AbsoluteFill style={{ backgroundColor: C.nuit, overflow: "hidden" }}>
      <AbsoluteFill style={{ translate: `${secousse * Math.sin((f - SCEAU) * 3.3)}px ${secousse * 0.7 * Math.sin((f - SCEAU) * 4.1 + 0.9)}px` }}>
        <AbsoluteFill style={{ transform: `perspective(1400px) rotateX(${4 * (1 - grue)}deg) scale(${1.06 - 0.06 * grue + 0.03 * pousse})`, transformOrigin: "50% 45%" }}>
          <Img src={staticFile("img/logo-large.jpg")} style={{ position: "absolute", left: -7.5, width: 1935, height: 1080, filter: `blur(${lin(f, 0, 20, [4, 14])}px) brightness(.9)` }} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 62% 58% at 50% 48%, rgba(246,238,219,.9), rgba(239,228,200,.72) 55%, rgba(60,38,18,.55))" }} />
          <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.5, mixBlendMode: "multiply" }} />
          {ELS.map((e) => {
            const t = de(f, e.cue, e.cue + 12, [0, 1], POSE);
            const vu = lin(f, e.cue, e.cue + 3);
            return (
              <div key={e.cle} style={{ position: "absolute", left: e.x - e.w / 2 + e.dx * (1 - t), top: e.y + e.dy * (1 - t), translate: "0 -50%", rotate: `${e.rot * (1 + (1 - t))}deg`, scale: `${1.12 - 0.12 * t}`, opacity: vu * (1 - 0.14 * recul), filter: `saturate(${1 - 0.1 * recul})` }}>
                {e.rendu(e.w)}
              </div>
            );
          })}
          {/* la lumière de scène derrière le nom, la poussière dorée */}
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 34% 30% at 50% 46%, rgba(255,232,190,1), transparent 70%)", opacity: scene }} />
          {POUSSIERE.map((p, i) => (
            <div key={i} style={{ position: "absolute", left: p.x + Math.sin(f * 0.03 + i) * p.amp, top: ((p.y0 - f * p.monte * 2) % 1080 + 1080) % 1080, width: p.taille, height: p.taille, borderRadius: "50%", backgroundColor: "#d9a441", opacity: p.op * lin(f, 6, 20) }} />
          ))}
          {/* le logo (un sceau), le nom, le filet, le ruban de l'adresse, la promesse */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 236, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Img src={staticFile("img/logo-carre.jpg")} style={{ width: 168, height: 168, borderRadius: "50%", objectFit: "cover", boxShadow: `0 0 0 5px ${C.clair}, 0 0 0 8px ${C.rouge}, 0 18px 40px rgba(40,26,14,.45)`, scale: `${kLogo}`, opacity: lin(f, SCEAU - 5, SCEAU - 3) }} />
            <div style={{ marginTop: 26 }}>
              <Lettres texte="Random Japan Place" a={SCEAU + 1} pas={1.0} style={{ font: `400 112px/1 ${TITRE}`, color: C.encre }} />
            </div>
            <div style={{ marginTop: 18, width: 640, height: 3, backgroundColor: C.trait, scale: `${de(f, 34, 46)} 1` }} />
            <div style={{ marginTop: 26, opacity: interpolate(ruban, [0, 0.2], [0, 1], borne), scale: `${interpolate(ruban, [0, 1], [0.3, 1])} 1` }}>
              <div style={{ padding: "22px 70px 24px", backgroundColor: C.rouge, color: C.clair, font: `700 54px/1 ${SANS}`, letterSpacing: "0.01em", clipPath: "polygon(0 0, 100% 0, calc(100% - 26px) 50%, 100% 100%, 0 100%, 26px 50%)" }}>
                map.randomjapanplace.com
              </div>
            </div>
            <div style={{ marginTop: 26, padding: "12px 30px 14px", backgroundColor: C.clair, backgroundImage: GRAIN, boxShadow: FILET, font: `400 44px/1 ${TITRE}`, color: C.encre, opacity: de(f, 43, 51), translate: `0 ${(1 - de(f, 43, 53)) * 24}px` }}>
              Free · in 3D · EN · FR · 日本語
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {credit ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 16, textAlign: "center", font: `400 20px ${SANS}`, color: "rgba(53,37,26,.75)", opacity: lin(f, 50, 58) }}>{credit}</div> : null}
    </AbsoluteFill>
  );
};

export { hasard };
