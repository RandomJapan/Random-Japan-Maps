// La vidéo 2 du « générique d'animé » de la carte (2026-11-22) : la chanson n° 2, chantée par une jeune femme, et une héroïne
// d'animé pour le hook (le propriétaire : « Fais la vidéo avec la chanson 2 maintenant, il faudra que ce soit une belle fille pour le
// hook quand la musique est chantée par une fille »). Le même moteur que la vidéo 1 (Commun.tsx, Personnage, Titre, Fin), d'autres
// lieux du propriétaire pour chaque parole, des pétales et un rose de cerisier. 9:16, 60 images/s ; le temps : fille/temps.ts.
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Credit, Eclairs, FOUET, Mots, Parole, Plans, Sources, UnPlan, Vitesse } from "../Commun";
import { Fin } from "../Fin";
import { Perso, Personnage, Titre } from "../Generique";
import { C, FPS, s } from "../theme";
import { Accroche, AVANT_CARTE, Petales, ROSE } from "./Accroche";
import { b, PAROLES, T, V0 } from "./temps";

// ---------------------------------------------------------------- les plans
const PLANS: UnPlan[] = [
  // la carte, au bout de la plongée dans son téléphone
  { de: T.carte - AVANT_CARTE, a: T.daisen, src: "rushes/tn-japon.mp4", t0: 2.1, zoom: [1.3, 1.0], entree: "sec" },
  // « au-dessus des nuages » : le Daisen et sa crête dans les nuages ; « au-delà du Fuji » : le Fuji au couchant derrière le torii
  // rouge du lac d'Hakone
  { de: T.daisen, a: T.hakone, src: "reels/daisen.mp4", t0: 0.1, zoom: [1.14, 1.0], entree: "fouet" },
  { de: T.hakone, a: T.torii, src: "reels/hakone.mp4", t0: 0.1, zoom: [1.0, 1.12], entree: "punch" },
  // « à travers mille torii »
  { de: T.torii, a: T.kabushima, src: "reels/inariyama.mp4", zoom: [1.0, 1.12], entree: "flash" },
  { de: T.kabushima, a: T.futami, src: "reels/kabushima.mp4", zoom: [1.12, 1.0], entree: "rouge" },
  { de: T.futami, a: T.persos, src: "reels/futamigaura.mp4", zoom: [1.0, 1.12], entree: "punch" },
  // (temps 37 → 41 : deux lieux en personnages, plus bas) ; puis son sourire, figé, avant le refrain
  { de: T.sourire, a: T.refrain, src: "clips/fille-flux.mp4", t0: 1.5, gel: true, zoom: [1.18, 1.3], centre: [0.42, 0.3], entree: "flash" },
  // le refrain
  { de: T.refrain, a: T.akagi, src: "rushes/p-plongee.mp4", t0: 0.3, v: 1.4, zoom: [1.1, 1.0], entree: "flash" },
  { de: T.akagi, a: T.neige, src: "reels/akagi.mp4", t0: 0.1, zoom: [1.12, 1.0], entree: "punch" },
  { de: T.neige, a: T.mer, src: "rushes/p-hiver.mp4", t0: 1.0, zoom: [1.05, 1.14], entree: "fouet" },
  { de: T.mer, a: T.sanctuaires, src: "rushes/p-mer.mp4", t0: 0.5, zoom: [1.25, 1.35], centre: [0.6, 0.38], entree: "fouet" },
  { de: T.sanctuaires, a: T.route, src: "rushes/tn-filtres.mp4", t0: 0.85, zoom: [1.06, 1.0], entree: "flash" },
  { de: T.route, a: T.fille, src: "rushes/ja-route.mp4", v: 1.2, zoom: [1.06, 1.0], entree: "fouet" },
  // « Japan, wait for me! » : elle dégaine, pose la lame sur son bras et fait un clin d'œil
  // (de sa seconde 1,4 : la lame déjà le long du bras, le clin d'œil à 2,5 s tient ses 20 images avant le feu d'artifice)
  { de: T.fille, a: T.feux, src: "clips/fille-tire.mp4", t0: 1.4, zoom: [1.0, 1.06], entree: "rouge" },
  { de: T.feux, a: T.fin + 12, src: "rushes/it-feux.mp4", t0: 2.5, zoom: [1.15, 1.05], entree: "flash" },
];
const COUPES_FOUET = [T.daisen, T.neige, T.mer, T.route];
const FLOU: [number, number][] = [[T.carte - AVANT_CARTE, T.carte + 6], ...COUPES_FOUET.map((x): [number, number] => [x - FOUET + 2, x + FOUET - 2])];
const CARTE: [number, number][] = [[T.carte - 2, T.daisen], [T.refrain, T.akagi], [T.neige, T.fille]];

// ---------------------------------------------------------------- les lieux en personnages (les noms de la carte)
const PERSOS: Perso[] = [
  { src: "reels/okama.mp4", jp: "蔵王御釜", en: "OKAMA CRATER", ou: "MIYAGI · YAMAGATA", couleur: C.mer },
  { src: "reels/keya.mp4", jp: "芥屋の大門", en: "KEYA NO OTO", ou: "FUKUOKA", couleur: ROSE },
];
const DUREE_PERSO = b(39) - b(37);

