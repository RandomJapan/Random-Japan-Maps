/**
 * Le montage de la vidéo « sceau » (outils/video/sceau) : ce qu'il y a dans la lettre cachetée, 20 s en 9:16 à 60 images/s. Ses
 * fichiers (plans de la lettre, prises et captures de la carte, bruitages, musique) sont dans videos/carte/sceau/public, hors de
 * git : preparer.py, rushes.py, captures.py et musique.py les y mettent.
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
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "carte", "sceau", "public"));
