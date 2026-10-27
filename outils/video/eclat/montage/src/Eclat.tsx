// La vidéo « éclat » (2026-10-27, le propriétaire : « en te basant sur ces deux vidéos et la stratégie marketing du PSG… un
// hook qui ressemble à ces deux vidéos… un edit de la carte extrêmement dynamique avec beaucoup de cuts… 15 secondes au
// maximum »). L'accroche (Vitre.tsx) : la carte imprimée sous une vitre, qu'un marteau fait éclater à T0. Puis, sur la
// musique (musique.py, 140 battements), un plan par temps : la carte en 3D, les vrais lieux du propriétaire et leur place
// sur la carte, les fiches, les dés, les saisons, la mer, l'itinéraire, la balade en 3D, la légende ; aux trois arrêts de
// la musique, l'image se fige en trame noir et blanc (comme les arrêts sur image de la vidéo du PSG) ; la fin : le logo
// dans ses rayons de lumière, « FREE · LINK IN BIO ».
import React from "react";
import { AbsoluteFill, Audio, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { b, C, entre, expoEntree, expoSortie, FPS, POLICE, rebond, s, T0 } from "./theme";
import { Vitre } from "./Vitre";

export const LONGUEUR = s(14.6);

// ---------------------------------------------------------------- les plans
/** Un plan, du temps k au temps fin de la musique : une vidéo (t : sa seconde au début du plan, v : sa vitesse) ou une
 *  capture du téléphone (ui/…, 1,5 fois la taille de la vidéo) ; zoom [début, fin] et centre [x, y] (0 à 1) ; gel : l'image
 *  du plan d'avant, figée en trame. */
type Plan = { k: number; fin: number; src: string; t?: number; v?: number; zoom?: [number, number]; centre?: [number, number]; gel?: boolean; entree?: "punch" | "fouet" | "flash" };
const PLANS: Plan[] = [
  { k: 0, fin: 2, src: "rushes/p-plongee.mp4", t: 0.2, v: 3.6, zoom: [1.0, 1.1] },
  { k: 2, fin: 3, src: "reels/himeji.mp4", t: 0.3, zoom: [1.12, 1.0], entree: "punch" },
  { k: 3, fin: 4, src: "ui/himeji-fiche.jpg", zoom: [1.32, 1.2], centre: [0.5, 0.56], entree: "punch" },
  { k: 4, fin: 5, src: "rushes/tn-japon.mp4", t: 4.6, v: 1.6, entree: "fouet" },
  { k: 5, fin: 6, src: "reels/aogashima.mp4", t: 0.4, zoom: [1.1, 1.0], entree: "punch" },
  { k: 6, fin: 7, src: "rushes/tn-aogashima.mp4", t: 0.4, v: 1.8, entree: "punch" },
  { k: 7, fin: 7.5, src: "ui/hasard.jpg", zoom: [1.5, 1.42], centre: [0.34, 0.27], entree: "punch" },
  { k: 7.5, fin: 8, src: "ui/hasard.jpg", zoom: [1.42, 1.42], centre: [0.34, 0.27], gel: true },
  { k: 8, fin: 8.5, src: "rushes/p-printemps.mp4", t: 0.8, entree: "flash" },
  { k: 8.5, fin: 9, src: "rushes/p-ete.mp4", t: 0.8, entree: "punch" },
  { k: 9, fin: 9.5, src: "rushes/p-automne.mp4", t: 0.8, entree: "punch" },
  { k: 9.5, fin: 10, src: "rushes/p-hiver.mp4", t: 0.8, entree: "punch" },
  { k: 10, fin: 11, src: "rushes/p-mer.mp4", t: 0.6, v: 1.5, zoom: [1.15, 1.35], centre: [0.74, 0.2], entree: "punch" },
  { k: 11, fin: 12, src: "ui/route.jpg", zoom: [1.18, 1.32], centre: [0.42, 0.5], entree: "punch" },
  { k: 12, fin: 13, src: "reels/itsukushima.mp4", t: 0.5, zoom: [1.1, 1.0], entree: "fouet" },
  { k: 13, fin: 14, src: "rushes/it-torii.mp4", t: 0.55, zoom: [1.12, 1.04], centre: [0.5, 0.4], entree: "punch" },
  { k: 14, fin: 15, src: "rushes/kk-course.mp4", t: 4.3, entree: "punch" },
  { k: 15, fin: 15.5, src: "rushes/tk-barque.mp4", t: 1.5, entree: "punch" },
  { k: 15.5, fin: 16, src: "rushes/tk-barque.mp4", t: 1.5 + (0.5 * 60) / 140, gel: true },
  { k: 16, fin: 17, src: "ui/orochi-bulle.jpg", zoom: [1.4, 1.3], centre: [0.43, 0.33], entree: "flash" },
  { k: 17, fin: 18, src: "reels/kinkakuji.mp4", t: 0.2, zoom: [1.1, 1.0], entree: "punch" },
  { k: 18, fin: 19, src: "rushes/kk-feux.mp4", t: 4.0, zoom: [1.15, 1.05], entree: "punch" },
  { k: 19, fin: 20, src: "rushes/it-feux.mp4", t: 3.0, entree: "punch" },
  { k: 20, fin: 21, src: "rushes/tn-filtres.mp4", t: 1.5, v: 1.6, entree: "fouet" },
  { k: 21, fin: 22, src: "ui/kinkaku-fiche.jpg", zoom: [1.32, 1.2], centre: [0.5, 0.56], entree: "punch" },
  { k: 22, fin: 23, src: "rushes/tn-filtres.mp4", t: 6.3, v: 1.5, entree: "punch" },
  { k: 23, fin: 24, src: "rushes/tn-filtres.mp4", t: 6.3 + (1.5 * 60) / 140, gel: true },
];
const FOUET = 12; // (images) un panoramique éclair : la moitié avant la coupe, la moitié après

/** Une image du plan : la vidéo ou la capture, cadrée (zoom, centre). */
const Image_: React.FC<{ p: Plan; duree: number; decalage: number }> = ({ p, duree, decalage }) => {
  const f = useCurrentFrame();
  const [z0, z1] = p.zoom ?? [1.06, 1.0];
  const u = entre(f, 0, duree);
  const z = z0 + (z1 - z0) * (u * 0.6 + expoSortie(u) * 0.4);
  const m = 0.5 / z, c = p.centre ?? [0.5, 0.5];
  const cx = Math.min(1 - m, Math.max(m, c[0])), cy = Math.min(1 - m, Math.max(m, c[1]));
  const style: React.CSSProperties = {
    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transformOrigin: "50% 50%",
    transform: `scale(${z.toFixed(5)}) translate(${((0.5 - cx) * 100).toFixed(3)}%, ${((0.5 - cy) * 100).toFixed(3)}%)`,
  };
  if (p.src.endsWith(".jpg")) return <Img src={staticFile(p.src)} style={style} />;
  const v = p.v ?? 1;
  return <OffthreadVideo src={staticFile(p.src)} muted trimBefore={Math.max(0, Math.round(((p.t ?? 0) - (decalage / FPS) * v) * FPS))} playbackRate={v} style={style} />;
};

/** La trame : noir et blanc, des points dont la taille suit l'ombre (l'image multipliée par une grille de points dégradés,
 *  éclaircie puis seuillée par un fort contraste : un point noir là où image × grille × 1,6 < 0,5). */
const Trame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ filter: "brightness(1.6) contrast(8)", backgroundColor: "#fff", isolation: "isolate" }}>
    <AbsoluteFill style={{ filter: "grayscale(1) contrast(1.3)" }}>{children}</AbsoluteFill>
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(circle, #000 0px, #fff 8.5px)", backgroundSize: "12px 12px", mixBlendMode: "multiply" }} />
  </AbsoluteFill>
);

