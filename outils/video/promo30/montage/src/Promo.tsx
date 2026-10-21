// La vidéo promo de 30 s (16:9) de la carte Random Japan Place, sur « Amenoshita2 » de PeriTune (CC BY 4.0) :
// le logo, la plongée en 3D, une fiche et sa vidéo, le dé, les favoris et leur route, les légendes, la mer et les
// saisons, puis Halloween (jusqu'au 31 octobre) et la fin. Les coupes tombent sur les temps de la musique (b(n)) ;
// une voix off féminine (Flora, ElevenLabs « Sarah ») ; un bruitage pour chaque geste et chaque clic.
// SHOTS est la seule source des temps : la voix et les bruitages s'y rapportent (S.x + décalage).
import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Ouverture, Plongee } from "./Debut";
import { FicheLieu, LeDe, Route, Vivant } from "./Fonctions";
import { Bascule, Chasse, Defile, Titre } from "./Halloween";
import { Fin } from "./Fin";
import { Grain, useFormat } from "./parts";
import { FicheLieuV, FinV, LeDeV, OuvertureV, PlongeeV, RouteV, VivantV } from "./Vertical";
import { b, DEBUT_MUSIQUE, DUREE, FPS } from "./theme";

export const LIEUX = 140; // le nombre de lieux de la carte le jour du tournage (le badge « Categories »)

// les plans : [début, durée], tous calés sur les temps de la musique
export const SHOTS = {
  ouverture: [0, 110], plongee: [b(0), b(12) - b(0)], fiche: [b(12), b(20) - b(12)], de: [b(20), b(24) - b(20)],
  route: [b(24), b(31) - b(24)], vivant: [b(31), b(40) - b(31)], bascule: [b(40), b(44) - b(40)], titre: [b(44), b(48) - b(44)],
  defile: [b(48), b(52) - b(48)], chasse: [b(52), b(56) - b(52)], fin: [b(56), DUREE - b(56)],
} as const;
const S = Object.fromEntries(Object.entries(SHOTS).map(([k, v]) => [k, v[0]])) as Record<keyof typeof SHOTS, number>;

// la voix off (voix/court/<nom>.wav, voix.py) : [nom, image]
export const VOIX: [string, number][] = [
  ["v1-reve", 6], ["v2-carte", S.plongee + 5], ["v3-video", S.fiche + 26], ["v5-route", S.route + 12],
  ["v6-legendes", S.vivant + 3], ["v7-halloween", S.bascule - 17], ["v8-defile", S.defile + 8], ["v9-fin", S.fin + 1],
];
const DUREES_VOIX: Record<string, number> = {
  "v1-reve": 88, "v2-carte": 168, "v3-video": 55, "v5-route": 69, "v6-legendes": 88, "v7-halloween": 111, "v8-defile": 93, "v9-fin": 77,
};

