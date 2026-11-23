// Les pièces communes des vidéos du calendrier : un plan plein écran (une vidéo ou une image, avec un zoom de monteur), les bulles
// de texte natives de TikTok (reprises de la vidéo « le créateur », outils/video/jeu), le son (musique et bruitages).
import React from "react";
import { Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FPS, POLICE, s } from "./theme";

// une vidéo de l'image `de` à `a` ; t0 : sa seconde à l'image `de` ; v : sa vitesse ; zoom : (image) → [échelle, origine x, origine y]
export type Plan = { de: number; a: number; src: string; t0?: number; v?: number; img?: boolean; zoom?: (f: number) => [number, number, number] };

export const LePlan: React.FC<{ p: Plan; l?: number; h?: number }> = ({ p, l = 1080, h = 1920 }) => {
  const f = useCurrentFrame() + p.de;
  const [z, ox, oy] = p.zoom ? p.zoom(f) : [1, l / 2, h / 2];
  const plein: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: l, height: h, transform: `scale(${z.toFixed(5)})`, transformOrigin: `${ox}px ${oy}px` }}>
      {p.img
        ? <Img src={staticFile(p.src)} style={plein} />
        : <OffthreadVideo src={staticFile(p.src)} muted trimBefore={Math.round((p.t0 ?? 0) * FPS)} playbackRate={p.v ?? 1} style={plein} />}
    </div>
  );
};

export const Plans: React.FC<{ plans: Plan[]; l?: number; h?: number }> = ({ plans, l = 1080, h = 1920 }) => (
  <>
    {plans.map((p, i) => (
      <Sequence key={i} from={p.de} durationInFrames={p.a - p.de} layout="none">
        <div style={{ position: "absolute", left: 0, top: 0, width: l, height: h, overflow: "hidden" }}><LePlan p={p} l={l} h={h} /></div>
      </Sequence>
    ))}
  </>
);

/** Le texte natif de TikTok, avec son fond : des lignes noires sur des bulles blanches arrondies qui se touchent, au centre. Il
 *  apparaît d'un coup, comme dans l'appli. \n coupe la ligne. */
export const Bulle: React.FC<{ texte: string; de: number; a: number; y: number; taille?: number }> = ({ texte, de, a, y, taille = 62 }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 90 }}>
      {texte.split("\n").map((l, i) => (
        <div key={i} style={{
          fontFamily: POLICE, fontWeight: 700, fontSize: taille, lineHeight: 1.18, color: "#121212", background: "#fff",
          padding: `${taille * 0.16}px ${taille * 0.34}px`, borderRadius: taille * 0.3, textAlign: "center", whiteSpace: "nowrap",
          marginTop: i ? -taille * 0.12 : 0, letterSpacing: -0.3,
        }}>{l}</div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- le son
const AVANCE = 2; // l'AAC du MP4 retarde le son d'autant
/** [seconde, fichier de sfx/, volume, durée (s) : coupé et fondu au bout] */
export type Effet = [number, string, number, number?];

export const Son: React.FC<{ bgm: boolean; musique: string; volume: number | ((f: number) => number); effets: Effet[] }> = ({ bgm, musique, volume, effets }) => {
  const { durationInFrames: duree } = useVideoConfig();
  return (
    <>
      {bgm && <Audio src={staticFile(musique)} volume={volume} />}
      {effets.map(([a, nom, v, d], i) => (
        <Sequence key={i} from={Math.max(0, s(a) - AVANCE)} durationInFrames={Math.min(s(d ?? 3), duree)} layout="none">
          <Audio src={staticFile(`sfx/${nom}`)} volume={d === undefined ? v : (f) => v * interpolate(f, [s(d) - 12, s(d)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </Sequence>
      ))}
    </>
  );
};
