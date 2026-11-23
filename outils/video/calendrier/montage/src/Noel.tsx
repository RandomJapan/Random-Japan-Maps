// Les pièces des trois vidéos de Noël (plan-noel.md, 2026-11-23) : la prise cv-jours (ses plans, dans l'ordre de plans.js), le
// temps de la musique (chaque vidéo prend un passage de « Yuki akari »), le papier de la carte.
import React from "react";
import { Img, staticFile } from "remotion";
import { C, FPS, secTemps } from "./theme";

// ---------------------------------------------------------------- la prise cv-jours (comme JOURS de plans.js : mêmes durées)
// voir : la décoration apparaît APPARITION s après le début du plan (le jour change à l'écran)
export const APPARITION = 0.4;
const SEGMENTS: [string, number, number, boolean][] = [
  ["japon", 1, 3.2, false], ["neige", 1, 2.4, false], ["cascades", 4, 2.4, false], ["lanternes", 5, 2.4, true], ["cygnes", 8, 2.4, true],
  ["papier", 9, 4.4, true], ["fermes", 13, 2.4, true], ["kanji", 14, 4.4, true], ["cartes", 15, 4.4, true], ["singes", 16, 2.4, true],
  ["kamakura", 17, 2.4, true], ["danse", 21, 2.4, true], ["rennes", 23, 2.4, true], ["traineau", 24, 8, true], ["yuzu", 22, 4.4, true],
];
export type Segment = { nom: string; j: number; t0: number; d: number; voir: boolean };
export const SEG: Record<string, Segment> = {};
{
  let t0 = 0;
  for (const [nom, j, d, voir] of SEGMENTS) { SEG[nom] = { nom, j, t0, d, voir }; t0 += d; }
}
export const PRISE = "rushes/cv-jours.mp4";
/** Où lire un plan : la prise cv-jours, sauf les grues en papier (cv-papier : le vol lancé sous la coupe, déjà à l'écran). */
export const prise = (nom: string) => (nom === "papier"
  ? { src: "rushes/cv-papier.mp4", t0: 0, voir: false, j: 9 }
  : { src: PRISE, t0: SEG[nom].t0, voir: SEG[nom].voir, j: SEG[nom].j });

// ---------------------------------------------------------------- le temps : b0 est le temps du morceau à l'image 0
export const temps = (b0: number) => {
  const zero = secTemps(b0);
  /** l'image du temps b du morceau */
  const b = (n: number) => Math.round((secTemps(n) - zero) * FPS);
  return { b, debut: zero };
};

/** Le papier de la carte (le grain des cadeaux imprimés) en fond. */
export const Papier: React.FC<{ teinte?: string }> = ({ teinte = C.clair }) => (
  <div style={{ position: "absolute", inset: 0, background: teinte }}>
    <Img src={staticFile("ui/grain.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5, mixBlendMode: "multiply" }} />
  </div>
);
