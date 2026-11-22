// Le hook de la vidéo 2 (image 0 → temps 18) : l'héroïne d'animé (les rushes du propriétaire redessinés par FLUX : une jeune femme,
// longs cheveux bruns, chapeau de paille à ruban rose) fixe l'objectif dès l'image 0 sous « IF MY JAPAN MAP HAD AN ANIME OPENING 2 »,
// des pétales de cerisier passent ; elle arme et tranche vers l'objectif (fille-coupe) : sur la lame, l'image se fend en deux, et de
// l'autre côté elle est de dos, se retourne, sourit et tend son téléphone, la vraie carte dedans (fille-flux, posée par ecran.py) ; la
// caméra plonge dans l'écran et atterrit sur le plan de la carte quand la voix entre (« 地図を広げて »).
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, entre, expoEntree, expoSortie, FPS, hasard, POLICE, rebond } from "../theme";
import { Eclairs, Vitesse } from "../Commun";
import { T } from "./temps";

export const ROSE = "#ff4f8b";
export const AVANT_CARTE = 10;

const Video: React.FC<{ src: string; t0?: number; style?: React.CSSProperties }> = ({ src, t0 = 0, style }) => (
  <OffthreadVideo src={staticFile(src)} muted trimBefore={Math.round(t0 * FPS)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }} />
);

// fille-coupe : sa lame traverse l'objectif à sa seconde 2,04 (son image 49 à 24/s), en diagonale ; elle arrive pile sur la coupe
const LAME = 2.04;
const DEBUT = LAME - T.coupe / FPS;
// la ligne de la lame (px de la vidéo), du bas à gauche au haut à droite
const A: [number, number] = [-150, 1977], B: [number, number] = [1280, 497];
const DUREE_FENTE = 20;
const TENUE = 3;

/** Le texte du hook, dès l'image 0 (c'est aussi la couverture). */
const Texte: React.FC = () => {
  const f = useCurrentFrame();
  const fin = T.coupe + 75;
  if (f >= fin + 8) return null;
  const sortie = expoEntree(entre(f, fin, fin + 8));
  const coup = f >= T.coupe ? 1 - rebond(f, T.coupe, 500, 20) : 0;
  return (
    <div style={{
      position: "absolute", left: 40, right: 40, top: 236, zIndex: 120, display: "flex", flexDirection: "column", alignItems: "center",
      transform: `translateY(${(-40 * sortie).toFixed(1)}px) rotate(${(-3 + 4 * coup).toFixed(2)}deg) scale(${(1 + 0.08 * coup).toFixed(3)})`, opacity: 1 - sortie,
    }}>
      {["IF MY *JAPAN MAP*", "HAD AN *ANIME*", "OPENING 2 🌸"].map((l, i) => (
        <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 92, lineHeight: 1.06, whiteSpace: "nowrap", letterSpacing: -1 }}>
          {l.split("*").map((m, j) => j % 2
            ? <span key={j} style={{ background: C.rouge, color: "#fff", padding: "0 16px", borderRadius: 14, border: `7px solid ${C.encre}`, boxShadow: `5px 7px 0 ${C.encre}`, display: "inline-block", transform: "rotate(-2deg)", margin: "4px 4px" }}>{m}</span>
            : <span key={j} style={{ color: "#fff", WebkitTextStroke: `13px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 24px rgba(0,0,0,.5)" }}>{m}</span>)}
        </div>
      ))}
    </div>
  );
};

/** Des pétales de cerisier qui tombent en tournoyant (fixés par hasard(i) : les mêmes à chaque rendu). */
export const Petales: React.FC<{ de: number; a: number; n?: number; z?: number; force?: number }> = ({ de, a, n = 26, z = 115, force = 1 }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const op = Math.min(entre(f, de, de + 6), 1 - entre(f, a - 10, a)) * force;
  const g = f - de;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, zIndex: z, opacity: op, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="petale" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff6f9" />
          <stop offset="60%" stopColor="#ffc3d5" />
          <stop offset="100%" stopColor="#ff8fb2" />
        </radialGradient>
      </defs>
      {Array.from({ length: n }, (_, i) => {
        const taille = 16 + 22 * hasard(i, 1);
        const vy = 3.2 + 3.5 * hasard(i, 2), vx = -1.2 - 1.6 * hasard(i, 3);
        const y = ((hasard(i, 4) * 2100 + g * vy) % 2100) - 100;
        const x = ((hasard(i, 5) * 1300 + g * vx + 40 * Math.sin(g / (14 + 10 * hasard(i, 6)) + 6 * hasard(i, 7))) % 1300 + 1300) % 1300 - 110;
        const rot = hasard(i, 8) * 360 + g * (3 + 4 * hasard(i, 9));
        const ecrase = 0.35 + 0.65 * Math.abs(Math.cos(g / (9 + 8 * hasard(i, 10)) + hasard(i, 11) * 6));
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(taille / 20).toFixed(3)} ${(ecrase * taille / 20).toFixed(3)})`}>
            {/* un pétale : une goutte fendue au bout */}
            <path d="M0,-14 C9,-10 11,4 3,13 L0,10 L-3,13 C-11,4 -9,-10 0,-14 Z" fill="url(#petale)" opacity={0.92} />
          </g>
        );
      })}
    </svg>
  );
};

