// La vidéo « Devine le lieu » (2026-11-09, le propriétaire : « Prépare 2 vidéos qui présente le jeu "Devine le lieu" Ainsi que son Défi du
// jour […] attractive selon les codes des réseaux sociaux »). 25 s, 9:16, 60 images/s, en anglais. Un quiz qu'on joue en regardant : un vrai
// plan du propriétaire à plein écran, trois secondes pour deviner, puis le plan rétrécit dans la photo du vrai jeu, un doigt pose l'épingle,
// et la carte s'envole jusqu'à la réponse. Chaque niveau donne moins de temps. Le quatrième reste sans réponse : on la demande en commentaire.
// 120 battements par minute : le temps n tombe à l'image 30 n (le découpage : ../plan.md).
import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { C, entre, expoS, FPS, POLICE, rebond } from "./theme";
import { Credits, Effet, Fin, FOUET, Mots, Plans, Son, UnPlan, Voix } from "./Commun";

const b = (n: number) => Math.round(n * 30);
const sec = (n: number) => n * 0.5;
export const DUREE_DEVINE = b(50);
const T = { q1: b(0), r1: b(6), q2: b(11), r2: b(15), q3: b(19), r3: b(21), q4: b(26), gel: b(30), com: b(31), score: b(33), amis: b(37), fin: b(41) };

// le cadre de la photo dans le jeu (mesuré sur la prise) : son centre et son échelle par rapport à un vrai plan plein écran
const PHOTO = { y: 312, echelle: 380 / 1080 };
const COULEURS = { easy: "#3f8a5a", medium: "#c9971c", hard: "#d9622b", impossible: "#a8321f" };

type Q = { de: number; a: number; niveau: number; nom: string; couleur: string; morceaux: { src: string; t0: number; v?: number; de: number; a: number }[]; secondes: number; centre: number; sort: boolean };
const QUESTIONS: Q[] = [
  { de: T.q1, a: T.r1, niveau: 1, nom: "EASY", couleur: COULEURS.easy, secondes: 3, centre: 0.52, sort: true,
    morceaux: [{ src: "kinkaku-1", t0: 0, de: 0, a: 90 }, { src: "kinkaku-2", t0: 0, v: 0.8, de: 90, a: T.r1 + 16 }] },
  { de: T.q2, a: T.r2, niveau: 2, nom: "MEDIUM", couleur: COULEURS.medium, secondes: 2, centre: 0.5, sort: true,
    morceaux: [{ src: "motonosumi", t0: 0.4, de: T.q2, a: T.r2 + 16 }] },
  { de: T.q3, a: T.r3, niveau: 3, nom: "HARD", couleur: COULEURS.hard, secondes: 1, centre: 0.42, sort: true,
    morceaux: [{ src: "aogashima", t0: 0.1, de: T.q3, a: T.r3 + 16 }] },
  { de: T.q4, a: T.gel, niveau: 4, nom: "IMPOSSIBLE", couleur: COULEURS.impossible, secondes: 2, centre: 0.5, sort: false,
    morceaux: [{ src: "moai", t0: 0, de: T.q4, a: T.gel + 2 }] },
];

/** Le compte à rebours : un anneau qui se vide, le chiffre qui claque à chaque seconde. */
const Anneau: React.FC<{ de: number; a: number; secondes: number; couleur: string }> = ({ de, a, secondes, couleur }) => {
  const f = useCurrentFrame();
  const reste = Math.max(0, (a - f) / FPS);
  const n = Math.max(1, Math.ceil(reste));
  const debutChiffre = a - n * FPS;
  const v = f === de && de === 0 ? 1 : rebond(f, Math.max(de, debutChiffre), 520, 22);
  const part = Math.min(1, reste / secondes);
  const R = 118, tour = 2 * Math.PI * R;
  return (
    <div style={{ position: "absolute", left: 540 - 150, top: 1140, width: 300, height: 300, zIndex: 89 }}>
      <svg width="300" height="300" viewBox="0 0 300 300" style={{ position: "absolute", inset: 0 }}>
        <circle cx="150" cy="150" r="142" fill="rgba(13,18,24,.72)" />
        <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="22" />
        <circle cx="150" cy="150" r={R} fill="none" stroke={n === 1 ? "#e0563f" : couleur} strokeWidth="22" strokeLinecap="round" strokeDasharray={`${(part * tour).toFixed(1)} ${tour.toFixed(1)}`} transform="rotate(-90 150 150)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: POLICE, fontWeight: 900, fontSize: 168, color: "#fff", transform: `scale(${(1.45 - 0.45 * v).toFixed(3)})` }}>{n}</div>
    </div>
  );
};

