// Ce que les trois vidéos d'Halloween ont en commun : polices, couleurs, les rushes de la carte (recadrables),
// la carte-photo des vidéos du propriétaire, les titres, l'éclair, le grain, les crédits et la fin.
import React from "react";
import {
  AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import { loadFont as zen } from "@remotion/google-fonts/ZenAntique";
import { loadFont as fell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as noto } from "@remotion/google-fonts/NotoSans";

export const TITRE = zen("normal", { weights: ["400"], subsets: ["latin", "japanese"] }).fontFamily;
export const FELL = fell("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const SANS = noto("normal", { weights: ["400", "700", "900"], subsets: ["latin"] }).fontFamily;

export const FPS = 30;
export const L = 1920;
export const H = 1080;
export const C = {
  papier: "#efe4c8", clair: "#f6eedb", encre: "#2c1e14", rouge: "#a8321f",
  citrouille: "#e8792a", orange: "#ff9b3d", violet: "#8a4fc0", nuit: "#0d0e16",
};
export const im = (s: number) => Math.round(s * FPS);
const borne = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const de = (f: number, a: number, b: number, sortie = [0, 1], easing = Easing.bezier(0.16, 1, 0.3, 1)) =>
  interpolate(f, [a, b], sortie, { ...borne, easing });

/** Une ombre de texte lisible sur la carte de nuit comme sur une vidéo claire. */
export const OMBRE = "0 2px 0 rgba(0,0,0,.55), 0 0 18px rgba(0,0,0,.75), 0 0 42px rgba(0,0,0,.55)";

/**
 * Un rush de la carte (videos/halloween/public/rushes). debut : instant du rush (s) au début du plan ;
 * vitesse ; cadre(f) : la partie du rush montrée, [x, y, largeur] en px du rush (la hauteur suit le 16:9).
 */
export const Rush: React.FC<{
  nom: string; debut?: number; vitesse?: number; taille?: [number, number];
  cadre?: (f: number) => [number, number, number]; filtre?: string; style?: React.CSSProperties;
}> = ({ nom, debut = 0, vitesse = 1, taille = [L, H], cadre, filtre, style }) => {
  const f = useCurrentFrame();
  const [x, y, l] = cadre ? cadre(f) : [0, 0, taille[0]];
  const k = L / l;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.nuit, ...style }}>
      <Video
        src={staticFile(`rushes/${nom}.mp4`)}
        trimBefore={Math.round(debut * FPS)}
        playbackRate={vitesse}
        muted
        style={{
          position: "absolute", left: -x * k, top: -y * k, width: taille[0] * k, height: taille[1] * k,
          maxWidth: "none", filter: filtre,
        }}
      />
    </AbsoluteFill>
  );
};

/** Une vidéo du propriétaire (9:16) en plein cadre 16:9 : la bande du milieu, un peu plus sombre et froide. */
export const ClipPlein: React.FC<{ nom: string; debut?: number; vitesse?: number; y?: number; zoom?: [number, number]; filtre?: string }> = ({
  nom, debut = 0, vitesse = 1, y = 50, zoom = [1, 1.08], filtre = "saturate(.65) contrast(1.15) brightness(.72) hue-rotate(-10deg)",
}) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <Video
        src={staticFile(`clips/${nom}.mp4`)}
        trimBefore={Math.round(debut * FPS)}
        playbackRate={vitesse}
        muted
        objectFit="cover"
        style={{
          width: "100%", height: "100%", objectPosition: `50% ${y}%`, filter: filtre,
          scale: interpolate(f, [0, durationInFrames], zoom, borne),
        }}
      />
    </AbsoluteFill>
  );
};