const UnPlan: React.FC<{ p: Plan; avant: number; sortie: number | null; z: number }> = ({ p, avant, sortie, z }) => {
  const f = useCurrentFrame();
  const g = f - avant, duree = b(p.fin) - b(p.k);
  let x = 0, ry = 0, sc = 1;
  if (p.entree === "fouet") {
    const u = expoSortie(entre(g, -FOUET / 2, FOUET * 0.45));
    x = 1250 * (1 - u); ry = -22 * (1 - u);
  }
  if (sortie !== null) {
    const u = expoEntree(entre(f, sortie - FOUET / 2, sortie + FOUET * 0.2));
    x -= 1250 * u; ry += 22 * u;
  }
  if (p.entree === "punch" || p.entree === "flash") sc = 1 + 0.1 * (1 - rebond(g, 0, 320, 20));
  if (p.gel) sc = 1 + 0.07 * expoSortie(entre(g, 0, duree));
  // la secousse de chaque coupe (plus forte aux débuts de mesure et aux arrêts)
  const fort = p.entree === "flash" || p.gel ? 18 : 8;
  const sec = g >= 0 ? fort * Math.exp(-g / 4) : 0;
  const image = <Image_ p={p} duree={duree + avant} decalage={avant} />;
  return (
    <AbsoluteFill style={{ zIndex: z }}>
      <AbsoluteFill style={{
        transform: `translate(${(x + sec * Math.sin(g * 2.3)).toFixed(1)}px, ${(sec * Math.cos(g * 3.1)).toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${(1.04 * sc).toFixed(5)})`,
      }}>
        {p.gel ? <Trame><Freeze frame={0}>{image}</Freeze></Trame> : image}
      </AbsoluteFill>
      {(p.entree === "flash" || p.gel) && <AbsoluteFill style={{ background: "#fff", opacity: (p.gel ? 0.7 : 0.9) * (1 - entre(g, 0, 7)) }} />}
    </AbsoluteFill>
  );
};

