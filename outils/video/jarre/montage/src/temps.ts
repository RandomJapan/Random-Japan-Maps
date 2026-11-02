// Le temps de la vidéo « jarre », en temps de musique (t(n) : le temps n, 25 images à 60 images/s). Le découpage est dans
// outils/video/jarre/plan.md. La musique (musique.py) éclate au temps 12, s'arrête au temps 36,5 et repart au temps 37.
import { t } from "./theme";

/** Le centre du trou de la jarre ouverte (px de la vidéo : preparer.py le mesure). */
export const TROU: [number, number] = [504, 846];

export const T = {
  // l'accroche : le marteau, puis les mains, à leur vitesse réelle ; on plonge dans la jarre au temps 12
  marteau: 0, coupe: 79, mains: 143, ouvre: t(12),
  coups: [12, 50, 70, 89, 119], // les cinq coups de marteau, là où ils tombent dans le plan ; le dernier fend la jarre
  // la carte
  plongee: t(12), itsuku: t(16), tapEpingle: t(16.75), fiche: t(17), tapVideo: t(18), reel: t(18.25),
  des: t(21), tapDes: t(21.5), vol: t(21.5), ficheDes: t(23.5),
  saisons: t(25), mer: t(28), legende: t(30), route: t(32.5), gel: t(36.5), portail: t(37), tapPortail: t(37.6), balade: t(38), fin: t(42),
};
