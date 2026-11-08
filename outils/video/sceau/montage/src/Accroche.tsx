// L'accroche (0 → temps 12), sur le modèle des vidéos « jarre » et « éclat » (des vidéos du PSG) : à la première personne, un
// pouce casse le sceau de cire rouge 日本 d'une vieille lettre, puis les mains la déplient, sans texte ni musique, avec seulement les
// bruits du geste. Dedans, imprimée sur le papier, la carte du Japon ; au temps 12, on plonge dedans et elle devient la vraie carte
// (Carte.tsx). Les deux plans sont générés avec Flora (Seedance 2.0, à partir de leur seule première image) et joués à leur vitesse
// réelle (le second 8 % plus vite), avec le petit tremblement d'un téléphone (la leçon de la jarre : accélérés, ils faisaient mécaniques).
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { entre, expoSortie, FPS, secousse } from "./theme";
import { cadrePlongee, DUREE_PLONGEE, PAPIER, papierDansLaCarte, T } from "./temps";

// la seconde de chaque plan de Flora à chaque image : le sceau (le pouce appuie déjà ; la cire cède à 1,62 s du plan), puis la
// lettre, de son premier bruit de papier jusqu'à l'image où elle est à plat (3,75 s), où elle reste pendant la plongée
const secondeSceau = (f: number) => 0.45 + f / FPS;
const secondeLettre = (f: number) => Math.min(3.75, 0.15 + ((f - T.lettre) / FPS) * 1.08);

/** Le tremblement de la main qui filme : plusieurs lentes oscillations sans rapport entre elles (px, degrés), jamais régulières.
 *  (les plans de Seedance bougent déjà un peu : la moitié de celui de la jarre) */
const tremblement = (f: number) => {
  const x = 2.5 * Math.sin(f / 41 + 0.3) + 1.5 * Math.sin(f / 17.3 + 2.1) + 0.6 * Math.sin(f / 7.1);
  const y = 2 * Math.sin(f / 37 + 1.2) + 1.2 * Math.sin(f / 15.1) + 0.5 * Math.sin(f / 6.3);
  const r = 0.16 * Math.sin(f / 53 + 0.7) + 0.06 * Math.sin(f / 19);
  return { x, y, r, z: 1.03 + 0.004 * Math.sin(f / 61) };
};

export const Accroche: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= T.ouvre + DUREE_PLONGEE) return null;
  const g = Math.min(f, T.ouvre - 1); // (pendant la plongée, le tremblement et l'approche restent ceux de la dernière image)
  const { x, y, r, z } = tremblement(g);
  // quand la cire cède, la main tressaille à peine
  const [sx, sy] = secousse(f, T.craque, 4, 0.22);
  // les derniers temps, le téléphone s'approche un peu de la carte
  const approche = 1 + 0.05 * expoSortie(entre(g, T.ouvre - 40, T.ouvre - 1)) ** 2;
  const video = f < T.lettre
    ? <Freeze frame={Math.round(secondeSceau(f) * FPS)}><OffthreadVideo src={staticFile("clips/sceau-casse.mp4")} muted style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} /></Freeze>
    : <Freeze frame={Math.round(secondeLettre(f) * FPS)}><OffthreadVideo src={staticFile("clips/lettre-ouverte.mp4")} muted style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} /></Freeze>;
  const filme = (
    <AbsoluteFill style={{ transform: `translate(${(x + sx).toFixed(2)}px, ${(y + sy).toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${(z * approche).toFixed(4)})`, transformOrigin: `${PAPIER.x}px ${PAPIER.y}px` }}>
      {video}
    </AbsoluteFill>
  );
  if (f < T.ouvre) return filme;
  // la plongée : le papier part avec le cadre de la vraie carte (Carte.tsx prend le même), et s'efface
  const u = expoSortie(entre(f, T.ouvre, T.ouvre + DUREE_PLONGEE));
  const { origine, transform } = cadrePlongee(u);
  return (
    <AbsoluteFill style={{ transformOrigin: origine, transform, opacity: 1 - entre(f, T.ouvre + 3, T.ouvre + 13) }}>
      <AbsoluteFill style={{ transformOrigin: origine, transform: papierDansLaCarte() }}>{filme}</AbsoluteFill>
    </AbsoluteFill>
  );
};
