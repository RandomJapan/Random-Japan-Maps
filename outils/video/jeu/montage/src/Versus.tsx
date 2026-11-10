// La quatrième vidéo du jeu, « noob vs pro » (2026-11-10, le propriétaire : « C'est bon fait une autre vidéo dans un style encore
// différent »). 26 s, 9:16, 60 images/s, en anglais. Un duel comique façon jeu d'arcade 8-bit : le débutant (1P) pose tout à Tokyo,
// le pro (2P) vise juste… sauf à la manche 4, près de Tokyo, que le débutant gagne. Police pixel, musique chiptune composée, sans voix.
// Refaite le même jour sur une borne d'arcade (« deux téléphones côte à côte […] c'est trop petit pour regarder, surtout sur
// téléphone ») : un seul grand écran, les joueurs jouent chacun leur tour. Puis plus lente, avec deux personnages (« ça va un peu trop
// vite et on ne se rend pas bien compte que c'est un noob vs un pro qui joue ») : un écran « VS » au début (LV 1 contre LV 99), les
// deux personnages en pixel art (personnages.py) qui parlent dans des boîtes de dialogue, leurs têtes qui changent (il pleure, il est
// choqué…), des tours deux fois plus longs, la manche 3 en avance rapide, un écran « VS » des scores à la fin.
// 150 battements par minute : le temps n tombe à l'image 24 n (le découpage : ../plan-versus.md).
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont as pixel } from "@remotion/google-fonts/PressStart2P";
import { entre, EMOJI, expoSortie, FPS, rebond, TIKTOK } from "./theme";
import { Effet, Son } from "./Commun";
import DESSINS from "./personnages.json";

const PIXEL = `${pixel("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily}, ${EMOJI}, monospace`;
const b = (n: number) => Math.round(n * 24);
const sec = (n: number) => (n * 24) / FPS;
export const DUREE_VERSUS = b(65);

const ROUGE = "#e0563f", BLEU = "#5b9bd5", OR = "#ffd23f", NUIT = "#0d1218";
// l'ombre dure d'un texte pixel (un contour, puis une ombre portée)
const contour = (px: number, c = "#000") => [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]].map(([x, y]) => `${x * px}px ${y * px}px 0 ${c}`).join(", ") + `, ${px}px ${px + 4}px 0 ${c}`;

type Qui = "noob" | "pro";
const COULEUR: Record<Qui, string> = { noob: ROUGE, pro: BLEU };
const NOM: Record<Qui, string> = { noob: "NOOB 🐣", pro: "PRO 😎" };

// ---------------------------------------------------------------- les deux personnages (pixel art 24 × 24, personnages.py)
const D = DESSINS as unknown as { palette: Record<string, string>; sprites: Record<Qui, string[]>; tetes: Record<Qui, Record<string, Record<string, string>>> };
/** Un personnage, une tête : des rectangles par suite de pixels de même couleur. */
const Perso: React.FC<{ qui: Qui; tete: string; px: number; style?: React.CSSProperties }> = ({ qui, tete, px, style }) => {
  const lignes = D.sprites[qui].map((l, i) => D.tetes[qui][tete]?.[String(i)] ?? l);
  const rects: React.ReactNode[] = [];
  lignes.forEach((l, y) => {
    let x = 0;
    while (x < 24) {
      const c = l[x];
      let n = 1;
      while (x + n < 24 && l[x + n] === c) n++;
      if (c !== ".") rects.push(<rect key={`${y}-${x}`} x={x} y={y} width={n} height={1} fill={D.palette[c]} />);
      x += n;
    }
  });
  return (
    <svg width={24 * px} height={24 * px} viewBox="0 0 24 24" shapeRendering="crispEdges" style={{ display: "block", filter: `drop-shadow(${px / 2}px ${px / 2}px 0 rgba(0,0,0,.6))`, ...style }}>{rects}</svg>
  );
};

// les têtes, au fil de la vidéo (en temps) ; sinon : content (le débutant), cool (le pro)
const HUMEURS: Record<Qui, [number, number, string][]> = {
  noob: [[10, 20, "pleure"], [24, 36, "pleure"], [40, 46.5, "choque"], [46.5, 52, "fier"], [52, 57, "pleure"]],
  pro: [[46.5, 52, "choque"]],
};
const humeur = (qui: Qui, t: number) => HUMEURS[qui].find(([a, z]) => t >= a && t < z)?.[2] ?? (qui === "noob" ? "content" : "cool");

// ---------------------------------------------------------------- le découpage de l'écran
// L'écran (les prises 1080 × 1920 à × 0,778). Les prises (plans.js) : des manches de 12 temps, chaque joueur appuie sur la carte 5
// temps après « Next place », valide un demi-temps après. La vidéo montre le débutant, puis le pro, à chaque manche.
const E = { x: 120, y: 300, l: 840, h: 1493 };
const K = E.l / 1080;
const FRONTON = { x: 34, y: 14, l: 1012, h: 214 };
const PUPITRE = 1852; // le haut des manettes

