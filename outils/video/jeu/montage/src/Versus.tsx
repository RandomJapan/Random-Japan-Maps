// La quatrième vidéo du jeu, « noob vs pro » (2026-11-10, le propriétaire : « C'est bon fait une autre vidéo dans un style encore
// différent »). 20,4 s, 9:16, 60 images/s, en anglais. Un duel comique en écran partagé, façon borne d'arcade 8-bit : deux téléphones
// jouent les mêmes manches du vrai jeu ; le débutant (à gauche) pose tout à Tokyo, le pro (à droite) vise juste… sauf à la manche 4,
// près de Tokyo, que le débutant gagne. Tableau des scores, points qui sautent, police pixel, musique chiptune composée, sans voix.
// 150 battements par minute : le temps n tombe à l'image 24 n (le découpage : ../plan-versus.md).
import React from "react";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont as pixel } from "@remotion/google-fonts/PressStart2P";
import { entre, EMOJI, expoSortie, FPS, rebond, TIKTOK } from "./theme";
import { Effet, Son } from "./Commun";

const PIXEL = `${pixel("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily}, ${EMOJI}, monospace`;
const b = (n: number) => Math.round(n * 24);
const sec = (n: number) => (n * 24) / FPS;
export const DUREE_VERSUS = b(51);

const ROUGE = "#e0563f", BLEU = "#5b9bd5", OR = "#ffd23f", NUIT = "#0d1218";
// l'ombre dure d'un texte pixel (un contour de 6 px, puis une ombre portée)
const contour = (px: number, c = "#000") => [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]].map(([x, y]) => `${x * px}px ${y * px}px 0 ${c}`).join(", ") + `, ${px}px ${px + 4}px 0 ${c}`;

// ---------------------------------------------------------------- les deux téléphones
// (sous le tableau des scores et la ligne des messages ; leur bas, 1417, reste au-dessus de la légende de TikTok)
const TEL = { l: 516, h: 917, y: 500, x: [16, 548] as const };
const K = TEL.l / 1080;
const MANCHES = [0, 8, 16, 24]; // le début de chaque manche (en temps)
// les vrais résultats des prises (le jeu les calcule) : les points de chaque manche filmée, puis le total des cinq
const POINTS = { noob: [2, 38, 225, 783], pro: [999, 998, 998, 33] };
const TOTAL = { noob: 1286, pro: 4027 };
// quand tombe la réponse de chacun (en temps, depuis le début de la manche) : le débutant valide à 1,5, le pro à 3 (à 4 à la manche 4)
const REPONSE = { noob: [2, 2, 2, 2], pro: [3.5, 3.5, 3.5, 4.5] };
type Qui = "noob" | "pro";

