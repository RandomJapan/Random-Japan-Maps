// L'accroche (0 → temps 10), sur le modèle de la vidéo du PSG que le propriétaire a montrée : à la première personne, un marteau
// tape sur une jarre enterrée, puis deux mains gantées l'ouvrent, sans texte ni musique, avec seulement les bruits du geste. Au
// temps 10, les deux morceaux partent sur les côtés avec les mains : le Japon est dedans. Les deux plans sont générés avec Flora
// (MiniMax H3 Max, de leur première à leur dernière image) et joués image par image : chaque coup de marteau tombe sur un temps.
import React from "react";
import { AbsoluteFill, Freeze, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { entre, FPS, secousse, t } from "./theme";
import { T } from "./temps";

// [image de la vidéo, seconde du plan de Flora] : les coups du marteau sont à 1,0, 1,8, 2,47, 3,14 et 3,81 s de son plan
const CLES_MARTEAU: [number, number][] = [[0, 0.12], [t(1), 1.0], [t(2), 1.8], [t(3), 2.47], [t(4), 3.14], [t(5), 3.81], [t(5.5), 4.3]];
// la fente s'ouvre d'un coup au début du plan des mains, puis continue plus vite
const CLES_MAINS: [number, number][] = [[t(5.5), 0.3], [t(7.5), 1.7], [t(10), 4.4]];
const seconde = (f: number, cles: [number, number][]) => interpolate(f, cles.map((c) => c[0]), cles.map((c) => c[1]), { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const DUREE_OUVERTURE = 20; // images : les morceaux quittent l'image

/** Les deux morceaux (la dernière image du plan des mains, coupée le long de la fente) : ils partent sur les côtés, en
 *  tournant et en venant vers l'objectif (comme tirés par les mains). */
const Moities: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.ouvre || f >= T.ouvre + DUREE_OUVERTURE) return null;
  const u = entre(f, T.ouvre, T.ouvre + DUREE_OUVERTURE);
  const e = u * u * (3 - 2 * u) * (0.7 + 0.3 * u); // (un départ lourd, puis ils filent)
  const moitie = (cote: "gauche" | "droite") => {
    const signe = cote === "gauche" ? -1 : 1;
    return (
      <Img key={cote} src={staticFile(`img/moitie-${cote}.png`)} style={{
        position: "absolute", inset: 0, width: 1080, height: 1920,
        transform: `translateX(${(signe * 1050 * e).toFixed(1)}px) rotate(${(signe * 9 * e).toFixed(2)}deg) scale(${(1 + 0.32 * e).toFixed(4)})`,
        transformOrigin: `${cote === "gauche" ? 0 : 100}% 80%`,
      }} />
    );
  };
  return <AbsoluteFill>{moitie("gauche")}{moitie("droite")}</AbsoluteFill>;
};

export const Accroche: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= T.ouvre + DUREE_OUVERTURE) return null;
  // une petite secousse à chaque coup : la main tient le téléphone près de la jarre
  const [sx, sy] = T.coups.reduce<[number, number]>((a, c, i) => {
    const [x, y] = secousse(f, c, i === 4 ? 12 : 6, 0.22);
    return [a[0] + x, a[1] + y];
  }, [0, 0]);
  return (
    <AbsoluteFill>
      {f < T.mains && (
        <AbsoluteFill style={{ transform: `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(1.02)` }}>
          <Freeze frame={Math.round(seconde(f, CLES_MARTEAU) * FPS)}>
            <OffthreadVideo src={staticFile("clips/jarre-marteau.mp4")} muted style={{ width: 1080, height: 1920 }} />
          </Freeze>
        </AbsoluteFill>
      )}
      {f >= T.mains && f < T.ouvre && (
        <Freeze frame={Math.round(seconde(f, CLES_MAINS) * FPS)}>
          <OffthreadVideo src={staticFile("clips/jarre-mains.mp4")} muted style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
        </Freeze>
      )}
      <Moities />
    </AbsoluteFill>
  );
};
