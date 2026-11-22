// Le temps de la vidéo 2 du « générique d'animé » (2026-11-22, la chanson n° 2, chantée par une jeune femme : le propriétaire, « il
// faudra que ce soit une belle fille pour le hook quand la musique est chantée par une fille »). Le découpage : outils/video/generique/
// plan-2.md. La chanson : 165 battements par minute comme la n° 1, son premier temps à 0,0173 s (les moindres carrés sur ses attaques
// fortes) ; silence jusqu'à 1,05 s, intro instrumentale, une coupure 5,9 → 6,45 s, la voix à 6,5 s, le refrain anglais au temps 42.
// La vidéo commence sur son temps 6 (2,2 s : l'intro joue dès l'image 0) : V0, l'image de sa seconde 0, est négatif.
import { FPS, TEMPS } from "../theme";

export const V0 = -132;
export const T0 = 0.0173;
/** Le temps n de la chanson n° 2 → son image dans la vidéo 2. */
export const b = (n: number) => V0 + Math.round((T0 + n * TEMPS) * FPS);
/** Une seconde de la chanson n° 2 → son image dans la vidéo 2. */
export const c = (secondes: number) => V0 + Math.round(secondes * FPS);
/** La fin : la chanson s'éteint vers 29,9 s ; le carton de fin tient encore un peu. */
export const DUREE = c(30.4);

export const T = {
  // le hook : l'héroïne fixe l'objectif dès l'image 0 et tranche ; sa lame passe devant au temps 10 (la fente), elle est de dos,
  // se retourne, tend son téléphone (la vraie carte dedans), et la plongée atterrit sur la carte au temps 18, quand la voix entre
  coupe: b(10), carte: b(18),
  // le couplet : « au-dessus des nuages, au-delà du Fuji » ; puis les torii
  daisen: b(25), hakone: b(28), torii: b(31.5), kabushima: b(33), futami: b(34.5),
  // « vers un Japon que tu ne connais pas encore » : deux lieux en personnages ; puis son sourire, figé, avant le refrain
  persos: b(37), sourire: b(41),
  // le refrain
  refrain: b(42), akagi: b(46), neige: b(50), mer: b(54), sanctuaires: b(58), route: b(62), fille: b(66), feux: b(70),
  fin: b(74), allons: c(27.6),
};

/** Les paroles (les mêmes que la chanson n° 1) : quand chaque ligne est chantée, lu sur la stéréo (le centre, la voix, contre les
 *  côtés : elle reprend après chaque blanc à 6,5, 8,4, 9,1, 11,5, 12,4, 13,5, 14,2 s : les huit demi-lignes) ; a : l'image où elles
 *  s'effacent. Le refrain : un vers tous les 8 temps à partir du temps 42, comme la n° 1. */
export const PAROLES = {
  jp: [
    { jp: "地図を広げて 走り出せ", en: "Open the map and start running", de: c(6.5), fin: c(9.0), a: T.daisen },
    { jp: "雲を越えて 富士の向こうへ", en: "Over the clouds, beyond Mount Fuji", de: c(9.1), fin: c(11.3), a: T.torii },
    { jp: "千の鳥居を くぐり抜けて", en: "Through a thousand torii gates", de: c(11.5), fin: c(13.3), a: T.persos },
    { jp: "まだ知らない 日本へ", en: "To a Japan you don't know yet", de: c(13.5), fin: c(14.9), a: T.refrain - 4 },
  ],
  en: [
    { texte: "OPEN THE *MAP*,\nLET'S GO!", de: b(42), fin: c(17.4), a: T.neige },
    { texte: "FROM THE *SNOW*\nTO THE *SEA*", de: b(50), fin: c(20.4), a: T.sanctuaires },
    { texte: "EVERY *SHRINE*,\nEVERY *ROAD*", de: b(58), fin: c(23.3), a: T.fille },
    { texte: "JAPAN,\n*WAIT* FOR ME!", de: b(66), fin: c(26.2), a: T.fin },
  ],
};
