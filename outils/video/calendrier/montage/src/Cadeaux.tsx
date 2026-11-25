// La promo du calendrier de l'Avent de la carte, « les cadeaux sont vrais » (2026-11-23 ; le propriétaire a filmé les cadeaux
// imprimés : « tu peux te servir de ça pour faire des vidéos pour le calendrier de l'Avent et toutes les fonctionnalités »).
// 21,4 s, 9:16, 60 images/s, en anglais. Le format « créateur » (la vidéo du jeu du 2026-11-10) : l'histoire à la première
// personne dans les bulles natives de TikTok, un enregistrement d'écran du vrai calendrier (rushes.py : cv-cases, le 15 décembre)
// et les vrais plans du propriétaire, sur le second refrain de « Yuki akari », la musique de Noël de la carte.
// Chaque case ouverte à l'écran devient, à la coupe, le vrai cadeau imprimé : la 9 (papier origami → la grue pliée), la 3
// (le calendrier 2027 au mur), la 15 (la carte de vœux écrite et glissée sous une porte). Le découpage : ../plan.md.
// 96 battements par minute : le temps n tombe à l'image 37,5 n.
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { entre, FPS, s } from "./theme";
import { Bulle, Effet, Plan, Plans, Son } from "./Commun";

const b = (n: number) => Math.round(n * 37.5);
export const DUREE_CADEAUX = s(21.4); // 32 temps, puis l'accord de ré qui résonne et s'efface

/** Un zoom lent de monteur, de z0 à z1 sur le plan, autour de (x, y). */
const pousse = (de: number, a: number, z0: number, z1: number, x = 540, y = 960) => (f: number): [number, number, number] =>
  [z0 + (z1 - z0) * entre(f, de, a), x, y];

// la prise du calendrier (et ses 24 cases à la fin, b(28)) : t0 = la seconde de la prise au début du plan (les appuis de plans.js : le bouton 0,31 s, la case 9 à
// 1,25 s, Download 3,13 s ; la 3 à 4,69 s, Download 6,56 s ; la 15 à 8,13 s, Download 10 s)
const ECRAN: [number, number, number][] = [[b(4), b(8.5), 0.75], [b(12.5), b(16.75), 4.3], [b(19.25), b(23.5), 7.75]];
// le pliage en six coupes d'un tiers de temps
const PLIS = [1, 2, 3, 4, 5, 6].map((k, i): Plan => ({ de: b(9.5 + i / 3), a: b(9.5 + (i + 1) / 3), src: `clips/p-pli-${k}.mp4`, t0: 0.2 }));

const PLANS: Plan[] = [
  { de: 0, a: b(4), src: "clips/p-grue.mp4", t0: 0, zoom: pousse(0, b(4), 1, 1.06) },
  { de: b(4), a: b(8.5), src: "rushes/cv-cases.mp4", t0: ECRAN[0][2] },
  { de: b(8.5), a: b(9.5), src: "clips/p-papier.mp4", t0: 0.3, v: 1.2, zoom: pousse(b(8.5), b(9.5), 1.08, 1) },
  ...PLIS,
  { de: b(11.5), a: b(12.5), src: "clips/p-grue-finie.mp4", t0: 0.8, zoom: pousse(b(11.5), b(12.5), 1, 1.05) },
  { de: b(12.5), a: b(16.75), src: "rushes/cv-cases.mp4", t0: ECRAN[1][2] },
  { de: b(16.75), a: b(18), src: "clips/p-calendrier.mp4", t0: 0.3, zoom: pousse(b(16.75), b(18), 1, 1.05) },
  { de: b(18), a: b(19.25), src: "clips/p-crayon.mp4", t0: 0.8, v: 1.6 },
  { de: b(19.25), a: b(23.5), src: "rushes/cv-cases.mp4", t0: ECRAN[2][2] },
  { de: b(23.5), a: b(24.5), src: "clips/p-voeux-carte.mp4", t0: 0.2, zoom: pousse(b(23.5), b(24.5), 1.06, 1) },
  { de: b(24.5), a: b(25.5), src: "clips/p-voeux-ecrire.mp4", t0: 0.4, v: 2 },
  { de: b(25.5), a: b(26.5), src: "clips/p-voeux-texte.mp4", t0: 0.15 },
  { de: b(26.5), a: b(28), src: "clips/p-porte.mp4", t0: 0.2, v: 2.2 },
  { de: b(28), a: b(29.5), src: "rushes/cv-cases.mp4", t0: 11.3 }, // les 24 cases, toutes celles du 15 ouvertes
  { de: b(29.5), a: DUREE_CADEAUX, src: "clips/p-pouce.mp4", t0: 0 },
];

