/**
 * Le montage de « Japan Daily » (outils/video/daily), 9:16 à 60 images/s. Ses fichiers (les plans du propriétaire coupés, les prises
 * de carte, la musique, les bruitages, le logo) sont dans videos/carte/daily/public, hors de git : preparer.py, rushes.py et
 * musique.py les y mettent.
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
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "carte", "daily", "public"));
