// « I hid 24 gifts in my Japan map » (plan-noel.md, vidéo 3, 2026-11-23) : les 24 portes du vrai calendrier (captures.py), qui
// s'ouvrent l'une après l'autre, de plus en plus vite (4 sur deux temps, 8 sur un temps, 12 sur un demi-temps), chacune avec
// son cadeau écrit dessous et une clochette ; à la fin, toutes ouvertes. Sur le premier refrain de « Yuki akari » (temps 76 → 108 :
// la fin, immobile, tenait 7 s jusqu'au temps 112 ; elle tient maintenant 6 temps).
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Bulle, Effet, Son } from "./Commun";
import { Papier, temps } from "./Noel";
import { C, FPS, POLICE, rebond, s, TITRE } from "./theme";

const { b, debut } = temps(76);
export const DUREE_CASES = b(108) + s(0.7);

// l'image de l'ouverture de la porte j (1 à 24)
const ouverture = (j: number) => (j <= 4 ? b(80 + 2 * (j - 1)) : j <= 12 ? b(88 + (j - 5)) : b(96 + 0.5 * (j - 13)));
const FIN = b(102);

type Sorte = "boutique" | "musique" | "telecharger" | "balade" | "carte";
const SORTES: Record<Sorte, [string, string]> = {
  boutique: ["Inkami shop", "#a8321f"], musique: ["Music", "#3d7a4a"], telecharger: ["To download", "#2f6b5e"],
  balade: ["3D walk", "#8a6a1e"], carte: ["On the map", "#5b4a8a"],
};
// les cadeaux (noel.js, raccourcis) et leur sorte
const CADEAUX: [string, Sorte][] = [
  ["Your name in Japanese", "boutique"], ["The map's Christmas song", "musique"], ["A 2027 calendar to print", "telecharger"],
  ["Free home delivery", "boutique"], ["A red scarf for the 3D walk", "balade"], ["Wallpaper: Fuji in winter", "telecharger"],
  ["Japanese winter words", "telecharger"], ["A Christmas quiz round", "carte"], ["Origami paper", "telecharger"],
  ["Last day for a portrait", "boutique"], ["Snowflake glasses", "balade"], ["The tale of Yuki-onna", "carte"],
  ["Wallpaper: Gokayama", "telecharger"], ["The kanji of the year", "carte"], ["A New Year card", "telecharger"],
  ["Santa's sack", "balade"], ["A gift card", "boutique"], ["Gift tags", "telecharger"], ["A paper lantern", "balade"],
  ["Wallpaper: Christmas night", "telecharger"], ["Valentine's Day early", "boutique"], ["A yuzu bath", "carte"],
  ["Christmas cake recipe", "telecharger"], ["Christmas night", "carte"],
];

// la grille : portes-fermees.png / portes-ouvertes.png font 995 px (5 colonnes de 185 px, 17,5 px entre elles)
const GX = 90, GY = 360, GL = 900, K = GL / 995, PAS = 202.5, CASE = 185;
const cellule = (j: number) => {
  const r = Math.floor((j - 1) / 5), c = (j - 1) % 5;
  return { x: c * PAS, y: r * PAS, l: j === 24 ? 2 * CASE + 17.5 : CASE };
};

const Porte: React.FC<{ j: number }> = ({ j }) => {
  const f = useCurrentFrame();
  const o = ouverture(j);
  if (f < o) return null;
  const { x, y, l } = cellule(j);
  const d = f - o;
  const tourne = Math.min(1, d / 7); // la porte s'ouvre (pivote sur sa charnière gauche)
  const vive = f < (j < 24 ? ouverture(j + 1) : FIN);
  return (
    <div style={{ position: "absolute", left: GX + x * K, top: GY + y * K, width: l * K, height: CASE * K, perspective: 600 }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", transform: `rotateY(${((1 - tourne) * -80).toFixed(2)}deg)`, transformOrigin: "0 50%" }}>
        <Img src={staticFile("cases/portes-ouvertes.png")} style={{ position: "absolute", left: -x * K, top: -y * K, width: GL }} />
      </div>
      {vive && <div style={{ position: "absolute", inset: -6, border: `6px solid ${C.rouge}`, borderRadius: 6, boxShadow: `0 0 26px ${C.rouge}` }} />}
    </div>
  );
};

const Cadeau: React.FC = () => {
  const f = useCurrentFrame();
  if (f < ouverture(1) || f >= FIN) return null;
  let j = 1;
  while (j < 24 && f >= ouverture(j + 1)) j++;
  const [titre, sorte] = CADEAUX[j - 1];
  const [nomSorte, couleur] = SORTES[sorte];
  const u = rebond(f, ouverture(j), 600, 26);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: GY + GL + 40, display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${((1 - u) * 30).toFixed(1)}px)` }}>
      <div style={{ fontFamily: TITRE, fontSize: 40, color: C.rouge, letterSpacing: 2 }}>December {j}</div>
      <div style={{ fontFamily: TITRE, fontSize: 66, lineHeight: 1.12, color: C.encre, textAlign: "center", whiteSpace: "nowrap" }}>{titre}</div>
      <div style={{ marginTop: 12, fontFamily: POLICE, fontWeight: 800, fontSize: 34, color: "#fff", background: couleur, padding: "6px 22px", borderRadius: 30 }}>{nomSorte}</div>
    </div>
  );
};

const NOTES = [
  "re5", "fad5", "la5", "re6",
  "re5", "mi5", "fad5", "la5", "si5", "re6", "mi6", "fad6",
  "mi5", "fad5", "la5", "si5", "re6", "mi6", "fad6", "la6", "si6", "re7", "mi7", "fad7",
];
const EFFETS: Effet[] = [
  ...NOTES.map((n, i): Effet => [ouverture(i + 1) / FPS, `clochette-${n}.wav`, (i < 12 ? 0.19 : 0.15) * (n.endsWith("7") ? 0.7 : 1), 1.2]),
  [FIN / FPS, "shimmer-sparkle-sweep.mp3", 0.32],
];

export const Cases: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Papier />
      <Img src={staticFile("cases/portes-fermees.png")} style={{ position: "absolute", left: GX, top: GY, width: GL, filter: "drop-shadow(0 10px 18px rgba(60,40,20,.25))" }} />
      {CADEAUX.map((_, i) => <Porte key={i} j={i + 1} />)}
      <Cadeau />
      <Bulle texte={"I hid 24 gifts\nin my Japan map 🎁"} de={0} a={ouverture(1)} y={170} />
      <Bulle texte={"24 free gifts 🎁\nDecember 1 → 24"} de={FIN} a={DUREE_CASES + 1} y={GY + GL + 40} taille={64} />
      {f >= FIN + s(0.6) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center", transform: `scale(${rebond(f, FIN + s(0.6)).toFixed(3)})` }}>
          <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 52, color: "#fff", background: C.rouge, padding: "10px 38px", borderRadius: 40, boxShadow: "0 8px 20px rgba(0,0,0,.25)" }}>on my Japan map · link in bio</div>
        </div>
      )}
      <Son bgm={bgm} musique="musique/yuki-akari.wav" debut={debut}
        volume={(i) => 0.5 * (1 - interpolate(i, [DUREE_CASES - s(0.7), DUREE_CASES], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))} effets={EFFETS} />
    </AbsoluteFill>
  );
};
