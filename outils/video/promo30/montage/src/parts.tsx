// Les pièces du montage : la caméra 2,5D sur les captures de l'interface (Page), les plans filmés de la carte (Rush),
// un extrait vidéo du propriétaire (Extrait), les lettres pressées, le cartouche de légende, le sceau (hanko),
// le curseur qui touche, le cœur, le dé en 3D, le grain de papier et les sources de la carte.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { C, de, ELAN, FILET, FPS, FRAPPE, GRAIN, lin, SANS, TITRE } from "./theme";

const borne = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Le format de la vidéo : W × H, v (vertical 9:16 : rushes-v/, captures ui-v/ sur une page de téléphone 540 × 960). */
export const useFormat = () => {
  const { width, height } = useVideoConfig();
  const v = height > width;
  return { W: width, H: height, v, page: (v ? [540, 960] : [1280, 720]) as [number, number], ui: v ? "ui-v" : "ui" };
};
export type Fmt = { W: number; H: number; S: number };
export const F16: Fmt = { W: 1920, H: 1080, S: 1.5 };
export const F9: Fmt = { W: 1080, H: 1920, S: 2 };

/** Une clé de caméra sur une capture : le point (cx, cy) de la page (px CSS de la page 1280 × 720) mis au centre de
 *  l'image, z le grossissement (1 = toute la page sur 1920 px), rx/ry/rz des inclinaisons en degrés. */
export type Cle = { f: number; cx: number; cy: number; z: number; rx?: number; ry?: number; rz?: number };

const suivreCles = (cles: Cle[], f: number, ease: (t: number) => number) => {
  let a = cles[0], z = cles[cles.length - 1];
  for (let i = 0; i < cles.length - 1; i++) if (f >= cles[i].f && f <= cles[i + 1].f) { a = cles[i]; z = cles[i + 1]; break; }
  if (f > cles[cles.length - 1].f) a = z;
  const t = a.f === z.f ? 1 : interpolate(f, [a.f, z.f], [0, 1], { ...borne, easing: ease });
  const m = (p: number | undefined, q: number | undefined) => (p ?? 0) + ((q ?? 0) - (p ?? 0)) * t;
  return { cx: m(a.cx, z.cx), cy: m(a.cy, z.cy), z: m(a.z, z.z), rx: m(a.rx, z.rx), ry: m(a.ry, z.ry), rz: m(a.rz, z.rz) };
};

const CAMERA = Easing.bezier(0.33, 0, 0.15, 1);
/** Où tombe à l'écran (px de la vidéo) un point de la page (px CSS), à l'image f — sans inclinaison. */
export const ecran = (cles: Cle[], f: number, px: number, py: number, ease: (t: number) => number = CAMERA, fmt: Fmt = F16): [number, number] => {
  const c = suivreCles(cles, f, ease);
  const Z = fmt.S * c.z;
  return [fmt.W / 2 + (px - c.cx) * Z, fmt.H / 2 + (py - c.cy) * Z];
};

/**
 * Une capture de l'interface (videos/carte/promo30/public/ui, 3840 × 2160 pour une page de 1280 × 720) sous une caméra
 * 2,5D. Le grossissement passe par la propriété CSS zoom (pas transform: scale) : le navigateur dessine alors la page
 * à sa taille agrandie, à partir de l'image 3×, et le texte reste net même incliné (règle Q2 du skill).
 * Les enfants se placent en px CSS de la page.
 */