const Telephone: React.FC<{ qui: Qui }> = ({ qui }) => {
  const f = useCurrentFrame();
  const x = TEL.x[qui === "noob" ? 0 : 1];
  const fin = f >= b(42);
  const sortie = expoSortie(entre(f, b(42), b(43)));
  const video = (src: string, de: number) => <OffthreadVideo src={staticFile(src)} muted trimBefore={de} style={{ width: 1080, height: 1920 }} />;
  return (
    <div style={{
      position: "absolute", left: x, top: TEL.y, width: TEL.l, height: TEL.h, borderRadius: 34, overflow: "hidden",
      boxShadow: `0 0 0 7px #05070a, 0 0 0 11px ${qui === "noob" ? ROUGE : BLEU}, 0 30px 70px rgba(0,0,0,.6)`,
      filter: fin ? `brightness(${1 - 0.6 * sortie}) blur(${(6 * sortie).toFixed(2)}px)` : undefined,
    }}>
      <div style={{ width: 1080, height: 1920, transform: `scale(${K})`, transformOrigin: "0 0" }}>
        <Sequence durationInFrames={b(34)} layout="none">{video(`rushes/vs-${qui}.mp4`, 0)}</Sequence>
        <Sequence from={b(34)} durationInFrames={b(8)} layout="none">{video(`rushes/vs-${qui}-score.mp4`, 0)}</Sequence>
        <Sequence from={b(42)} layout="none"><Freeze frame={0}>{video(`rushes/vs-${qui}-score.mp4`, b(8))}</Freeze></Sequence>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- le tableau des scores, les points qui sautent
const scoreA = (qui: Qui, f: number) => {
  let total = 0;
  MANCHES.forEach((d, k) => {
    const de = b(d + REPONSE[qui][k]);
    total += POINTS[qui][k] * Math.min(1, Math.max(0, (f - de) / 24));
  });
  const fin = entre(f, b(35), b(36)); // le score des cinq manches
  return Math.round(total + (TOTAL[qui] - POINTS[qui].reduce((a, c) => a + c, 0)) * fin);
};

const Tableau: React.FC = () => {
  const f = useCurrentFrame();
  const bloc = (qui: Qui) => {
    const g = qui === "noob";
    const couleur = g ? ROUGE : BLEU;
    const gagnant = !g && f >= b(35);
    return (
      <div style={{ position: "absolute", top: 186, [g ? "left" : "right"]: 34, textAlign: g ? "left" : "right", fontFamily: PIXEL }}>
        <div style={{ fontSize: 40, color: "#fff", textShadow: contour(4) }}>
          {g ? <><span style={{ color: couleur }}>1P </span>NOOB 🐣</> : <>{gagnant ? "👑 " : ""}😎 PRO<span style={{ color: couleur }}> 2P</span></>}
        </div>
        <div style={{ fontSize: 56, color: OR, textShadow: contour(5), marginTop: 18, letterSpacing: 2 }}>{String(scoreA(qui, f)).padStart(4, "0")}</div>
      </div>
    );
  };
  return <>{bloc("noob")}{bloc("pro")}</>;
};

/** Le grand « VS » : déjà là à la première image (la couverture), il bat sur les temps, puis monte se ranger entre les scores. */
const GrandVS: React.FC = () => {
  const f = useCurrentFrame();
  const u = expoSortie(entre(f, b(2.5), b(3.25)));
  const bat = f < b(2.5) ? 1 + 0.06 * Math.exp(-((f % 24) / 6)) : 1;
  const milieu = TEL.y + TEL.h / 2, haut = 262; // entre les deux scores
  const taille = 170 - 110 * u, y = milieu - (milieu - haut) * u;
  if (f >= b(42)) return null;
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: y - taille / 2, textAlign: "center", fontFamily: PIXEL, fontSize: taille, color: OR,
      textShadow: `${contour(Math.max(4, taille / 18))}, ${-taille / 14}px 0 0 ${ROUGE}, ${taille / 14}px 0 0 ${BLEU}`, transform: `scale(${bat.toFixed(4)})`, zIndex: 40,
    }}>VS</div>
  );
};

/** Les points d'un joueur au-dessus de son téléphone, quand sa réponse tombe. */
const Saut: React.FC<{ qui: Qui; k: number }> = ({ qui, k }) => {
  const f = useCurrentFrame();
  const de = b(MANCHES[k] + REPONSE[qui][k]);
  if (f < de || f >= de + b(3)) return null;
  const v = rebond(f, de, 420, 16);
  const p = POINTS[qui][k];
  const couleur = p >= 900 ? OR : p >= 500 ? "#7ddf64" : p >= 100 ? "#ffa24a" : ROUGE;
  const emoji = p >= 900 ? " 🔥" : p < 100 ? " 💀" : qui === "noob" && k === 3 ? " 🍀" : "";
  const sortie = entre(f, de + b(2.4), de + b(3));
  return (
    <div style={{
      position: "absolute", left: TEL.x[qui === "noob" ? 0 : 1], width: TEL.l, top: TEL.y + 620 - 50 * v - 40 * sortie, textAlign: "center",
      fontFamily: PIXEL, fontSize: 64, color: couleur, textShadow: contour(6), opacity: 1 - sortie, zIndex: 50,
      transform: `scale(${(0.4 + 0.6 * v).toFixed(4)})`,
    }}>+{p}{emoji}</div>
  );
};

