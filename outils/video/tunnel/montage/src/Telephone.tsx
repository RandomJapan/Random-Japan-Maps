// La première partie (0 → 8,9 s) : le téléphone en perspective, une caméra continue. Elle observe le post Aogashima,
// glisse latéralement vers le profil (la vidéo part à gauche, le profil arrive de droite), flotte pour montrer la 3D
// des calques, va vers le lien de la bio, prend son élan (recul de 4 %) et plonge dedans : le zoom est multiplicatif
// (×0,96 × 50^E(u), E(u) = (e^(4u) − 1)/(e^4 − 1)), le lien blanchit et devient l'écran. Le fond est la vidéo,
// floue (le bokeh du brief) ; aucun mouvement n'est linéaire.
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { Doigt, PagePost, PageProfil } from "./TikTok";
import { cles, entre, expoS, expoSortie, houle, plongee, rebond, s } from "./theme";
import { T } from "./temps";

const doux = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));
// le point de l'écran où la caméra pose son point de visée (ox, oy : en px de la page, 1080 × 2340)
const VISEE_X = 540, VISEE_Y = 900;

function camera(f: number) {
  const intro = rebond(f + 2, 0); // le téléphone arrive des profondeurs (déjà en route à la première image)
  let sc = cles(f, [[0, 0.6], [s(2.5), 0.645, doux], [s(2.95), 0.8], [s(3.1), 0.8], [s(3.62), 0.665], [s(6.15), 0.72, doux], [s(7.3), 1.06]]);
  sc *= 0.8 + 0.2 * intro;
  const ox = cles(f, [[0, 540], [s(2.5), 540], [s(2.95), 330], [s(3.1), 330], [s(3.62), 540], [s(6.15), 540], [s(7.3), 400]]);
  const oy = cles(f, [[0, 1170], [s(2.5), 1170], [s(2.95), 1890], [s(3.1), 1890], [s(3.62), 1170], [s(6.15), 1110, doux], [s(7.3), 974]]);
  // le flottement : une houle lente qui s'éteint avant le plongeon
  const calme = 1 - entre(f, s(7.0), s(7.6));
  const ry = cles(f, [[0, -14], [s(2.5), -8, doux], [s(2.95), -4], [s(3.1), -4], [s(3.62), 10], [s(6.15), -7, doux], [s(7.3), -2], [s(7.8), 0]])
    + 1.6 * houle(f, 3.1) * calme;
  const rx = cles(f, [[0, 10], [s(2.95), 5, doux], [s(3.1), 5], [s(3.62), 11], [s(6.15), 6, doux], [s(7.3), 3], [s(7.8), 0]])
    + 16 * (1 - intro) + 1.1 * houle(f, 4.3, 1) * calme;
  // l'élan, puis le plongeon
  if (f >= T.elan[0] && f < T.plonge[0]) sc = 1.06 * (1 - 0.04 * expoSortie(entre(f, T.elan[0], T.elan[1])));
  if (f >= T.plonge[0]) sc = 1.06 * 0.96 * Math.pow(50, plongee(entre(f, T.plonge[0], T.plonge[1])));
  return { sc, ox, oy, rx, ry };
}

/** Le fond : la vidéo du post, très floue et assombrie (la profondeur de champ), et des taches de lumière. */
const Fond: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0b1418" }}>
      {/* (le profil couvre tout l'écran à partir de 7,4 s : la vidéo n'est plus demandée, surtout pas pendant le
          flou de mouvement du plongeon, qui en demandait 14 images à la fois) */}
      {f < s(7.4) && (
        <OffthreadVideo src={staticFile("tiktok/aogashima-flou.mp4")} muted
          style={{ position: "absolute", inset: 0, width: 1080, height: 1920, objectFit: "cover", transform: "scale(1.35)", filter: "blur(14px) brightness(.5) saturate(1.25)" }} />
      )}
      {[[180, 330, 260, 0], [880, 520, 200, 1.3], [760, 1560, 300, 2.1], [240, 1380, 180, 3.4], [560, 1820, 240, 4.2]].map(([x, y, r, p], i) => (
        <div key={i} style={{
          position: "absolute", left: x + 30 * houle(f, 6 + i, p), top: y + 40 * houle(f, 7 + i, p + 1), width: r, height: r, borderRadius: "50%",
          transform: "translate(-50%, -50%)", background: "radial-gradient(rgba(255,255,255,.16), rgba(255,255,255,0) 70%)",
        }} />
      ))}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 40%, rgba(0,0,0,.55))" }} />
    </AbsoluteFill>
  );
};

export const Telephone: React.FC = () => {
  const f = useCurrentFrame();
  const { sc, ox, oy, rx, ry } = camera(f);
  const g = expoS(entre(f, T.glisse[0], T.glisse[1])); // les pages glissent
  const kz = 1 - expoSortie(entre(f, T.elan[0], T.elan[1])); // les calques s'aplatissent avant le plongeon
  const lien = entre(f, T.surbrillance, T.surbrillance + s(0.4));
  const plonge = entre(f, T.plonge[0], T.plonge[1]);
  const blanc = entre(f, s(8.48), s(8.6)); // l'écran est tout blanc à la fin du plongeon
  return (
    <AbsoluteFill>
      <Fond />
      <AbsoluteFill style={{ perspective: 2600, perspectiveOrigin: `${VISEE_X}px ${VISEE_Y}px` }}>
        <div style={{
          position: "absolute", left: VISEE_X, top: VISEE_Y, width: 0, height: 0, transformStyle: "preserve-3d",
          transform: `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale(${sc.toFixed(5)}) translate(${-ox}px, ${-oy}px)`,
        }}>
          {f < T.glisse[1] + 2 && (
            <div style={{ position: "absolute", transformStyle: "preserve-3d", transformOrigin: "540px 1170px",
              transform: `translate3d(${(-1350 * g).toFixed(1)}px, 0, ${(-260 * g).toFixed(1)}px) rotateY(${(32 * g).toFixed(2)}deg)` }}>
              <PagePost kz={kz} />
            </div>
          )}
          {f >= T.glisse[0] && (
            <div style={{ position: "absolute", transformStyle: "preserve-3d", transformOrigin: "540px 1170px",
              transform: `translate3d(${(1350 * (1 - g)).toFixed(1)}px, 0, ${(-260 * (1 - g)).toFixed(1)}px) rotateY(${(-32 * (1 - g)).toFixed(2)}deg)` }}>
              <PageProfil kz={kz} lien={lien} appuye={f >= T.tapLien && f < T.tapLien + 9} plonge={plonge} />
            </div>
          )}
          <Doigt chemin={[[s(2.42), 760, 2280], [s(2.92), 330, 1882]]} appui={T.tapNom} clair />
          <Doigt chemin={[[s(6.85), 860, 1420], [s(7.42), 420, 974]]} appui={T.tapLien} />
        </div>
      </AbsoluteFill>
      {blanc > 0 && <AbsoluteFill style={{ background: "#fff", opacity: blanc }} />}
    </AbsoluteFill>
  );
};