const Niveau: React.FC<{ q: Q }> = ({ q }) => {
  const f = useCurrentFrame();
  const v = q.de === 0 ? 1 : rebond(f, q.de, 420, 22);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 182, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, zIndex: 91, transform: `translateY(${(-40 * (1 - v)).toFixed(1)}px)`, opacity: Math.min(1, q.de === 0 ? 1 : (f - q.de + 1) / 3) }}>
      <div style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 50, color: "#fff", background: q.couleur, border: `6px solid ${C.encre}`, borderRadius: 999, padding: "4px 34px", letterSpacing: 1 }}>LEVEL {q.niveau} · {q.nom}</div>
      <div style={{ display: "flex", gap: 10 }}>
        {[1, 2, 3, 4].map((n) => <div key={n} style={{ width: 96, height: 16, borderRadius: 9, border: `4px solid ${C.encre}`, background: n <= q.niveau ? "#fff" : "rgba(255,255,255,.28)" }} />)}
      </div>
    </div>
  );
};

/** Un vrai plan à plein écran, le niveau, le compte à rebours ; à la fin, il rétrécit dans le cadre de la photo du jeu. */
const Question: React.FC<{ q: Q }> = ({ q }) => {
  const f = useCurrentFrame();
  const fin = q.a + (q.sort ? 16 : 2);
  if (f < q.de || f >= fin) return null;
  const u = q.sort ? expoS(entre(f, q.a - 3, q.a + 13)) : 0;
  const S = 1 + (PHOTO.echelle - 1) * u;
  const cy = q.centre * 1920;
  const Tx = 540 - 540 * S, Ty = cy + (PHOTO.y - cy) * u - cy * S;
  const haut = (cy - 432) * u, bas = (1920 - cy - 432) * u;
  const zoom = 1.07 - 0.07 * entre(f, q.de, q.a);
  const voile = 1 - entre(f, q.a - 3, q.a + 3);
  return (
    <AbsoluteFill style={{ zIndex: 60 }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${Tx.toFixed(2)}px, ${Ty.toFixed(2)}px) scale(${S.toFixed(5)})`, clipPath: `inset(${haut.toFixed(1)}px 0 ${bas.toFixed(1)}px 0)` }}>
        {q.morceaux.map((m) => (
          <Sequence key={m.src} from={m.de} durationInFrames={m.a - m.de} layout="none">
            <OffthreadVideo src={staticFile(`reels/${m.src}.mp4`)} muted trimBefore={Math.round(m.t0 * FPS)} playbackRate={m.v ?? 1} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom.toFixed(4)})` }} />
          </Sequence>
        ))}
        <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.34), rgba(0,0,0,0) 30%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: voile }}>
        <Niveau q={q} />
        <Anneau de={q.de} a={q.a} secondes={q.secondes} couleur={q.couleur} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** La réponse : le verdict du jeu, les points qui montent. */
