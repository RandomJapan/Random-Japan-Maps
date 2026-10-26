/**
 * Le montage des vidéos de la balade 3D (outils/video/balade) : trois vidéos de 30 s en 9:16 à 60 images/s. Leurs
 * fichiers (prises de la balade et de la carte, vrais lieux, airs et bruitages du jeu, voix, bruitages repris) sont dans
 * videos/balade/public, hors de git : rushes.py, carte.py, preparer.py, musique.py, sons.py et voix.py les y mettent.
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
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "balade", "public"));
