// La vidéo « tunnel » : un TikTok → le profil → le lien de la bio → la carte (30 s, 9:16, 60 images/s).
// Le téléphone (0 → 8,9 s), puis le blanc du lien s'ouvre sur la carte (un rectangle arrondi qui s'agrandit depuis le
// point visé), la carte et ses fonctions, la fin. Le flou de mouvement (8 sous-images par image) seulement pendant les
// mouvements rapides : le glissement vers le profil, le plongeon (14), les panoramiques éclair, le recul final.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Carte } from "./Carte";
import { Fin } from "./Fin";
import { Son } from "./Son";
import { Telephone } from "./Telephone";
import { entre, expoSortie, s } from "./theme";
import { T } from "./temps";

const FLOU_MOUVEMENT: [number, number][] = [
  [s(3.02), s(3.7)], [s(7.78), s(8.98)], [T.fouet1[0] - 2, T.fouet1[1] + 4], [T.fouet2[0] - 2, T.fouet2[1] + 4], [T.fin, T.fin + s(0.6)],
];

const Plans: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const p = expoSortie(entre(f, T.portail[0], T.portail[1]));
  const clip = p >= 1 ? undefined : `inset(${(900 * (1 - p)).toFixed(1)}px ${(540 * (1 - p)).toFixed(1)}px ${(1020 * (1 - p)).toFixed(1)}px ${(540 * (1 - p)).toFixed(1)}px round ${(80 * (1 - p) + 4).toFixed(1)}px)`;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {f < T.portail[1] + 3 && <Telephone />}
      {f >= T.carte - 1 && <AbsoluteFill style={{ clipPath: clip }}><Carte /></AbsoluteFill>}
      <Fin bgm={bgm} />
    </AbsoluteFill>
  );
};

export const Tunnel: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU_MOUVEMENT.some(([a, z]) => f >= a && f <= z);
  const plongeon = f >= FLOU_MOUVEMENT[1][0] && f <= FLOU_MOUVEMENT[1][1]; // le zoom avance beaucoup à chaque image : plus de sous-images
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {flou ? <CameraMotionBlur shutterAngle={plongeon ? 200 : 250} samples={plongeon ? 14 : 8}><Plans bgm={bgm} /></CameraMotionBlur> : <Plans bgm={bgm} />}
      <Son bgm={bgm} />
    </AbsoluteFill>
  );
};
