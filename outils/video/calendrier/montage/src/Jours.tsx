// « My Japan map changes every day until Christmas » (plan-noel.md, vidéo 1, 2026-11-23) : la carte de nuit, sans interface ;
// un plan par jour, la décoration du jour apparaît à l'écran (la prise cv-jours change de jour en tournant), sous une porte du
// calendrier dont le chiffre tourne. Sur la fin du pont et le grand refrain final de « Yuki akari » (temps 176 → 212) ; une
// clochette de boîte à musique par jour, qui monte la gamme de ré.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Effet, Plan, Plans, Son } from "./Commun";
import { APPARITION, Papier, prise, temps } from "./Noel";
import { C, FPS, POLICE, rebond, s, TITRE, entre } from "./theme";

const { b, debut } = temps(176);
const CROCHE = 0.3125; // une croche à 96 : la décoration paraît sur le « et » du temps
export const DUREE_JOURS = b(212) + s(0.8);

const JOURS: [string, string][] = [
  ["neige", "Santa hats on every pin 🎅"], ["cascades", "waterfalls freeze 🧊"], ["lanternes", "lanterns in old villages 🏮"],
  ["cygnes", "the swans arrive 🦢"], ["papier", "paper cranes fly"], ["fermes", "snowy farmhouses 🏡"],
  ["kanji", "the kanji of the year"], ["cartes", "New Year cards fly 📮"], ["kamakura", "snow huts light up"],
  ["danse", "two cranes dance"], ["yuzu", "yuzu in the hot springs"], ["rennes", "the reindeer rest 🦌"],
];
const FIN = ["traineau", "Santa's sleigh 🛷"] as const;

// chaque jour : la coupe (sur le temps : le chiffre tourne, le texte arrive), puis la décoration qui paraît (une croche plus
// tard : sa clochette)
type Jour = { coupe: number; flip: number; nom: string; texte: string };
const LISTE: Jour[] = [...JOURS, FIN].map(([nom, texte], k) => {
  const coupe = b(180 + 2 * k);
  return { coupe, flip: prise(nom).voir ? coupe + s(CROCHE) : coupe, nom, texte };
});

// la décoration est au centre de la prise (son repère y pose son pied) : on s'en approche, plus ou moins selon sa taille
const GROS: Record<string, number> = { japon: 1, traineau: 1, kanji: 1, cartes: 1, neige: 1.2, cascades: 1.2, papier: 1.15, yuzu: 1.55 };
const zoom = (nom: string) => (): [number, number, number] => [GROS[nom] ?? 1.42, 540, 965];
const PLANS: Plan[] = [
  { de: 0, a: b(180), src: prise("japon").src, t0: prise("japon").t0 + 0.3, zoom: zoom("japon") },
  ...LISTE.map((j, k): Plan => {
    const p = prise(j.nom);
    return {
      de: j.coupe, a: k < LISTE.length - 1 ? LISTE[k + 1].coupe : DUREE_JOURS, src: p.src,
      t0: p.t0 + (p.voir ? APPARITION - CROCHE : j.nom === "papier" ? 1.7 : 0.3), v: j.nom === "traineau" ? 1.4 : 1, zoom: zoom(j.nom),
    };
  }),
];

const NOTES = ["re5", "mi5", "fad5", "la5", "si5", "re6", "mi6", "fad6", "la6", "si6", "re7", "mi7", "fad7"];
const EFFETS: Effet[] = [
  ...LISTE.map((j, k): Effet => [j.flip / FPS, `clochette-${NOTES[k]}.wav`, 0.34 - 0.012 * k, 1.5]),
  [LISTE[12].flip / FPS + 0.1, "shimmer-sparkle-sweep.mp3", 0.35],
];