export const Page: React.FC<{ src: string; cles: Cle[]; ease?: (t: number) => number; children?: React.ReactNode; flou?: number }> = ({
  src, cles, ease = CAMERA, children, flou = 0,
}) => {
  const f = useCurrentFrame();
  const { W, H, page } = useFormat();
  const c = suivreCles(cles, f, ease);
  const Z = (W / page[0]) * c.z;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.papier }}>
      <div style={{ position: "absolute", inset: 0, perspective: `${1400 * Z}px`, perspectiveOrigin: `${W / 2}px ${H / 2}px` }}>
        <div
          style={{
            position: "absolute", width: page[0], height: page[1], zoom: Z,
            transform: `translate(${W / 2 / Z - c.cx}px, ${H / 2 / Z - c.cy}px) rotateY(${c.ry}deg) rotateX(${c.rx}deg) rotateZ(${c.rz}deg)`,
            transformOrigin: `${c.cx}px ${c.cy}px`, transformStyle: "preserve-3d", filter: flou ? `blur(${flou}px)` : undefined,
          }}
        >
          <Img src={staticFile(src)} style={{ position: "absolute", width: page[0], height: page[1] }} />
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Un plan filmé de la carte (videos/carte/promo30/public/rushes, 1920 × 1080) ; cadre(f) : [x, y, largeur] en px du rush. */
export const Rush: React.FC<{
  nom: string; debut?: number; vitesse?: number; taille?: [number, number]; cadre?: (f: number) => [number, number, number];
  filtre?: string; style?: React.CSSProperties;
}> = ({ nom, debut = 0, vitesse = 1, taille: t, cadre, filtre, style }) => {
  const f = useCurrentFrame();
  const { W, H, v } = useFormat();
  const taille = t ?? [W, H];
  const [x, y, l] = cadre ? cadre(f) : [0, 0, taille[0]];
  const k = W / l;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.nuit, ...style }}>
      <Video
        src={staticFile(`${v ? "rushes-v" : "rushes"}/${nom}.mp4`)} trimBefore={Math.round(debut * FPS)} playbackRate={vitesse} muted
        style={{ position: "absolute", left: -x * k, top: -y * k, width: taille[0] * k, height: taille[1] * k, maxWidth: "none", filter: filtre }}
      />
    </AbsoluteFill>
  );
};

/** Un extrait d'une vidéo du propriétaire (clips/, 9:16), qui remplit sa boîte. */
export const Extrait: React.FC<{ nom: string; debut?: number; vitesse?: number; style?: React.CSSProperties }> = ({ nom, debut = 0, vitesse = 1, style }) => (
  <Video
    src={staticFile(`clips/${nom}.mp4`)} trimBefore={Math.round(debut * FPS)} playbackRate={vitesse} muted objectFit="cover"
    style={{ width: "100%", height: "100%", ...style }}
  />
);

