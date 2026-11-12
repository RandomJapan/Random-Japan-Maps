// Le temps de la vidéo « fléchette », en temps de musique (t(n) : le temps n, 25 images à 60 images/s). Le découpage est dans
// outils/video/fleche/plan.md. La musique (musique.py) éclate au temps 12, s'arrête au temps 36,5 et repart au temps 37 : la forme
// de la vidéo « sceau », dont ce montage est une copie.
import { t } from "./theme";

export const T = {
  // l'accroche (ses plans : accroche.json) : le lancer, la fléchette plantée près du point d'Aogashima ; on plonge dedans au temps 12
  ouvre: t(12),
  // la carte
  plongee: t(12), ile: t(16), tapEpingle: t(16.75), fiche: t(17), tapVideo: t(18), reel: t(18.25),
  ville: t(21), saisons: t(24), jour: t(27), tapJour: t(27.75), nuit: t(27.85), mer: t(29.5), legende: t(31), route: t(33),
  gel: t(36.5), portail: t(37), tapPortail: t(37.6), balade: t(38), fin: t(42),
};

/** Le point vert où la fléchette s'est plantée, sur la dernière image de l'accroche (px de la vidéo : VF2b à 4,0 s, mesuré). */
export const POINTE = { x: 615, y: 972, rayon: 22 };
export const DUREE_PLONGEE = 26; // images
/** Le grossissement de l'affiche pendant la plongée (u : 0 → 1) : il accélère vers le point, × 80 à la fin (la plongée de la vidéo
 *  « tunnel » : E(u) = (e^(4u) − 1) / (e^4 − 1)). */
export const grossissement = (u: number) => 80 ** ((Math.exp(4 * u) - 1) / (Math.exp(4) - 1));
