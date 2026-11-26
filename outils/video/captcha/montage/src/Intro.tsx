// L'intro « captcha » d'une vidéo de lieu (2026-11-26) : à l'image 0, une fenêtre de captcha est déjà là (au moins 85 % de la
// largeur, au-dessus de la légende de TikTok et à gauche de ses boutons), le lieu en morceaux dedans ; un doigt (le rond des
// enregistrements d'écran) remet les morceaux en place, « Verified ✓ » en vert, puis l'image grandit de la fenêtre au plein écran.
// La dernière image est exactement l'image 0 du plan du propriétaire (l'image seule, sans rien d'autre) : il colle son plan juste
// après, sans saut.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Grille } from "./Grille";
import { Puzzle } from "./Puzzle";
import { borne, doigt, grandir, H, lerp, PropsIntro, Rect, W } from "./theme";

/** L'image 0 entière, à l'échelle k, son coin en (x, y). */
export const ImagePlan: React.FC<{ src: string; k: number; x: number; y: number }> = ({ src, k, x, y }) => (
  <Img src={src} style={{ position: "absolute", left: x, top: y, width: W * k, height: H * k, maxWidth: "none" }} />
);

/** La partie de l'image 0 qui va dans la zone : l'échelle et le coin de l'image entière (repère de la zone). */
export function cadrage(p: PropsIntro) {
  const k = p.zone.w / p.recadrage.w;
  return { k, x: -p.recadrage.x * k, y: -p.recadrage.y * k };
}

/** Le doigt : un rond gris clair cerclé de blanc, qui s'enfonce un peu quand il appuie. */
const Doigt: React.FC<{ p: PropsIntro; t: number }> = ({ p, t }) => {
  const g = p.geste;
  if (t < g.apparait || t > g.disparait + 0.08) return null;
  const { x, y } = doigt(g, t);
  const entre = borne((t - g.apparait) / 0.06), sort = 1 - borne((t - g.disparait) / 0.08);
  const appuie = g.appuis.some(([a, b]) => t >= a && t <= b);
  const d = 96;
  return (
    <div style={{
      position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: "50%",
      background: appuie ? "rgba(150,150,150,0.62)" : "rgba(170,170,170,0.42)", border: "4px solid rgba(255,255,255,0.92)",
      boxShadow: "0 3px 14px rgba(0,0,0,0.35)", boxSizing: "border-box",
      transform: `scale(${(appuie ? 0.84 : 1) * (0.6 + 0.4 * entre)})`, opacity: Math.min(entre, sort),
    }} />
  );
};

export const Intro: React.FC<PropsIntro> = (p) => {
  const t = useCurrentFrame() / p.fps;
  const src = staticFile(p.image);
  const [g0, g1] = p.temps.grandit;
  // la fin : l'image 0 seule, telle quelle (la jointure avec le plan)
  if (t >= g1 - 1e-6) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <ImagePlan src={src} k={1} x={0} y={0} />
      </AbsoluteFill>
    );
  }
  const e = grandir(borne((t - g0) / (g1 - g0)));
  const z = p.zone, { k } = cadrage(p);
  // l'image qui grandit : son échelle de k à 1, son milieu du milieu de la zone au milieu de l'écran, et la fenêtre qui la
  // découpe s'ouvre de la zone à tout l'écran (elle reste toujours dans l'image)
  const s = lerp(k, 1, e);
  const cx0 = z.x + (W / 2 - p.recadrage.x) * k, cy0 = z.y + (H / 2 - p.recadrage.y) * k;
  const cx = lerp(cx0, W / 2, e), cy = lerp(cy0, H / 2, e);
  const masque: Rect = { x: lerp(z.x, 0, e), y: lerp(z.y, 0, e), w: lerp(z.w, W, e), h: lerp(z.h, H, e) };
  const rayon = lerp(p.style === "grille" ? 0 : 14, 0, e);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* derrière la fenêtre : le lieu flou et sombre (une fenêtre qui s'ouvre sur une page) */}
      <Img src={src} style={{ position: "absolute", width: W, height: H, transform: "scale(1.08)",
        filter: "blur(28px) brightness(0.5) saturate(1.15)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)" }} />
      <AbsoluteFill style={{ opacity: 1 - borne(e / 0.18), transform: `scale(${1 + 0.05 * e})`, transformOrigin: `${z.x + z.w / 2}px ${z.y + z.h / 2}px` }}>
        {p.style === "grille" ? <Grille p={p} t={t} /> : <Puzzle p={p} t={t} />}
      </AbsoluteFill>
      {t >= g0 && (
        <div style={{ position: "absolute", left: masque.x, top: masque.y, width: masque.w, height: masque.h, overflow: "hidden",
          borderRadius: rayon, boxShadow: `0 24px 70px rgba(0,0,0,${0.45 * (1 - e)})` }}>
          <ImagePlan src={src} k={s} x={cx - (W / 2) * s - masque.x} y={cy - (H / 2) * s - masque.y} />
        </div>
      )}
      <Doigt p={p} t={t} />
    </AbsoluteFill>
  );
};
