// Des images fixes d'une composition, d'un seul paquet (plus vite qu'un `remotion still` par image) : pour regarder chaque plan et chaque
// enchaînement avant le rendu.
//   node stills.mjs Cadeaux out/stills 0 120 240 …     (images de la vidéo ; « s12.5 » : la seconde 12,5)
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const [id, dossier, ...images] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("../../../../videos/carte/calendrier/public"), outDir: path.resolve("out/paquet") });
const composition = await selectComposition({ serveUrl, id, inputProps: { bgm: true } });
for (const im of images) {
  const frame = im.startsWith("s") ? Math.round(parseFloat(im.slice(1)) * composition.fps) : parseInt(im, 10);
  await renderStill({ composition, serveUrl, output: path.join(dossier, `${String(frame).padStart(5, "0")}.jpg`), frame, imageFormat: "jpeg", jpegQuality: 80, scale: 0.4, inputProps: { bgm: true }, timeoutInMilliseconds: 120000 });
  process.stdout.write(`${frame} `);
}
console.log("");
