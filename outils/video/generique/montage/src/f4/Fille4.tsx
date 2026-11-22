// La vidéo 4 du « générique d'animé » de la carte (2026-11-22) : la chanson n° 4 (la courte de Lyria, une jeune femme), son
// pré-refrain et son refrain, et l'héroïne de la vidéo 2 (une jeune femme originale : longs cheveux bruns, chapeau de paille à ruban
// rose) dans deux nouveaux gestes du propriétaire : de dos, elle se retourne en souriant et tend son téléphone (rush 1) ; sur
// « Japan, wait for me! » elle dégaine et fait tournoyer une lame rose (rush 3). Le même moteur, d'autres lieux, le rose des
// cerisiers. 9:16, 60 images/s ; le temps : f4/temps.ts.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Eclairs, FOUET, Mots, Plans, Sources, UnPlan, Vitesse } from "../Commun";
import { Fin } from "../Fin";
import { Perso, Personnage, Titre } from "../Generique";
import { C, FPS } from "../theme";
import { Petales, ROSE } from "../fille/Accroche";
import { AccrocheTel } from "../suite/Accroche";
import { Bruit, Son } from "../suite/Son";
import { b, PAROLES, T, V0 } from "./temps";

const AVANT_CARTE = 10;

// ---------------------------------------------------------------- les plans
const PLANS: UnPlan[] = [
  { de: T.carte - AVANT_CARTE, a: T.yushun, src: "rushes/tn-japon.mp4", t0: 2.1, zoom: [1.3, 1.0], entree: "sec" },
  // « let's go! » : en voiture sous les cerisiers d'Yushun, puis le château d'Hirosaki dans les cerisiers en fleurs
  { de: T.yushun, a: T.hirosaki, src: "reels/yushun.mp4", zoom: [1.1, 1.0], entree: "fouet" },
  { de: T.hirosaki, a: T.persos, src: "reels/hirosaki.mp4", zoom: [1.0, 1.12], entree: "punch" },
  // (temps 116 → 132 : Iiyama et Uradome en personnages, plus bas)
  // « every shrine » : Yūtoku Inari, Kotohira, Togakushi, Ōyamazumi ; « every road » : Tsumago, le pont rouge de Fukuurajima
  { de: T.sanctuaires, a: T.kotohira, src: "reels/yutoku.mp4", zoom: [1.12, 1.0], entree: "flash" },
  { de: T.kotohira, a: T.togakushi, src: "reels/kotohira.mp4", zoom: [1.0, 1.12], entree: "punch" },
  { de: T.togakushi, a: T.oyamazumi, src: "reels/togakushi.mp4", zoom: [1.0, 1.14], entree: "rouge" },
  { de: T.oyamazumi, a: T.routes, src: "reels/oyamazumi.mp4", zoom: [1.12, 1.0], entree: "punch" },
  { de: T.routes, a: T.fukuura, src: "reels/tsumago.mp4", zoom: [1.0, 1.1], entree: "fouet" },
  { de: T.fukuura, a: T.attends, src: "reels/fukuura.mp4", zoom: [1.0, 1.14], entree: "punch" },
  // « Japan, wait for me! » : le pont de bois au soleil couchant ; elle dégaine, sa lame rose tournoie (sa seconde 0 → 2,9) ; figée
  // face à nous, la poignée levée (sa seconde 2,95), pendant l'arrêt de la chanson
  { de: T.attends, a: T.sabre, src: "reels/tsuru.mp4", zoom: [1.15, 1.0], entree: "flash" },
  { de: T.sabre, a: T.arret, src: "clips/fille-sabre.mp4", zoom: [1.0, 1.08], entree: "flash" },
  { de: T.arret, a: T.fin + 12, src: "clips/fille-sabre.mp4", t0: 2.95, gel: true, zoom: [1.14, 1.22], centre: [0.42, 0.32], entree: "flash" },
];
const COUPES_FOUET = [T.yushun, T.routes];
const FLOU: [number, number][] = [[T.carte - AVANT_CARTE, T.carte + 6], ...COUPES_FOUET.map((x): [number, number] => [x - FOUET + 2, x + FOUET - 2])];
const CARTE: [number, number][] = [[T.carte - 2, T.yushun]];

// ---------------------------------------------------------------- les lieux en personnages (les noms de la carte)
const PERSOS: Perso[] = [
  { src: "reels/iiyama.mp4", jp: "雪まつり", en: "IIYAMA SNOW FESTIVAL", ou: "NAGANO", couleur: C.or },
  { src: "reels/uradome.mp4", jp: "浦富海岸", en: "URADOME COAST", ou: "TOTTORI", couleur: C.mer },
];

