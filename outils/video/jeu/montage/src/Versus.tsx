// La quatrième vidéo du jeu, « noob vs pro » (2026-11-10, le propriétaire : « C'est bon fait une autre vidéo dans un style encore
// différent »). 22,8 s, 9:16, 60 images/s, en anglais. Un duel comique façon jeu d'arcade 8-bit : le débutant (1P) pose tout à Tokyo,
// le pro (2P) vise juste… sauf à la manche 4, près de Tokyo, que le débutant gagne. Police pixel, musique chiptune composée, sans voix.
// Refaite le même jour sur une borne d'arcade (le propriétaire : « deux téléphones côte à côte […] c'est trop petit pour regarder,
// surtout sur téléphone […] peut-être mettre ça sur la borne d'un jeu d'arcade ») : un seul grand écran, les deux joueurs jouent
// chacun leur tour comme sur une vraie borne (PLAYER 1, puis PLAYER 2), le tableau des scores sur le fronton, les manettes en bas.
// 150 battements par minute : le temps n tombe à l'image 24 n (le découpage : ../plan-versus.md).
import React from "react";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont as pixel } from "@remotion/google-fonts/PressStart2P";
import { entre, EMOJI, expoSortie, FPS, rebond, TIKTOK } from "./theme";
import { Effet, Son } from "./Commun";

const PIXEL = `${pixel("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily}, ${EMOJI}, monospace`;
const b = (n: number) => Math.round(n * 24);
const sec = (n: number) => (n * 24) / FPS;
export const DUREE_VERSUS = b(57);

const ROUGE = "#e0563f", BLEU = "#5b9bd5", OR = "#ffd23f", NUIT = "#0d1218";
// l'ombre dure d'un texte pixel (un contour, puis une ombre portée)
const contour = (px: number, c = "#000") => [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]].map(([x, y]) => `${x * px}px ${y * px}px 0 ${c}`).join(", ") + `, ${px}px ${px + 4}px 0 ${c}`;

type Qui = "noob" | "pro";
const COULEUR: Record<Qui, string> = { noob: ROUGE, pro: BLEU };

// ---------------------------------------------------------------- la borne : le fronton, l'écran, les manettes
// L'écran (les prises 1080 × 1920 à × 0,778) : 1,6 fois les téléphones d'avant, presque toute la largeur.
const E = { x: 120, y: 300, l: 840, h: 1493 };
const K = E.l / 1080;
const FRONTON = { x: 34, y: 14, l: 1012, h: 214 };
const PUPITRE = 1852; // le haut des manettes

// Les morceaux de prise sur l'écran : [de, à] en temps de la vidéo, la prise, et son temps au début du morceau. Chaque manche :
// le débutant joue (sa prise telle quelle, décalée de 4 temps), puis le pro (sa prise décalée pour que son appui tombe 1 temps
// après qu'il a la main). À la manche 4, l'écran revient au débutant (sa réponse, près de Tokyo).
type Morceau = { de: number; a: number; qui: Qui; prise: string; t0: number; fige?: boolean };
const MORCEAUX: Morceau[] = [
  { de: 0, a: 4, qui: "noob", prise: "vs-noob", t0: 0, fige: true }, // la photo de la manche 1, le temps de deviner
  { de: 4, a: 8.5, qui: "noob", prise: "vs-noob", t0: 0 },
  { de: 8.5, a: 12, qui: "pro", prise: "vs-pro", t0: 1.5 },
  { de: 12, a: 16.5, qui: "noob", prise: "vs-noob", t0: 8 },
  { de: 16.5, a: 20, qui: "pro", prise: "vs-pro", t0: 9.5 },
  { de: 20, a: 24.5, qui: "noob", prise: "vs-noob", t0: 16 },
  { de: 24.5, a: 28, qui: "pro", prise: "vs-pro", t0: 17.5 },
  { de: 28, a: 32.5, qui: "noob", prise: "vs-noob", t0: 24 },
  { de: 32.5, a: 36.5, qui: "pro", prise: "vs-pro", t0: 26.5 },
  { de: 36.5, a: 40, qui: "noob", prise: "vs-noob", t0: 30.5 },
  { de: 40, a: 44, qui: "noob", prise: "vs-noob-score", t0: 0 },
  { de: 44, a: 48, qui: "pro", prise: "vs-pro-score", t0: 1.5 },
];
const FIN = 48; // l'écran d'attente : « PRESS START »
// les changements de joueur (et de scène) : l'écran grésille (à la fin, il s'éteint et se rallume)
const BASCULES = MORCEAUX.slice(2).map((m) => m.de);
const joueurA = (f: number): Qui | null => MORCEAUX.find((m) => f >= b(m.de) && f < b(m.a))?.qui ?? null;

