// Le hook (image 0 → temps 8) : le vrai garçon au chapeau de paille dégaine son katana et tranche vers l'objectif (rush 4 du
// propriétaire, avant la chanson, dans le bruit de sa chambre) ; la lame passe devant l'objectif : l'image se fend en deux le long
// de la lame, la chanson démarre, et de l'autre côté il est devenu un héros d'animé (son rush 2 redessiné par FLUX), qui se
// retourne, sourit et tend son téléphone, la vraie carte dessus (posée image par image dans l'écran par ecran.py) ; la caméra entre
// dans l'écran, et la carte s'ouvre en grand sur « 地図を広げて ».
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, entre, expoEntree, expoSortie, FPS, POLICE, rebond } from "./theme";
import { T } from "./temps";
import { Eclairs, Vitesse } from "./Commun";

const Video: React.FC<{ src: string; t0?: number; style?: React.CSSProperties }> = ({ src, t0 = 0, style }) => (
  <OffthreadVideo src={staticFile(src)} muted trimBefore={Math.round(t0 * FPS)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }} />
);

// la coupe : la ligne de la lame (px de la vidéo), du bas à gauche au haut à droite, comme la lame du rush
const A: [number, number] = [-200, 1700], B: [number, number] = [1280, 520];
const DUREE_FENTE = 20;
const TENUE = 3; // (images) la ligne de la lame brille d'abord sur l'image figée, puis les moitiés s'écartent

/** Le texte du hook, dès l'image 0 (c'est aussi la couverture) : blanc cerné d'encre, « anime » sur la pastille rouge. */
const Texte: React.FC = () => {
  const f = useCurrentFrame();
  const fin = T.anime + 75;
  if (f >= fin + 8) return null;
  const sortie = expoEntree(entre(f, fin, fin + 8));
  const coup = f >= T.anime ? 1 - rebond(f, T.anime, 500, 20) : 0; // la coupe le secoue
  return (
    <div style={{
      position: "absolute", left: 40, right: 40, top: 236, zIndex: 120, display: "flex", flexDirection: "column", alignItems: "center",
      transform: `translateY(${(-40 * sortie).toFixed(1)}px) rotate(${(-3 + 4 * coup).toFixed(2)}deg) scale(${(1 + 0.08 * coup).toFixed(3)})`, opacity: 1 - sortie,
    }}>
      {["IF MY *JAPAN MAP*", "HAD AN *ANIME*", "OPENING ⚔️"].map((l, i) => (
        <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 92, lineHeight: 1.06, whiteSpace: "nowrap", letterSpacing: -1 }}>
          {l.split("*").map((m, j) => j % 2
            ? <span key={j} style={{ background: C.rouge, color: "#fff", padding: "0 16px", borderRadius: 14, border: `7px solid ${C.encre}`, boxShadow: `5px 7px 0 ${C.encre}`, display: "inline-block", transform: "rotate(-2deg)", margin: "4px 4px" }}>{m}</span>
            : <span key={j} style={{ color: "#fff", WebkitTextStroke: `13px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 24px rgba(0,0,0,.5)" }}>{m}</span>)}
        </div>
      ))}
    </div>
  );
};

/** L'image réelle se fend le long de la lame : les deux moitiés (la dernière image du rush, figée) s'écartent, l'animé est dessous. */
const Fente: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.anime || f >= T.anime + DUREE_FENTE) return null;
  const u = expoSortie(entre(f, T.anime + TENUE, T.anime + DUREE_FENTE)) ** 1.6;
  // la normale à la lame : les moitiés partent de chaque côté
  const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy);
  const nx = -dy / l, ny = dx / l;
  const ecart = 900 * u;
  const moitie = (cote: 1 | -1) => {
    // le polygone de ce côté de la ligne
    const poly = cote === 1 ? `${A[0]}px ${A[1]}px, ${B[0]}px ${B[1]}px, 1400px 2400px, -400px 2400px` : `${A[0]}px ${A[1]}px, ${B[0]}px ${B[1]}px, 1400px -600px, -400px -600px`;
    return (
      <AbsoluteFill style={{ clipPath: `polygon(${poly})`, transform: `translate(${(cote * nx * ecart).toFixed(1)}px, ${(cote * ny * ecart).toFixed(1)}px) rotate(${(cote * 4 * u).toFixed(2)}deg)` }}>
        <Freeze frame={0}><Video src="clips/vrai-coupe.mp4" t0={1.02} /></Freeze>
      </AbsoluteFill>
    );
  };
  return (
    <AbsoluteFill style={{ zIndex: 110 }}>
      {moitie(1)}
      {moitie(-1)}
      {/* la lumière de la lame, le long de la coupe */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - entre(f, T.anime + 3, T.anime + DUREE_FENTE) }}>
        <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke="#fff" strokeWidth={34 * (1 - u) + 6} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 26px #fff) drop-shadow(0 0 60px #9ff)" }} />
      </svg>
    </AbsoluteFill>
  );
};

/** Le passage dans l'écran du téléphone : la plongée est dans le plan animé lui-même (ecran.py fait atterrir la carte de l'écran
 *  sur le cadrage exact du plan de la carte à T.carte) ; Generique.tsx montre ce plan dessous à partir de T.carte - 10, et l'animé
 *  s'efface sur les trois dernières images. */
export const AVANT_CARTE = 10;

export const Accroche: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= T.carte + 2) return null;
  // l'animé : de T.anime jusqu'à la carte, à la vitesse du rush
  const coupe = f >= T.coupe ? 1 - rebond(f, T.coupe, 320, 20) : 0;
  return (
    <AbsoluteFill style={{ zIndex: 100 }}>
      {/* le vrai : il dégaine, puis il fixe l'objectif et tranche */}
      {f < T.coupe && <Sequence from={T.tire} durationInFrames={T.coupe - T.tire} layout="none"><Video src="clips/vrai-tire.mp4" /></Sequence>}
      {f >= T.coupe && f < T.anime && (
        <Sequence from={T.coupe} durationInFrames={T.anime - T.coupe} layout="none">
          <AbsoluteFill style={{ transform: `scale(${(1 + 0.1 * coupe).toFixed(4)})` }}><Video src="clips/vrai-coupe.mp4" /></AbsoluteFill>
        </Sequence>
      )}
      {/* l'animé */}
      {f >= T.anime && (
        <Sequence from={T.anime} layout="none">
          <AbsoluteFill style={{ opacity: 1 - entre(f, T.carte - 3, T.carte) }}>
            <Video src="clips/anime-flux.mp4" />
          </AbsoluteFill>
        </Sequence>
      )}
      <Fente />
      {/* les traits de vitesse quand il se retourne vers nous, puis quand il tend le téléphone */}
      <Vitesse de={T.anime + 40} a={T.anime + 70} cx={520} cy={640} rx={300} ry={420} force={0.55} z={105} />
      <Vitesse de={T.anime + 92} a={T.carte - 6} cx={700} cy={900} rx={360} ry={560} force={0.7} z={105} />
      <Eclairs liste={[{ f: T.anime, c: "#fff", d: 2 }, { f: T.anime + 2, c: C.rouge, d: 1, o: 0.6 }]} z={112} />
      <Texte />
    </AbsoluteFill>
  );
};
