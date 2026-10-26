// Vidéo 3 : les secrets de la balade : chaque lieu cache un secret (les corbeaux sacrés d'Itsukushima, la carte au trésor
// d'Aogashima, la luciole des Heike à Gokayama, la dixième assiette d'Okiku à Himeji, et un cinquième…), chacun donne un
// koban (le compteur, en haut) ; on les dépense chez Bunbuku, le marchand tanuki ; ce qu'on y achète ; la fin. 30 s sur
// l'air d'Aogashima (126 battements, depuis l'entrée de sa mélodie).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Koban, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoEntree, expoSortie, FPS, POLICE, rebond } from "./theme";

const BPM = 126;
export const b = (n: number) => Math.round((n * 60 * FPS) / BPM);
const sec = (n: number) => (n * 60) / BPM;

export const PLANS: Plan[] = [
  // le crochet : on entre dans le bosquet de bambous, les deux corbeaux sur le petit torii caché
  { de: 0, a: b(8), prise: "it-corbeaux", t: 36.8 },
  // (comment : la douceur sur la pierre, les corbeaux descendent du ciel)
  { de: b(8), a: b(11), prise: "it-corbeaux", t: 8.0, entree: "fouet", zoom: [1.4, 1.5], centre: [0.5, 0.46] },
  { de: b(11), a: b(14), prise: "it-corbeaux", t: 47.4, entree: "punch" },
  { de: b(14), a: b(17), prise: "ao-carte", t: 9.9, entree: "fouet" },
  { de: b(17), a: b(19), prise: "ao-tresor", t: 5.0, entree: "punch", zoom: [1.25, 1.35], centre: [0.45, 0.5] },
  { de: b(19), a: b(22), prise: "ao-tresor", t: 12.6, entree: "punch" },
  { de: b(22), a: b(25), prise: "gk-luciole", t: 3.3, entree: "fouet", luminosite: 1.3 },
  { de: b(25), a: b(30), prise: "gk-luciole", t: 51.2, luminosite: 1.4 },
  { de: b(30), a: b(33), prise: "hm-okiku", t: 4.5, entree: "fouet" },
  { de: b(33), a: b(38), prise: "hm-okiku", t: 8.9 },
  { de: b(38), a: b(42), prise: "tk-miroir", t: 4.6, entree: "fouet", zoom: [1.0, 1.1], centre: [0.4545, 0.5] },
  { de: b(42), a: b(45), prise: "bunbuku", t: 1.3, entree: "fouet" },
  { de: b(45), a: b(48), prise: "bunbuku", t: 15.6 },
  { de: b(48), a: b(50), prise: "garde-robe", t: 5.6, entree: "punch" },
  { de: b(50), a: b(52), prise: "it-feux", t: 6.1, entree: "punch", zoom: [1.22, 1.3], centre: [0.56, 0.4] },
  { de: b(52), a: b(54), prise: "trio6", t: 4.6, entree: "punch" },
  { de: b(54), a: b(56), prise: "saisons", t: 2.6, vitesse: 8, entree: "punch" },
  { de: b(56), a: b(63), prise: "garde-robe", t: 9.5, entree: "fouet" },
];

// le compteur de koban (en haut à gauche) : il monte à chaque secret trouvé
const KOBAN: [number, number][] = [[b(12), 1], [b(20), 2], [b(28), 3], [b(36), 4]];
const Compteur: React.FC = () => {
  const f = useCurrentFrame();
  if (f < b(10) || f > b(56)) return null;
  const n = KOBAN.filter(([t]) => f >= t).reduce((m, [, k]) => Math.max(m, k), 0);
  const dernier = KOBAN.filter(([t]) => f >= t).pop()?.[0] ?? b(10);
  const v = rebond(f, b(10)), saut = 1 + 0.35 * (1 - rebond(f, dernier, 420, 16));
  const sortie = expoEntree(entre(f, b(56) - 10, b(56)));
  return (
    <div style={{
      position: "absolute", right: 40, top: 470, display: "flex", alignItems: "center", gap: 14, padding: "12px 26px 12px 18px",
      background: C.papier, border: `6px solid ${C.encre}`, borderRadius: 999, boxShadow: `inset 0 0 0 5px ${C.papier}, inset 0 0 0 9px ${C.or}, 0 10px 30px rgba(0,0,0,.35)`,
      transform: `translateX(${(400 * (1 - v) + 500 * sortie).toFixed(1)}px)`,
    }}>
      <div style={{ transform: `scale(${saut.toFixed(4)}) rotate(${(-10 * (saut - 1)).toFixed(2)}deg)` }}><Koban taille={72} /></div>
      <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 60, color: C.encre }}>× {n}</div>
    </div>
  );
};