// ---------------------------------------------------------------- la porte du calendrier : le chiffre du jour
const Porte: React.FC = () => {
  const f = useCurrentFrame();
  if (f < b(180) - 8 || f >= b(206)) return null;
  let i = 0;
  while (i + 1 < LISTE.length && f >= LISTE[i + 1].coupe) i++;
  const j = LISTE[i];
  const jour = prise(j.nom).j;
  const entree = rebond(f, b(180) - 8);
  const sortie = entre(f, b(206) - 8, b(206));
  // le chiffre tourne : il s'écrase puis revient (8 images), la porte bondit
  const df = f - j.coupe;
  const tourne = df >= 0 && df < 8 ? Math.abs(Math.cos((df / 8) * Math.PI)) : 1;
  const bond = 1 + 0.08 * Math.sin(Math.PI * Math.min(1, Math.max(0, df) / 10)) * (df >= 0 ? 1 : 0);
  const texteVu = f >= j.coupe;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", flexDirection: "column", alignItems: "center",
      opacity: 1 - sortie, transform: `scale(${(entree * bond).toFixed(4)})`, transformOrigin: "50% 0" }}>
      <div style={{ width: 270, height: 270, position: "relative", boxShadow: "0 10px 30px rgba(10,14,30,0.55)" }}>
        <Papier teinte="#f2e8cf" />
        <div style={{ position: "absolute", inset: 10, border: `3px solid ${C.trait}`, outline: `1.5px solid ${C.trait}`, outlineOffset: -10 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scaleY(${tourne.toFixed(3)})` }}>
          <div style={{ fontFamily: TITRE, fontSize: 34, letterSpacing: 6, color: C.rouge, marginTop: 4 }}>DEC</div>
          <div style={{ fontFamily: TITRE, fontSize: 132, lineHeight: 1, color: C.encre, marginTop: -4 }}>{jour}</div>
          <div style={{ width: 20, height: 20, background: C.rouge, transform: "rotate(45deg)", marginTop: 8 }} />
        </div>
      </div>
      <div style={{ marginTop: 26, height: 84 }}>
        {texteVu && (
          <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 56, color: "#fff", padding: "8px 30px", borderRadius: 44,
            background: "rgba(20,24,40,0.72)", whiteSpace: "nowrap", transform: `scale(${rebond(f, j.coupe, 520, 22).toFixed(3)})` }}>{j.texte}</div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- les cartouches du début et de la fin (le papier de la carte)
const Cartouche: React.FC<{ lignes: string[]; taille: number; de: number; a: number; top: number; ruban?: string }> = ({ lignes, taille, de, a, top, ruban }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const u = de === 0 ? 1 : rebond(f, de);
  const o = 1 - entre(f, a - 8, a);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, opacity: o, transform: `scale(${u.toFixed(4)})` }}>
      <div style={{ position: "relative", padding: "34px 30px 38px", boxShadow: "0 14px 40px rgba(8,12,28,0.6)" }}>
        <Papier teinte="#f2e8cf" />
        <div style={{ position: "absolute", inset: 12, border: `3px solid ${C.trait}` }} />
        <div style={{ position: "absolute", inset: 20, border: `1.5px solid ${C.trait}` }} />
        {lignes.map((l, i) => (
          <div key={i} style={{ position: "relative", fontFamily: TITRE, fontSize: taille, lineHeight: 1.22, color: C.encre, textAlign: "center" }}>{l}</div>
        ))}
      </div>
      {ruban && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: -14, position: "relative" }}>
          <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 50, color: "#fff", background: C.rouge, padding: "10px 40px", borderRadius: 6, boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}>{ruban}</div>
        </div>
      )}
    </div>
  );
};

export const Jours: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  // un voile sombre en haut, pour la porte et les textes
  const voile = <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 720, background: "linear-gradient(rgba(8,12,26,0.55), rgba(8,12,26,0))" }} />;
  return (
    <AbsoluteFill style={{ background: "#0d1424" }}>
      <Plans plans={PLANS} />
      {voile}
      <Cartouche lignes={["My Japan map", "changes every day", "until Christmas 🎄"]} taille={76} de={0} a={b(180)} top={230} />
      <Porte />
      <Cartouche lignes={["24 days ·", "24 free gifts 🎁", "on my Japan map"]} taille={74} de={b(206)} a={DUREE_JOURS + 1} top={250} ruban="link in bio" />
      <Son bgm={bgm} musique="musique/yuki-akari.wav" debut={debut}
        volume={(i) => 0.5 * (1 - interpolate(i, [DUREE_JOURS - s(0.8), DUREE_JOURS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))} effets={EFFETS} />
    </AbsoluteFill>
  );
};
