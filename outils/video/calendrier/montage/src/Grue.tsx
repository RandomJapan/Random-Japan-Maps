// Le tutoriel de la grue en papier (2026-11-23, le propriétaire : « tu feras aussi une vidéo tutoriel comment faire une grue avec
// justement le papier qu'on fournit […] on pourra mettre le lien du tutoriel directement dans la case »). 2 min 19 s, 9:16,
// 60 images/s, en anglais, sur « Yuki akari » (la musique de Noël de la carte) sans deux de ses parties. La première version
// faisait 2 min 59 ; le 2026-11-25, le propriétaire : « 3 minutes, c'est un peu long […] entre 2 minutes et 2 minutes 30. Et
// à partir de l'étape 9, il y a un moment où […] j'ai galère un petit peu […] si tu peux le couper » : les étapes sont plus
// courtes (les mains plus rapides) et l'étape 9 ne montre plus que les moments où l'on voit le pli (preparer.py).
// Les 12 étapes de origami-{l}.pdf (case 9 du calendrier), l'étape 9 en six (9a à 9f, sa page 4) : en haut, les mains du
// propriétaire qui plient le vrai papier de la case (accélérées, la vitesse est écrite) ; en bas, sur le papier de la carte, le
// dessin de l'étape (les mêmes, calculés par origami/origami.html : diagrammes.py) et sa consigne, celle du PDF.
// Chaque étape commence sur un temps de la musique. Le découpage : ../plan.md.
import React from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, entre, expoSortie, FPS, rebond, s, secTemps, TEXTE, TITRE } from "./theme";
import { Effet, Plan, Plans, Son } from "./Commun";
import DUREES from "./durees.json";

const D = DUREES as Record<string, { d: number; v: number }>;
// La musique raccourcie (musique/yuki-akari-court.wav, preparer.py) : sans A1 (temps 16 → 48) ni B2 (112 → 144), 64 temps
// en tout. Les deux coupes sont avant le temps 172, là où le tempo ne change pas (96) : le temps n de la version courte tombe
// donc à la seconde du temps n + 64 du morceau entier, moins 40 s.
const secCourt = (temps: number) => secTemps(temps + 64) - secTemps(64);
const t = (temps: number) => Math.round(secCourt(temps) * FPS); // l'image du temps n de la musique courte
export const DUREE_GRUE = s(139.0);
const HAUT = 1010; // les mains : de 0 à 1010 px ; le papier en dessous

