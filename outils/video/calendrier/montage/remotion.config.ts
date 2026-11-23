/**
 * Le montage des vidéos du calendrier de l'Avent (outils/video/calendrier) : la promo « les cadeaux sont vrais » et le tutoriel
 * de la grue, 9:16 à 60 images/s. Ses fichiers (vrais plans, prise du calendrier, dessins de la grue, musique, bruitages) sont
 * dans videos/carte/calendrier/public, hors de git : preparer.py, rushes.py et diagrammes.py les y mettent.
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
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "carte", "calendrier", "public"));
