/**
 * Le montage des intros « captcha » (outils/video/captcha), pour Remotion Studio (npx remotion studio) : ses fichiers (l'image 0
 * de chaque plan, la prise de carte de l'écran de fin) sont dans videos/intros captcha/_atelier, hors de git. Les vrais rendus
 * passent par rendre.mjs (appelé par fabriquer.py).
 * All configuration options: https://remotion.dev/docs/config
 */
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("angle");
Config.setPublicDir(path.join(process.cwd(), "..", "..", "..", "..", "videos", "intros captcha", "_atelier", "public"));