type Etape = { de: number; a: number; num: string; titre?: string; texte: string; dessin: string; plans: [string, number][] };
// de, a : en temps de la musique courte (A2 16 → 48, B1 48 → 80, le pont 80 → 112, le passage 112 → 116, F1 116 → 148,
// F2 148 → 180, la fin 180 →) ; plans : [plan préparé, sa part en temps]. Chaque consigne reste au moins 0,3 s par mot.
const ETAPES: Etape[] = [
  { de: 8, a: 18, num: "✂", titre: "Before you start", texte: "Print the paper of day 9 at 100 %, on thin paper. Cut out the square along the line.", dessin: "grue/apercu.jpg", plans: [["t-papier", 10]] },
  { de: 18, a: 30, num: "1", texte: "Pattern side up. Fold in half into a triangle, then unfold. The same the other way.", dessin: "grue/etape-01.png", plans: [["t-1", 12]] },
  { de: 30, a: 42, num: "2", texte: "Turn over (white side up). Fold in half into a rectangle, then unfold. The same the other way.", dessin: "grue/etape-02.png", plans: [["t-2", 12]] },
  { de: 42, a: 54, num: "3", texte: "Using the creases, bring the top, left and right corners down to the bottom one. Flatten.", dessin: "grue/etape-03.png", plans: [["t-3", 12]] },
  { de: 54, a: 66, num: "4", texte: "A small square, its open points at the bottom. Fold the two top edges to the middle.", dessin: "grue/etape-04.png", plans: [["t-4", 12]] },
  { de: 66, a: 78, num: "5", texte: "Fold the top triangle down over them. Then unfold the folds of steps 4 and 5.", dessin: "grue/etape-05.png", plans: [["t-5", 12]] },
  { de: 78, a: 90, num: "6", texte: "Lift the bottom point (one layer only) up along the crease. The sides go to the middle. Flatten.", dessin: "grue/etape-06.png", plans: [["t-6", 12]] },
  { de: 90, a: 100, num: "7", texte: "Turn over and repeat steps 4 to 6 on the other side: this is the “bird base”.", dessin: "grue/etape-07.png", plans: [["t-7", 10]] },
  { de: 100, a: 112, num: "8", texte: "Fold the lower edges (top layer) to the middle. Turn over and do it again.", dessin: "grue/etape-08.png", plans: [["t-8a", 6], ["t-8b", 6]] },
  { de: 112, a: 122, num: "9a", titre: "The neck and the tail", texte: "At the bottom there are two thin points. The left one will be the neck, the right one the tail.", dessin: "grue/detail-9a.png", plans: [["t-9a", 10]] },
  { de: 122, a: 130, num: "9b", titre: "The neck and the tail", texte: "Fold the left point up at a slant, almost to the top. Press hard, unfold. Same behind.", dessin: "grue/detail-9b.png", plans: [["t-9b", 8]] },
  { de: 130, a: 140, num: "9c", titre: "The neck and the tail", texte: "Pull the left point a little away. Open it from below: its two layers come apart.", dessin: "grue/detail-9c.png", plans: [["t-9c", 10]] },
  { de: 140, a: 148, num: "9d", titre: "The neck and the tail", texte: "With a finger, push the tip up between the two layers, along the crease.", dessin: "grue/detail-9d.png", plans: [["t-9d", 8]] },
  { de: 148, a: 156, num: "9e", titre: "The neck and the tail", texte: "Close it and flatten it well: the neck comes out between the front and the back.", dessin: "grue/detail-9e.png", plans: [["t-9e", 8]] },
  { de: 156, a: 162, num: "9f", titre: "The neck and the tail", texte: "Do the same with the right point: this is the tail.", dessin: "grue/detail-9f.png", plans: [["t-9f", 6]] },
  { de: 162, a: 172, num: "10", texte: "Fold the tip of the neck the same way, down: this is the head.", dessin: "grue/etape-10.png", plans: [["t-10a", 6], ["t-10b", 4]] },
  { de: 172, a: 180, num: "11", texte: "Fold both wings down: one in front, one behind.", dessin: "grue/etape-11.png", plans: [["t-11", 8]] },
  { de: 180, a: 192, num: "12", texte: "Gently spread the wings to puff up the back.", dessin: "grue/etape-12.png", plans: [["t-12", 12]] },
];

/** Les plans d'une étape : chacun remplit sa part (sa vitesse de lecture est réglée d'après sa durée préparée). */
const plansDe = (e: Etape): (Plan & { vitesse: number })[] => {
  let n = e.de;
  return e.plans.map(([nom, part]) => {
    const de = t(n), a = t(n + part);
    n += part;
    const p = D[`tuto/${nom}`];
    const lecture = p.d / ((a - de) / FPS);
    return { de, a, src: `tuto/${nom}.mp4`, t0: 0, v: lecture, vitesse: p.v * lecture };
  });
};
const MAINS = ETAPES.flatMap(plansDe);

// le début et la fin, en plein écran
const plein = (nom: string, de: number, a: number, t0 = 0): Plan => {
  const p = D[`tuto/${nom}`];
  return { de, a, src: `tuto/${nom}.mp4`, t0, v: Math.min(1.25, (p.d - t0) / ((a - de) / FPS)) };
};
const PLEIN: Plan[] = [
  plein("o-grue-vol", 0, t(8)),
  plein("o-grue-main", t(192), t(200)),
  plein("o-grue-feuille", t(200), t(208)),
  plein("o-fin", t(208), DUREE_GRUE),
];

// ---------------------------------------------------------------- le haut : la vitesse et le numéro de l'étape, sur les mains
const Vitesse: React.FC<{ v: number }> = ({ v }) => (
  <div style={{ position: "absolute", right: 34, top: 200, fontFamily: TEXTE, fontWeight: 800, fontSize: 34, color: "#fff",
    background: "rgba(20,14,10,.55)", borderRadius: 999, padding: "6px 20px" }}>
    {v > 1.15 ? `⏩ ×${v >= 2.95 ? Math.round(v) : v.toFixed(1)}` : "real speed"}
  </div>
);