type Morceau = { de: number; a: number; qui: Qui | null; prise?: string; t0?: number; ecran?: "vs" | "scores" | "attente" };
const MORCEAUX: Morceau[] = [
  { de: 0, a: 4, qui: null, ecran: "vs" },
  { de: 4, a: 12.5, qui: "noob", prise: "vs-noob", t0: 0 },      // manche 1 : il appuie au temps 9
  { de: 12.5, a: 20, qui: "pro", prise: "vs-pro", t0: 2.5 },     // 15
  { de: 20, a: 26.5, qui: "noob", prise: "vs-noob", t0: 14 },    // manche 2 : 23
  { de: 26.5, a: 32, qui: "pro", prise: "vs-pro", t0: 15 },      // 28,5
  { de: 32, a: 36, qui: null, prise: "vs-noob", t0: 30.5 },      // manche 3, en avance rapide : la réponse du débutant
  { de: 36, a: 43, qui: "noob", prise: "vs-noob", t0: 38 },      // manche 4 : 39
  { de: 43, a: 48.5, qui: "pro", prise: "vs-pro", t0: 38.5 },    // 45,5
  { de: 48.5, a: 52, qui: "noob", prise: "vs-noob", t0: 42.5 },  // la réponse du débutant, encore
  { de: 52, a: 57, qui: null, ecran: "scores" },
  { de: 57, a: 65, qui: null, ecran: "attente" },
];
const FIN = 57; // l'écran s'éteint et se rallume sur « PRESS START »
const BASCULES = MORCEAUX.slice(1, -1).map((m) => m.de); // l'écran grésille
const morceauA = (f: number) => MORCEAUX.find((m) => f >= b(m.de) && f < b(m.a)) ?? MORCEAUX[MORCEAUX.length - 1];
const joueurA = (f: number): Qui | null => morceauA(f).qui;

// les vrais résultats des prises (le jeu les calcule) : les points des manches 1 à 4, puis le total des cinq
const POINTS = { noob: [2, 38, 225, 783], pro: [999, 998, 998, 33] };
const TOTAL = { noob: 1286, pro: 4027 };
// (en temps de la vidéo) chacun appuie sur la carte, valide un demi-temps après, sa réponse tombe un temps après l'appui
const APPUIS = { noob: [9, 23, 39], pro: [15, 28.5, 45.5] };
const REPONSES = { noob: [10, 24, 32.5, 40], pro: [16, 29.5, 32.5, 46.5] }; // (la manche 3 : les deux d'un coup)
const CINQUIEME = 52.5; // l'écran des scores : la cinquième manche s'ajoute

// ---------------------------------------------------------------- ce que disent les personnages (au plus 12 lettres par ligne)
type Replique = { de: number; a: number; qui: Qui; l1: string; l2?: string };
const REPLIQUES: Replique[] = [
  { de: 6.5, a: 10, qui: "noob", l1: "EASY!", l2: "IT'S TOKYO 🗼" },
  { de: 10.25, a: 12.5, qui: "noob", l1: "1,556 KM?!", l2: "NOOO 😭" },
  { de: 12.75, a: 16, qui: "pro", l1: "SHURI CASTLE", l2: "OKINAWA. 🎯" },
  { de: 16.25, a: 20, qui: "pro", l1: "TOO EASY. 😎" },
  { de: 21.5, a: 24, qui: "noob", l1: "TOKYO", l2: "AGAIN! 🗼" },
  { de: 24.25, a: 26.5, qui: "noob", l1: "WHY?! 😭" },
  { de: 26.75, a: 29.5, qui: "pro", l1: "SAPPORO. 🎯" },
  { de: 29.75, a: 32, qui: "pro", l1: "NEXT! 😎" },
  { de: 37.5, a: 40, qui: "noob", l1: "TOKYO.", l2: "ALWAYS. 🗼" },
  { de: 40.25, a: 43, qui: "noob", l1: "+783?!", l2: "WAIT... 😳" },
  { de: 43.25, a: 46.5, qui: "pro", l1: "KYUSHU,", l2: "FOR SURE. 🎯" },
  { de: 46.75, a: 48.5, qui: "pro", l1: "WHAT?! 😱" },
  { de: 49.25, a: 52, qui: "noob", l1: "TOLD YOU.", l2: "TOKYO! 😎" },
];
const lettres = (r: Replique) => Array.from(r.l1 + (r.l2 ?? "")).length;
/** Le personnage parle (sa bouche bouge) pendant que son texte s'écrit, une lettre par image. */
const parleA = (qui: Qui, f: number) => REPLIQUES.some((r) => r.qui === qui && f >= b(r.de) && f < b(r.de) + lettres(r));
const teteA = (qui: Qui, f: number) => {
  const h = humeur(qui, f / 24);
  return parleA(qui, f) && f % 12 < 6 && (h === "content" || h === "cool") ? "parle" : h;
};