// ---------------------------------------------------------------- les éclairs
const ECLAIRS = [
  { f: T.daisen - 1, c: "#fff", d: 2, o: 0.7 },
  { f: T.kabushima, c: "#000", d: 1 }, { f: T.futami, c: ROSE, d: 1 },
  { f: T.persos, c: "#fff", d: 2 }, { f: b(39), c: ROSE, d: 1 }, { f: T.sourire, c: "#fff", d: 2, o: 0.8 },
  { f: T.refrain - 1, c: "#fff", d: 3 }, { f: T.refrain + 2, c: ROSE, d: 1, o: 0.7 }, { f: T.refrain + 3, c: "#000", d: 1 },
  { f: T.sanctuaires, c: "#fff", d: 2, o: 0.8 }, { f: T.fille, c: ROSE, d: 2 }, { f: T.feux, c: "#fff", d: 2 },
];

// ---------------------------------------------------------------- le son
const AVANCE = 2; // l'AAC du MP4 retarde le son d'autant
const CHANSON = 0.8;
const DOUX = 0.6;
const SFX: [number, string, number, number?][] = [
  // la lame qui fend l'air vers l'objectif, la coupe
  [T.coupe / FPS - 0.32, "sfx/sweep-metal-quick.mp3", 0.55],
  [T.coupe / FPS - 0.03, "sfx/transition-snap.mp3", 0.35],
  [T.coupe / FPS, "sfx/katana.wav", 0.25, 0.9],
  // la caméra entre dans le téléphone ; le titre tombe ; les épingles jaillissent (la plongée tombe dans la coupure de la chanson,
  // 5,9 → 6,45 s : plus bas que dans la vidéo 1, sinon ils couvrent la musique)
  [T.carte / FPS - 0.32, "sfx/zoom-air-fast.mp3", 0.35 * DOUX],
  [T.carte / FPS, "sfx/impact-deep-whoosh.mp3", 0.3 * DOUX],
  [b(21) / FPS, "sfx/pops.mp3", 0.4 * DOUX],
  ...COUPES_FOUET.map((x): [number, string, number] => [x / FPS - 0.3, "sfx/swoosh-quick.mp3", 0.4 * DOUX]),
  // son sourire, puis le refrain
  [T.sourire / FPS - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.3 * DOUX],
  [T.fille / FPS + 0.1, "sfx/katana.wav", 0.3 * DOUX, 1.2],
  [T.fin / FPS, "sfx/shimmer-sparkle-sweep.mp3", 0.4 * DOUX],
];

const Son: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const { durationInFrames: duree } = useVideoConfig();
  return (
    <>
      {/* la chanson commence avant l'image 0 (V0 < 0) : on la prend à son image AVANCE - V0 */}
      {bgm && <Audio src={staticFile("musique/chanson-fille.wav")} trimBefore={AVANCE - V0} volume={CHANSON} />}
      {SFX.map(([a, nom, v, d], i) => (
        <Sequence key={i} from={Math.max(0, s(a) - AVANCE)} durationInFrames={Math.min(s(d ?? 3), duree)} layout="none">
          <Audio src={staticFile(nom)} volume={d === undefined ? v : (g) => v * interpolate(g, [s(d) - 12, s(d)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </Sequence>
      ))}
    </>
  );
};

// ---------------------------------------------------------------- tout
export const Fille: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const surCarte = CARTE.some(([a, z]) => f >= a && f < z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      {PERSOS.map((p, i) => <Personnage key={i} p={p} i={i} de={b(37 + 2 * i)} a={b(37 + 2 * i) + DUREE_PERSO} />)}
      <AbsoluteFill style={{ zIndex: 50, background: "linear-gradient(rgba(0,0,0,.32) 0px, rgba(0,0,0,0) 620px)", opacity: f >= T.carte && f < T.fin ? 1 : 0 }} />
      <Titre de={T.carte} a={b(24)} ombre={ROSE} />
      <Petales de={T.sourire} a={T.refrain + 30} n={18} z={60} force={0.9} />
      <Vitesse de={T.sourire} a={T.refrain} cx={460} cy={620} rx={300} ry={420} force={0.6} />
      <Vitesse de={T.refrain} a={T.refrain + 20} cx={540} cy={900} force={0.9} />
      <Vitesse de={T.fille} a={T.fille + 26} cx={430} cy={760} rx={280} ry={430} force={0.7} />
      {PAROLES.jp.map((l, i) => <Parole key={i} {...l} />)}
      {PAROLES.en.map((l, i) => <Mots key={i} texte={l.texte} de={l.de} fin={l.fin} a={l.a} />)}
      <Credit role="原作" nom="@random_japan_place" de={b(19)} a={b(27)} />
      <Credit role="舞台" nom="JAPAN · 150+ PLACES" de={b(28)} a={b(36)} />
      <Sources visible={surCarte} />
      <Eclairs liste={ECLAIRS} />
      <Fin de={T.fin} de2={T.allons} ombre={ROSE} />
      <Accroche />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={220} samples={8}>{image}</CameraMotionBlur> : image}
      <Son bgm={bgm} />
    </AbsoluteFill>
  );
};
