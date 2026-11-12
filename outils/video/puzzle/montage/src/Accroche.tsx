// L'accroche (0 → temps 12, 4,2 s), sur le modèle des vidéos « sceau » et « fléchette » : à la première personne, le soir, sur une
// table en bois, une main pose la dernière pièce du puzzle de la carte du Japon (au milieu de Honshū) : clic, le puzzle est fini, la
// main s'en va, le téléphone s'approche. Seulement les bruits du geste (le son d'origine du plan). Au temps 12, on plonge dans le
// Japon du puzzle et il devient la vraie carte en relief (Carte.tsx), comme le Japon de cire du sceau. Le plan est généré avec
// Higgsfield (le puzzle fini avec Nano Banana, puis Seedance 2.0) : une main qui soulève une pièce, joué à l'envers (Seedance n'a
// jamais su finir un puzzle : deux fois, le trou faisait plusieurs pièces et la main posait la sienne à côté), à sa vitesse réelle,
// avec le petit tremblement d'un téléphone.
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { Mots } from "./Commun";
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

/** La main est sortie du cadre (image de la vidéo) : le téléphone s'approche du puzzle fini jusqu'à la plongée. */
export const MAIN_PARTIE = 168;
export const APPROCHE = 0.2;
// (de plus en plus vite : à la plongée, il va déjà vers la carte, qui continue de plonger)
const approcheA = (g: number) => 1 + APPROCHE * entre(g, MAIN_PARTIE - 20, T.ouvre - 1) ** 2;

export const Accroche: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= T.ouvre + DUREE_PLONGEE) return null;
  const g = Math.min(f, T.ouvre - 1); // (pendant la plongée, le tremblement et l'approche restent ceux de la dernière image)
  const { x, y, r, z } = tremblement(g);
  const approche = approcheA(g);
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
  // les mots de l'accroche : déjà posés à la première image (elle sert de couverture)
  const mots = f < T.ouvre && (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.3) 0px, rgba(0,0,0,0) 560px)" }} />
      <Mots texte={"THE LAST PIECE OF\nMY *JAPAN* PUZZLE 🧩"} de={-60} a={MAIN_PARTIE - 18} y={170} taille={84} />
      <Mots texte={"NOW WATCH IT\nCOME *ALIVE* 👀"} de={MAIN_PARTIE - 18} a={T.ouvre} y={170} taille={88} />
    </>
  );
  // la plongée : le puzzle part avec le cadre de la vraie carte (Carte.tsx prend le même), et s'efface. (Les mêmes calques avant
  // elle : quand ils changeaient au temps 12, le flou de mouvement, qui mélange les images d'avant, rayait le puzzle.)
  const plonge = f >= T.ouvre;
  const { origine, transform } = cadrePlongee(expoSortie(entre(f, T.ouvre, T.ouvre + DUREE_PLONGEE)));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transformOrigin: origine, transform: plonge ? transform : undefined, opacity: 1 - entre(f, T.ouvre + 3, T.ouvre + 13) }}>
        <AbsoluteFill style={{ transformOrigin: origine, transform: plonge ? papierDansLaCarte() : undefined }}>{filme}</AbsoluteFill>
      </AbsoluteFill>
      {mots}
    </AbsoluteFill>
  );
};