const BANDE: Bande = {
  musique: { fichier: "aogashima.wav", debut: 0.15 + sec(8), volume: 2.4 },
  voix: [["c1", 0.15], ["c2", sec(8) + 0.05], ["c3", sec(14) + 0.1], ["c4", sec(22) + 0.05], ["c5", sec(30) + 0.05], ["c6", sec(42) + 0.05], ["c7", sec(48) + 0.3], ["c8", sec(56) + 0.2]],
  durees: { c1: 2.67, c2: 1.8, c3: 1.3, c4: 2.04, c5: 2.56, c6: 4.18, c7: 3.82, c8: 2.64 },
  sfx: [
    [0.6, "sfx-jeu/oiseau-corbeau.wav", 0.8], [2.4, "sfx-jeu/oiseau-corbeau.wav", 0.7],
    [sec(8) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(8) + 0.4, "sfx-jeu/magie.wav", 0.7], [sec(12), "sfx-jeu/koban.wav", 1.2],
    [sec(14) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(14) + 0.1, "sfx/paper-slide.mp3", 0.7], [sec(17) + 0.2, "sfx-jeu/pelle.wav", 0.9],
    [sec(18) + 0.2, "sfx-jeu/boite.wav", 0.9], [sec(20), "sfx-jeu/koban.wav", 1.2],
    [sec(22) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(25), "sfx/light-spell.mp3", 0.8], [sec(28), "sfx-jeu/koban.wav", 1.2],
    [sec(30) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(30) + 0.3, "sfx-jeu/assiette.wav", 0.9], [sec(31) + 0.3, "sfx-jeu/assiette.wav", 0.8],
    [sec(33), "sfx-jeu/magie.wav", 0.8], [sec(36), "sfx-jeu/koban.wav", 1.2],
    [sec(38) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(39), "sfx/sparkle-touch.mp3", 0.9],
    [sec(42) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(45), "sfx/paper-slide.mp3", 0.7], [sec(47), "sfx-jeu/achat.wav", 1.0],
    [sec(48), "sfx-jeu/pouf.wav", 0.8], [sec(50), "sfx-jeu/feu-boum.wav", 0.9], [sec(52), "sfx-jeu/cri-gao.wav", 0.8], [sec(53), "sfx-jeu/cri-fuwa.wav", 0.8],
    [sec(54), "sfx/stardust-swish.mp3", 0.8],
    [sec(56) - 0.14, "sfx/whoosh-fast.mp3", 0.8], [sec(56) + 0.25, "sfx/bass-hit-short.mp3", 0.9], [sec(56) + 0.3, "sfx/pop.mp3", 0.8],
  ],
};

const Textes: React.FC = () => (
  <>
    <Cadre texte={"Every place in my game\nhides a *secret* 🤫"} de={-12} a={b(8) - 6} y={500} />
    <Etiquette n="1" nom="Itsukushima" ja="厳島神社" sous="the sacred crows" y={290} de={b(8) + 6} a={b(14) - 6} />
    <Etiquette n="2" nom="Aogashima" ja="青ヶ島" sous="the treasure map" y={290} de={b(14) + 6} a={b(22) - 6} />
    <Etiquette n="3" nom="Gokayama" ja="五箇山" sous="the golden firefly" y={290} de={b(22) + 6} a={b(30) - 6} />
    <Etiquette n="4" nom="Himeji Castle" ja="姫路城" sous="Okiku's plate" y={290} de={b(30) + 6} a={b(38) - 6} />
    <Etiquette n="5" nom="Takachiho" ja="高千穂" sous="???" y={290} de={b(38) + 6} a={b(42) - 6} />
    <Cadre texte="Each secret = 1 gold *koban*" de={b(42) + 6} a={b(45) - 4} />
    <Cadre texte="Spend them at *Bunbuku*'s 🦝" de={b(45) + 4} a={b(48) - 4} />
    <Cadre texte="Samurai armor" de={b(48) + 3} a={b(50) - 3} taille={56} />
    <Cadre texte="Fireworks 🎆" de={b(50) + 3} a={b(52) - 3} taille={56} />
    <Cadre texte="Secret *companions*" de={b(52) + 3} a={b(54) - 3} taille={56} />
    <Cadre texte="Magic *seasons* ❄️" de={b(54) + 3} a={b(56) - 3} taille={56} />
    <Fin de={b(56)} titre="Can you find all 5?" ligne="Secrets · koban · Bunbuku's shop" />
  </>
);

const FLOU: [number, number][] = [8, 14, 22, 30, 38, 42, 56].map((n): [number, number] => [b(n) - 18, b(n) + 18]);

export const Secrets: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.32) 0px, rgba(0,0,0,.12) 380px, rgba(0,0,0,0) 640px)", opacity: f < b(56) ? 1 : 1 - expoSortie(entre(f, b(56), b(56) + 20)) }} />
      <Textes />
      <Compteur />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={240} samples={8}>{image}</CameraMotionBlur> : image}
      <Son bande={BANDE} bgm={bgm} />
    </AbsoluteFill>
  );
};
