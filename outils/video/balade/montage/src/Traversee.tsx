// Vidéo 8 (2026-11-02) : Udo et Yakushima, ouverts à tout le monde ce jour-là : deux lieux qui n'en font qu'un. Il faut les cinq
// tampons d'Udo pour que le batelier nous emmène, et l'île n'apparaît sur la carte qu'après la traversée. Le format change un peu
// (le propriétaire) : une accroche dans les trois premières secondes. La forêt qui a inspiré Princesse Mononoké (le vrai sentier
// de mousse, glissé dans le sentier du jeu), et elle est fermée : des chaînes et un cadenas tombent dessus, la musique se coupe.
// Puis, dans l'ordre demandé : Udo (la grotte, les boules de chance, le lapin, les torii, le dernier tampon et la cape de plumes),
// le batelier (les cinq tampons, le cadenas s'ouvre), la carte de la traversée ; Yakushima (le port, le pont suspendu, le singe et
// le cerf, le cœur de ciel, le Jōmon Sugi, la cape du loup) ; le secret, montré sans être résolu (la nuit : un petit esprit, le vieux
// cèdre creux, un aperçu du grand cerf) ; le petit esprit qui nous suit et saute sur le dos du compagnon ; la fin. Sur l'air
// d'Udo (100 battements) et celui de Yakushima (92) : le second commence pendant la traversée, sa mélodie entre à l'arrivée.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoEntree, expoSortie, rebond, s } from "./theme";

const BU = 60 / 100, BY = 60 / 92; // (s) un temps de l'air d'Udo, de l'air de Yakushima
/** L'accroche : le cadenas tombe sur « locked » (à 2,92 s, mesuré sur la voix), Udo commence à T1. */
const CADENAS = 2.92, T1 = 3.6;
const secU = (n: number) => T1 + n * BU;
const T2 = secU(28); // la traversée (cinq temps de l'air de Yakushima)
const T3 = T2 + 5 * BY; // l'arrivée à Yakushima : la mélodie de son air entre là
const secY = (n: number) => T3 + n * BY;
const u = (n: number) => s(secU(n));
const y = (n: number) => s(secY(n));
export const LONGUEUR = y(41) + s(4.6);