const Numero: React.FC<{ e: Etape; f: number }> = ({ e, f }) => {
  const de = t(e.de);
  const v = rebond(f, de, 420, 20);
  const long = e.num.length > 1;
  return (
    <div style={{ position: "absolute", left: 36, top: 186, display: "flex", alignItems: "center", gap: 18,
      transform: `scale(${(0.6 + 0.4 * v).toFixed(4)})`, transformOrigin: "70px 70px" }}>
      <div style={{ width: 140, height: 140, borderRadius: "50%", background: C.rouge, border: `5px solid ${C.clair}`,
        boxShadow: "0 10px 30px rgba(0,0,0,.45)", display: "grid", placeItems: "center",
        fontFamily: TITRE, fontSize: long ? 62 : 82, color: "#fff", lineHeight: 1 }}>{e.num}</div>
      {e.num !== "✂" && (
        <div style={{ fontFamily: TITRE, fontSize: 40, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.8)" }}>step {e.num} / 12</div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- le bas : le dessin de l'étape et sa consigne, sur le papier de la carte
const Papier: React.FC<{ e: Etape; f: number }> = ({ e, f }) => {
  const de = t(e.de);
  const u = rebond(f, de, 300, 22);
  const fondu = entre(f, de, de + 8);
  return (
    <>
      <div style={{ position: "absolute", left: 36, top: HAUT + 32, width: 424, height: 404, borderRadius: 12, background: C.dessin,
        border: `3px solid rgba(138,107,69,.5)`, boxShadow: "0 8px 24px rgba(53,37,26,.18)", overflow: "hidden",
        transform: `translateX(${(70 * (1 - u)).toFixed(1)}px)`, opacity: fondu }}>
        <Img src={staticFile(e.dessin)} style={{ position: "absolute", inset: 12, width: "calc(100% - 24px)", height: "calc(100% - 24px)", objectFit: "contain" }} />
      </div>
      <div style={{ position: "absolute", left: 488, top: HAUT + 34, width: 448, opacity: fondu, transform: `translateY(${(24 * (1 - expoSortie(entre(f, de, de + 16)))).toFixed(1)}px)` }}>
        {e.titre && <div style={{ fontFamily: TITRE, fontSize: 40, color: C.rouge, marginBottom: 12, lineHeight: 1.15 }}>{e.titre}</div>}
        <div style={{ fontFamily: TEXTE, fontWeight: 600, fontSize: 36, lineHeight: 1.36, color: C.encre }}>{e.texte}</div>
      </div>
    </>
  );
};

const FondPapier: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: HAUT, width: 1080, height: 1920 - HAUT, backgroundColor: C.clair,
    backgroundImage: `url(${staticFile("ui/grain.jpg")})`, backgroundSize: "240px" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 10, background: `linear-gradient(${C.rouge}, ${C.rougeFonce})` }} />
    <div style={{ position: "absolute", left: 18, right: 18, top: 22, bottom: 18, boxShadow: `inset 0 0 0 2px ${C.clair}, inset 0 0 0 3.5px rgba(138,107,69,.55)` }} />
    {/* sous la légende de TikTok, vu sur YouTube : la légende des plis et d'où vient le papier */}
    <Img src={staticFile("grue/legende.png")} style={{ position: "absolute", left: 60, top: 470, width: 960 }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontFamily: TITRE, fontSize: 36, color: C.encreDouce }}>
      Free paper: day 9 of the Advent calendar · map.randomjapanplace.com
    </div>
  </div>
);

// ---------------------------------------------------------------- le début et la fin : un cartouche de la carte
const Cartouche: React.FC<{ de: number; a: number; y: number; pose?: boolean; children: React.ReactNode }> = ({ de, a, y, pose, children }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const v = pose ? 1 : rebond(f, de, 300, 20);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: y, padding: "34px 40px 38px", textAlign: "center",
      background: "rgba(246,238,219,.95)", borderRadius: 8, boxShadow: `inset 0 0 0 6px rgba(246,238,219,.95), inset 0 0 0 8.5px ${C.trait}, 0 24px 60px rgba(0,0,0,.45)`,
      opacity: pose ? 1 : Math.min(1, (f - de + 1) / 6), transform: `translateY(${(40 * (1 - v)).toFixed(1)}px) scale(${(0.92 + 0.08 * v).toFixed(4)})` }}>
      {children}
    </div>
  );
};
const grand: React.CSSProperties = { fontFamily: TITRE, fontSize: 92, lineHeight: 1.08, color: C.encre };
const petit: React.CSSProperties = { fontFamily: TEXTE, fontWeight: 600, fontSize: 38, lineHeight: 1.35, color: C.encreDouce, marginTop: 18 };
const rouge: React.CSSProperties = { color: C.rouge };

