/**
 * Le montage de la vidéo « générique d'animé » de la carte (outils/video/generique) : un opening de shōnen, 9:16 à 60 images/s.
 * Ses fichiers (rushes du propriétaire, plans animés, prises de la carte, chanson, bruitages) sont dans videos/carte/generique/public,
 * hors de git : preparer.py les y met.
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
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "carte", "generique", "public"));