export const PLANS: Plan[] = [
  // l'accroche : le vrai sentier de mousse, puis le sentier du jeu, sous l'arche de racines du Kuguri-sugi
  { de: 0, a: u(0), prise: "yk-foret", t: 0.3, zoom: [1.0, 1.04], reel: { lieu: "yk-mousse", t: 0, volet: s(2.0) } },
  // Udo
  { de: u(0), a: u(7), prise: "ud-grotte", t: 0.3, entree: "fouet", reel: { lieu: "ud-grotte", t: 0, volet: s(3 * BU) } },
  // (la boule part à 1,85 s de la prise, elle tombe dans le creux à 2,8 s)
  { de: u(7), a: u(10), prise: "ud-boule", t: 1.2, entree: "fouet", reel: { lieu: "ud-tortue", t: 0, volet: s(0.45) } },
  // (le lapin luit à 0,9 s de la prise)
  { de: u(10), a: u(13), prise: "ud-lapin", t: 0.2, entree: "fouet", reel: { lieu: "ud-ema", t: 0, volet: s(0.45) } },
  { de: u(13), a: u(17), prise: "ud-torii", t: 0.6, entree: "fouet", reel: { lieu: "ud-torii", t: 0, volet: s(BU) } },
  // (le dernier tampon à 7,5 s de la prise, la carte de la récompense jusqu'à 14,25 s, le nuage et la cape à 15,2 s)
  { de: u(17), a: u(20), prise: "ud-cape", t: 7.0, entree: "fouet" },
  { de: u(20), a: u(20.75), prise: "ud-cape", t: 13.4, entree: "punch" },
  { de: u(20.75), a: u(22), prise: "ud-cape", t: 15.05, entree: "punch" },
  { de: u(22), a: u(24), prise: "ud-plumes", t: 0.4, entree: "punch" },
  { de: u(24), a: u(28), prise: "ud-batelier", t: 0.3, entree: "fouet" },
  // la traversée : le bateau part à 1 s de la prise et arrive à 7,5 s ; deux fois plus vite
  { de: u(28), a: y(0), prise: "ud-traversee", t: 0.95, vitesse: 2, entree: "fouet" },
  // Yakushima
  { de: y(0), a: y(4), prise: "yk-port", t: 0.3, entree: "fouet", reel: { lieu: "yk-baie", t: 0, volet: s(BY) } },
  { de: y(4), a: y(7), prise: "yk-pont", t: 0.3, entree: "fouet", reel: { lieu: "yk-pont", t: 0, volet: s(BY) } },
  { de: y(7), a: y(10.5), prise: "yk-singe", t: 0.3, entree: "fouet", zoom: [1.1, 1.16], centre: [0.5, 0.45], reel: { lieu: "yk-singe", t: 0, volet: s(BY) } },
  { de: y(10.5), a: y(14), prise: "yk-coeur", t: 0.7, entree: "fouet" },
  { de: y(14), a: y(17.5), prise: "yk-jomon", t: 0.3, entree: "fouet", reel: { lieu: "yk-tronc", t: 0, volet: s(BY) } },
  { de: y(17.5), a: y(20.5), prise: "yk-loup", t: 0.7, entree: "fouet" },
  // le secret, la nuit (un peu éclaircie : sur un téléphone, la nuit du jeu est sombre)
  { de: y(20.5), a: y(23.5), prise: "yk-nuit", t: 0.3, entree: "fouet", luminosite: 1.45 },
  { de: y(23.5), a: y(26.5), prise: "yk-esprit", t: 0.3, entree: "fouet", luminosite: 1.25 },
  { de: y(26.5), a: y(29.5), prise: "yk-creux", t: 2.7, vitesse: 3.2, entree: "fouet", luminosite: 1.4 },
  { de: y(29.5), a: y(34.5), prise: "yk-cerf", t: 0.3, entree: "punch" },
  // le petit esprit qui nous suit, de jour
  { de: y(34.5), a: y(38), prise: "yk-ami", t: 1.6, entree: "fouet" },
  { de: y(38), a: y(41), prise: "yk-dos", t: 0.6, entree: "punch" },
  { de: y(41), a: LONGUEUR, prise: "yk-fin", t: 1.2, entree: "fouet" },
];

// Les niveaux des vidéos d'avant : les bruitages à −4 dB (DOUX), les ambiances 20 dB sous la voix.
const DOUX = 0.6;

