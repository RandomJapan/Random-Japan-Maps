/**
 * Le montage de la vidéo « minuit » (outils/video/minuit) : la dernière nuit d'Halloween sur la carte, 22,5 s en 9:16
 * à 60 images/s. Ses fichiers (prises et captures de la carte, voix off, bruitages, musique) sont dans
 * videos/carte/minuit/public, hors de git : preparer.py, rushes.py, captures.py, musique.py et voix.py les y mettent.
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
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "carte", "minuit", "public"));
