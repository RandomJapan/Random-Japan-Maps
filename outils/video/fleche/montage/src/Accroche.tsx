// L'accroche (0 → temps 12), sur le modèle des vidéos « jarre » et « sceau » : à la première personne, le soir, dans une chambre en
// désordre, une main lance une fléchette sur l'affiche de la carte du Japon punaisée au mur ; en gros plan, la fléchette plantée
// vibre dans l'océan, juste à côté du petit point vert d'Aogashima, et le téléphone s'en approche. Seulement les bruits du lancer
// (le son d'origine des plans). Au temps 12, on plonge dans le point : l'affiche grossit vers lui (× 80) et la vraie carte apparaît
// dans un cercle qui s'ouvre sur lui (Carte.tsx). Les deux plans sont générés avec Higgsfield (Seedance 2.0) et joués à leur
// vitesse réelle, avec le petit tremblement d'un téléphone. On coupe le lancer juste avant que la fléchette touche : dans le plan
// large, elle se plante ailleurs.
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { Mots } from "./Commun";
import { entre, expoSortie, FPS } from "./theme";
import { DUREE_PLONGEE, grossissement, POINTE, T } from "./temps";
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
  const g = Math.min(f, T.ouvre - 1); // (pendant la plongée, le tremblement reste celui de la dernière image)
  const { x, y, r, z } = tremblement(g);
  const { clip, seconde, zoom, centre } = aLImage(f);
  const video = (
    <Freeze frame={Math.round(seconde * FPS)}>
      <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted style={{ position: "absolute", inset: 0, width: 1080, height: 1920, transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: `${centre[0] * 100}% ${centre[1] * 100}%` }} />
    </Freeze>
  );
  // la plongée : l'affiche grossit vers le point, et un trou s'ouvre sur lui (le point grossi avec elle), où la vraie carte apparaît
  const u = entre(f, T.ouvre, T.ouvre + DUREE_PLONGEE);
  const k = f >= T.ouvre ? grossissement(u) : 1;
  const trou = f >= T.ouvre ? POINTE.rayon * k * expoSortie(entre(f, T.ouvre, T.ouvre + 6)) : 0;
  const masque = trou > 0 ? `radial-gradient(circle at ${POINTE.x}px ${POINTE.y}px, transparent ${trou.toFixed(1)}px, #000 ${(trou + 3).toFixed(1)}px)` : undefined;
  return (
    <AbsoluteFill style={{ WebkitMaskImage: masque, maskImage: masque }}>
      <AbsoluteFill style={{ transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${(z * k).toFixed(4)})`, transformOrigin: `${POINTE.x}px ${POINTE.y}px` }}>
        {video}
      </AbsoluteFill>
      {/* les mots de l'accroche : déjà posés à la première image (elle sert de couverture) */}
      <Mots texte={"I THREW A DART AT\nMY *JAPAN* MAP 🎯"} de={-60} a={200} y={170} taille={92} />
      <Mots texte={"WHERE DID IT LAND? 👀"} de={200} a={T.ouvre} y={190} taille={84} />
    </AbsoluteFill>
  );
};