// les bruitages (sfx/) : { a: image du pic voulu, src, volume, duree? } — le pic de chaque son est près de son début
type Bruit = { a: number; src: string; v: number; d?: number };
export const SFX: Bruit[] = [
  // l'ouverture : le cartouche se pose, le sceau frappe, la montée jusqu'au retour de la musique, le tambour
  { a: 9, src: "paper-slide", v: 0.5 },
  { a: 58, src: "tampon", v: 1.6 },
  { a: S.plongee - 75, src: "montee", v: 0.65 },
  { a: S.plongee - 5, src: "whoosh-fast", v: 0.5 },
  { a: S.plongee, src: "taiko", v: 0.9 },
  // la plongée : les trois mots, le compteur qui se cale, le trait rouge sous « 3D map »
  { a: S.plongee + 3, src: "swoosh-quick", v: 0.45 },
  { a: S.plongee + 51, src: "swoosh-quick", v: 0.42 },
  { a: S.plongee + 36, src: "sparkle-touch", v: 0.5 },
  { a: S.plongee + 101, src: "swoosh-quick", v: 0.42 },
  { a: S.plongee + 114, src: "pinceau", v: 2.6 },
  // la fiche : le clic sur l'épingle, la fiche qui vole et se pose, le clic sur la vidéo, la vidéo qui s'allume
  { a: S.fiche, src: "whoosh-fast", v: 0.5 },
  { a: S.fiche + 24, src: "switch-click-quick", v: 0.85 },
  { a: S.fiche + 27, src: "paper-move-quick", v: 0.6 },
  { a: S.fiche + 43, src: "transition-snap", v: 0.5 },
  { a: S.fiche + 57, src: "switch-click-quick", v: 0.75 },
  { a: S.fiche + 59, src: "shimmer-sparkle-sweep", v: 0.32 },
  // le dé : le clic, le dé qui roule, la caméra qui file, la fiche qui se retourne et se pose
  { a: S.de + 2, src: "switch-click-quick", v: 0.85 },
  { a: S.de + 4, src: "de", v: 1.3 },
  { a: S.de + 5, src: "whoosh-swirl", v: 0.4 },
  { a: S.de + 26, src: "sparkle-poof-hit", v: 0.45 },
  { a: S.de + 40, src: "transition-snap", v: 0.45 },
  // la route : quatre cœurs (de plus en plus doux), le panneau qui glisse, le pinceau qui trace, les temps qui se posent
  { a: S.route + 1, src: "sparkle-touch", v: 0.5 },
  { a: S.route + 13, src: "sparkle-touch", v: 0.44 },
  { a: S.route + 26, src: "sparkle-touch", v: 0.38 },
  { a: S.route + 39, src: "sparkle-touch", v: 0.32 },
  { a: S.route + 9, src: "paper-slide", v: 0.6 },
  { a: S.route + 41, src: "pinceau", v: 3.0 },
  { a: S.route + 59, src: "transition-snap", v: 0.28 },
  { a: S.route + 65, src: "transition-snap", v: 0.25 },
  { a: S.route + 81, src: "transition-snap", v: 0.3 },
  // vivant : la légende (la carte qui se déroule, le sceau 伝説), la mer, les quatre saisons et leur sceau rouge
  { a: S.vivant, src: "whoosh-fast", v: 0.5 },
  { a: S.vivant + 13, src: "carte", v: 0.8 },
  { a: S.vivant + 20, src: "tampon", v: 1.4 },
  { a: S.vivant + 51, src: "whoosh-fast", v: 0.5 },
  { a: S.vivant + 53, src: "wind-woosh-throw", v: 0.35 },
  { a: S.vivant + 76, src: "whoosh-swirl", v: 0.5 },
  { a: S.vivant + 81, src: "sparkle-touch", v: 0.4 },
  { a: S.vivant + 85, src: "sparkle-touch", v: 0.34 },
  { a: S.vivant + 89, src: "sparkle-touch", v: 0.3 },
  { a: S.vivant + 93, src: "sparkle-touch", v: 0.26 },
  { a: S.vivant + 92, src: "tampon", v: 1.0 },
  // Halloween : la bascule (l'éclair, le tonnerre, le vent), le titre qui tombe, les coupes, le défilé, la chasse
  { a: S.bascule, src: "whoosh-fast", v: 0.45 },
  { a: S.bascule + 12, src: "tonnerre", v: 1.0 },
  { a: S.bascule + 6, src: "vent", v: 0.3, d: S.fin - S.bascule - 6 },
  { a: S.titre + 4, src: "impact-epic-trailer", v: 0.75 },
  { a: S.titre + 4, src: "taiko", v: 0.6 },
  { a: S.titre + 13, src: "swoosh-quick", v: 0.35 },
  { a: S.titre + 25, src: "swoosh-quick", v: 0.32 },
  { a: S.titre + 38, src: "wing-flutter", v: 3.0, d: 30 },
  { a: S.defile, src: "whoosh-fast", v: 0.45 },
  { a: S.defile + 2, src: "tampon", v: 1.0 },
  { a: S.defile + 25, src: "swoosh-quick", v: 0.4 },
  { a: S.defile + 27, src: "tampon", v: 0.9 },
  { a: S.chasse, src: "whoosh-fast", v: 0.45 },
  { a: S.chasse + 21, src: "switch-click-quick", v: 0.8 },
  { a: S.chasse + 26, src: "sparkle-poof-hit", v: 0.55 },
  { a: S.chasse + 34, src: "shimmer-sparkle-sweep", v: 0.35 },
  // la fin : la montée, les éléments qui volent, le logo qui frappe (tambour, sceau, impact), le ruban, l'éclat
  { a: S.fin + 20 - 75, src: "montee", v: 0.55 },
  { a: S.fin + 2, src: "air-whoosh-powerful", v: 0.5 },
  { a: S.fin + 8, src: "stardust-swish", v: 0.35 },
  { a: S.fin + 20, src: "impact-deep-whoosh", v: 0.75 },
  { a: S.fin + 20, src: "taiko", v: 0.7 },
  { a: S.fin + 20, src: "tampon", v: 1.3 },
  { a: S.fin + 37, src: "light-spell", v: 0.32, d: 40 },
  { a: S.fin + 44, src: "sparkle-touch", v: 0.4 },
];

