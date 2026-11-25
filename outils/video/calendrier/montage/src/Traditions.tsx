// « 5 things Japan does in December » (plan-noel.md, vidéo 2, 2026-11-23) : une liste à apprendre, prise dans les « Le savais-tu ? »
// et les cadeaux des cases, chaque chose montrée sur la vraie carte (la prise cv-jours) ; grands mots blancs cernés à la TikTok,
// un mot en rouge, le numéro dans un disque rouge. Sur le deuxième couplet de « Yuki akari » (temps 46 → 82), calme.
import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Effet, Plan, Plans, Son } from "./Commun";
import { Papier, PRISE, prise, SEG, temps } from "./Noel";
import { C, FPS, POLICE, rebond, s, entre, lisse } from "./theme";

const { b, debut } = temps(46);
export const DUREE_TRADITIONS = b(82) + s(0.7);
const fait = (k: number) => b(52 + 5 * k); // le début de la chose k (0 à 4)

const ZOOM = (): [number, number, number] => [1.12, 540, 1080];
const PRES = (): [number, number, number] => [1.5, 540, 965]; // le yuzu, au centre de la prise
const PLANS: Plan[] = [
  { de: 0, a: fait(0), src: PRISE, t0: SEG.traineau.t0 + 2.4, v: 1.4, zoom: ZOOM },
  { de: fait(0), a: fait(1), src: PRISE, t0: SEG.yuzu.t0 + 0.55, zoom: PRES },
  { de: fait(1), a: fait(2), src: PRISE, t0: SEG.kanji.t0 + 0.9, zoom: ZOOM },
  { de: fait(2), a: fait(3), src: prise("papier").src, t0: 1.1, zoom: ZOOM },
  { de: fait(3), a: fait(4), src: PRISE, t0: SEG.cartes.t0 + 0.55, zoom: ZOOM },
];

// les phrases : *mot* en rouge ; \n coupe la ligne
const CHOSES = [
  "On the shortest day,\nthey bathe with *yuzu* 🍋",
  "A monk paints the *kanji*\nof the year 🖌️",
  "They fold *1,000* paper\ncranes to make a wish",
  "New Year cards all arrive\non *January 1* 📮",
  "Christmas Eve dinner?\n*Fried chicken* 🍗",
];

const Mots: React.FC<{ texte: string; taille: number }> = ({ texte, taille }) => (
  <>
    {texte.split("\n").map((ligne, i) => (
      <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: taille, lineHeight: 1.16, textAlign: "center", whiteSpace: "nowrap" }}>
        {ligne.split(/(\*[^*]+\*)/).map((m, j) => m.startsWith("*")
          ? <span key={j} style={{ color: "#fff", background: C.rouge, padding: "0 14px", borderRadius: 14, boxDecorationBreak: "clone" }}>{m.slice(1, -1)}</span>
          : <span key={j} style={{ color: "#fff", WebkitTextStroke: `13px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 24px rgba(0,0,0,.45)" }}>{m}</span>)}
      </div>
    ))}
  </>
);

/** Le titre d'une chose : le numéro (disque rouge) et la phrase, posés d'un coup sur la coupe (avec un petit bond). */
const Chose: React.FC<{ k: number }> = ({ k }) => {
  const f = useCurrentFrame();
  const de = fait(k), a = fait(k + 1);
  if (f < de || f >= a) return null;
  const u = rebond(f, de, 520, 24);
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top: 230, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ width: 104, height: 104, borderRadius: 52, background: C.rouge, border: "5px solid #fff", display: "grid", placeItems: "center",
        fontFamily: POLICE, fontWeight: 900, fontSize: 60, color: "#fff", boxShadow: "0 8px 20px rgba(0,0,0,.4)", transform: `scale(${u.toFixed(3)})` }}>{k + 1}</div>
      <div style={{ transform: `scale(${(0.9 + 0.1 * u).toFixed(3)})` }}><Mots texte={CHOSES[k]} taille={70} /></div>
    </div>
  );
};

// la 5e : la vraie fiche de la case 23, du titre au « Did you know? » (qui raconte le poulet frit)
const Fiche: React.FC = () => {
  const f = useCurrentFrame(); // dans la Sequence
  const d = fait(5) - fait(4);
  const y = -1080 * lisse(entre(f, d * 0.25, d * 0.8));
  return (
    <AbsoluteFill>
      <Papier />
      <Img src={staticFile("cases/case-23.png")} style={{ position: "absolute", left: 20, top: 560 + y, width: 1040 }} />
    </AbsoluteFill>
  );
};

// la fin : les 24 portes ouvertes du calendrier
const Fin: React.FC = () => {
  const f = useCurrentFrame();
  const u = rebond(f, 0, 300, 22);
  return (
    <AbsoluteFill>
      <Papier />
      <Img src={staticFile("cases/portes-ouvertes.png")} style={{ position: "absolute", left: 140, top: 735, width: 800, transform: `scale(${(0.85 + 0.15 * u).toFixed(3)})`, opacity: Math.min(1, u * 1.4) }} />
    </AbsoluteFill>
  );
};

const EFFETS: Effet[] = [
  ...[0, 1, 2, 3, 4].map((k): Effet => [fait(k) / FPS, "paper-slide.mp3", 0.22]),
  [b(77) / FPS, "shimmer-sparkle-sweep.mp3", 0.3],
];

export const Traditions: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0d1424" }}>
      <Plans plans={PLANS} />
      <Sequence from={fait(4)} durationInFrames={b(77) - fait(4)} layout="none"><Fiche /></Sequence>
      <Sequence from={b(77)} layout="none"><Fin /></Sequence>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 760, background: "linear-gradient(rgba(8,12,26,0.5), rgba(8,12,26,0))", opacity: f < b(77) ? 1 : 0 }} />
      {f < fait(0) && (
        <div style={{ position: "absolute", left: 30, right: 30, top: 250 }}><Mots texte={"*5 things* Japan does\nin December ❄️"} taille={84} /></div>
      )}
      {[0, 1, 2, 3, 4].map((k) => <Chose key={k} k={k} />)}
      {f >= b(77) && (
        <div style={{ position: "absolute", left: 30, right: 30, top: 250, transform: `scale(${rebond(f, b(77), 520, 24).toFixed(3)})` }}>
          <Mots texte={"One a day in the\n*Advent calendar*\nof my Japan map 🎁"} taille={66} />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}>
            <div style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 52, color: "#fff", background: C.rouge, padding: "10px 36px", borderRadius: 40 }}>free · link in bio</div>
          </div>
          {/* l'adresse écrite (le marketing, 2026-11-25 : les liens ne sont pas cliquables dans les Shorts YouTube) */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 44, color: "#fff", background: C.encre, padding: "10px 34px", borderRadius: 40 }}>map.randomjapanplace.com</div>
          </div>
        </div>
      )}
      <Son bgm={bgm} musique="musique/yuki-akari.wav" debut={debut}
        volume={(i) => 0.5 * (1 - interpolate(i, [DUREE_TRADITIONS - s(0.7), DUREE_TRADITIONS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))} effets={EFFETS} />
    </AbsoluteFill>
  );
};