/** La carte-photo : une vidéo du propriétaire dans un cadre de papier, qui entre en tournant (à droite). */
export const CartePhoto: React.FC<{ nom: string; debut?: number; vitesse?: number; penche?: number; legende?: string; x?: number }> = ({
  nom, debut = 0, vitesse = 1, penche = 3, legende, x = 1260,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: f - 2, fps, config: { damping: 14, stiffness: 120, mass: 0.8 } });
  return (
    <div
      style={{
        position: "absolute", left: x, top: 84, width: 480, padding: "16px 16px 0", backgroundColor: "#f3ead4",
        border: "1px solid #8a6b45", boxShadow: "0 30px 60px rgba(0,0,0,.6), 0 4px 10px rgba(0,0,0,.4)",
        translate: `${interpolate(e, [0, 1], [760, 0])}px ${interpolate(e, [0, 1], [60, 0])}px`,
        rotate: `${interpolate(e, [0, 1], [penche + 14, penche])}deg`,
        transformOrigin: "50% 100%",
      }}
    >
      <div style={{ width: 448, height: 796, overflow: "hidden", outline: "1.5px solid #35251a", position: "relative", backgroundColor: "#111" }}>
        <Video
          src={staticFile(`clips/${nom}.mp4`)}
          trimBefore={Math.round(debut * FPS)}
          playbackRate={vitesse}
          muted
          objectFit="cover"
          style={{ width: "100%", height: "100%", filter: "saturate(.75) contrast(1.12) brightness(.82) hue-rotate(-6deg)" }}
        />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 45%, transparent 55%, rgba(10,6,20,.55))" }} />
      </div>
      <div style={{ height: 58, display: "flex", alignItems: "center", justifyContent: "center", font: `italic 400 30px ${FELL}`, color: C.encre }}>
        {legende}
      </div>
    </div>
  );
};

/** L'étiquette d'un lieu : son numéro (orange, cerné), son nom et une phrase, en bas à gauche. */
export const Etiquette: React.FC<{ n: number; nom: string; ou: string; phrase: string }> = ({ n, nom, ou, phrase }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 3, fps, config: { damping: 11, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", left: 96, bottom: 110, width: 1080 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
        <div
          style={{
            font: `400 210px/0.8 ${TITRE}`, color: C.orange, WebkitTextStroke: `3px ${C.encre}`,
            textShadow: "0 6px 0 rgba(0,0,0,.45), 0 0 40px rgba(255,140,40,.55)",
            scale: interpolate(pop, [0, 1], [2.4, 1]), opacity: interpolate(pop, [0, 0.2], [0, 1], borne),
          }}
        >
          {n}
        </div>
        <div style={{ paddingBottom: 14 }}>
          <div style={{ font: `400 80px/1 ${TITRE}`, color: C.clair, textShadow: OMBRE, clipPath: `inset(-40px ${de(f, 6, 22, [100, 0])}% -40px -40px)` }}>
            {nom}
          </div>
          <div style={{ marginTop: 10, font: `italic 400 40px/1.1 ${FELL}`, color: "#e9d9b4", textShadow: OMBRE, opacity: de(f, 14, 24) }}>
            {ou}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 22, display: "inline-block", padding: "12px 22px 14px", backgroundColor: "rgba(12,10,18,.72)",
          borderLeft: `6px solid ${C.orange}`, font: `700 44px/1.2 ${SANS}`, color: "#fff",
          translate: `${de(f, 20, 32, [-40, 0])}px 0`, opacity: de(f, 20, 30),
        }}
      >
        {phrase}
      </div>
    </div>
  );
};