const Resultat: React.FC<{ de: number; a: number; verdict: string; pts: number; couleur: string; y?: number }> = ({ de, a, verdict, pts, couleur, y = 1236 }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const n = Math.round(pts * entre(f, de + 4, de + 32));
  const v = rebond(f, de + 4, 420, 20);
  return (
    <>
      <Mots texte={verdict} de={de} a={a} y={y} taille={100} />
      <div style={{ position: "absolute", left: 0, right: 0, top: y + 126, display: "flex", justifyContent: "center", zIndex: 91, opacity: f >= de + 4 ? 1 : 0, transform: `scale(${(1.4 - 0.4 * v).toFixed(3)}) rotate(-2deg)` }}>
        <div style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 86, color: "#fff", background: couleur, border: `7px solid ${C.encre}`, borderRadius: 22, padding: "0 30px", boxShadow: "0 8px 0 rgba(0,0,0,.35)", fontVariantNumeric: "tabular-nums" }}>+{n} PTS</div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------- les plans
const V1 = 1.5, V2 = 1.9, T0 = 0.15; // les vitesses des révélations : de plus en plus vite
const PLANS: UnPlan[] = [
  { de: T.r1, a: T.q2, src: "rushes/jd-1.mp4", t0: T0, v: V1, zoom: [1, 1], entree: "sec" },
  { de: T.r2, a: T.q3, src: "rushes/jd-2.mp4", t0: T0, v: V2, zoom: [1, 1], entree: "sec" },
  { de: T.r3, a: T.q4, src: "rushes/jd-3.mp4", t0: T0, v: V1, zoom: [1, 1], entree: "sec" },
  { de: T.gel, a: T.score, src: "reels/moai.mp4", t0: 1.9, gel: true },
  { de: T.score, a: T.amis, src: "rushes/jd-score.mp4", t0: 0.45, zoom: [1, 1.03], entree: "flash" },
  { de: T.amis, a: b(38), src: "ui/salon-1.jpg", img: true, zoom: [1, 1], entree: "fouet" },
  { de: b(38), a: b(39), src: "ui/salon-2.jpg", img: true, zoom: [1, 1], entree: "sec" },
  { de: b(39), a: T.fin, src: "ui/salon-3.jpg", img: true, zoom: [1, 1.08], centre: [0.5, 0.3], entree: "sec" },
];
const carteVisible = (f: number) => (f >= T.r1 + 8 && f < T.q2) || (f >= T.r2 + 8 && f < T.q3) || (f >= T.r3 + 8 && f < T.q4) || (f >= T.score && f < T.fin);
const FLOU: [number, number][] = [[T.r1 - 3, T.r1 + 14], [T.r2 - 3, T.r2 + 14], [T.r3 - 3, T.r3 + 14], [T.amis - FOUET / 2 + 2, T.amis + FOUET / 2 - 2]];

