/**
 * Le montage de la vidéo « puzzle » (outils/video/puzzle) : la dernière pièce du puzzle de la carte, 19,2 s en 9:16 à 60
 * images/s. Ses fichiers (le plan du puzzle, les prises et captures de la carte reprises de la vidéo « sceau », bruitages, musique)
 * sont dans videos/carte/puzzle/public, hors de git : preparer.py et musique.py les y mettent.
 * All configuration options: https://remotion.dev/docs/config
 */
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(94);
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(1);
Config.setChromiumOpenGlRenderer("angle");
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "carte", "puzzle", "public"));
