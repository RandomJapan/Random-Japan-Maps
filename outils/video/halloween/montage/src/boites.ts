// Les boîtes des yōkai du défilé dans un rush (rushes.py les relève à chaque image : rushes/<nom>.json), pour
// cadrer chaque yōkai de près au montage.
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { dossierRushes, useFormat } from "./commun";

export type Boites = { taille: [number, number]; images: ([number, number, number, number] | null)[][] };
// l'ordre du cortège (hyakki.js, CORTEGE)
export const MEMBRES = ["chochin", "renard", "kasa", "tanuki", "kappa", "oni", "tengu", "rokurokubi", "zori"];

export function useBoites(nom: string): Boites | null {
  const { v } = useFormat();
  const [boites, setBoites] = useState<Boites | null>(null);
  const [attente] = useState(() => delayRender(`boîtes ${nom}`));
  useEffect(() => {
    fetch(staticFile(`${dossierRushes(v)}/${nom}.json`))
      .then((r) => r.json())
      .then((b: Boites) => { setBoites(b); continueRender(attente); })
      .catch((e) => { console.error(e); continueRender(attente); });
  }, [nom, v, attente]);
  return boites;
}

/** Le centre d'un yōkai à l'image n du rush (lissé sur ±6 images), ou null s'il n'est pas à l'écran. */
export function centre(b: Boites, membre: number, n: number): [number, number] | null {
  let sx = 0, sy = 0, k = 0;
  for (let j = -6; j <= 6; j++) {
    const r = b.images[Math.max(0, Math.min(b.images.length - 1, n + j))]?.[membre];
    if (!r) continue;
    sx += r[0] + r[2] / 2; sy += r[1] + r[3] / 2; k++;
  }
  return k ? [sx / k, sy / k] : null;
}

/** Le moment (image du rush) où ce yōkai passe le plus près du milieu de l'image, entre deux images. */
export function auMilieu(b: Boites, membre: number, de = 15, a = Infinity): number {
  let meilleur = de, ecart = Infinity;
  for (let n = de; n < Math.min(a, b.images.length - 15); n++) {
    const c = centre(b, membre, n);
    if (!c) continue;
    const e = Math.abs(c[0] - b.taille[0] / 2) + 0.5 * Math.abs(c[1] - b.taille[1] / 2);
    if (e < ecart) { ecart = e; meilleur = n; }
  }
  return meilleur;
}
