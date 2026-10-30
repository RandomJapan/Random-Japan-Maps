/**
 * Le montage des vidéos d'Halloween (outils/video/halloween). Ses fichiers (rushes de la carte, extraits des
 * vidéos du propriétaire, musiques, bruitages) sont dans videos/carte/halloween/public, hors de git : rushes.py et
 * preparer.py les y mettent.
 * All configuration options: https://remotion.dev/docs/config
 */
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "carte", "halloween", "public"));