/** Un éclair : quelques flashs bleutés (un orage), sur `duree` images. */
export const Eclair: React.FC<{ duree?: number; force?: number }> = ({ duree = 10, force = 1 }) => {
  const f = useCurrentFrame();
  const motif = [0.95, 0.25, 0.8, 0.1, 0.45, 0.05, 0, 0, 0, 0];
  const v = (motif[Math.min(motif.length - 1, Math.floor((f / duree) * motif.length))] ?? 0) * force;
  return <AbsoluteFill style={{ backgroundColor: "#dfe8ff", opacity: f < duree ? v : 0, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

/** Un flash blanc bref (coupe franche). */
export const Flash: React.FC<{ duree?: number; force?: number }> = ({ duree = 6, force = 0.8 }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ backgroundColor: "#fff", opacity: de(f, 0, duree, [force, 0]) }} />;
};

/** Vignette sombre et grain de film (le grain change toutes les deux images). */
export const Ambiance: React.FC<{ force?: number }> = ({ force = 1 }) => {
  const f = useCurrentFrame();
  const graine = Math.floor(f / 2) % 50;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 75% at 50% 50%, transparent 58%, rgba(6,4,14,${0.6 * force}))` }} />
      <svg width={L} height={H} style={{ position: "absolute", inset: 0, opacity: 0.12 * force, mixBlendMode: "overlay" }}>
        <filter id={`grain${graine}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={graine} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain${graine})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Les sources de la carte, toujours visibles sur ses images (licences d'OpenStreetMap et de Mapterhorn). */
export const SourcesCarte: React.FC = () => (
  <div style={{ position: "absolute", right: 26, bottom: 18, font: `400 19px ${SANS}`, color: "rgba(255,255,255,.62)", textShadow: "0 1px 3px rgba(0,0,0,.8)" }}>
    © OpenStreetMap · Mapterhorn · Natural Earth
  </div>
);

/** Un gros titre en deux temps (une ligne puis l'autre), au centre. */
export const GrosTitre: React.FC<{ haut?: string; titre: React.ReactNode; bas?: string; couleurBas?: string; y?: number; taille?: number }> = ({
  haut, titre, bas, couleurBas = C.orange, y = 0, taille = 124,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f, fps, config: { damping: 16, stiffness: 190 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", translate: `0 ${y}px` }}>
      {haut ? (
        <div style={{ font: `900 46px/1 ${SANS}`, letterSpacing: ".18em", color: C.orange, textShadow: OMBRE, marginBottom: 22 }}>
          {haut}
        </div>
      ) : null}
      <div style={{ font: `400 ${taille}px/1.02 ${TITRE}`, color: C.clair, textShadow: OMBRE, maxWidth: 1600, scale: interpolate(p, [0, 1], [1.12, 1]) }}>
        {titre}
      </div>
      {bas ? (
        <div style={{ marginTop: 26, font: `italic 400 58px/1.1 ${FELL}`, color: couleurBas, textShadow: OMBRE, opacity: de(f, 14, 24), translate: `0 ${de(f, 14, 26, [24, 0])}px` }}>
          {bas}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Un bruitage (videos/halloween/public/sfx) à un instant du plan. */
export const Son: React.FC<{ nom: string; a: number; volume?: number }> = ({ nom, a, volume = 0.7 }) => (
  <Sequence from={a} layout="none">
    <Audio src={staticFile(`sfx/${nom}.mp3`)} volume={volume} />
  </Sequence>
);

/** Une réplique du conteur (voix off générée avec Flora, resserrée : voix.py), à un instant du plan. */
export const Voix: React.FC<{ nom: string; a: number; volume?: number }> = ({ nom, a, volume = 1 }) => (
  <Sequence from={a} layout="none">
    <Audio src={staticFile(`voix/court/${nom}.wav`)} volume={volume} />
  </Sequence>
);

/** Une nappe sonore (le vent, des murmures : voix/<nom>.mp3), sur toute la vidéo, en fondu. */
export const Nappe: React.FC<{ nom: string; fin: number; volume?: number }> = ({ nom, fin, volume = 0.3 }) => (
  <Audio src={staticFile(`voix/${nom}.mp3`)} loop volume={(f) => volume * interpolate(f, [0, 10, fin - 20, fin], [0, 1, 1, 0], borne)} />
);

/** La musique (CC BY), depuis `debut` s du morceau, en fondu à la fin. */
export const Musique: React.FC<{ nom: string; debut?: number; volume?: number; fin: number; baisses?: [number, number][] }> = ({
  nom, debut = 0, volume = 0.8, fin, baisses = [],
}) => (
  <Audio
    src={staticFile(`musique/${nom}.m4a`)}
    trimBefore={Math.round(debut * FPS)}
    volume={(f) => {
      // plus bas pendant que le conteur parle (baisses : [début, fin] en images), en fondu de 6 images
      const sous = Math.max(0, ...baisses.map(([a, z]) => Math.min(interpolate(f, [a - 6, a], [0, 1], borne), interpolate(f, [z, z + 6], [1, 0], borne))));
      return volume * (1 - 0.5 * sous) * interpolate(f, [0, 4, fin - 24, fin], [0, 1, 1, 0], borne);
    }}
  />
);

/** La fin : un voile, le logo, le nom de la carte, l'adresse sur un ruban rouge, « lien en bio ». */
export const Fin: React.FC<{ accroche: string; sous?: string; credit?: string }> = ({ accroche, sous, credit }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ruban = spring({ frame: f - 14, fps, config: { damping: 12, stiffness: 140 } });
  const montee = (a: number) => ({ opacity: de(f, a, a + 10), translate: `0 ${de(f, a, a + 14, [26, 0])}px` });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(8,6,16,.78), rgba(8,6,16,.45) 70%, rgba(8,6,16,.7))", opacity: de(f, 0, 10) }} />
      <div style={{ position: "relative" }}>
        <Img src={staticFile("img/logo.jpg")} style={{ width: 132, height: 132, borderRadius: "50%", border: `3px solid ${C.papier}`, boxShadow: "0 0 0 6px rgba(232,121,42,.6), 0 10px 30px rgba(0,0,0,.6)", ...montee(0) }} />
        <div style={{ marginTop: 18, font: `400 84px/1.05 ${TITRE}`, color: C.clair, textShadow: OMBRE, ...montee(4) }}>{accroche}</div>
        {sous ? <div style={{ marginTop: 10, font: `italic 400 50px/1.15 ${FELL}`, color: C.orange, textShadow: OMBRE, ...montee(9) }}>{sous}</div> : null}
        <div style={{ marginTop: 34, display: "inline-block", opacity: interpolate(ruban, [0, 0.2], [0, 1], borne), scale: `${interpolate(ruban, [0, 1], [0.3, 1])} 1` }}>
          <div
            style={{
              padding: "22px 66px 24px", backgroundColor: C.rouge, color: C.clair, font: `700 50px/1 ${SANS}`,
              clipPath: "polygon(0 0, 100% 0, calc(100% - 24px) 50%, 100% 100%, 0 100%, 24px 50%)",
            }}
          >
            map.randomjapanplace.com
          </div>
        </div>
        <div style={{ marginTop: 22, font: `700 40px/1.2 ${SANS}`, color: "#fff", textShadow: OMBRE, ...montee(22) }}>
          Free · in 3D · link in <span style={{ color: C.orange }}>bio</span> ↗
        </div>
        {credit ? <div style={{ marginTop: 26, font: `400 22px ${SANS}`, color: "rgba(255,255,255,.7)", ...montee(26) }}>{credit}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

/** Une coupe rapide : l'image d'avant glisse et se brouille (un « whip ») — posée par-dessus la coupe. */
export const Glisse: React.FC<{ children: React.ReactNode; sortie?: number; duree: number }> = ({ children, sortie = 6, duree }) => {
  const f = useCurrentFrame();
  const fin = duree - sortie;
  return (
    <AbsoluteFill
      style={{
        translate: `${interpolate(f, [fin, duree], [0, -260], { ...borne, easing: Easing.in(Easing.cubic) })}px 0`,
        filter: `blur(${interpolate(f, [fin, duree], [0, 26], borne)}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