// ---------------------------------------------------------------- les éclairs
const ECLAIRS = [
  { f: T.yushun - 1, c: "#fff", d: 2, o: 0.7 }, { f: T.hirosaki, c: ROSE, d: 1 },
  { f: T.persos, c: "#fff", d: 2 }, { f: b(124), c: ROSE, d: 1 },
  { f: T.sanctuaires, c: "#000", d: 1 }, { f: T.kotohira, c: ROSE, d: 1 }, { f: T.oyamazumi, c: "#000", d: 1 }, { f: T.fukuura, c: "#fff", d: 1, o: 0.7 },
  { f: T.attends - 1, c: "#fff", d: 3 }, { f: T.attends + 2, c: ROSE, d: 1, o: 0.7 },
  { f: T.sabre, c: "#fff", d: 2 }, { f: T.sabre + 2, c: ROSE, d: 1, o: 0.6 }, { f: T.arret, c: "#fff", d: 2 }, { f: T.fin, c: "#fff", d: 2 },
];

// ---------------------------------------------------------------- le son
const DOUX = 0.6;
const BRUITS: Bruit[] = [
  // elle se retourne ; le téléphone monte vers l'objectif ; la plongée tombe dans la coupure avant le refrain
  [0.5, "sfx/swoosh-quick.mp3", 0.3 * DOUX],
  [1.35, "sfx/whoosh-fast.mp3", 0.3 * DOUX],
  [T.carte / FPS - 0.32, "sfx/zoom-air-fast.mp3", 0.35 * DOUX],
  [T.carte / FPS, "sfx/impact-deep-whoosh.mp3", 0.3 * DOUX],
  [b(102) / FPS, "sfx/pops.mp3", 0.4 * DOUX],
  ...COUPES_FOUET.map((x): Bruit => [x / FPS - 0.3, "sfx/swoosh-quick.mp3", 0.4 * DOUX]),
  // elle dégaine, la lame siffle ; l'arrêt de la chanson : un claquement sur l'image figée
  [T.sabre / FPS + 0.1, "sfx/katana.wav", 0.35 * DOUX, 1.2],
  [T.sabre / FPS + 1.3, "sfx/sweep-metal-quick.mp3", 0.35 * DOUX],
  [T.arret / FPS - 0.03, "sfx/transition-snap.mp3", 0.3 * DOUX],
  [T.fin / FPS, "sfx/shimmer-sparkle-sweep.mp3", 0.4 * DOUX],
];

// ---------------------------------------------------------------- tout
export const Fille4: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const surCarte = CARTE.some(([a, z]) => f >= a && f < z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      {PERSOS.map((p, i) => <Personnage key={i} p={p} i={i} de={b(116 + 8 * i)} a={b(124 + 8 * i)} y={620} />)}
      <AbsoluteFill style={{ zIndex: 50, background: "linear-gradient(rgba(0,0,0,.34) 0px, rgba(0,0,0,0) 640px)", opacity: f >= T.carte && f < T.fin ? 1 : 0 }} />
      <Titre de={T.carte + 3} a={b(106)} ombre={ROSE} />
      <Vitesse de={T.carte} a={T.carte + 18} cx={540} cy={900} force={0.8} />
      <Vitesse de={T.sabre} a={T.sabre + 24} cx={430} cy={820} rx={300} ry={460} force={0.7} />
      <Vitesse de={T.arret} a={T.fin} cx={460} cy={640} rx={300} ry={420} force={0.6} />
      <Petales de={T.sabre} a={T.fin + 20} n={18} z={60} force={0.9} />
      {PAROLES.map((l, i) => <Mots key={i} texte={l.texte} de={l.de} fin={l.fin} a={l.a} />)}
      <Sources visible={surCarte} />
      <Eclairs liste={ECLAIRS} />
      <Fin de={T.fin} de2={T.allons} ombre={ROSE} />
      <AccrocheTel src="clips/fille-tourne.mp4" carte={T.carte} lignes={["IF MY *JAPAN MAP*", "HAD AN *ANIME*", "OPENING 4 🌸"]} petales
        pouls={[b(95), b(97)]}
        vitesses={[{ de: 40, a: 60, cx: 520, cy: 760, rx: 300, ry: 460, force: 0.5 }, { de: T.carte - 24, a: T.carte - 2, cx: 560, cy: 900, rx: 320, ry: 540, force: 0.7 }]} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={220} samples={8}>{image}</CameraMotionBlur> : image}
      <Son bgm={bgm} chanson="musique/chanson-4.wav" v0={V0} bruits={BRUITS} />
    </AbsoluteFill>
  );
};
