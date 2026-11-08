// Le temps de la vidéo « sceau », en temps de musique (t(n) : le temps n, 25 images à 60 images/s). Le découpage est dans
// outils/video/sceau/plan.md. La musique (musique.py) éclate au temps 12, s'arrête au temps 36,5 et repart au temps 37.
import { t } from "./theme";

export const T = {
  // l'accroche : le pouce casse le sceau (il cède à l'image 70), puis les mains déplient la lettre ; on plonge dans sa carte au temps 12
  sceau: 0, craque: 70, lettre: 100, ouvre: t(12),
  // la carte
  plongee: t(12), tottori: t(16), tapEpingle: t(16.75), fiche: t(17), tapVideo: t(18), reel: t(18.25),
  ville: t(21), saisons: t(24), jour: t(27), tapJour: t(27.75), nuit: t(27.85), mer: t(29.5), legende: t(31), route: t(33),
  gel: t(36.5), portail: t(37), tapPortail: t(37.6), balade: t(38), fin: t(42),
};

/** La plongée dans la lettre : la carte imprimée sur le papier (la dernière image du plan des mains) et le premier plan de la
 *  vraie carte, cadré comme elle, sont posés l'un sur l'autre ; ce cadre, d'abord celui du papier, devient l'écran entier.
 *  x, y : le milieu du Japon imprimé (px de la vidéo) ; cx, cy : le même point sur la vraie carte ; angle (degrés) et echelle :
 *  le Japon imprimé par rapport à la vraie carte. */
// (mesurés sur les deux images, du milieu d'Hokkaidō au milieu de Kyūshū)
export const PAPIER = { x: 529, y: 978, cx: 438, cy: 956, angle: -18, echelle: 0.605 };
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
