/**
 * Le montage des deux vidéos du jeu (outils/video/jeu) : « Devine le lieu » et le défi du jour, 9:16 à 60 images/s. Ses
 * fichiers (vrais plans, prises et captures du jeu, voix, bruitages, musique) sont dans videos/carte/jeu/public, hors de
 * git : preparer.py, rushes.py, captures.py, voix.py et musique.py les y mettent.
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
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "carte", "jeu", "public"));