// l'encodage AAC décale la piste d'environ une image : tout le son part une image plus tôt (sound-design §4.6)
const AVANCE = 1;
// le mélange (mesuré sur le rendu) : la musique ~3 dB sous le niveau de la voix entre les répliques, ~10 dB sous elle
// quand elle parle ; on baisse la voix et les bruitages plutôt que de pousser la musique (elle saturerait), finir.py
// remet le tout à −14 LUFS. (La première version : musique 20 dB sous la voix, presque inaudible.)
const VOLUME_VOIX = 0.35;
const VOLUME_SFX = 0.32;
const VOLUME_MUSIQUE = 1.0;
const BAISSE_SOUS_VOIX = 0.5;

export const Promo: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  // en vertical (TikTok), les scènes qui changent de mise en page ont leur version (Vertical.tsx) ; Halloween suit le format
  const { v } = useFormat();
  const [O, P, Fi, D, R, V, Fn] = v ? [OuvertureV, PlongeeV, FicheLieuV, LeDeV, RouteV, VivantV, FinV] : [Ouverture, Plongee, FicheLieu, LeDe, Route, Vivant, Fin];
  const sous = (f: number) =>
    Math.max(0, ...VOIX.map(([n, a]) => Math.min(interpolate(f, [a - 6, a], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), interpolate(f, [a + DUREES_VOIX[n], a + DUREES_VOIX[n] + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))));
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence durationInFrames={SHOTS.ouverture[1]} name="Ouverture"><O /></Sequence>
      <Sequence from={S.plongee} durationInFrames={SHOTS.plongee[1]} name="Plongée"><P lieux={LIEUX} /></Sequence>
      <Sequence from={S.fiche} durationInFrames={SHOTS.fiche[1]} name="Fiche"><Fi /></Sequence>
      <Sequence from={S.de} durationInFrames={SHOTS.de[1]} name="Dé"><D /></Sequence>
      <Sequence from={S.route} durationInFrames={SHOTS.route[1]} name="Route"><R /></Sequence>
      <Sequence from={S.vivant} durationInFrames={SHOTS.vivant[1]} name="Vivant"><V /></Sequence>
      <Sequence from={S.bascule} durationInFrames={SHOTS.bascule[1]} name="Bascule"><Bascule /></Sequence>
      <Sequence from={S.titre} durationInFrames={SHOTS.titre[1]} name="Halloween"><Titre /></Sequence>
      <Sequence from={S.defile} durationInFrames={SHOTS.defile[1]} name="Défilé"><Defile /></Sequence>
      <Sequence from={S.chasse} durationInFrames={SHOTS.chasse[1]} name="Chasse"><Chasse /></Sequence>
      <Sequence from={S.fin} durationInFrames={SHOTS.fin[1]} name="Fin"><Fn credit={bgm ? "♪ Amenoshita2 · PeriTune (CC BY 4.0)" : undefined} /></Sequence>
      <Grain force={0.7} />

      {bgm ? (
        <Audio
          src={staticFile("musique/peritune-amenoshita2.m4a")} trimBefore={Math.round(DEBUT_MUSIQUE * FPS) + AVANCE}
          volume={(f) => VOLUME_MUSIQUE * (1 - BAISSE_SOUS_VOIX * sous(f)) * interpolate(f, [0, 3, DUREE - 22, DUREE], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      ) : null}
      {VOIX.map(([nom, a]) => (
        <Sequence key={nom} from={a - AVANCE} layout="none"><Audio src={staticFile(`voix/court/${nom}.wav`)} volume={VOLUME_VOIX} /></Sequence>
      ))}
      {SFX.map((s, i) => (
        <Sequence key={i} from={Math.max(0, s.a - AVANCE)} durationInFrames={s.d ?? 90} layout="none">
          <Audio src={staticFile(`sfx/${s.src}.mp3`)} volume={s.v * VOLUME_SFX} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