// les vrais résultats des prises (le jeu les calcule) : les points de chaque manche filmée, puis le total des cinq
const POINTS = { noob: [2, 38, 225, 783], pro: [999, 998, 998, 33] };
const TOTAL = { noob: 1286, pro: 4027 };
// (en temps de la vidéo) quand chacun appuie sur la carte, et quand sa réponse tombe (il valide un demi-temps après l'appui)
const APPUIS = { noob: [5, 13, 21, 29], pro: [9.5, 17.5, 25.5, 33.5] };
const REPONSES = { noob: [6, 14, 22, 30], pro: [10.5, 18.5, 26.5, 34.5] };
const CINQUIEME = { noob: 40.5, pro: 44 }; // l'écran de score : la cinquième manche s'ajoute
const finDuMorceau = (t: number) => MORCEAUX.find((m) => t >= m.de && t < m.a)!.a;

/** La pièce de décor : le corps de la borne, ses liserés (rouge côté 1P, bleu côté 2P), le cadre de l'écran, les manettes. */
const Borne: React.FC = () => {
  const f = useCurrentFrame();
  const qui = joueurA(f);
  const lueur = qui ? COULEUR[qui] : OR;
  // un bouton enfoncé : à chaque appui du joueur (et à sa validation), quelques images
  const appuye = (q: Qui) => [...APPUIS[q], ...APPUIS[q].map((a) => a + 0.5), ...(q === "noob" ? [12, 20, 28, 40.5] : [])].some((a) => f >= b(a) && f < b(a) + 7);
  // le manche penche pendant que le joueur vise
  const penche = (q: Qui) => APPUIS[q].reduce((p, a) => p + Math.sin(Math.PI * entre(f, b(a - 0.75), b(a))) * (q === "noob" ? 14 : -10), 0);
  const manettes = (q: Qui, x0: number) => {
    const c = COULEUR[q];
    const bas = appuye(q);
    return (
      <>
        {/* le manche */}
        <div style={{ position: "absolute", left: x0 - 5, top: PUPITRE + 10, width: 10, height: 34, background: "#b9bcc8", transformOrigin: "50% 100%", transform: `rotate(${penche(q).toFixed(2)}deg)` }}>
          <div style={{ position: "absolute", left: -18, top: -30, width: 46, height: 40, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff8 0 12%, ${c} 40%, #000a 100%)` }} />
        </div>
        <div style={{ position: "absolute", left: x0 - 30, top: PUPITRE + 40, width: 60, height: 18, borderRadius: "50%", background: "#0008" }} />
        {/* deux boutons */}
        {[0, 1].map((k) => (
          <div key={k} style={{ position: "absolute", left: x0 + (q === "noob" ? 1 : -1) * (100 + 78 * k) - 30, top: PUPITRE + 22 + (bas && k === 0 ? 5 : 0), width: 60, height: 30, borderRadius: "50%", background: `radial-gradient(circle at 40% 35%, #fff9 0 10%, ${c} 45%, #0009 100%)`, boxShadow: bas && k === 0 ? "0 1px 0 #000" : "0 6px 0 #000c" }} />
        ))}
      </>
    );
  };
  return (
    <>
      {/* la salle : du noir, deux néons */}
      <AbsoluteFill style={{ background: `radial-gradient(60% 40% at 0% 30%, ${ROUGE}55, transparent), radial-gradient(60% 40% at 100% 70%, ${BLEU}55, transparent), #07080d` }} />
      {/* le corps de la borne */}
      <div style={{
        position: "absolute", left: 18, right: 18, top: 0, bottom: 0, background: "linear-gradient(90deg, #121420, #1d2031 12%, #1d2031 88%, #121420)",
        boxShadow: `inset 10px 0 0 ${ROUGE}, inset -10px 0 0 ${BLEU}, -6px 0 24px ${ROUGE}88, 6px 0 24px ${BLEU}88`,
      }} />
      {/* le décor du cadre : une trame de petits carrés, comme des pixels */}
      <div style={{ position: "absolute", left: 30, right: 30, top: 236, height: 1600, backgroundImage: "radial-gradient(#ffffff14 2px, transparent 2.5px)", backgroundSize: "28px 28px" }} />
      {/* le cadre noir de l'écran, sa lueur à la couleur du joueur */}
      <div style={{ position: "absolute", left: E.x - 16, top: E.y - 16, width: E.l + 32, height: E.h + 32, borderRadius: 38, background: "#030406", boxShadow: `0 0 0 5px ${lueur}, 0 0 46px 6px ${lueur}88` }} />
      {/* le pupitre, en perspective */}
      <div style={{ position: "absolute", left: 18, right: 18, top: PUPITRE - 12, bottom: 0, background: "linear-gradient(#3a3e57, #23263a 30%, #181a28)", clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0 100%)", boxShadow: "inset 0 3px 0 #ffffff33" }} />
      {manettes("noob", 190)}
      {manettes("pro", 890)}
      {[["1P", ROUGE, 470], ["2P", BLEU, 560]].map(([t, c, x]) => (
        <div key={t as string} style={{ position: "absolute", left: x as number, top: PUPITRE + 18, width: 50, height: 34, borderRadius: 6, background: "#e9e9ef", boxShadow: "0 5px 0 #0009", fontFamily: PIXEL, fontSize: 14, color: c as string, display: "grid", placeItems: "center" }}>{t}</div>
      ))}
      {/* (les cartes : sous l'écran) */}
      <div style={{ position: "absolute", left: 0, right: 0, top: E.y + E.h + 23, textAlign: "center", fontFamily: `${TIKTOK}, sans-serif`, fontWeight: 700, fontSize: 17, color: "rgba(255,255,255,.6)" }}>
        © Mapterhorn · © OpenStreetMap · Natural Earth
      </div>
    </>
  );
};

// ---------------------------------------------------------------- le fronton : le titre, les ampoules, le tableau des scores
const scoreA = (qui: Qui, f: number) => {
  let total = 0;
  REPONSES[qui].forEach((r, k) => { total += POINTS[qui][k] * entre(f, b(r), b(r) + 24); });
  const reste = TOTAL[qui] - POINTS[qui].reduce((a, c) => a + c, 0);
  return Math.round(total + reste * entre(f, b(CINQUIEME[qui]), b(CINQUIEME[qui]) + 24));
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
    const actif = qui === q;
    const gagnant = !g && f >= b(45);
    return (
      <div style={{ position: "absolute", top: 104, [g ? "left" : "right"]: 66, textAlign: g ? "left" : "right", fontFamily: PIXEL }}>
        <div style={{ fontSize: 34, color: "#fff", textShadow: contour(4), opacity: actif || qui === null ? 1 : 0.55 }}>
          {g ? <><span style={{ color: COULEUR[q] }}>1P </span>NOOB 🐣</> : <>{gagnant ? "👑 " : ""}😎 PRO<span style={{ color: COULEUR[q] }}> 2P</span></>}
        </div>
        <div style={{ fontSize: 52, color: OR, textShadow: contour(5), marginTop: 14, letterSpacing: 2 }}>{String(scoreA(q, f)).padStart(4, "0")}</div>
      </div>
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
      <div style={{ position: "absolute", left: 0, right: 0, top: 124, textAlign: "center", fontFamily: PIXEL, fontSize: 64, color: OR, textShadow: `${contour(5)}, -5px 0 0 ${ROUGE}, 5px 0 0 ${BLEU}` }}>VS</div>
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
  const qui = joueurA(f);
  const clignote = Math.floor(f / 15) % 2 === 0;
  const texte = qui === "noob" ? <><Fleche vers="d" px={26} />PLAYER 1 · NOOB 🐣</> : qui === "pro" ? <>😎 PRO · PLAYER 2<Fleche vers="g" px={26} /></> : clignote ? "★ FREE PLAY ★" : "";
  const c = qui ? COULEUR[qui] : OR;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 244, textAlign: "center", fontFamily: PIXEL, fontSize: 28, color: c, textShadow: contour(3), letterSpacing: 1 }}>{texte}</div>
  );
};

// ---------------------------------------------------------------- l'écran
const video = (src: string, de: number) => <OffthreadVideo src={staticFile(`rushes/${src}.mp4`)} muted trimBefore={de} style={{ width: 1080, height: 1920 }} />;

/** Le grésillement d'un écran qui change de joueur : du bruit, une barre claire qui roule, un éclair. */
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

const Ecran: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  // à la fin, l'écran s'éteint (il se tasse en un trait), puis se rallume sur l'écran d'attente
  const off = entre(f, b(FIN) - 10, b(FIN)), on = entre(f, b(FIN) + 4, b(FIN) + 16);
  const tasse = f < b(FIN) ? 1 - 0.995 * expoSortie(off) : 0.005 + 0.995 * expoSortie(on);
  return (
    <div style={{ position: "absolute", left: E.x, top: E.y, width: E.l, height: E.h, borderRadius: 22, overflow: "hidden", background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scaleY(${tasse.toFixed(4)})`, filter: f >= b(FIN) - 10 && f < b(FIN) + 16 ? `brightness(${(1 + 2 * (1 - tasse)).toFixed(2)})` : undefined }}>
        {f < b(FIN) ? (
          <div style={{ width: 1080, height: 1920, transform: `scale(${K})`, transformOrigin: "0 0" }}>
            {MORCEAUX.map((m, i) => (
              <Sequence key={i} from={b(m.de)} durationInFrames={b(m.a) - b(m.de)} layout="none">
                {m.fige ? <Freeze frame={0}>{video(m.prise, b(m.t0))}</Freeze> : video(m.prise, b(m.t0))}
              </Sequence>
            ))}
          </div>
        ) : <Attente />}
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

/** Le grand titre de la première image (la couverture), sur la carte : il bat, puis s'efface quand la manche commence. */
const Titre: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= b(2)) return null;
  const bat = 1 + 0.05 * Math.exp(-((f % 24) / 6));
  const u = expoSortie(entre(f, b(1.6), b(2)));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: PIXEL, transform: `scale(${(bat * (1 - 0.6 * u)).toFixed(4)})`, opacity: 1 - u }}>
      <div style={{ fontSize: 104, color: "#fff", textShadow: contour(8) }}><span style={{ color: ROUGE }}>NOOB</span></div>
      <div style={{ fontSize: 190, color: OR, textShadow: `${contour(10)}, -14px 0 0 ${ROUGE}, 14px 0 0 ${BLEU}`, margin: "26px 0 30px" }}>VS</div>
      <div style={{ fontSize: 104, color: BLEU, textShadow: contour(8) }}>PRO</div>
    </div>
  );
};

/** Les points du joueur qui a la main, sur la photo de la manche (la carte, dessous, garde son épingle), quand sa réponse tombe. */
const Saut: React.FC<{ qui: Qui; k: number }> = ({ qui, k }) => {
  const f = useCurrentFrame();
  const r = REPONSES[qui][k];
  const de = b(r), fin = b(finDuMorceau(r));
  if (f < de || f >= fin) return null;
  const v = rebond(f, de, 420, 16);
  const p = POINTS[qui][k];
  const couleur = p >= 900 ? OR : p >= 500 ? "#7ddf64" : p >= 100 ? "#ffa24a" : ROUGE;
  const emoji = p >= 900 ? " 🔥" : p < 100 ? " 💀" : qui === "noob" && k === 3 ? " 🍀" : "";
  const sortie = entre(f, fin - 9, fin);
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: 190 - 40 * v, textAlign: "center",
      fontFamily: PIXEL, fontSize: 84, color: couleur, textShadow: contour(7), opacity: 1 - sortie,
      transform: `scale(${(0.4 + 0.6 * v).toFixed(4)})`,
    }}>+{p}{emoji}</div>
  );
};

// ---------------------------------------------------------------- les messages, sur la carte (coordonnées de l'écran)
type Msg = { de: number; a: number; l1: string; l2?: string; c?: string };
const MESSAGES: Msg[] = [
  { de: 2, a: 4, l1: "ROUND 1", l2: "WHERE IS THIS? 📍", c: OR },
  { de: 6.25, a: 8.5, l1: "THE NOOB SAID", l2: "TOKYO 💀" },
  { de: 8.5, a: 9.5, l1: "PRO'S TURN 😎", c: BLEU },
  { de: 12, a: 13, l1: "ROUND 2", c: OR },
  { de: 14.25, a: 16.5, l1: "TOKYO AGAIN?! 😭" },
  { de: 16.5, a: 17.5, l1: "PRO'S TURN 😎", c: BLEU },
  { de: 20, a: 21, l1: "ROUND 3", c: OR },
  { de: 22.25, a: 24.5, l1: "ONLY KNOWS", l2: "TOKYO 🗼" },
  { de: 24.5, a: 25.5, l1: "PRO'S TURN 😎", c: BLEU },
  { de: 28, a: 29, l1: "ROUND 4", c: OR },
  { de: 30.25, a: 32.5, l1: "WAIT... 😳" },
  { de: 32.5, a: 33.5, l1: "PRO'S TURN 😎", c: BLEU },
  { de: 36.5, a: 40, l1: "THE NOOB WON", l2: "THIS ROUND?! 🤯" },
  { de: 40.25, a: 44, l1: "FINAL SCORE", l2: "CURIOUS TOURIST 🐣", c: OR },
  { de: 44, a: 45.75, l1: "SEASONED", l2: "TRAVELER 😎", c: BLEU },
  { de: 45.75, a: 48, l1: "WHICH ONE", l2: "ARE YOU? 👇" },
];

const Message: React.FC = () => {
  const f = useCurrentFrame();
  const m = MESSAGES.find((x) => f >= b(x.de) && f < b(x.a));
  if (!m) return null;
  const v = rebond(f, b(m.de), 480, 20);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 900, textAlign: "center", fontFamily: PIXEL, whiteSpace: "nowrap", transform: `scale(${(1.1 - 0.1 * v).toFixed(4)})` }}>
      <div style={{ display: "inline-block", padding: "26px 30px", background: "rgba(5,7,12,.72)", boxShadow: "0 0 0 5px #000" }}>
        <div style={{ fontSize: m.l2 ? 50 : 58, color: m.c ?? "#fff", textShadow: contour(5), lineHeight: 1.3 }}>{m.l1}</div>
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
  const clignote = Math.floor(g / 12) % 2 === 0; // « PRESS START » clignote à la croche
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
const EFFETS: Effet[] = [[0, "vs-piece.wav", 0.28, 1.4], [sec(2), "vs-manche.wav", 0.16]];
[12, 20, 28].forEach((d) => EFFETS.push([sec(d), "vs-appui-g.wav", 0.22], [sec(d), "vs-manche.wav", 0.16]));
(["noob", "pro"] as Qui[]).forEach((q) => {
  const c = q === "noob" ? "g" : "d";
  APPUIS[q].forEach((a, k) => {
    const r = REPONSES[q][k];
    const son = q === "noob" ? (k === 3 ? "chance" : "rate") : k === 3 ? "bonk" : "reussi";
    EFFETS.push(
      [sec(a), `vs-appui-${c}.wav`, 0.26], [sec(a + 0.5), `vs-valide-${c}.wav`, 0.18],
      [sec(r), `vs-${son}-${c}.wav`, son === "rate" ? 0.32 : 0.3, son === "rate" ? 1.6 : 1.2], [sec(r) + 0.05, `vs-compte-${c}.wav`, 0.09],
    );
  });
});
[...BASCULES, FIN].forEach((t) => EFFETS.push([sec(t) - 0.03, "vs-bascule.wav", 0.12]));
EFFETS.push([sec(40.5), "vs-appui-g.wav", 0.22], [sec(40.75), "vs-compte-g.wav", 0.09], [sec(44.05), "vs-compte-d.wav", 0.09], [sec(45), "vs-reussi-d.wav", 0.2, 1.2],
  [sec(FIN + 0.75), "vs-piece.wav", 0.3, 1.4]);

/** La borne qui tressaute : quand le débutant marque gros (manche 4), quand le pro se trompe. */
const secousse = (f: number) => [30, 34.5].reduce((x, t) => {
  const u = f - b(t);
  return u >= 0 && u < 14 ? x + Math.sin(u * 2.1) * 9 * Math.exp(-u / 5) : x;
}, 0);

export const Versus: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: NUIT }}>
      <AbsoluteFill style={{ transform: `translateX(${secousse(f).toFixed(2)}px)` }}>
        <Borne />
        <Fronton />
        <Tour />
        <Ecran>
          <div style={{ position: "absolute", inset: 0 }}>
            <Titre />
            {[0, 1, 2, 3].map((k) => <React.Fragment key={k}><Saut qui="noob" k={k} /><Saut qui="pro" k={k} /></React.Fragment>)}
            <Message />
          </div>
        </Ecran>
      </AbsoluteFill>
      <Son bgm={bgm} musique="musique/versus.wav" volume={1} voix={[]} effets={EFFETS} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- la miniature : la borne, la manche 1 du débutant (Tokyo, pour Okinawa)
export const MiniatureVersus: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: NUIT }}>
    <Borne />
    <Fronton />
    <Tour />
    <div style={{ position: "absolute", left: E.x, top: E.y, width: E.l, height: E.h, borderRadius: 22, overflow: "hidden" }}>
      <div style={{ width: 1080, height: 1920, transform: `scale(${K})`, transformOrigin: "0 0" }}>
        <OffthreadVideo src={staticFile("rushes/vs-noob.mp4")} muted trimBefore={b(3)} style={{ width: 1080, height: 1920 }} />
      </div>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,.13) 0 2px, transparent 2px 4px)" }} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 90px rgba(0,0,0,.55)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: PIXEL, fontSize: 84, color: ROUGE, textShadow: contour(7) }}>+2 💀</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", fontFamily: PIXEL }}>
        <div style={{ fontSize: 110, color: ROUGE, textShadow: contour(8) }}>NOOB</div>
        <div style={{ fontSize: 150, color: OR, textShadow: `${contour(9)}, -12px 0 0 ${ROUGE}, 12px 0 0 ${BLEU}`, margin: "18px 0 22px" }}>VS</div>
        <div style={{ fontSize: 110, color: BLEU, textShadow: contour(8) }}>PRO</div>
      </div>
    </div>
  </AbsoluteFill>
);