// ---------------------------------------------------------------- les messages, entre le tableau et les téléphones
type Msg = { de: number; a: number; l1: string; l2?: string; jaune?: boolean };
const MESSAGES: Msg[] = [
  { de: 0, a: b(4), l1: "ROUND 1", l2: "WHERE IS THIS? 📍", jaune: true },
  { de: b(4), a: b(8), l1: "THE NOOB SAID", l2: "TOKYO 💀" },
  { de: b(8), a: b(11.5), l1: "ROUND 2", jaune: true },
  { de: b(11.5), a: b(16), l1: "TOKYO AGAIN?! 😭" },
  { de: b(16), a: b(19.5), l1: "ROUND 3", jaune: true },
  { de: b(19.5), a: b(24), l1: "ONLY KNOWS", l2: "TOKYO 🗼" },
  { de: b(24), a: b(26.5), l1: "ROUND 4", jaune: true },
  { de: b(26.5), a: b(29), l1: "WAIT... 😳" },
  { de: b(29), a: b(34), l1: "THE NOOB WON", l2: "THIS ROUND?! 🤯" },
  { de: b(34), a: b(38), l1: "FINAL SCORE", jaune: true },
  { de: b(38), a: b(42), l1: "WHICH ONE", l2: "ARE YOU? 👇" },
];

const Message: React.FC = () => {
  const f = useCurrentFrame();
  const m = MESSAGES.find((x) => f >= x.de && f < x.a);
  if (!m) return null;
  const v = m.de === 0 ? 1 : rebond(f, m.de, 480, 20);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 352, textAlign: "center", fontFamily: PIXEL, zIndex: 45, transform: `scale(${(1.25 - 0.25 * v).toFixed(4)})` }}>
      <div style={{ fontSize: m.jaune ? 54 : 40, color: m.jaune ? OR : "#fff", textShadow: contour(5), lineHeight: 1.3 }}>{m.l1}</div>
      {m.l2 && <div style={{ fontSize: m.jaune ? 32 : 40, color: "#fff", textShadow: contour(5), lineHeight: 1.3, marginTop: 10 }}>{m.l2}</div>}
    </div>
  );
};

