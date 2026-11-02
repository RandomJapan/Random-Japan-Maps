// La vidéo « jarre » (2026-11-02, le propriétaire, avec une vidéo TikTok du PSG : « En te basant sur le Hook de cette vidéo tu vas
// faire un edit en motion design de maximum 20 secondes pour présenter la carte et ses fonctionnalités »). 20 s, 9:16, 60 images/s,
// en anglais. L'accroche (Accroche.tsx) : un marteau, une jarre enterrée, deux mains qui l'ouvrent, sans texte ni musique ; dedans,
// la carte : on y plonge, et la musique éclate. Puis les fonctions (Carte.tsx), la fin (Fin.tsx). Le flou de mouvement seulement pendant les
// mouvements rapides. Le découpage : outils/video/jarre/plan.md.
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Accroche } from "./Accroche";
import { Carte } from "./Carte";
import { Fin } from "./Fin";
import { FOUET } from "./Commun";
import { C, FPS, s, t } from "./theme";
import { T } from "./temps";

const COUPES_FOUET = [T.itsuku, T.des, T.mer, T.route];
const FLOU: [number, number][] = [[T.ouvre - 1, T.ouvre + 20], ...COUPES_FOUET.map((c): [number, number] => [c - FOUET + 2, c + FOUET - 2])];

// ---------------------------------------------------------------- le son
const AVANCE = 2; // l'AAC du MP4 retarde le son d'autant
const sec = (n: number) => t(n) / FPS;
const MUSIQUE = 0.42;
/** [seconde où le bruit doit s'entendre (son attaque déduite), fichier, volume, durée (s) : coupé et fondu au bout]. */
const SFX: [number, string, number, number?][] = [
  // l'accroche : le son d'origine des deux plans, coupé comme eux, et déjà calé sur l'image (preparer.py : geste)
  [0, "sfx/geste.wav", 1, T.ouvre / FPS],
  // l'ouverture : le souffle de la plongée sous la musique, puis les points qui surgissent
  [T.ouvre / FPS - 0.02, "sfx/air-whoosh-powerful.mp3", 0.3],
  [T.ouvre / FPS + 0.12, "sfx/pops.mp3", 0.55],
  // les panoramiques éclair
  ...COUPES_FOUET.map((c): [number, string, number] => [c / FPS - 0.33, "sfx/swoosh-quick.mp3", 0.35]),
  // l'épingle, la fiche, la vidéo
  [T.tapEpingle / FPS, "sfx/tap.mp3", 0.7], [T.fiche / FPS, "sfx/paper-slide.mp3", 0.3], [T.tapVideo / FPS, "sfx/tap.mp3", 0.7], [T.reel / FPS, "sfx/ui-message-pop.mp3", 0.3],
  // le dé, le vol, sa fiche
  [T.des / FPS + 0.07, "sfx/pop.mp3", 0.3], [T.tapDes / FPS, "sfx/de.mp3", 0.4], [T.vol / FPS + 0.1, "sfx/whoosh-fast.mp3", 0.35], [T.ficheDes / FPS, "sfx/paper-slide.mp3", 0.3],
  // les saisons, la mer, la légende
  ...[25, 25.75, 26.5, 27.25].map((n): [number, string, number] => [sec(n), "sfx/transition-snap.mp3", 0.25]),
  [T.mer / FPS, "sfx/tonnerre.mp3", 0.12, 0.9],
  [T.legende / FPS + 20 / FPS, "sfx/tap.mp3", 0.6], [T.legende / FPS + 24 / FPS, "sfx/sparkle-touch.mp3", 0.3],
  // la route, l'arrêt sur image, le portail
  [T.route / FPS + 0.1, "sfx/pinceau.mp3", 0.6, 1.4],
  [T.gel / FPS - 0.17, "sfx/click-camera.mp3", 0.9],
  [T.portail / FPS + 0.05, "sfx/pop.mp3", 0.3], [T.tapPortail / FPS, "sfx/tap.mp3", 0.7], [T.balade / FPS - 0.12, "sfx/hit-fast-exciting.mp3", 0.35], [T.balade / FPS, "sfx/shimmer-sparkle-sweep.mp3", 0.25],
  ...[39.33, 40.67].map((n): [number, string, number] => [sec(n), "sfx/transition-snap.mp3", 0.25]),
  // la fin
  [T.fin / FPS, "sfx/sparkle-touch.mp3", 0.25], [sec(44), "sfx/ui-success-soft.mp3", 0.2],
];

const Son: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const { durationInFrames: duree } = useVideoConfig();
  return (
    <>
      {bgm && (
        <Sequence from={T.ouvre - AVANCE} layout="none">
          <Audio src={staticFile("musique/jarre.wav")} volume={MUSIQUE} />
        </Sequence>
      )}
      {SFX.map(([a, nom, v, d], i) => (
        <Sequence key={i} from={Math.max(0, s(a) - AVANCE)} durationInFrames={Math.min(s(d ?? 3), duree)} layout="none">
          <Audio src={staticFile(nom)} volume={d === undefined ? v : (f) => v * interpolate(f, [s(d) - 12, s(d)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </Sequence>
      ))}
    </>
  );
};

// ---------------------------------------------------------------- tout
export const Jarre: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Carte />
      <Fin />
      <AbsoluteFill style={{ zIndex: 200 }}><Accroche /></AbsoluteFill>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={220} samples={8}>{image}</CameraMotionBlur> : image}
      <Son bgm={bgm} />
    </AbsoluteFill>
  );
};
