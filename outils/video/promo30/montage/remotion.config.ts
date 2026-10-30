/**
 * Le montage de la vidéo promo de 30 s (outils/video/promo30). Ses fichiers (rushes et captures de la carte,
 * extraits des vidéos du propriétaire, voix off, musique, bruitages) sont dans videos/carte/promo30/public, hors de git :
 * rushes.py, captures.py, voix.py et preparer.py les y mettent.
 * All configuration options: https://remotion.dev/docs/config
 */
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "carte", "promo30", "public"));