// ---------------------------------------------------------------- la fin : « PRESS START »
const Fin: React.FC = () => {
  const f = useCurrentFrame();
  if (f < b(42)) return null;
  const g = f - b(42);
  const v = rebond(f, b(42), 300, 16), v2 = rebond(f, b(43)), v3 = rebond(f, b(45), 420, 20);
  const clignote = Math.floor(g / 12) % 2 === 0; // « PRESS START » clignote à la croche
  return (
    <AbsoluteFill style={{ zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 430, gap: 42, fontFamily: PIXEL }}>
      <div style={{ width: 250, height: 250, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", boxShadow: `0 0 0 10px ${OR}, 0 0 0 20px #000`, transform: `scale(${(0.3 + 0.7 * v).toFixed(4)})` }}>
        <Img src={staticFile("ui/logo.jpg")} style={{ width: 226, height: 226, borderRadius: "50%" }} />
      </div>
      <div style={{ fontSize: 52, color: OR, textShadow: contour(5), opacity: f >= b(43) ? 1 : 0, transform: `translateY(${(50 * (1 - v2)).toFixed(1)}px)`, textAlign: "center", lineHeight: 1.35 }}>GUESS<br />THE PLACE</div>
      <div style={{ fontSize: 44, color: "#fff", textShadow: contour(5), opacity: f >= b(44) && clignote ? 1 : 0 }}>▶ PRESS START</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, opacity: f >= b(45) ? 1 : 0, transform: `scale(${(1.4 - 0.4 * v3).toFixed(4)})` }}>
        <div style={{ fontSize: 36, color: "#fff", background: ROUGE, padding: "18px 30px", boxShadow: "0 0 0 6px #000, 8px 12px 0 6px #000" }}>FREE · LINK IN BIO</div>
        <div style={{ fontFamily: `${TIKTOK}, sans-serif`, fontWeight: 800, fontSize: 40, color: NUIT, background: "#fff", padding: "10px 30px", borderRadius: 999 }}>map.randomjapanplace.com</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- le son : le débutant à gauche, le pro à droite
const EFFETS: Effet[] = [];
MANCHES.forEach((d, k) => {
  if (k) EFFETS.push([sec(d), "vs-appui-g.wav", 0.2], [sec(d), "vs-appui-d.wav", 0.2], [sec(d), "vs-manche.wav", 0.16]);
  const proAppui = k === 3 ? 3.5 : 2.5;
  EFFETS.push(
    [sec(d + 1), "vs-appui-g.wav", 0.26], [sec(d + 1.5), "vs-valide-g.wav", 0.18],
    [sec(d + REPONSE.noob[k]), k === 3 ? "vs-chance-g.wav" : "vs-rate-g.wav", k === 3 ? 0.3 : 0.32, 1.6],
    [sec(d + REPONSE.noob[k]) + 0.05, "vs-compte-g.wav", 0.09],
    [sec(d + proAppui), "vs-appui-d.wav", 0.26], [sec(d + proAppui + 0.5), "vs-valide-d.wav", 0.18],
    [sec(d + REPONSE.pro[k]), k === 3 ? "vs-bonk-d.wav" : "vs-reussi-d.wav", 0.3, 1.2],
    [sec(d + REPONSE.pro[k]) + 0.05, "vs-compte-d.wav", 0.09],
  );
});
EFFETS.push([sec(34.5), "vs-appui-g.wav", 0.2], [sec(34.5), "vs-appui-d.wav", 0.2], [sec(35), "vs-compte-g.wav", 0.09], [sec(35), "vs-compte-d.wav", 0.09],
  [sec(42), "vs-piece.wav", 0.3, 1.4]);

export const Versus: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <AbsoluteFill style={{ backgroundColor: NUIT }}>
    {/* le fond : la moitié du débutant rouge, celle du pro bleue, une trame de pixels */}
    <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(168,50,31,.42) 0 50%, rgba(79,127,166,.42) 50% 100%)` }} />
    <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.22) 50%, transparent 50%)", backgroundSize: "100% 8px", opacity: 0.6 }} />
    <Telephone qui="noob" />
    <Telephone qui="pro" />
    <Tableau />
    <GrandVS />
    {MANCHES.map((_, k) => <React.Fragment key={k}><Saut qui="noob" k={k} /><Saut qui="pro" k={k} /></React.Fragment>)}
    <Message />
    <Fin />
    <div style={{ position: "absolute", left: 0, right: 0, top: TEL.y + TEL.h + 22, textAlign: "center", fontFamily: `${TIKTOK}, sans-serif`, fontWeight: 700, fontSize: 21, color: "rgba(255,255,255,.75)" }}>
      © Mapterhorn · © OpenStreetMap · Natural Earth
    </div>
    <Son bgm={bgm} musique="musique/versus.wav" volume={1} voix={[]} effets={EFFETS} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- la miniature : la manche 4 (le débutant qui gagne)
export const MiniatureVersus: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: NUIT }}>
    <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(168,50,31,.42) 0 50%, rgba(79,127,166,.42) 50% 100%)` }} />
    {(["noob", "pro"] as Qui[]).map((qui, i) => (
      <div key={qui} style={{ position: "absolute", left: TEL.x[i], top: TEL.y, width: TEL.l, height: TEL.h, borderRadius: 34, overflow: "hidden", boxShadow: `0 0 0 7px #05070a, 0 0 0 11px ${i ? BLEU : ROUGE}` }}>
        <div style={{ width: 1080, height: 1920, transform: `scale(${K})`, transformOrigin: "0 0" }}>
          <OffthreadVideo src={staticFile(`rushes/vs-${qui}.mp4`)} muted trimBefore={b(qui === "noob" ? 3 : 4)} style={{ width: 1080, height: 1920 }} />
        </div>
      </div>
    ))}
    <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: PIXEL }}>
      <div style={{ fontSize: 76, color: "#fff", textShadow: contour(7) }}>NOOB</div>
      <div style={{ fontSize: 110, color: OR, textShadow: `${contour(7)}, -8px 0 0 ${ROUGE}, 8px 0 0 ${BLEU}`, margin: "6px 0" }}>VS</div>
      <div style={{ fontSize: 76, color: "#fff", textShadow: contour(7) }}>PRO</div>
    </div>
    {/* (la manche 1 jouée : la réponse de chacun) */}
    {[["+2 💀", ROUGE], ["+999 🔥", OR]].map(([t, c], i) => (
      <div key={i} style={{ position: "absolute", left: TEL.x[i], width: TEL.l, top: TEL.y + TEL.h + 40, textAlign: "center", fontFamily: PIXEL, fontSize: 60, color: c, textShadow: contour(6) }}>{t}</div>
    ))}
  </AbsoluteFill>
);