/** Des lettres pressées une à une (letterpress : grandes et floues → nettes), comme brand-ink-open. */
export const Lettres: React.FC<{ texte: string; a: number; pas?: number; style?: React.CSSProperties; couleurs?: Record<number, string> }> = ({
  texte, a, pas = 2.4, style, couleurs = {},
}) => {
  const f = useCurrentFrame();
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", whiteSpace: "pre", ...style }}>
      {texte.split("").map((ch, i) => {
        const t = de(f, a + i * pas, a + i * pas + 12, [0, 1], Easing.bezier(0.2, 0.7, 0.25, 1));
        return (
          <span key={i} style={{ display: "inline-block", opacity: t, transform: `scale(${1.6 - 0.6 * t})`, transformOrigin: "center bottom", filter: `blur(${(1 - t) * 6}px)`, color: couleurs[i] }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** Un cartouche de légende, comme ceux du site : papier neuf, double filet, Zen Antique ; il monte en se précisant. */
export const Cartouche: React.FC<{ a: number; fin?: number; children: React.ReactNode; taille?: number; style?: React.CSSProperties }> = ({
  a, fin = 1e9, children, taille = 50, style,
}) => {
  const f = useCurrentFrame();
  const e = de(f, a, a + 12);
  const s = lin(f, fin, fin + 6);
  return (
    <div
      style={{
        position: "absolute", padding: `${taille * 0.3}px ${taille * 0.62}px ${taille * 0.34}px`, backgroundColor: C.clair, backgroundImage: GRAIN,
        boxShadow: FILET, borderRadius: 3, font: `400 ${taille}px/1.08 ${TITRE}`, color: C.encre, whiteSpace: "nowrap",
        opacity: e * (1 - s), translate: `0 ${(1 - e) * 28 - s * 14}px`, filter: `blur(${(1 - e) * 8}px)`, ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Un sceau rouge (hanko) qui frappe le papier : il tombe en accélérant, s'écrase un peu, se pose de travers. */
export const Sceau: React.FC<{ a: number; texte: string; taille?: number; style?: React.CSSProperties }> = ({ a, texte, taille = 120, style }) => {
  const f = useCurrentFrame();
  const chute = de(f, a - 5, a, [0, 1], FRAPPE);
  const rebond = f < a ? 0 : Math.exp(-(f - a) / 3) * Math.sin((f - a) * 1.4);
  const k = f < a ? 2.4 - 1.4 * chute : 1 - 0.06 * rebond;
  const vertical = texte.length > 1;
  return (
    <div
      style={{
        position: "absolute", width: taille, height: vertical ? taille * 1.5 : taille, display: "grid", placeItems: "center",
        backgroundColor: C.rouge, color: C.clair, borderRadius: taille * 0.08, font: `400 ${taille * (vertical ? 0.5 : 0.62)}px/1 ${TITRE}`,
        writingMode: vertical ? "vertical-rl" : undefined, letterSpacing: vertical ? "0.08em" : undefined,
        boxShadow: `inset 0 0 0 ${taille * 0.045}px ${C.rouge}, inset 0 0 0 ${taille * 0.07}px ${C.clair}, 0 8px 20px rgba(60,20,10,.35)`,
        opacity: lin(f, a - 5, a - 3), scale: `${k}`, rotate: `${interpolate(chute, [0, 1], [-14, -5])}deg`, ...style,
      }}
    >
      {texte}
    </div>
  );
};

/** Le curseur (une flèche d'encre bordée de papier) : il glisse de clé en clé et touche aux images de « touches ». */
export const Curseur: React.FC<{ chemin: [number, number, number][]; touches?: number[]; taille?: number }> = ({ chemin, touches = [], taille = 46 }) => {
  const f = useCurrentFrame();
  let a = chemin[0], z = chemin[chemin.length - 1];
  for (let i = 0; i < chemin.length - 1; i++) if (f >= chemin[i][0] && f <= chemin[i + 1][0]) { a = chemin[i]; z = chemin[i + 1]; break; }
  if (f > chemin[chemin.length - 1][0]) a = z;
  const t = a[0] === z[0] ? 1 : de(f, a[0], z[0], [0, 1], Easing.bezier(0.45, 0, 0.2, 1));
  const x = a[1] + (z[1] - a[1]) * t, y = a[2] + (z[2] - a[2]) * t;
  const appui = Math.max(0, ...touches.map((c) => interpolate(f, [c - 2, c, c + 4], [0, 1, 0], borne)));
  const apparu = lin(f, chemin[0][0], chemin[0][0] + 6);
  return (
    <>
      {touches.map((c) => {
        const r = lin(f, c, c + 16);
        return f >= c && f < c + 16 ? (
          <div key={c} style={{ position: "absolute", left: x - 60 * r, top: y - 60 * r, width: 120 * r, height: 120 * r, borderRadius: "50%", border: `${5 - 3 * r}px solid ${C.rouge}`, opacity: 0.9 * (1 - r) }} />
        ) : null;
      })}
      <svg width={taille} height={taille} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 4, top: y - 2, overflow: "visible", opacity: apparu, scale: `${1 - 0.18 * appui}`, transformOrigin: "4px 2px", filter: "drop-shadow(0 4px 6px rgba(40,26,14,.4))" }}>
        <path d="M4 2 L4 20 L8.6 15.6 L11.6 22.4 L14.6 21.1 L11.7 14.4 L18 14.4 Z" fill={C.encre} stroke={C.clair} strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </>
  );
};

/** Le cœur des favoris (le même tracé que le site). */
export const Coeur: React.FC<{ taille?: number; couleur?: string; style?: React.CSSProperties }> = ({ taille = 40, couleur = C.rouge, style }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" style={{ overflow: "visible", ...style }}>
    <path d="M12 20.3s-7.4-4.5-9.2-9.1C1.5 7.8 3.7 4.6 7 4.6c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.3 0 5.5 3.2 4.2 6.6-1.8 4.6-9.2 9.1-9.2 9.1Z" fill={couleur} stroke={C.clair} strokeWidth={1.4} />
  </svg>
);

const POINTS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]], 2: [[0.27, 0.27], [0.73, 0.73]], 3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]], 5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.27, 0.22], [0.73, 0.22], [0.27, 0.5], [0.73, 0.5], [0.27, 0.78], [0.73, 0.78]],
};
/** Un dé en 3D (six faces de papier, points rouges), tourné de rx/ry/rz degrés. */
export const De3D: React.FC<{ s?: number; rx: number; ry: number; rz?: number; style?: React.CSSProperties }> = ({ s = 90, rx, ry, rz = 0, style }) => {
  const faces: [number, string][] = [
    [1, `translateZ(${s / 2}px)`], [6, `rotateY(180deg) translateZ(${s / 2}px)`], [2, `rotateY(90deg) translateZ(${s / 2}px)`],
    [5, `rotateY(-90deg) translateZ(${s / 2}px)`], [3, `rotateX(90deg) translateZ(${s / 2}px)`], [4, `rotateX(-90deg) translateZ(${s / 2}px)`],
  ];
  return (
    <div style={{ position: "absolute", width: s, height: s, perspective: 900, ...style }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
        {faces.map(([n, tr]) => (
          <div key={n} style={{ position: "absolute", inset: 0, transform: tr, backfaceVisibility: "hidden", backgroundColor: C.clair, backgroundImage: GRAIN, borderRadius: s * 0.16, boxShadow: `inset 0 0 0 ${s * 0.03}px ${C.trait}, inset 0 0 ${s * 0.18}px rgba(138,107,69,.35)` }}>
            {POINTS[n].map(([px, py], i) => (
              <div key={i} style={{ position: "absolute", left: px * s - s * 0.09, top: py * s - s * 0.09, width: s * 0.18, height: s * 0.18, borderRadius: "50%", backgroundColor: n === 1 ? C.rouge : C.encre }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Le grain du papier et un léger vignettage brun, sur toute l'image. */
export const Grain: React.FC<{ force?: number }> = ({ force = 1 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.35 * force, mixBlendMode: "multiply" }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 78% 72% at 50% 50%, transparent 60%, rgba(60,38,18,${0.42 * force}))` }} />
  </AbsoluteFill>
);

/** Les sources de la carte (licences d'OpenStreetMap et de Mapterhorn), sur chaque image de la carte. */
export const Sources: React.FC<{ nuit?: boolean }> = ({ nuit }) => (
  <div style={{ position: "absolute", right: 24, bottom: 16, font: `400 18px ${SANS}`, color: nuit ? "rgba(255,255,255,.62)" : "rgba(53,37,26,.7)", textShadow: nuit ? "0 1px 3px rgba(0,0,0,.8)" : "0 0 4px rgba(246,238,219,.9)" }}>
    © OpenStreetMap · Mapterhorn · Natural Earth
  </div>
);

/** Une coupe rapide : l'image d'avant file de côté en se brouillant (whip), posée sur la fin d'un plan. */
export const Fuite: React.FC<{ duree: number; sortie?: number; sens?: 1 | -1; children: React.ReactNode }> = ({ duree, sortie = 6, sens = -1, children }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [duree - sortie, duree], [0, 1], { ...borne, easing: Easing.in(Easing.cubic) });
  return <AbsoluteFill style={{ translate: `${sens * 300 * t}px 0`, filter: t > 0 ? `blur(${26 * t}px)` : undefined }}>{children}</AbsoluteFill>;
};

/** Une entrée rapide : l'image arrive de côté en se précisant (le pendant de Fuite). */
export const Arrivee: React.FC<{ entree?: number; sens?: 1 | -1; children: React.ReactNode }> = ({ entree = 6, sens = 1, children }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, entree], [1, 0], { ...borne, easing: Easing.out(Easing.cubic) });
  return <AbsoluteFill style={{ translate: `${sens * 300 * t}px 0`, filter: t > 0 ? `blur(${26 * t}px)` : undefined }}>{children}</AbsoluteFill>;
};

export { ELAN };