// ---------------------------------------------------------------- le son
const rev = (r: number, tau: number, v: number) => r / FPS + (tau - T0) / v; // la seconde de la vidéo d'un instant de la prise
const appuis = (r: number, v: number): Effet[] => [
  [rev(r, 0.4, v), "tap.mp3", 0.6], [rev(r, 0.42, v), "epingle.wav", 0.55],
  [rev(r, 0.95, v), "tap.mp3", 0.6], [rev(r, 1.0, v), "air-whoosh-powerful.mp3", 0.24],
];
const tics = (d: number, n: number): Effet[] => Array.from({ length: n }, (_, k): Effet => [d + k, k % 2 ? "toc.wav" : "tic.wav", 0.5]);
const quoi = (r: number, v: number, son: string, vol: number): Effet[] => [[rev(r, 1.75, v), son, vol], [rev(r, 1.85, v), "pts.wav", 0.28]];
const EFFETS: Effet[] = [
  ...tics(sec(0), 3), ...tics(sec(11), 2), ...tics(sec(19), 1), ...tics(sec(26), 2),
  [sec(6) - 0.03, "impact-deep-whoosh.mp3", 0.3], ...appuis(T.r1, V1), ...quoi(T.r1, V1, "bien.wav", 0.34),
  [sec(11), "transition-snap.mp3", 0.25],
  [sec(15) - 0.03, "swoosh-quick.mp3", 0.3], ...appuis(T.r2, V2), ...quoi(T.r2, V2, "moyen.wav", 0.34),
  [sec(19), "transition-snap.mp3", 0.25],
  [sec(21) - 0.03, "swoosh-quick.mp3", 0.3], ...appuis(T.r3, V1), ...quoi(T.r3, V1, "loin.wav", 0.15),
  [sec(26), "transition-snap.mp3", 0.25],
  [sec(30) - 0.17, "click-camera.mp3", 0.9],
  [sec(33), "hit-fast-exciting.mp3", 0.3], [sec(33.3), "ui-success-soft.mp3", 0.3],
  [sec(37) - 0.1, "swoosh-quick.mp3", 0.3], [sec(38), "ui-message-pop.mp3", 0.4], [sec(39), "ui-message-pop.mp3", 0.4],
  [sec(41), "sparkle-touch.mp3", 0.25], [sec(45), "ui-success-soft.mp3", 0.2],
];
const VOIX: Voix[] = [
  [0.05, "d-3s"], [1.55, "d-ou"],
  [rev(T.r1, 1.75, V1), "d-bull"],
  [sec(11) + 0.05, "d-2s"],
  [rev(T.r2, 1.75, V2), "d-pasmal"],
  [sec(19) + 0.02, "d-1s"],
  [rev(T.r3, 1.75, V1), "d-loin"],
  [sec(26) + 0.1, "d-celui"],
  [sec(30) - 0.1, "d-temps"],
  [sec(31), "d-comment"],
  [sec(33) + 0.25, "d-battre"],
  [sec(37) + 0.1, "d-amis"],
  [sec(41) + 0.25, "d-titre"],
  [sec(45) + 0.05, "d-free"], [sec(45) + 0.55, "d-bio"],
];

// ---------------------------------------------------------------- tout
export const Devine: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  // (le moment où la voix dit le verdict)
  const dit = (r: number, v: number) => Math.round(rev(r, 1.72, v) * FPS);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      {QUESTIONS.map((q) => <Question key={q.niveau} q={q} />)}
      <Credits visible={carteVisible(f)} />
      <Mots texte={"YOU HAVE\n*3 SECONDS*"} de={0} a={b(3)} y={310} taille={118} pose />
      <Mots texte={"WHERE IS\nTHIS?"} de={b(3)} a={b(6)} y={310} taille={132} />
      <Resultat de={dit(T.r1, V1)} a={T.q2} verdict="BULLSEYE!" pts={974} couleur="#3f8a5a" />
      <Mots texte={"*2 SECONDS*"} de={T.q2} a={T.r2} y={310} taille={118} />
      <Resultat de={dit(T.r2, V2)} a={T.q3} verdict="NOT BAD" pts={608} couleur="#c9971c" />
      <Mots texte={"*1 SECOND*"} de={T.q3} a={T.r3} y={310} taille={118} />
      <Resultat de={dit(T.r3, V1)} a={T.q4} verdict="FAR AWAY…" pts={282} couleur="#d9622b" y={1296} />
      <Mots texte={"AND THIS\n*ONE?*"} de={T.q4} a={T.gel} y={310} taille={118} />
      <Mots texte={"TIME'S UP!"} de={T.gel} a={T.com} y={760} taille={150} />
      <Mots texte={"COMMENT\nYOUR *GUESS*\n👇"} de={T.com} a={T.score} y={640} taille={124} />
      <Mots texte={"CAN YOU BEAT\n*MY SCORE?*"} de={T.score + 8} a={T.amis} y={1150} taille={104} />
      <Mots texte={"CHALLENGE\nYOUR *FRIENDS*"} de={T.amis} a={T.fin} y={1120} taille={112} />
      <Fin de={T.fin} de2={b(45)} titre={<>GUESS<br />THE PLACE</>} sous="160 PLACES FROM MY VIDEOS" fond="reels/motonosumi.mp4" t0={1.6} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={200} samples={6}>{image}</CameraMotionBlur> : image}
      <Son bgm={bgm} musique="musique/devine.wav" volume={0.34} voix={VOIX} effets={EFFETS} />
    </AbsoluteFill>
  );
};
