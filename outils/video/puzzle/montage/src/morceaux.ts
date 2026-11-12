// Les plans de l'accroche, dans l'ordre : leur fichier (clips/<clip>.mp4), la seconde du plan à leur première image (s0), leurs
// images de début et de fin dans la vidéo (f0, f1), leur vitesse (v). Lus aussi par preparer.py (le son de l'accroche est coupé
// comme eux) : ils sont dans accroche.json.
import accroche from "./accroche.json";

/** zoom, centre (0 à 1) : les plans de Seedance sortent plus larges que leur image de départ, on se rapproche de la cire. */
export type Morceau = { clip: string; s0: number; f0: number; f1: number; v: number; zoom?: number; centre?: number[] };
export const MORCEAUX: Morceau[] = accroche.morceaux as Morceau[];