// les annonces (sans personnage)
type Annonce = { de: number; a: number; l1: string; l2?: string; c?: string; haut?: boolean };
const ANNONCES: Annonce[] = [
  { de: 4, a: 6.5, l1: "ROUND 1", l2: "WHERE IS THIS? 📍", c: OR },
  { de: 20, a: 21.5, l1: "ROUND 2", c: OR },
  { de: 32, a: 36, l1: "ROUND 3 ⏩", l2: "SAME STORY... 😭", c: OR },
  { de: 36, a: 37.5, l1: "ROUND 4", c: OR },
  { de: 48.5, a: 52, l1: "THE NOOB WON", l2: "THIS ROUND! 🤯", c: OR, haut: true },
];

// ---------------------------------------------------------------- la borne
/** La pièce de décor : le corps de la borne, ses liserés (rouge côté 1P, bleu côté 2P), le cadre de l'écran, les manettes. */
const Borne: React.FC = () => {
  const f = useCurrentFrame();
  const qui = joueurA(f);
  const lueur = qui ? COULEUR[qui] : OR;
  const appuye = (q: Qui) => [...APPUIS[q], ...APPUIS[q].map((a) => a + 0.5)].some((a) => f >= b(a) && f < b(a) + 7);
  const penche = (q: Qui) => APPUIS[q].reduce((p, a) => p + Math.sin(Math.PI * entre(f, b(a - 1), b(a))) * (q === "noob" ? 14 : -10), 0);
  const manettes = (q: Qui, x0: number) => {
    const c = COULEUR[q];
    const bas = appuye(q);
    return (
      <>
        <div style={{ position: "absolute", left: x0 - 5, top: PUPITRE + 10, width: 10, height: 34, background: "#b9bcc8", transformOrigin: "50% 100%", transform: `rotate(${penche(q).toFixed(2)}deg)` }}>
          <div style={{ position: "absolute", left: -18, top: -30, width: 46, height: 40, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff8 0 12%, ${c} 40%, #000a 100%)` }} />
        </div>
        <div style={{ position: "absolute", left: x0 - 30, top: PUPITRE + 40, width: 60, height: 18, borderRadius: "50%", background: "#0008" }} />
        {[0, 1].map((k) => (
          <div key={k} style={{ position: "absolute", left: x0 + (q === "noob" ? 1 : -1) * (100 + 78 * k) - 30, top: PUPITRE + 22 + (bas && k === 0 ? 5 : 0), width: 60, height: 30, borderRadius: "50%", background: `radial-gradient(circle at 40% 35%, #fff9 0 10%, ${c} 45%, #0009 100%)`, boxShadow: bas && k === 0 ? "0 1px 0 #000" : "0 6px 0 #000c" }} />
        ))}
      </>
    );
  };
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(60% 40% at 0% 30%, ${ROUGE}55, transparent), radial-gradient(60% 40% at 100% 70%, ${BLEU}55, transparent), #07080d` }} />
      <div style={{
        position: "absolute", left: 18, right: 18, top: 0, bottom: 0, background: "linear-gradient(90deg, #121420, #1d2031 12%, #1d2031 88%, #121420)",
        boxShadow: `inset 10px 0 0 ${ROUGE}, inset -10px 0 0 ${BLEU}, -6px 0 24px ${ROUGE}88, 6px 0 24px ${BLEU}88`,
      }} />
      <div style={{ position: "absolute", left: 30, right: 30, top: 236, height: 1600, backgroundImage: "radial-gradient(#ffffff14 2px, transparent 2.5px)", backgroundSize: "28px 28px" }} />
      <div style={{ position: "absolute", left: E.x - 16, top: E.y - 16, width: E.l + 32, height: E.h + 32, borderRadius: 38, background: "#030406", boxShadow: `0 0 0 5px ${lueur}, 0 0 46px 6px ${lueur}88` }} />
      <div style={{ position: "absolute", left: 18, right: 18, top: PUPITRE - 12, bottom: 0, background: "linear-gradient(#3a3e57, #23263a 30%, #181a28)", clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0 100%)", boxShadow: "inset 0 3px 0 #ffffff33" }} />
      {manettes("noob", 190)}
      {manettes("pro", 890)}
      {[["1P", ROUGE, 470], ["2P", BLEU, 560]].map(([t, c, x]) => (
        <div key={t as string} style={{ position: "absolute", left: x as number, top: PUPITRE + 18, width: 50, height: 34, borderRadius: 6, background: "#e9e9ef", boxShadow: "0 5px 0 #0009", fontFamily: PIXEL, fontSize: 14, color: c as string, display: "grid", placeItems: "center" }}>{t}</div>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: E.y + E.h + 23, textAlign: "center", fontFamily: `${TIKTOK}, sans-serif`, fontWeight: 700, fontSize: 17, color: "rgba(255,255,255,.6)" }}>
        © Mapterhorn · © OpenStreetMap · Natural Earth
      </div>
    </>
  );
};

// ---------------------------------------------------------------- le fronton : le titre, les ampoules, les deux joueurs et leurs scores
const scoreA = (qui: Qui, f: number) => {
  let total = 0;
  REPONSES[qui].forEach((r, k) => { total += POINTS[qui][k] * entre(f, b(r), b(r) + 24); });
  const reste = TOTAL[qui] - POINTS[qui].reduce((a, c) => a + c, 0);
  return Math.round(total + reste * entre(f, b(CINQUIEME), b(CINQUIEME) + 24));
};

const Fronton: React.FC = () => {
  const f = useCurrentFrame();
  const qui = joueurA(f);
  const pas = Math.floor(f / 12); // les ampoules avancent à la croche
  const ampoules: React.ReactNode[] = [];
  const n = 22;
  for (let i = 0; i < n; i++) {
    for (const y of [FRONTON.y + 10, FRONTON.y + FRONTON.h - 10]) {
      const allumee = (i + pas + (y > 100 ? 1 : 0)) % 3 === 0;
      ampoules.push(<div key={`${i}-${y}`} style={{ position: "absolute", left: FRONTON.x + 26 + (i * (FRONTON.l - 52)) / (n - 1) - 6, top: y - 6, width: 12, height: 12, borderRadius: "50%", background: allumee ? "#fff3b0" : "#5a4a1c", boxShadow: allumee ? `0 0 12px 3px ${OR}` : "none" }} />);
    }
  }
  const bloc = (q: Qui) => {
    const g = q === "noob";
    const eteint = qui !== null && qui !== q;
    return (
      <>
        <div style={{ position: "absolute", top: 106, [g ? "left" : "right"]: 58, opacity: eteint ? 0.5 : 1 }}>
          <Perso qui={q} tete={teteA(q, f)} px={4} />
          {!g && f >= b(53) && <div style={{ position: "absolute", left: 22, top: -38, fontSize: 44, fontFamily: EMOJI }}>👑</div>}
        </div>
        <div style={{ position: "absolute", top: 116, [g ? "left" : "right"]: 170, textAlign: g ? "left" : "right", fontFamily: PIXEL, opacity: eteint ? 0.55 : 1 }}>
          <div style={{ fontSize: 30, color: "#fff", textShadow: contour(4) }}>
            {g ? <><span style={{ color: COULEUR[q] }}>1P </span>NOOB</> : <>PRO<span style={{ color: COULEUR[q] }}> 2P</span></>}
          </div>
          <div style={{ fontSize: 50, color: OR, textShadow: contour(5), marginTop: 14, letterSpacing: 2 }}>{String(scoreA(q, f)).padStart(4, "0")}</div>
        </div>
      </>
    );
  };
  return (
    <>
      <div style={{
        position: "absolute", left: FRONTON.x, top: FRONTON.y, width: FRONTON.l, height: FRONTON.h, borderRadius: 18,
        background: `linear-gradient(90deg, #5a1d14, #2a1430 50%, #14294a)`, boxShadow: `inset 0 0 0 4px #000, inset 0 0 50px #000a, 0 8px 0 #000`,
      }} />
      {ampoules}
      <div style={{ position: "absolute", left: 0, right: 0, top: FRONTON.y + 34, textAlign: "center", fontFamily: PIXEL, fontSize: 30, color: OR, textShadow: contour(3), letterSpacing: 3 }}>GUESS THE PLACE</div>
      {bloc("noob")}
      {bloc("pro")}
      <div style={{ position: "absolute", left: 0, right: 0, top: 128, textAlign: "center", fontFamily: PIXEL, fontSize: 60, color: OR, textShadow: `${contour(5)}, -5px 0 0 ${ROUGE}, 5px 0 0 ${BLEU}` }}>VS</div>
    </>
  );
};

/** Une flèche pixel (le ▶ de la police tombe sur l'emoji bleu) : un triangle, à la couleur du texte. */
const Fleche: React.FC<{ vers: "d" | "g"; px: number }> = ({ vers, px }) => (
  <span style={{
    display: "inline-block", width: 0, height: 0, borderTop: `${px / 2}px solid transparent`, borderBottom: `${px / 2}px solid transparent`,
    [vers === "d" ? "borderLeft" : "borderRight"]: `${px * 0.8}px solid currentColor`, filter: "drop-shadow(3px 3px 0 #000)", verticalAlign: "-0.05em",
    margin: vers === "d" ? "0 0.5em 0 0" : "0 0 0 0.5em",
  }} />
);

/** La bande entre le fronton et l'écran : qui a la main. */
const Tour: React.FC = () => {
  const f = useCurrentFrame();
  const m = morceauA(f);
  const clignote = Math.floor(f / 15) % 2 === 0;
  let texte: React.ReactNode = "";
  if (m.qui === "noob") texte = <><Fleche vers="d" px={26} />PLAYER 1 · NOOB</>;
  else if (m.qui === "pro") texte = <>PRO · PLAYER 2<Fleche vers="g" px={26} /></>;
  else if (m.ecran === "vs") texte = "★ 2 PLAYERS ★";
  else if (m.ecran === "scores") texte = "★ GAME OVER ★";
  else if (m.ecran === "attente") texte = clignote ? "★ FREE PLAY ★" : "";
  else texte = "⏩ FAST FORWARD";
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 244, textAlign: "center", fontFamily: PIXEL, fontSize: 28, color: m.qui ? COULEUR[m.qui] : OR, textShadow: contour(3), letterSpacing: 1 }}>{texte}</div>
  );
};

