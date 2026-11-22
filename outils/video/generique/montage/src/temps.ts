// Le temps de la vidéo « générique d'animé », en temps de la chanson (b(n) : le temps n ; c(s) : sa seconde s). Le découpage est
// dans outils/video/generique/plan.md. Les paroles : quand chaque ligne est chantée, mesuré sur la chanson (analyse.py : le centre
// de la stéréo, dans les fréquences de la voix, contre les côtés).
import { b, c } from "./theme";

export const T = {
  // le hook : le vrai garçon au katana (avant la chanson), puis l'animé (la chanson démarre sur la coupe du sabre)
  tire: 0, coupe: 60, anime: b(0),
  // le couplet
  carte: b(8), takeda: b(16), fuji: b(20),
  // le pré-refrain : les torii, puis les lieux en personnages, puis le coup de sabre animé avant le refrain
  torii: b(25), persos: b(33), sabre: b(39),
  // le refrain
  refrain: b(42), tottori: b(46), neige: b(50), mer: b(54), sanctuaires: b(58), route: b(62), heros: b(66), feux: b(70),
  fin: b(74), allons: c(28.0),
};

/** Les paroles, ligne par ligne : japonais (le couplet et le pré-refrain) ou anglais (le refrain) ; de → fin : quand elles sont
 *  chantées (secondes de la chanson) ; a : l'image où elles s'effacent. */
export const PAROLES = {
  jp: [
    { jp: "地図を広げて 走り出せ", en: "Open the map and start running", de: c(2.95), fin: c(5.8), a: T.takeda },
    { jp: "雲を越えて 富士の向こうへ", en: "Over the clouds, beyond Mount Fuji", de: c(5.95), fin: c(9.0), a: T.torii },
    { jp: "千の鳥居を くぐり抜けて", en: "Through a thousand torii gates", de: c(9.3), fin: c(12.05), a: T.persos },
    { jp: "まだ知らない 日本へ", en: "To a Japan you don't know yet", de: c(12.35), fin: c(14.5), a: T.refrain - 4 },
  ],
  en: [
    { texte: "OPEN THE *MAP*,\nLET'S GO!", de: c(15.3), fin: c(17.45), a: T.neige },
    { texte: "FROM THE *SNOW*\nTO THE *SEA*", de: c(18.2), fin: c(20.6), a: T.sanctuaires },
    { texte: "EVERY *SHRINE*,\nEVERY *ROAD*", de: c(21.1), fin: c(23.3), a: T.heros },
    { texte: "JAPAN,\n*WAIT* FOR ME!", de: c(24.2), fin: c(26.15), a: T.fin },
  ],
};