/** L'image se fend le long de la lame : les deux moitiés (l'image de la lame, figée) s'écartent ; de l'autre côté, elle est de dos. */
const Fente: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.coupe || f >= T.coupe + DUREE_FENTE) return null;
  const u = expoSortie(entre(f, T.coupe + TENUE, T.coupe + DUREE_FENTE)) ** 1.6;
  const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy);
  const nx = -dy / l, ny = dx / l;
  const ecart = 900 * u;
  const moitie = (cote: 1 | -1) => {
    const poly = cote === 1 ? `${A[0]}px ${A[1]}px, ${B[0]}px ${B[1]}px, 1400px 2400px, -400px 2400px` : `${A[0]}px ${A[1]}px, ${B[0]}px ${B[1]}px, 1400px -600px, -400px -600px`;
    return (
      <AbsoluteFill style={{ clipPath: `polygon(${poly})`, transform: `translate(${(cote * nx * ecart).toFixed(1)}px, ${(cote * ny * ecart).toFixed(1)}px) rotate(${(cote * 4 * u).toFixed(2)}deg)` }}>
        <Freeze frame={0}><Video src="clips/fille-coupe.mp4" t0={LAME} /></Freeze>
      </AbsoluteFill>
    );
  };
  return (
    <AbsoluteFill style={{ zIndex: 110 }}>
      {moitie(1)}
      {moitie(-1)}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - entre(f, T.coupe + 3, T.coupe + DUREE_FENTE) }}>
        <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke="#fff" strokeWidth={34 * (1 - u) + 6} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 26px #fff) drop-shadow(0 0 60px ${ROSE})` }} />
      </svg>
    </AbsoluteFill>
  );
};

export const Accroche: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= T.carte + 2) return null;
  // son regard : la caméra s'approche à peine, jusqu'au coup
  const approche = 1 + 0.06 * entre(f, 0, T.coupe);
  return (
    <AbsoluteFill style={{ zIndex: 100 }}>
      {f < T.coupe && (
        <AbsoluteFill style={{ transform: `scale(${approche.toFixed(4)})`, transformOrigin: "45% 30%" }}>
          <Video src="clips/fille-coupe.mp4" t0={DEBUT} />
        </AbsoluteFill>
      )}
      {/* elle, de dos, qui se retourne et tend le téléphone (la plongée et l'atterrissage sur la carte sont dans le plan lui-même) */}
      {f >= T.coupe && (
        <Sequence from={T.coupe} layout="none">
          <AbsoluteFill style={{ opacity: 1 - entre(f, T.carte - 3, T.carte) }}>
            <Video src="clips/fille-flux.mp4" />
          </AbsoluteFill>
        </Sequence>
      )}
      <Fente />
      <Petales de={-6} a={T.coupe + 4} />
      <Vitesse de={T.coupe + 40} a={T.coupe + 70} cx={520} cy={640} rx={300} ry={420} force={0.55} z={105} />
      <Vitesse de={T.coupe + 92} a={T.carte - 6} cx={700} cy={900} rx={360} ry={560} force={0.7} z={105} />
      <Eclairs liste={[{ f: T.coupe, c: "#fff", d: 2 }, { f: T.coupe + 2, c: ROSE, d: 1, o: 0.6 }]} z={112} />
      <Texte />
    </AbsoluteFill>
  );
};
