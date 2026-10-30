/**
 * Le montage de la vidéo « éclat » (outils/video/eclat, 2026-10-27) : 14,6 s en 9:16 à 60 images/s. Ses fichiers (la photo
 * de la vitre et le marteau, les prises de la carte et du jeu, les vrais lieux, la musique, les bruitages) sont dans
 * videos/carte/eclat/public, hors de git : preparer.py et musique.py les y mettent.
 */
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(94);
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(1);
Config.setChromiumOpenGlRenderer("angle");
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "carte", "eclat", "public"));
