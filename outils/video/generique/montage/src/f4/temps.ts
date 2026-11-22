// Le temps de la vidéo 4 du « générique d'animé » (2026-11-22, la chanson n° 4 : la courte de Lyria, 1 min 05, chantée par une jeune
// femme). Le découpage : outils/video/generique/plan-34.md. La chanson : 165,004 battements par minute, ses temps comptés depuis
// 0,2610 s ; un couplet, le pré-refrain (« まだ知らない 日本へ »), un roulement de caisse claire, une coupure (36,36 → 36,58 s) et le
// refrain au temps 100 (36,62 s) ; « Japan, wait for me! » vers le temps 147, un arrêt, le « Let's go! » final au temps 164, la fin
// à 62,1 s. La vidéo commence sur son temps 93 (34,08 s). Les vers : la transcription minutée de Gemini, recalée (à vérifier à
// l'oreille).
import { FPS } from "../theme";

export const TEMPS = 60 / 165.004;
export const T0 = 0.261;
export const V0 = -2045;
/** Le temps n de la chanson n° 4 → son image dans la vidéo 4. */
export const b = (n: number) => V0 + Math.round((T0 + n * TEMPS) * FPS);
/** Une seconde de la chanson n° 4 → son image dans la vidéo 4. */
export const c = (secondes: number) => V0 + Math.round(secondes * FPS);
export const DUREE = c(63.0);

export const T = {
  // le hook : l'héroïne, de dos, se retourne en souriant et tend son téléphone ; la plongée atterrit sur la carte au refrain
  carte: b(100),
  // « Open the map, let's go! » : la carte, puis la route d'Yushun sous les cerisiers et le château d'Hirosaki
  yushun: b(108), hirosaki: b(112),
  // « From the snow to the sea » : deux lieux en personnages, les kamakura d'Iiyama puis la côte d'Uradome
  persos: b(116),
  // « Every shrine, every road » : quatre sanctuaires, deux routes
  sanctuaires: b(132), kotohira: b(134), togakushi: b(136), oyamazumi: b(138), routes: b(140), fukuura: b(144),
  // « Japan, wait for me! » : le pont de Tsuru no Maihashi au couchant, puis elle dégaine, sa lame rose ; figée sur l'arrêt
  attends: b(148), sabre: b(154), arret: b(162),
  // le carton de fin sur le « Let's go! » final
  fin: b(164), allons: b(164) + 6,
};

export const PAROLES = [
  { texte: "OPEN THE *MAP*,\nLET'S GO!", de: T.carte, fin: c(40.6), a: b(115.5) },
  { texte: "FROM THE *SNOW*\nTO THE *SEA*", de: b(115.5), fin: c(47.3), a: b(131) },
  { texte: "EVERY *SHRINE*,\nEVERY *ROAD*", de: b(131), fin: c(53.3), a: b(146.5) },
  { texte: "JAPAN,\n*WAIT* FOR ME!", de: b(146.5), fin: c(58.8), a: T.fin },
];