// ---------------------------------------------------------------- le son : la musique (courte), un froissement de papier à chaque étape
const EFFETS: Effet[] = ETAPES.map((e): Effet => [secCourt(e.de) - 0.04, "paper-move-quick.mp3", 0.12]);

export const Grue: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const e = ETAPES.find((x) => f >= t(x.de) && f < t(x.a));
  const m = MAINS.find((x) => f >= x.de && f < x.a);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {e && (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: HAUT, overflow: "hidden" }}>
            <Plans plans={MAINS} l={1080} h={HAUT} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 420, background: "linear-gradient(rgba(0,0,0,.5), transparent)" }} />
          </div>
          <FondPapier />
          <Numero e={e} f={f} />
          {m && <Vitesse v={m.vitesse} />}
          <Papier e={e} f={f} />
        </>
      )}
      {!e && <Plans plans={PLEIN} />}
      <Cartouche de={0} a={t(8)} y={250} pose>
        <div style={grand}>How to fold<br />a <span style={rouge}>paper crane</span></div>
        <div style={petit}>with the free origami paper of my<br />Japan map’s Advent calendar 🎄</div>
      </Cartouche>
      <Cartouche de={t(192)} a={t(200)} y={260}>
        <div style={grand}>Your crane<br />is <span style={rouge}>ready!</span> ✨</div>
      </Cartouche>
      <Cartouche de={t(200)} a={t(208)} y={260}>
        <div style={{ ...grand, fontSize: 74 }}>In Japan, people fold<br /><span style={rouge}>1,000 cranes</span><br />to make a wish ✨</div>
        <div style={petit}>senbazuru · 千羽鶴</div>
      </Cartouche>
      <Cartouche de={t(208)} a={DUREE_GRUE} y={230}>
        <div style={{ ...grand, fontSize: 70 }}>Free paper<br />+ all the steps</div>
        <div style={{ ...petit, fontSize: 42, color: C.encre }}>day 9 of my Japan map’s<br />Advent calendar 🎄</div>
        <div style={{ display: "inline-block", marginTop: 26, fontFamily: TEXTE, fontWeight: 800, fontSize: 46, color: "#fff", background: C.rouge,
          borderRadius: 999, padding: "10px 44px", boxShadow: `0 7px 0 ${C.rougeFonce}` }}>link in bio</div>
        <div style={{ ...petit, fontSize: 34, marginTop: 20 }}>map.randomjapanplace.com</div>
      </Cartouche>
      <Son bgm={bgm} musique="musique/yuki-akari-court.wav" volume={(i) => 0.45 * (1 - entre(i, DUREE_GRUE - 50, DUREE_GRUE))} effets={EFFETS} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- la miniature : la grue et le titre
export const MiniatureGrue: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Sequence from={0} durationInFrames={1} layout="none">
      <Plans plans={[{ de: 0, a: 1, src: "tuto/o-grue-main.mp4", t0: 4.5 }]} />
    </Sequence>
    <Cartouche de={0} a={1} y={250} pose>
      <div style={grand}>How to fold<br />a <span style={rouge}>paper crane</span></div>
      <div style={petit}>with the free origami paper of my<br />Japan map’s Advent calendar 🎄</div>
    </Cartouche>
  </AbsoluteFill>
);