const TEXTES: { texte: string; de: number; a: number; y: number; taille?: number }[] = [
  { texte: "I put an Advent calendar\non my Japan map 🎄", de: 0, a: b(4.8), y: 260 },
  { texte: "day 9: origami paper\nto fold a crane ✨", de: b(4.8), a: b(12.5), y: 300 },
  { texte: "day 3: a 2027 calendar\nof Japan to print 📅", de: b(12.5), a: b(19.25), y: 300 },
  { texte: "day 15: a Japanese\nNew Year card 🎍", de: b(19.25), a: b(26.5), y: 300 },
  { texte: "24 free gifts\nfrom December 1st 🎁", de: b(26.5), a: b(29.5), y: 300 },
  { texte: "on my Japan map 🗺️\nlink in bio", de: b(29.5), a: DUREE_CADEAUX, y: 300 },
  // l'adresse écrite (le marketing, 2026-11-25 : les liens ne sont pas cliquables dans les Shorts YouTube) : sous le visage,
  // au-dessus de la légende de TikTok (y < 1420)
  { texte: "map.randomjapanplace.com", de: b(29.5), a: DUREE_CADEAUX, y: 1250, taille: 54 },
];

// ---------------------------------------------------------------- le son : les appuis de la prise, une petite réponse quand une case s'ouvre
const APPUIS_PRISE = [0.3125, 1.25, 3.125, 4.6875, 6.5625, 8.125, 10.0];
const PORTES = [1.25, 4.6875, 8.125];
const enVideo = (t: number) => ECRAN.map(([de, a, t0]) => de / FPS + (t - t0)).find((v, i) => v * FPS >= ECRAN[i][0] && v * FPS < ECRAN[i][1] - 6);
const EFFETS: Effet[] = [
  ...APPUIS_PRISE.map((t) => enVideo(t)).filter((v): v is number => v !== undefined).map((v): Effet => [v, "cr-appui.wav", 0.28]),
  ...PORTES.map((t) => enVideo(t)).filter((v): v is number => v !== undefined).map((v): Effet => [v + 0.45, "cr-reponse.wav", 0.16, 1.6]),
  [b(8.5) / FPS - 0.05, "paper-move-quick.mp3", 0.18],
  [b(26.5) / FPS, "paper-slide.mp3", 0.2, 1.2],
];

export const Cadeaux: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Plans plans={PLANS} />
    {TEXTES.map((t, i) => <Bulle key={i} {...t} />)}
    <Son bgm={bgm} musique="musique/refrain.wav" volume={0.5} effets={EFFETS} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- la miniature : la grue, le calendrier, la carte de vœux, la première bulle
export const MiniatureCadeaux: React.FC = () => {
  const case_ = (src: string, t: number, x: number, y: number, l: number, h: number, z = 1) => (
    <div style={{ position: "absolute", left: x, top: y, width: l, height: h, overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(src)} muted trimBefore={s(t)} style={{ width: 1080 * z * (l / 1080), height: 1920 * z * (l / 1080), objectFit: "cover",
        marginLeft: -(1080 * z * (l / 1080) - l) / 2, marginTop: -(1920 * z * (l / 1080) - h) / 2 }} />
    </div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {case_("clips/p-grue.mp4", 1.2, 0, 0, 1080, 1100)}
      {case_("clips/p-calendrier.mp4", 0.8, 0, 1106, 537, 814, 1.15)}
      {case_("clips/p-voeux-carte.mp4", 1.0, 543, 1106, 537, 814, 1.15)}
      <Bulle texte={"I put an Advent calendar\non my Japan map 🎄"} de={0} a={1} y={470} taille={68} />
      <Bulle texte={"…and the gifts are real 🎁"} de={0} a={1} y={960} taille={60} />
    </AbsoluteFill>
  );
};