// Chaque morceau de réplique (voix.py) tombe avec son texte à l'écran ; Son vérifie qu'ils ne se superposent pas.
const BANDE: Bande = {
  musique: [
    // l'accroche : l'air de Yakushima, un peu avant sa mélodie : son 4e temps tombe sur le cadenas, où il se coupe net
    { fichier: "yakushima.wav", debut: 0.15 + 8 * BY - (CADENAS - 4 * BY), volume: 2.1, a: CADENAS },
    // Udo, depuis l'entrée de sa mélodie
    { fichier: "udo.wav", debut: 0.15 + 8 * BU, volume: 2.5, de: T1, a: T2 + 0.15 },
    // la traversée : les temps 3 à 7 de l'introduction de Yakushima, plus douce (18 dB sous la voix au même volume) ; sa mélodie entre à l'arrivée
    { fichier: "yakushima.wav", debut: 0.15 + 3 * BY, volume: 3.0, de: T2, a: T3 + 0.05 },
    { fichier: "yakushima.wav", debut: 0.15 + 8 * BY, volume: 2.1, de: T3 },
  ],
  voix: [
    // (sept morceaux sortis de Flora plus bas que les autres, remontés : « and it's locked » et « But this forest has a secret », 5 dB sous les autres)
    ["i1a", 0], ["i1b", 2.4, 1.6],
    ["i2a", T1 + 0.05], ["i2b", T1 + 2.4],
    ["i3a", secU(7) + 0.04], ["i3b", secU(10) + 0.04, 1.25], ["i3c", secU(13) + 0.04],
    ["i4a", secU(17) + 0.05], ["i4b", secU(20) + 0.05],
    ["i5", secU(24) + 0.04], ["i6", T2 + 0.03],
    ["i7a", T3 + 0.03], ["i7b", T3 + 0.8], ["i7c", secY(4) + 0.04, 1.3], ["i7d", secY(7) + 0.04], ["i7e", secY(10.5) + 0.04, 1.25], ["i7f", secY(14) + 0.04], ["i8", secY(17.5) + 0.04],
    ["i9a", secY(20.5) + 0.04, 1.6], ["i9b", secY(23.5) + 0.06, 1.3], ["i9c", secY(26.5) + 0.04], ["i9d", secY(29.5) + 0.04], ["i10", secY(29.5) + 2.2],
    ["i11a", secY(34.5) + 0.04, 1.35], ["i11b", secY(38) + 0.04],
    ["i12a", secY(41) + 0.3], ["i12b", secY(41) + 1.5], ["i12c", secY(41) + 2.4],
  ],
  durees: {
    i1a: 2.31, i1b: 1.11, i2a: 2.25, i2b: 1.69, i3a: 1.66, i3b: 0.86, i3c: 1.83, i4a: 1.38, i4b: 1.95, i5: 2.26, i6: 3.06,
    i7a: 0.63, i7b: 1.42, i7c: 1.38, i7d: 1.94, i7e: 2.13, i7f: 2.1, i8: 1.65, i9a: 1.88, i9b: 1.41, i9c: 1.8, i9d: 2.04, i10: 0.88,
    i11a: 1.98, i11b: 1.77, i12a: 1.09, i12b: 0.77, i12c: 0.87,
  },
  sfx: ([
    // les fonds : le vent dans la forêt ; les vagues à Udo ; la nuit, les insectes
    [0.0, "sfx-jeu/boucle-feuilles.wav", 0.04, T1],
    [T1, "sfx-jeu/boucle-vagues.wav", 0.04, T2 - T1],
    [T3, "sfx-jeu/boucle-feuilles.wav", 0.04, secY(20.5) - T3],
    [secY(20.5) - 0.2, "sfx-jeu/boucle-insectes.wav", 0.04, secY(34.5) - secY(20.5) + 0.2],
    [secY(34.5), "sfx-jeu/boucle-feuilles.wav", 0.04, secY(41) - secY(34.5)],
    // l'accroche : le volet, les chaînes, le cadenas
    [1.95, "sfx/shimmer-sparkle-sweep.mp3", 0.65], [2.0, "sfx-jeu/magie.wav", 0.4],
    [CADENAS - 0.16, "sfx-jeu/chaine.wav", 0.8], [CADENAS, "sfx-jeu/verrou.wav", 1.3, 0.9], [CADENAS, "sfx/bass-hit-short.mp3", 0.5],
    // Udo : un panoramique éclair à chaque plan
    [T1 - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secU(3) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [secU(7) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secU(7) + 0.4, "sfx/shimmer-sparkle-sweep.mp3", 0.5], [secU(7) + 0.75, "sfx-jeu/piece.wav", 0.6], [secU(7) + 1.6, "sfx-jeu/caillou.wav", 0.9],
    [secU(10) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secU(10) + 0.4, "sfx/shimmer-sparkle-sweep.mp3", 0.5], [secU(10) + 0.75, "sfx-jeu/magie.wav", 0.45],
    [secU(13) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secU(14) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [secU(17) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secU(17) + 0.42, "sfx-jeu/pression.wav", 0.38], [secU(17) + 0.54, "sfx-jeu/tampon.wav", 0.45],
    [secU(20) + 0.05, "sfx-jeu/cadeau.wav", 0.5], [secU(20.75) + 0.12, "sfx-jeu/pouf.wav", 0.4],
    [secU(24) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    // le batelier : les cinq tampons, sur les demi-temps ; le cadenas s'ouvre ; la corne du bateau
    ...[0, 1, 2, 3, 4].map((k): [number, string, number] => [secU(25) + k * BU / 2, "sfx-jeu/tampon.wav", 0.4]),
    [secU(27.5), "sfx-jeu/deverrou.wav", 1.0], [secU(27.5) + 0.05, "sfx-jeu/chaine.wav", 0.55],
    [T2 - 0.14, "sfx/whoosh-fast.mp3", 0.5], [T2 - 0.2, "sfx-jeu/oiseau-corne.wav", 0.28, 2.6],
    [T3 - 0.6, "sfx-jeu/oiseau-corne.wav", 0.2, 2.2],
    // Yakushima
    [T3 - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secY(1) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [secY(4) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secY(5) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [secY(7) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secY(8) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6], [secY(8) + 0.4, "sfx-jeu/oiseau-singe.wav", 0.35],
    [secY(10.5) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secY(10.5) + 0.75, "sfx-jeu/magie.wav", 0.45], [secY(10.5) + 0.75, "sfx/sparkle-touch.mp3", 0.5],
    [secY(14) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secY(15) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [secY(17.5) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secY(17.5) + 0.55, "sfx-jeu/cadeau.wav", 0.5],
    // le secret
    [secY(20.5) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secY(20.5) + 0.2, "sfx/light-spell.mp3", 0.18, 2.0],
    [secY(23.5) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secY(23.5) + 0.5, "sfx-jeu/oiseau-esprit.wav", 0.6], [secY(23.5) + 1.3, "sfx-jeu/oiseau-esprit.wav", 0.5],
    [secY(26.5) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secY(26.5) + 0.5, "sfx-jeu/oiseau-esprit.wav", 0.4], [secY(26.5) + 1.1, "sfx-jeu/oiseau-esprit.wav", 0.4], [secY(26.5) + 1.5, "sfx-jeu/magie.wav", 0.4],
    [secY(29.5), "sfx/bass-hit-short.mp3", 0.3], [secY(29.5) + 0.2, "sfx-jeu/oiseau-cerf.wav", 0.32, 2.6],
    // le petit esprit
    [secY(34.5) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [secY(34.5) + 0.8, "sfx-jeu/oiseau-esprit.wav", 0.4],
    [secY(38) + 0.5, "sfx-jeu/oiseau-esprit.wav", 0.55], [secY(38) + 0.92, "sfx/pop.mp3", 0.5],
    // la fin
    [secY(41) - 0.14, "sfx/whoosh-fast.mp3", 0.4], [secY(41) + 0.25, "sfx/bass-hit-short.mp3", 0.27], [secY(41) + 0.3, "sfx/pop.mp3", 0.27],
  ] as Bande["sfx"]).map(([a, nom, v, d]): Bande["sfx"][number] => (d === undefined ? [a, nom, v * DOUX] : [a, nom, v, d])),
};

// ---------------------------------------------------------------- le cadenas
/** Une chaîne, de la longueur du cadre : un maillon de face, un de profil. angle : son inclinaison ; x, y : son milieu ; decale :
 *  où elle en est de son arrivée (px le long d'elle-même). */
const Chaine: React.FC<{ angle: number; x: number; y: number; decale: number; opacite?: number }> = ({ angle, x, y: yy, decale, opacite = 1 }) => {
  const P = 86, n = 40;
  return (
    <svg width={P * n} height={120} viewBox={`0 0 ${P * n} 120`} style={{ position: "absolute", left: x - (P * n) / 2, top: yy - 60, opacity: opacite, transform: `rotate(${angle}deg) translateX(${decale.toFixed(1)}px)`, filter: "drop-shadow(0 12px 14px rgba(0,0,0,.55))" }}>
      {[...Array(n)].map((_, i) => (i % 2 === 0
        ? <rect key={i} x={i * P - 16} y={26} width={P + 32} height={68} rx={34} fill="none" stroke={C.encre} strokeWidth={22} />
        : <rect key={i} x={i * P - 22} y={49} width={P + 44} height={22} rx={11} fill="#6a5e58" stroke={C.encre} strokeWidth={6} />
      ))}
      {[...Array(n)].map((_, i) => (i % 2 === 0 ? <rect key={i} x={i * P - 16} y={26} width={P + 32} height={68} rx={34} fill="none" stroke="#8d8078" strokeWidth={8} /> : null))}
    </svg>
  );
};

/** Le cadenas, dans le style de la boîte de dialogue de la balade : papier crème, trait d'encre, filet rouge ; ouvert : de 0 (fermé)
 *  à 1 (l'anse levée et tournée). */
const CorpsCadenas: React.FC<{ taille: number; ouvert?: number }> = ({ taille, ouvert = 0 }) => (
  <svg width={taille} height={taille * 1.22} viewBox="0 0 200 244" style={{ overflow: "visible", filter: "drop-shadow(0 22px 34px rgba(0,0,0,.55))" }}>
    <g transform={`translate(${(150 * ouvert).toFixed(1)} 0) translate(0 ${(-30 * ouvert).toFixed(1)}) rotate(${(40 * ouvert).toFixed(1)} 150 110)`}>
      <path d="M50 118 V72 a50 50 0 0 1 100 0 V118" fill="none" stroke={C.encre} strokeWidth={34} strokeLinecap="butt" />
      <path d="M50 118 V72 a50 50 0 0 1 100 0 V118" fill="none" stroke="#a79a90" strokeWidth={16} strokeLinecap="butt" />
    </g>
    <rect x={12} y={104} width={176} height={132} rx={24} fill={C.papier} stroke={C.encre} strokeWidth={9} />
    <rect x={24} y={116} width={152} height={108} rx={15} fill="none" stroke={C.rouge} strokeWidth={6} />
    <circle cx={100} cy={158} r={17} fill={C.encre} />
    <path d="M91 166 L85 200 H115 L109 166 Z" fill={C.encre} />
  </svg>
);

/** L'accroche : deux chaînes qui se croisent et le cadenas qui tombe dessus (tout part avec le plan, dans le panoramique éclair). */
const CadenasAccroche: React.FC = () => {
  const f = useCurrentFrame(), t0 = s(CADENAS);
  if (f < t0 - 12 || f > u(0) + 16) return null;
  const v = expoSortie(entre(f, t0 - 12, t0)), chute = rebond(f, t0 - 3, 520, 26);
  const fuite = expoEntree(entre(f, u(0) - 16, u(0) + 6));
  return (
    <AbsoluteFill style={{ transform: `translateX(${(-1250 * fuite).toFixed(1)}px)`, opacity: 1 - fuite }}>
      <AbsoluteFill style={{ background: `rgba(10,8,6,${(0.38 * v).toFixed(3)})` }} />
      <Chaine angle={-58} x={540} y={850} decale={1700 * (1 - v)} />
      <Chaine angle={58} x={540} y={850} decale={-1700 * (1 - v)} />
      <div style={{ position: "absolute", left: 540 - 180, top: 610, transformOrigin: "50% 60%", opacity: f >= t0 - 3 ? 1 : 0, transform: `translateY(${(-620 * (1 - chute)).toFixed(1)}px) scale(${(1.25 - 0.25 * chute).toFixed(4)}) rotate(${(-7 * (1 - chute)).toFixed(2)}deg)` }}>
        <CorpsCadenas taille={360} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- les cinq tampons et le cadenas qui s'ouvre
const TAMPONS = ["ema", "inari", "usagi", "ochichi", "undama"];
/** Sur le plan du batelier : le cadenas, les cinq vrais tampons d'Udo qui se posent un à un, sur les demi-temps ; au dernier temps,
 *  l'anse se lève, et tout saute. */
const CinqTampons: React.FC = () => {
  const f = useCurrentFrame(), de = u(25), ouvre = u(27.5), fin = u(28);
  if (f < de - 10 || f > fin + 4) return null;
  const arrive = expoSortie(entre(f, de - 10, de + 4)), saut = expoEntree(entre(f, fin - 14, fin + 2));
  const ouvert = expoSortie(entre(f, ouvre, ouvre + 12));
  return (
    <AbsoluteFill style={{ opacity: 1 - saut, transform: `translateY(${(-160 * saut).toFixed(1)}px)` }}>
      <div style={{ position: "absolute", left: 456 - 95, top: 500 - 40 * (1 - arrive), opacity: arrive }}>
        <div style={{ transform: `scale(${(1 + 0.12 * Math.sin(Math.PI * entre(f, ouvre, ouvre + 10))).toFixed(4)})` }}><CorpsCadenas taille={190} ouvert={ouvert} /></div>
      </div>
      <div style={{ position: "absolute", left: 40, width: 832, top: 760, display: "flex", justifyContent: "space-between" }}>
        {TAMPONS.map((id, k) => {
          const t = de + s((k * BU) / 2), posé = rebond(f, t, 520, 26);
          return (
            <div key={id} style={{ width: 160, height: 160, borderRadius: "50%", background: "rgba(255,250,240,.94)", border: `5px solid ${C.encre}`, display: "grid", placeItems: "center", boxShadow: "0 10px 26px rgba(0,0,0,.4)" }}>
              <Img src={staticFile(`ui/tampon-${id}.png`)} style={{ width: 146, height: 146, opacity: f >= t ? 1 : 0, transform: `scale(${(1.7 - 0.7 * posé).toFixed(4)}) rotate(${(((k * 7) % 11) - 5) * 1.6}deg)` }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Le grand cerf : à peine un aperçu. Le bord de l'image reste dans le noir et, pour « Can you find it? », tout s'éteint. */
const Ombre: React.FC = () => {
  const f = useCurrentFrame();
  if (f < y(29.5) || f > y(34.5) + 4) return null;
  const noir = expoSortie(entre(f, y(29.5) + s(2.1), y(29.5) + s(2.7)));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 62% 40% at 50% 44%, rgba(0,0,0,0) 0%, rgba(0,0,0,.4) 62%, rgba(0,0,0,.85) 100%)" }} />
      <AbsoluteFill style={{ background: "#000", opacity: 0.86 * noir }} />
    </AbsoluteFill>
  );
};

const Textes: React.FC = () => (
  <>
    <Cadre texte={"This forest inspired\n*Princess Mononoke*…"} de={-30} a={s(2.32)} />
    <Cadre texte="…and it's *locked* 🔒" de={s(2.4)} a={u(0) - 8} />
    <Cadre texte={"To reach it in my game,\nstart at *Udo*,"} de={u(0) + 3} a={s(T1 + 2.32)} />
    <Cadre texte={"a shrine inside\na *sea cave* ⛩️"} de={s(T1 + 2.4)} a={u(7) - 4} />
    <Etiquette n="10" nom="Udo" ja="鵜戸神宮 · Miyazaki" sous="NEW" de={u(3.5)} a={u(7) - 6} />
    <Cadre texte={"Throw *lucky balls*\nat the turtle rock 🐢"} de={u(7) + 2} a={u(10) - 4} />
    <Cadre texte="Stroke the *rabbit* 🐇" de={u(10) + 2} a={u(13) - 4} />
    <Cadre texte={"Climb the *red torii*\nup to Inari ⛩️"} de={u(13) + 2} a={u(17) - 4} />
    <Cadre texte="Get all *five stamps*…" de={u(17) + 3} a={u(20) - 3} />
    <Cadre texte={"…and earn a cape of\n*cormorant feathers*! 🪶"} de={u(20) + 3} a={u(24) - 4} />
    <Cadre texte={"Only then will the *boatman*\ntake you across…"} de={u(24) + 2} a={u(28) - 4} taille={56} />
    <Cadre texte={"…and the island only appears\non your *map* after the crossing 🗺️"} de={u(28) + 3} a={y(0) - 4} y={180} taille={50} largeur={1040} />
    <Cadre texte="*Yakushima!*" de={y(0) + 2} a={s(T3 + 0.72)} />
    <Cadre texte="Land at *Miyanoura port* ⚓" de={s(T3 + 0.8)} a={y(4) - 4} taille={56} />
    <Etiquette n="11" nom="Yakushima" ja="屋久島 · Kagoshima" sous="NEW" de={y(1.5)} a={y(4) - 6} y={480} />
    <Cadre texte={"Cross the\n*suspension bridge*"} de={y(4) + 2} a={y(7) - 4} />
    <Cadre texte={"Meet the *monkey* and the\n*deer* in the moss 🐒"} de={y(7) + 2} a={y(10.5) - 4} taille={56} />
    <Cadre texte={"See a *heart of sky*\nin Wilson's stump 💙"} de={y(10.5) + 2} a={y(14) - 4} />
    <Cadre texte={"Stand before the giant\n*Jōmon Sugi* 🌲"} de={y(14) + 2} a={y(17.5) - 4} />
    <Cadre texte={"…and earn the\n*wolf cape*! 🐺"} de={y(17.5) + 2} a={y(20.5) - 4} />
    <Cadre texte={"But this forest\nhas a *secret*… 🌙"} de={y(20.5) + 2} a={y(23.5) - 4} />
    <Cadre texte="Greet the *little spirits*…" de={y(23.5) + 2} a={y(26.5) - 4} taille={56} />
    <Cadre texte={"…enter the old\n*hollow cedar*…"} de={y(26.5) + 2} a={y(29.5) - 4} />
    <Cadre texte={"…and *something huge*\nis waiting."} de={y(29.5) + 2} a={s(secY(29.5) + 2.12)} />
    <Cadre texte="Can you *find it*? 👀" de={s(secY(29.5) + 2.2)} a={y(34.5) - 4} />
    <Cadre texte={"And one little spirit\nwill *follow you*…"} de={y(34.5) + 2} a={y(38) - 4} y={190} taille={56} />
    <Cadre texte={"…right onto your\n*companion's back*! 🦊"} de={y(38) + 2} a={y(41) - 4} />
    <Fin de={y(41)} titre={"Udo and Yakushima\nin 3D"} ligne="+ 9 more places · free" />
  </>
);

const FLOU: [number, number][] = [u(0), u(7), u(10), u(13), u(17), u(24), u(28), y(0), y(4), y(7), y(10.5), y(14), y(17.5), y(20.5), y(23.5), y(26.5), y(34.5), y(41)].map((n): [number, number] => [n - 18, n + 18]);

export const Traversee: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  // le choc du cadenas : l'image tremble
  const choc = entre(f, s(CADENAS), s(CADENAS) + 14), force = f >= s(CADENAS) && choc < 1 ? (1 - choc) * (1 - choc) : 0;
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit, transform: force ? `translate(${(26 * force * Math.sin(f * 2.4)).toFixed(1)}px, ${(34 * force * Math.cos(f * 3.1)).toFixed(1)}px)` : undefined }}>
      <Plans plans={PLANS} />
      <Ombre />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.32) 0px, rgba(0,0,0,.12) 380px, rgba(0,0,0,0) 640px)", opacity: f < y(41) ? 1 : 1 - expoSortie(entre(f, y(41), y(41) + 20)) }} />
      <CadenasAccroche />
      <CinqTampons />
      <Textes />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={240} samples={8}>{image}</CameraMotionBlur> : image}
      <Son bande={BANDE} bgm={bgm} />
    </AbsoluteFill>
  );
};