const Plans: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000", perspective: 2400 }}>
    {PLANS.map((p, i) => {
      const suivant = PLANS[i + 1];
      const avant = p.entree === "fouet" ? FOUET / 2 : 0;
      const apres = suivant?.entree === "fouet" ? FOUET / 2 : 0;
      const debut = b(p.k) - avant, duree = b(p.fin) - b(p.k) + avant + apres;
      return (
        <Sequence key={i} from={debut} durationInFrames={duree} layout="none">
          <UnPlan p={p} avant={avant} sortie={suivant?.entree === "fouet" ? b(p.fin) - debut : null} z={i} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

// ---------------------------------------------------------------- les mots
/** Un mot à la façon de TikTok : blanc cerné de noir, en capitales, qui claque en arrivant ; le mot entre * sur une
 *  pastille rouge. */
const Mot: React.FC<{ texte: string; de: number; a: number; y?: number; taille?: number }> = ({ texte, de, a, y = 290, taille = 104 }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const v = rebond(f, de, 420, 22);
  const lignes = texte.split("\n");
  return (
    <div style={{
      position: "absolute", left: 60, right: 60, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      transform: `scale(${(1.7 - 0.7 * v).toFixed(4)}) rotate(${(-6 * (1 - v) - 2).toFixed(2)}deg)`, transformOrigin: "50% 40%",
      opacity: Math.min(1, (f - de + 1) / 2),
    }}>
      {lignes.map((l, i) => (
        <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: taille, lineHeight: 1.04, textAlign: "center", letterSpacing: -1 }}>
          {l.split("*").map((m, j) => j % 2
            ? <span key={j} style={{ background: C.rouge, color: "#fff", padding: "0 18px", borderRadius: 18, border: `7px solid ${C.encre}`, boxShadow: "0 8px 0 rgba(0,0,0,.35)", display: "inline-block", transform: "rotate(-2deg)", margin: "0 4px" }}>{m}</span>
            : <span key={j} style={{ color: "#fff", WebkitTextStroke: `14px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 24px rgba(0,0,0,.45)" }}>{m}</span>)}
        </div>
      ))}
    </div>
  );
};

const MOTS: [string, number, number, number?][] = [
  ["EVERY PLACE\nI FILMED", 1, 3],
  ["ON *ONE*\n3D MAP", 3, 5],
  ["ROLL THE *DICE*", 7, 8, 1240], // (sous le panneau des dés)
  ["*4* SEASONS", 8, 10],
  ["LIVING *SEA*", 10, 11],
  ["ROAD *TRIPS*", 11, 12],
  ["WALK IT\nIN *3D*", 12, 16],
  ["*LEGENDS*", 16, 17, 1240], // (sous la bulle de la légende)
  ["100%\n*FREE*", 23, 24],
];

// ---------------------------------------------------------------- la fin
const Fin: React.FC = () => {
  const f = useCurrentFrame();
  const de = b(24), de2 = b(26);
  if (f < de) return null;
  const g = f - de;
  const vLogo = rebond(f, de, 300, 16), vTitre = rebond(f, de + 6), vBouton = rebond(f, de2, 420, 20), vAdr = rebond(f, de2 + 6);
  const rayons = expoSortie(entre(g, 0, 18));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: "blur(12px) brightness(.5)", transform: "scale(1.1)" }}>
        <Freeze frame={0}><OffthreadVideo src={staticFile("rushes/tn-japon.mp4")} muted trimBefore={s(0.2)} style={{ width: "100%", height: "100%" }} /></Freeze>
      </AbsoluteFill>
      {/* les rayons de lumière derrière le logo (la fin de la vidéo du PSG) */}
      <AbsoluteFill style={{
        background: "repeating-conic-gradient(from 0deg at 50% 640px, rgba(255,246,220,.55) 0deg 7deg, rgba(255,246,220,0) 7deg 18deg)",
        WebkitMaskImage: "radial-gradient(circle at 50% 640px, #000 0, rgba(0,0,0,.6) 380px, transparent 900px)",
        opacity: rayons, transform: `rotate(${(g * 0.25).toFixed(2)}deg) scale(${(0.6 + 0.4 * rayons).toFixed(3)})`, transformOrigin: "50% 640px",
      }} />
      <AbsoluteFill style={{ background: "#fff", opacity: 0.85 * (1 - entre(g, 0, 8)) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        <div style={{
          width: 340, height: 340, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center",
          boxShadow: "0 30px 90px rgba(0,0,0,.6), 0 0 0 12px rgba(255,255,255,.18)",
          transform: `scale(${Math.max(0, 0.2 + 0.8 * vLogo).toFixed(4)}) rotate(${(-18 * (1 - vLogo)).toFixed(2)}deg)`,
        }}>
          <Img src={staticFile("logo.jpg")} style={{ width: 306, height: 306, borderRadius: "50%" }} />
        </div>
        <div style={{
          fontFamily: POLICE, fontWeight: 900, fontSize: 94, lineHeight: 1.02, textAlign: "center", color: "#fff", padding: "0 60px",
          WebkitTextStroke: `14px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 30px rgba(0,0,0,.5)",
          opacity: f >= de + 6 ? 1 : 0, transform: `translateY(${(60 * (1 - vTitre)).toFixed(1)}px) scale(${(0.7 + 0.3 * vTitre).toFixed(4)})`,
        }}>EXPLORE JAPAN<br />IN 3D</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: f >= de2 ? 1 : 0 }}>
          <div style={{
            fontFamily: POLICE, fontWeight: 900, fontSize: 64, color: "#fff", background: C.rouge, border: `7px solid ${C.encre}`, borderRadius: 999,
            padding: "14px 56px", boxShadow: `0 9px 0 ${C.rougeFonce}, 0 9px 0 7px ${C.encre}, 0 30px 60px rgba(0,0,0,.45)`,
            transform: `scale(${(1.6 - 0.6 * vBouton).toFixed(4)}) rotate(${(-3 * (1 - vBouton) - 1.5).toFixed(2)}deg)`,
          }}>FREE · LINK IN BIO</div>
          <div style={{
            fontFamily: POLICE, fontWeight: 700, fontSize: 44, color: C.encre, background: C.papier, border: `6px solid ${C.encre}`, borderRadius: 999,
            padding: "10px 36px", opacity: f >= de2 + 6 ? 1 : 0, transform: `translateY(${(40 * (1 - vAdr)).toFixed(1)}px)`,
          }}>map.randomjapanplace.com</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- le son
const AVANCE = 2; // l'AAC du MP4 retarde le son d'autant
/** [seconde, fichier, volume] ; les secondes sont celles où le bruit doit s'entendre (son attaque est déduite). */
const SFX: [number, string, number][] = [
  [0.0, "sfx/piece.wav", 1.0],
  [0.0, "sfx/glass-plate-slide.mp3", 0.35],
  [0.45, "sfx/tink-1.wav", 1.0],
  [0.95, "sfx/tink-2.wav", 1.0],
  [T0 - 0.72 - 0.03, "sfx/whoosh-fast.mp3", 0.5],
  // (le verre, le coup de basse et les souffles s'additionnent à l'impact : plus fort, le rendu saturait)
  [T0 - 0.01, "sfx/glass-break-hammer.mp3", 0.55],
  [T0 - 0.06, "sfx/bass-hit-short.mp3", 0.4],
  [T0 + 0.13 - 0.22, "sfx/air-whoosh-powerful.mp3", 0.35],
  [T0 + 0.15, "sfx/glass-debris-sweep.mp3", 0.55],
  ...[4, 12, 20].map((k): [number, string, number] => [b(k) / FPS - 0.33, "sfx/swoosh-quick.mp3", 0.45]),
  ...[7.5, 15.5, 23].map((k): [number, string, number] => [b(k) / FPS - 0.17, "sfx/click-camera.mp3", 1.3]),
  ...[8, 16].map((k): [number, string, number] => [b(k) / FPS - 0.13, "sfx/hit-fast-exciting.mp3", 0.6]),
  [b(24) / FPS - 0.55, "sfx/impact-deep-whoosh.mp3", 0.45],
  [b(24) / FPS, "sfx/taiko.mp3", 0.5],
];
const MUSIQUE = 0.42;

const Son: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const { durationInFrames: duree } = useVideoConfig();
  return (
    <>
      {bgm && (
        <Sequence from={b(0) - AVANCE} layout="none">
          <Audio src={staticFile("musique/eclat.wav")} volume={(f) => MUSIQUE * interpolate(f, [duree - b(0) - 12, duree - b(0)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </Sequence>
      )}
      {SFX.map(([t, nom, v], i) => (
        <Sequence key={i} from={Math.max(0, s(t) - AVANCE)} durationInFrames={s(4)} layout="none"><Audio src={staticFile(nom)} volume={v} /></Sequence>
      ))}
    </>
  );
};

// ---------------------------------------------------------------- tout
const FLOU: [number, number][] = [4, 12, 20].map((k): [number, number] => [b(k) - 8, b(k) + 8]);

export const Eclat: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans />
      <Vitre />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.3) 0px, rgba(0,0,0,0) 560px)", opacity: f >= b(0) && f < b(24) ? 1 : 0 }} />
      {MOTS.map(([texte, de, a, y], i) => <Mot key={i} texte={texte} de={b(de)} a={b(a)} y={y} />)}
      <Fin />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={200} samples={6}>{image}</CameraMotionBlur> : image}
      <Son bgm={bgm} />
    </AbsoluteFill>
  );
};
