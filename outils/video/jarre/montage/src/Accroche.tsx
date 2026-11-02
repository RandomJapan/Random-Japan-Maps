// L'accroche (0 → temps 12), sur le modèle de la vidéo du PSG que le propriétaire a montrée : à la première personne, un marteau
// tape sur une jarre enterrée, puis deux mains l'ouvrent, sans texte ni musique, avec seulement les bruits du geste. Au temps 12, la
// carte apparaît au fond du trou et on plonge dedans. Le propriétaire voulait un geste « plus humain » : les deux plans sont générés
// avec Flora (Seedance 2.0, à partir de leur seule première image) et joués à leur vitesse réelle, avec une coupe dans celui du marteau
// et le petit tremblement d'un téléphone (accélérés et calés sur les temps, ceux de la première version faisaient mécaniques).
import React from "react";
import { AbsoluteFill, Freeze, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { entre, FPS, secousse } from "./theme";
import { T, TROU } from "./temps";

// la seconde de chaque plan de Flora à chaque image : le marteau en deux morceaux (les trois premiers coups, puis, sans sa pause,
// le grand coup qui fend la jarre), les mains jusqu'à l'image où la jarre est grande ouverte (preparer.py : SECONDE_OUVERTE)
const secondeMarteau = (f: number) => (f < T.coupe ? 0.38 + f / FPS : 2.83 + (f - T.coupe) / FPS);
const secondeMains = (f: number) => interpolate(f, [T.mains, T.ouvre], [0.75, 3.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const DUREE_PLONGEE = 20; // images : on passe à travers le trou

/** Le tremblement de la main qui filme : plusieurs lentes oscillations sans rapport entre elles (px, degrés), jamais régulières. */
const tremblement = (f: number) => {
  const x = 5 * Math.sin(f / 41 + 0.3) + 3 * Math.sin(f / 17.3 + 2.1) + 1.2 * Math.sin(f / 7.1);
  const y = 4 * Math.sin(f / 37 + 1.2) + 2.4 * Math.sin(f / 15.1) + 1 * Math.sin(f / 6.3);
  const r = 0.32 * Math.sin(f / 53 + 0.7) + 0.12 * Math.sin(f / 19);
  return { x, y, r, z: 1.035 + 0.006 * Math.sin(f / 61) };
};

/** La jarre ouverte, son trou transparent : la caméra avance puis tombe dedans. */
const Plongee: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.ouvre || f >= T.ouvre + DUREE_PLONGEE) return null;
  const u = entre(f, T.ouvre, T.ouvre + DUREE_PLONGEE);
  const k = 1 + 0.2 * Math.min(1, u * 3) + 11 * u ** 4;
  return (
    <Img src={staticFile("img/jarre-ouverte.png")} style={{
      position: "absolute", inset: 0, width: 1080, height: 1920, transformOrigin: `${TROU[0]}px ${TROU[1]}px`, transform: `scale(${k.toFixed(4)})`,
    }} />
  );
};

export const Accroche: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= T.ouvre + DUREE_PLONGEE) return null;
  const { x, y, r, z } = tremblement(f);
  // à chaque coup, la tête bouge à peine
  const [sx, sy] = T.coups.reduce<[number, number]>((a, c, i) => {
    const [dx, dy] = secousse(f, c, i === T.coups.length - 1 ? 7 : 3.5, 0.2);
    return [a[0] + dx, a[1] + dy];
  }, [0, 0]);
  return (
    <AbsoluteFill style={{ transform: `translate(${(x + sx).toFixed(2)}px, ${(y + sy).toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${z.toFixed(4)})` }}>
      {f < T.mains && (
        // (la jarre de ce plan est petite : on se rapproche d'elle et du marteau)
        <AbsoluteFill style={{ transform: "scale(1.2)", transformOrigin: "47% 40%" }}>
          <Freeze frame={Math.round(secondeMarteau(f) * FPS)}>
            <OffthreadVideo src={staticFile("clips/jarre-marteau.mp4")} muted style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
          </Freeze>
        </AbsoluteFill>
      )}
      {f >= T.mains && f < T.ouvre && (
        <Freeze frame={Math.round(secondeMains(f) * FPS)}>
          <OffthreadVideo src={staticFile("clips/jarre-mains.mp4")} muted style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
        </Freeze>
      )}
      <Plongee />
    </AbsoluteFill>
  );
};
