/**
 * Le montage des intros « captcha » (outils/video/captcha), pour Remotion Studio (npx remotion studio) : ses fichiers (l'image 0
 * de chaque plan, la prise de carte de l'écran de fin) sont dans le dossier de travail de fabriquer.py, hors de git. Les vrais rendus
 * passent par rendre.mjs (appelé par fabriquer.py).
 * All configuration options: https://remotion.dev/docs/config
 */
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("angle");
// les fichiers de travail sont là où fabriquer.py les a mis (--atelier : dans l'Outil Prépa TikTok, outils/atelier intros) ;
// ATELIER_INTROS=<ce dossier> pour les voir dans le Studio (sinon l'ancien dossier videos/intros captcha/_atelier)
Config.setPublicDir(process.env.ATELIER_INTROS ? path.join(process.env.ATELIER_INTROS, "public")
  : path.join(process.cwd(), "..", "..", "..", "..", "videos", "intros captcha", "_atelier", "public"));
