// L'accroche (0 → temps 12), sur le modèle des vidéos « jarre » et « éclat » (des vidéos du PSG) : à la première personne, sur un
// bureau en désordre le soir, de la cire rouge fondue coule d'une cuillère sur le papier, un tampon s'y enfonce, tourne et se
// soulève ; dans la cire, le Japon en relief. Sans texte ni musique, avec seulement les bruits du geste. Au temps 12, on plonge dans
// le Japon de cire et il devient la vraie carte en relief (Carte.tsx). Les trois plans sont générés avec Flora (deux avec Seedance 2.0,
// le gros plan avec Kling 2.5) et joués à leur vitesse réelle, avec le petit tremblement d'un téléphone.
// (La première version, le 8 novembre, cassait le sceau d'une lettre et la dépliait ; le propriétaire : « Le hook du début est mal
// fait et fait trop IA et n'accroche pas assez » : rien ne bougeait pendant la première seconde et demie, et le papier qu'on
// dépliait se déformait.)
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { entre, expoSortie, FPS } from "./theme";
import { cadrePlongee, DUREE_PLONGEE, PAPIER, papierDansLaCarte, T } from "./temps";
import { MORCEAUX } from "./morceaux";

/** Le tremblement de la main qui filme : plusieurs lentes oscillations sans rapport entre elles (px, degrés), jamais régulières.
 *  (les plans générés bougent déjà un peu : la moitié de celui de la jarre) */
const tremblement = (f: number) => {
  const x = 2.5 * Math.sin(f / 41 + 0.3) + 1.5 * Math.sin(f / 17.3 + 2.1) + 0.6 * Math.sin(f / 7.1);
  const y = 2 * Math.sin(f / 37 + 1.2) + 1.2 * Math.sin(f / 15.1) + 0.5 * Math.sin(f / 6.3);
  const r = 0.16 * Math.sin(f / 53 + 0.7) + 0.06 * Math.sin(f / 19);
  return { x, y, r, z: 1.03 + 0.004 * Math.sin(f / 61) };
};

/** Le plan et sa seconde à l'image f (la dernière image du dernier plan reste pendant la plongée). */
const aLImage = (f: number) => {
  const i = Math.max(0, MORCEAUX.findIndex((m) => f >= m.f0 && f < m.f1));
  const m = f >= T.ouvre ? MORCEAUX[MORCEAUX.length - 1] : MORCEAUX[i];
  const g = Math.min(f, m.f1 - 1);
  return { clip: m.clip, seconde: m.s0 + ((g - m.f0) / FPS) * m.v, zoom: m.zoom ?? 1, centre: m.centre ?? [0.5, 0.5] };
};

export const Accroche: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= T.ouvre + DUREE_PLONGEE) return null;
  const g = Math.min(f, T.ouvre - 1); // (pendant la plongée, le tremblement et l'approche restent ceux de la dernière image)
  const { x, y, r, z } = tremblement(g);
  // les derniers temps, le téléphone s'approche du Japon de cire
  const approche = 1 + 0.08 * expoSortie(entre(g, T.ouvre - 50, T.ouvre - 1)) ** 2;
  const { clip, seconde, zoom, centre } = aLImage(f);
  const video = (
    <Freeze frame={Math.round(seconde * FPS)}>
      <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted style={{ position: "absolute", inset: 0, width: 1080, height: 1920, transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: `${centre[0] * 100}% ${centre[1] * 100}%` }} />
    </Freeze>
  );
  const filme = (
    <AbsoluteFill style={{ transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${(z * approche).toFixed(4)})`, transformOrigin: `${PAPIER.x}px ${PAPIER.y}px` }}>
      {video}
    </AbsoluteFill>
  );
  if (f < T.ouvre) return filme;
  // la plongée : la cire part avec le cadre de la vraie carte (Carte.tsx prend le même), et s'efface
  const u = expoSortie(entre(f, T.ouvre, T.ouvre + DUREE_PLONGEE));
  const { origine, transform } = cadrePlongee(u);
  return (
    <AbsoluteFill style={{ transformOrigin: origine, transform, opacity: 1 - entre(f, T.ouvre + 3, T.ouvre + 13) }}>
      <AbsoluteFill style={{ transformOrigin: origine, transform: papierDansLaCarte() }}>{filme}</AbsoluteFill>
    </AbsoluteFill>
  );
};