// ---------------------------------------------------------------- l'écran
const video = (src: string, de: number) => <OffthreadVideo src={staticFile(`rushes/${src}.mp4`)} muted trimBefore={de} style={{ width: 1080, height: 1920 }} />;

/** Le grésillement d'un écran qui change de joueur : du bruit, une barre claire qui roule. */
const Gresil: React.FC<{ f: number }> = ({ f }) => {
  const s = BASCULES.map((t) => b(t)).find((t) => f >= t - 3 && f < t + 6);
  if (s === undefined) return null;
  const u = f < s ? (f - (s - 3)) / 3 : 1 - (f - s) / 6;
  return (
    <AbsoluteFill style={{ opacity: Math.max(0, u) }}>
      <svg width={E.l} height={E.h} style={{ position: "absolute", inset: 0 }}>
        <filter id={`g${f}`}><feTurbulence type="fractalNoise" baseFrequency="0.9 0.04" numOctaves={1} seed={f} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width={E.l} height={E.h} filter={`url(#g${f})`} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: ((f * 97) % E.h) - 60, height: 120, background: "linear-gradient(transparent, #fff8, transparent)" }} />
    </AbsoluteFill>
  );
};

/** L'écran « VS » : au début (LV 1 contre LV 99), à la fin (les scores des cinq manches). Coordonnées de l'écran (840 × 1493). */
const EcranVS: React.FC<{ fin?: boolean }> = ({ fin }) => {
  const f = useCurrentFrame();
  const de = fin ? b(52) : 0;
  const bob = (k: number) => Math.round(Math.sin(((f - de) / 24) * Math.PI + k) * 2) * 3; // (de pixel en pixel)
  const v = fin ? rebond(f, de + 6, 420, 18) : 1;
  const vQ = fin ? rebond(f, b(53.5), 420, 18) : 1;
  const texte = (q: Qui) => {
    const g = q === "noob";
    return (
      <div style={{ position: "absolute", top: g ? 96 : 704, [g ? "left" : "right"]: 420, width: 400, textAlign: g ? "left" : "right", fontFamily: PIXEL, transform: `scale(${(0.6 + 0.4 * v).toFixed(4)})`, transformOrigin: g ? "0 0" : "100% 0" }}>
        <div style={{ fontSize: 34, color: COULEUR[q], textShadow: contour(4) }}>{g ? "1P" : "2P"}</div>
        <div style={{ fontSize: 74, color: "#fff", textShadow: contour(6), marginTop: 16 }}>{g ? "NOOB" : "PRO"}</div>
        {fin ? (
          <>
            <div style={{ fontSize: 52, color: OR, textShadow: contour(5), marginTop: 22 }}>{TOTAL[q].toLocaleString("en-US")}</div>
            <div style={{ fontSize: 28, color: "#fff", textShadow: contour(3), marginTop: 18, lineHeight: 1.45 }}>{g ? <>CURIOUS<br />TOURIST</> : <>SEASONED<br />TRAVELER</>}</div>
          </>
        ) : (
          <div style={{ fontSize: 48, color: OR, textShadow: contour(5), marginTop: 22 }}>{g ? "LV 1" : "LV 99"}</div>
        )}
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ background: "#0b0d18" }}>
      {/* deux moitiés en biais : le rouge du débutant, le bleu du pro, des traits de vitesse */}
      <AbsoluteFill style={{ background: `linear-gradient(170deg, #7a2416, ${ROUGE} 70%)`, clipPath: "polygon(0 0, 100% 0, 100% 34%, 0 46%)" }} />
      <AbsoluteFill style={{ background: `linear-gradient(170deg, #2c5f99, #14294a)`, clipPath: "polygon(0 48%, 100% 36%, 100% 100%, 0 100%)" }} />
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(170deg, rgba(255,255,255,.07) 0 3px, transparent 3px 40px)" }} />
      <div style={{ position: "absolute", left: 30, top: 50 + bob(0) }}><Perso qui="noob" tete={fin ? "pleure" : teteA("noob", f)} px={15} /></div>
      <div style={{ position: "absolute", right: 30, top: 650 + bob(Math.PI) }}>
        <Perso qui="pro" tete="cool" px={15} />
        {fin && f >= b(53) && <div style={{ position: "absolute", left: 120, top: -86, fontSize: 110, fontFamily: EMOJI, transform: `scale(${rebond(f, b(53), 420, 16).toFixed(4)})` }}>👑</div>}
      </div>
      {texte("noob")}
      {texte("pro")}
      <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: PIXEL, fontSize: 170, color: OR, textShadow: `${contour(10)}, -14px 0 0 ${ROUGE}, 14px 0 0 ${BLEU}`, transform: `scale(${(1 + 0.05 * Math.exp(-((f % 24) / 6))).toFixed(4)})` }}>VS</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1036, textAlign: "center", fontFamily: PIXEL, fontSize: 46, color: "#fff", textShadow: contour(5), lineHeight: 1.4, opacity: fin ? (f >= b(53.5) ? 1 : 0) : 1, transform: `scale(${(1.3 - 0.3 * vQ).toFixed(4)})` }}>
        {fin ? <>WHICH ONE<br />ARE YOU? 👇</> : <>WHO KNOWS<br />JAPAN BEST?</>}
      </div>
    </AbsoluteFill>
  );
};

