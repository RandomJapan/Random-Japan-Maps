// Le temps de la vidéo 3 du « générique d'animé » (2026-11-22, la chanson n° 3 : la longue de Lyria, 2 min 04, chantée par un jeune
// homme ; le propriétaire : « On continue avec les deux derniers opening »). Le découpage : outils/video/generique/plan-34.md.
// La chanson : 167,073 battements par minute (les moindres carrés sur ses attaques fortes, 92 % à 20 ms près), ses temps comptés
// depuis 0,2151 s ; elle a deux couplets et deux refrains. La vidéo prend la fin du second pré-refrain (« まだ知らない 日本へ »),
// la coupure (90,74 → 91,04 s), la reprise du refrain au temps 253 (91,07 s), le refrain, le pont instrumental (temps 297 → 317),
// « Japan, wait for me! » au temps 317 et le « Let's go! » final, coupé net à 120,0 s. Les vers sont placés d'après une transcription
// minutée (Gemini sur Flora : ses temps arrivent ~0,7 s après les vrais, recalés sur la reprise et la fin) : à vérifier à l'oreille.
import { FPS } from "../theme";

export const TEMPS = 60 / 167.073;
export const T0 = 0.2151;
/** La vidéo commence sur le temps 247 de la chanson (88,92 s) : V0, l'image de sa seconde 0, est très négatif. */
export const V0 = -5335;
/** Le temps n de la chanson n° 3 → son image dans la vidéo 3. */
export const b = (n: number) => V0 + Math.round((T0 + n * TEMPS) * FPS);
/** Une seconde de la chanson n° 3 → son image dans la vidéo 3. */
export const c = (secondes: number) => V0 + Math.round(secondes * FPS);
/** La fin : la chanson est coupée net à 120,0 s ; son écho et le carton de fin tiennent encore un peu. */
export const DUREE = c(121.1);

export const T = {
  // le hook : le héros surgit dans le cadre dès l'image 0, tend son téléphone (la vraie carte dedans), la caméra plonge et atterrit
  // sur la carte à la reprise du refrain (temps 253)
  carte: b(253),
  // « Open the map, let's go! » : la carte, puis le petit train d'Okuoi sur son pont
  okuoi: b(261),
  // « From the snow to the sea » : deux lieux en personnages, le Yōtei enneigé puis les tourbillons de Naruto
  persos: b(269),
  // « Every shrine, every road » : trois sanctuaires et trois routes, un tous les deux temps
  sanctuaires: b(285), izumo: b(287), nikko: b(289), routes: b(291), iya: b(293), yushun: b(295),
  // le pont instrumental : le héros dégaine et fait tournoyer son sabre, des lieux en éclairs entre ses coups
  pont: b(297), sakurajima: b(305), sabre2: b(307), chute: b(311), jigoku: b(313), plongee: b(315),
  // « Japan, wait for me! » : Himeji, Kiyomizu, le soleil couchant ; puis le carton de fin sur le « Let's go! » final
  attends: b(317), kiyomizu: b(321), soir: b(325), fin: b(329), allons: c(118.8),
};

/** Les mots du refrain (un vers tous les 16 temps à partir de la reprise ; fin : où le vers chanté s'arrête). */
export const PAROLES = [
  { texte: "OPEN THE *MAP*,\nLET'S GO!", de: T.carte, fin: c(95.5), a: T.persos },
  { texte: "FROM THE *SNOW*\nTO THE *SEA*", de: T.persos, fin: c(101.8), a: T.sanctuaires },
  { texte: "EVERY *SHRINE*,\nEVERY *ROAD*", de: b(286), fin: c(107.1), a: T.pont },
  { texte: "JAPAN,\n*WAIT* FOR ME!", de: T.attends, fin: c(117.0), a: T.fin },
];
