// Rend les images des intros « captcha » (appelé par fabriquer.py) : le montage est préparé une seule fois, puis chaque travail
// (une composition et ses props) devient un dossier d'images PNG (transparentes pour le nom), que fabriquer.py encode.
//   node rendre.mjs <travaux.json>   avec { "public": dossier public, "travaux": [{ "composition", "props", "dossier" }] }
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";

const { public: publicDir, travaux } = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const entryPoint = path.resolve("src/index.ts");
let serveUrl;
try {
  serveUrl = await bundle({ entryPoint, publicDir, rspack: true });
} catch {
  serveUrl = await bundle({ entryPoint, publicDir });
}

for (const tr of travaux) {
  for (let essai = 1; ; essai++) {
    try {
      const composition = await selectComposition({ serveUrl, id: tr.composition, inputProps: tr.props });
      fs.rmSync(tr.dossier, { recursive: true, force: true });
      fs.mkdirSync(tr.dossier, { recursive: true });
      await renderFrames({
        composition, serveUrl, inputProps: tr.props, outputDir: tr.dossier, imageFormat: "png",
        concurrency: essai === 1 ? 4 : 2, timeoutInMilliseconds: essai === 1 ? 120000 : 300000,
        chromiumOptions: { gl: "angle" }, onStart: () => {}, onFrameUpdate: () => {},
      });
      console.log(`rendu : ${tr.composition} → ${tr.dossier}`);
      break;
    } catch (e) {
      // une image peut ne pas venir (une police, une vidéo lente à lire) : une seconde fois, plus doucement
      if (essai >= 2) throw e;
      console.log(`… nouvel essai (${tr.composition}) : ${e.message?.split("\n")[0]}`);
    }
  }
}
