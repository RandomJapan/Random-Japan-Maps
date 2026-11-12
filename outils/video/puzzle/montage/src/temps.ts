// Le temps de la vidéo « puzzle », en temps de musique (t(n) : le temps n, à l'image 25 (n − 2) : la vidéo commence au temps 2,
// voir theme.ts). Le découpage est dans outils/video/puzzle/plan.md. La musique (musique.py) éclate au temps 12, s'arrête au temps
// 36,5 et repart au temps 37 ; tout après le temps 12 est celui de la vidéo « sceau ».
import { t } from "./theme";

export const T = {
  // l'accroche (ses plans : accroche.json) : la main pose la dernière pièce, s'en va ; on plonge dans le Japon du puzzle au temps 12
  ouvre: t(12),
  // la carte
  plongee: t(12), tottori: t(16), tapEpingle: t(16.75), fiche: t(17), tapVideo: t(18), reel: t(18.25),
  ville: t(21), saisons: t(24), jour: t(27), tapJour: t(27.75), nuit: t(27.85), mer: t(29.5), legende: t(31), route: t(33),
  gel: t(36.5), portail: t(37), tapPortail: t(37.6), balade: t(38), fin: t(42),
};

/** La plongée dans le puzzle : le Japon du puzzle (la dernière image du plan) et le premier plan de la vraie carte, cadré comme
 *  lui, sont posés l'un sur l'autre ; ce cadre, d'abord celui du puzzle, devient l'écran entier (le nom vient du sceau, où c'était
 *  le papier de la lettre).
 *  x, y : le milieu du Japon du puzzle (px de la vidéo) ; cx, cy : le même point sur la vraie carte ; angle (degrés) et echelle :
 *  le Japon du puzzle par rapport à la vraie carte. */
// (mesurés sur les deux images, du milieu d'Hokkaidō (430, 570) au milieu de Kyūshū (400, 1550) dans le puzzle, à la dernière
// image du plan, avec l'approche du téléphone (× 1,2) et son tremblement (× 1,027) ; sur la carte, (470, 440) et (390, 1470), avec
// le × 1,06 de LePlan. Le puzzle a été fait sur une capture de la carte : les deux Japon ont presque la même forme.)
export const PAPIER = { x: 415, y: 1060, cx: 423, cy: 955, angle: -2.7, echelle: 1.103 };
export const DUREE_PLONGEE = 26; // images

/** Le cadre de la plongée à l'image f (u : 0 → 1) : la vraie carte, d'abord sur le papier, jusqu'à l'écran entier. */
export const cadrePlongee = (u: number) => {
  const k = PAPIER.echelle ** (1 - u);
  return {
    origine: `${PAPIER.cx}px ${PAPIER.cy}px`,
    transform: `translate(${((PAPIER.x - PAPIER.cx) * (1 - u)).toFixed(2)}px, ${((PAPIER.y - PAPIER.cy) * (1 - u)).toFixed(2)}px) rotate(${(PAPIER.angle * (1 - u)).toFixed(3)}deg) scale(${k.toFixed(5)})`,
  };
};
/** L'inverse du cadre de départ : le papier, dans le cadre de la vraie carte, retrouve sa place filmée. */
export const papierDansLaCarte = () =>
  `scale(${(1 / PAPIER.echelle).toFixed(5)}) rotate(${(-PAPIER.angle).toFixed(3)}deg) translate(${(PAPIER.cx - PAPIER.x).toFixed(2)}px, ${(PAPIER.cy - PAPIER.y).toFixed(2)}px)`;