const Ecran: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const off = entre(f, b(FIN) - 10, b(FIN)), on = entre(f, b(FIN) + 4, b(FIN) + 16);
  const tasse = f < b(FIN) ? 1 - 0.995 * expoSortie(off) : 0.005 + 0.995 * expoSortie(on);
  const m = morceauA(f);
  return (
    <div style={{ position: "absolute", left: E.x, top: E.y, width: E.l, height: E.h, borderRadius: 22, overflow: "hidden", background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scaleY(${tasse.toFixed(4)})`, filter: f >= b(FIN) - 10 && f < b(FIN) + 16 ? `brightness(${(1 + 2 * (1 - tasse)).toFixed(2)})` : undefined }}>
        <div style={{ width: 1080, height: 1920, transform: `scale(${K})`, transformOrigin: "0 0" }}>
          {MORCEAUX.filter((x) => x.prise).map((x, i) => (
            <Sequence key={i} from={b(x.de)} durationInFrames={b(x.a) - b(x.de)} layout="none">{video(x.prise!, b(x.t0!))}</Sequence>
          ))}
        </div>
        {m.ecran === "vs" && <EcranVS />}
        {m.ecran === "scores" && <EcranVS fin />}
        {m.ecran === "attente" && <Attente />}
        {children}
        <Gresil f={f} />
      </div>
      {/* le verre du tube : les lignes de balayage, les coins sombres, un reflet */}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,.13) 0 2px, transparent 2px 4px)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 90px rgba(0,0,0,.55)", borderRadius: 22 }} />
      <AbsoluteFill style={{ background: "linear-gradient(155deg, rgba(255,255,255,.10), transparent 35%)" }} />
    </div>
  );
};

/** Les points du joueur qui a la main, sur la photo de la manche (la carte, dessous, garde son épingle), quand sa réponse tombe. */
const Saut: React.FC<{ qui: Qui; k: number }> = ({ qui, k }) => {
  const f = useCurrentFrame();
  const r = REPONSES[qui][k];
  const de = b(r), fin = b(MORCEAUX.find((m) => r >= m.de && r < m.a)!.a);
  if (f < de || f >= fin) return null;
  const v = rebond(f, de, 420, 16);
  const p = POINTS[qui][k];
  const couleur = p >= 900 ? OR : p >= 500 ? "#7ddf64" : p >= 100 ? "#ffa24a" : ROUGE;
  const emoji = p >= 900 ? " 🔥" : p < 100 ? " 💀" : qui === "noob" && k === 3 ? " 🍀" : "";
  const sortie = entre(f, fin - 9, fin);
  const ensemble = k === 2; // la manche 3 : les deux l'un sous l'autre
  return (
    <div style={{
      position: "absolute", left: 0, width: E.l, top: (ensemble ? (qui === "noob" ? 140 : 250) : 190) - 40 * v, textAlign: "center",
      fontFamily: PIXEL, fontSize: ensemble ? 64 : 84, color: couleur, textShadow: contour(7), opacity: 1 - sortie, whiteSpace: "nowrap",
      transform: `scale(${(0.4 + 0.6 * v).toFixed(4)})`,
    }}>{ensemble ? (qui === "noob" ? "🐣 " : "😎 ") : ""}+{p}{ensemble ? "" : emoji}</div>
  );
};

/** La boîte de dialogue d'un personnage : son nom, sa tête, son texte qui s'écrit (coordonnées de l'écran). */
const Dialogue: React.FC = () => {
  const f = useCurrentFrame();
  const r = REPLIQUES.find((x) => f >= b(x.de) && f < b(x.a));
  if (!r) return null;
  const g = r.qui === "noob";
  const n = f - b(r.de);
  const v = rebond(f, b(r.de), 520, 22);
  const l1 = Array.from(r.l1), l2 = Array.from(r.l2 ?? "");
  const vu1 = l1.slice(0, n).join(""), vu2 = l2.slice(0, Math.max(0, n - l1.length)).join("");
  return (
    <div style={{ position: "absolute", left: 18, right: 18, top: 852, transform: `translateY(${(40 * (1 - v)).toFixed(1)}px)`, opacity: Math.min(1, n / 4) }}>
      <div style={{
        position: "absolute", top: -50, [g ? "left" : "right"]: 26, padding: "12px 20px", background: COULEUR[r.qui], color: "#fff",
        fontFamily: PIXEL, fontSize: 30, boxShadow: "0 0 0 5px #000", textShadow: contour(3),
      }}>{NOM[r.qui]}</div>
      <div style={{
        display: "flex", flexDirection: g ? "row" : "row-reverse", alignItems: "center", gap: 26, padding: "18px 30px", background: "#0b1026",
        boxShadow: "inset 0 0 0 6px #fff, 0 0 0 6px #000, 10px 12px 0 6px #000a",
      }}>
        <div style={{ width: 232, height: 232, flex: "none", background: `${COULEUR[r.qui]}55`, boxShadow: "inset 0 0 0 4px #000", display: "grid", placeItems: "center" }}>
          <Perso qui={r.qui} tete={teteA(r.qui, f)} px={9} />
        </div>
        <div style={{ flex: 1, fontFamily: PIXEL, fontSize: 38, lineHeight: 1.5, color: "#fff", textShadow: contour(3), whiteSpace: "nowrap", minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div>{vu1}{" "}</div>
          {r.l2 && <div>{vu2}{" "}</div>}
        </div>
      </div>
    </div>
  );
};

/** Les annonces : la manche, l'avance rapide, la victoire du débutant (sans personnage). */
const Annonces: React.FC = () => {
  const f = useCurrentFrame();
  const m = ANNONCES.find((x) => f >= b(x.de) && f < b(x.a));
  if (!m) return null;
  const v = rebond(f, b(m.de), 480, 20);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: m.haut ? 110 : 880, textAlign: "center", fontFamily: PIXEL, whiteSpace: "nowrap", transform: `scale(${(1.1 - 0.1 * v).toFixed(4)})` }}>
      <div style={{ display: "inline-block", padding: "26px 30px", background: "rgba(5,7,12,.78)", boxShadow: "0 0 0 5px #000" }}>
        <div style={{ fontSize: m.l2 ? 52 : 60, color: m.c ?? "#fff", textShadow: contour(5), lineHeight: 1.3 }}>{m.l1}</div>
        {m.l2 && <div style={{ fontSize: 42, color: "#fff", textShadow: contour(5), lineHeight: 1.3, marginTop: 14 }}>{m.l2}</div>}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- l'écran d'attente : « PRESS START »
const Attente: React.FC = () => {
  const f = useCurrentFrame();
  const g = f - b(FIN);
  const v = rebond(f, b(FIN) + 16, 300, 16), v2 = rebond(f, b(FIN + 1.25)), v3 = rebond(f, b(FIN + 3.25), 420, 20);
  const clignote = Math.floor(g / 12) % 2 === 0;
  return (
    <AbsoluteFill style={{
      background: "radial-gradient(circle at 50% 40%, #1b2347, #070912 70%)", display: "flex", flexDirection: "column", alignItems: "center",
      paddingTop: 170, gap: 60, fontFamily: PIXEL,
    }}>
      <div style={{ width: 300, height: 300, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", boxShadow: `0 0 0 12px ${OR}, 0 0 0 24px #000`, transform: `scale(${(0.3 + 0.7 * v).toFixed(4)})` }}>
        <Img src={staticFile("ui/logo.jpg")} style={{ width: 272, height: 272, borderRadius: "50%" }} />
      </div>
      <div style={{ fontSize: 76, color: OR, textShadow: contour(6), opacity: f >= b(FIN + 1.25) ? 1 : 0, transform: `translateY(${(60 * (1 - v2)).toFixed(1)}px)`, textAlign: "center", lineHeight: 1.35 }}>GUESS<br />THE PLACE</div>
      <div style={{ fontSize: 58, color: "#fff", textShadow: contour(5), opacity: f >= b(FIN + 2.25) && clignote ? 1 : 0 }}><Fleche vers="d" px={52} />PRESS START</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40, whiteSpace: "nowrap", opacity: f >= b(FIN + 3.25) ? 1 : 0, transform: `scale(${(1.1 - 0.1 * v3).toFixed(4)})` }}>
        <div style={{ fontSize: 36, color: "#fff", background: ROUGE, padding: "22px 34px", boxShadow: "0 0 0 7px #000, 10px 14px 0 7px #000" }}>FREE · LINK IN BIO</div>
        <div style={{ fontFamily: `${TIKTOK}, sans-serif`, fontWeight: 800, fontSize: 46, color: NUIT, background: "#fff", padding: "12px 38px", borderRadius: 999 }}>map.randomjapanplace.com</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- le son : le débutant à gauche (1P), le pro à droite (2P)
const EFFETS: Effet[] = [[0, "vs-piece.wav", 0.28, 1.4]];
[4, 20, 32, 36].forEach((t) => EFFETS.push([sec(t), "vs-manche.wav", 0.16]));
(["noob", "pro"] as Qui[]).forEach((q) => {
  const c = q === "noob" ? "g" : "d";
  APPUIS[q].forEach((a, i) => {
    const k = i === 2 ? 3 : i; // (les manches 1, 2 et 4)
    const r = REPONSES[q][k];
    const son = q === "noob" ? (k === 3 ? "chance" : "rate") : k === 3 ? "bonk" : "reussi";
    EFFETS.push(
      [sec(a), `vs-appui-${c}.wav`, 0.26], [sec(a + 0.5), `vs-valide-${c}.wav`, 0.18],
      [sec(r), `vs-${son}-${c}.wav`, son === "rate" ? 0.32 : 0.3, son === "rate" ? 1.6 : 1.2], [sec(r) + 0.05, `vs-compte-${c}.wav`, 0.09],
    );
  });
});
// la manche 3 en avance rapide : les deux scores d'un coup
EFFETS.push([sec(32.5), "vs-compte-g.wav", 0.09], [sec(32.5), "vs-compte-d.wav", 0.09]);
BASCULES.forEach((t) => EFFETS.push([sec(t) - 0.03, "vs-bascule.wav", 0.12]));
// le texte qui s'écrit : un bip toutes les doubles croches, du côté du personnage
REPLIQUES.forEach((r) => {
  for (let k = 0; k * 6 < lettres(r); k++) EFFETS.push([sec(r.de) + k * 0.1, `vs-texte-${r.qui === "noob" ? "g" : "d"}.wav`, 0.05]);
});
EFFETS.push([sec(CINQUIEME), "vs-compte-g.wav", 0.09], [sec(CINQUIEME), "vs-compte-d.wav", 0.09], [sec(53), "vs-reussi-d.wav", 0.2, 1.2],
  [sec(FIN) - 0.03, "vs-bascule.wav", 0.12], [sec(FIN + 0.75), "vs-piece.wav", 0.3, 1.4]);

/** La borne qui tressaute : quand le débutant marque gros (manche 4), quand le pro se trompe. */
const secousse = (f: number) => [40, 46.5].reduce((x, t) => {
  const u = f - b(t);
  return u >= 0 && u < 14 ? x + Math.sin(u * 2.1) * 9 * Math.exp(-u / 5) : x;
}, 0);

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ transform: `translateX(${secousse(f).toFixed(2)}px)` }}>
      <Borne />
      <Fronton />
      <Tour />
      <Ecran>
        <div style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2, 3].map((k) => <React.Fragment key={k}><Saut qui="noob" k={k} /><Saut qui="pro" k={k} /></React.Fragment>)}
          <Annonces />
          <Dialogue />
        </div>
      </Ecran>
    </AbsoluteFill>
  );
};

export const Versus: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <AbsoluteFill style={{ backgroundColor: NUIT }}>
    <Scene />
    <Son bgm={bgm} musique="musique/versus.wav" volume={1} voix={[]} effets={EFFETS} />
  </AbsoluteFill>
);

// la miniature : la borne et l'écran « VS » du début (les deux personnages, LV 1 contre LV 99)
export const MiniatureVersus: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: NUIT }}>
    <Scene />
  </AbsoluteFill>
);
