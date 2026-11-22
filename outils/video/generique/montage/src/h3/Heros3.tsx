// La vidéo 3 du « générique d'animé » de la carte (2026-11-22) : la chanson n° 3 (la longue de Lyria, un jeune homme), son second
// refrain et son pont, et le héros de la vidéo 1 (un personnage original : cheveux bruns bouclés, chapeau de paille à ruban bleu nuit)
// dans deux nouveaux gestes du propriétaire (rush 3) : il surgit dans le cadre en tendant son téléphone, puis dégaine et fait
// tournoyer son sabre pendant le pont. Le même moteur que les vidéos 1 et 2 (Commun.tsx, Personnage, Titre, Fin), d'autres lieux,
// et un bleu électrique (la lumière de sa lame) à la place du rouge. 9:16, 60 images/s ; le temps : h3/temps.ts.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Credit, Eclairs, FOUET, Mots, Plans, Sources, UnPlan, Vitesse } from "../Commun";
import { Fin } from "../Fin";
import { Perso, Personnage, Titre } from "../Generique";
import { C, FPS } from "../theme";
import { AccrocheTel } from "../suite/Accroche";
import { Bruit, Son } from "../suite/Son";
import { b, PAROLES, T, V0 } from "./temps";

export const BLEU = "#2ec4ff";
const AVANT_CARTE = 10; // le plan de la carte commence 10 images avant T.carte (ecran.py le sait aussi)

// ---------------------------------------------------------------- les plans
const PLANS: UnPlan[] = [
  // la carte, au bout de la plongée dans son téléphone (t0 et zoom : ecran.py pose dans l'écran ce même plan, au même instant)
  { de: T.carte - AVANT_CARTE, a: T.okuoi, src: "rushes/tn-japon.mp4", t0: 2.1, zoom: [1.3, 1.0], entree: "sec" },
  // « let's go! » : le petit train rouge d'Okuoi sur son pont au-dessus du lac (le montage du propriétaire : le pont, la cabine,
  // le train vu d'en haut)
  { de: T.okuoi, a: T.persos, src: "reels/okuoi.mp4", zoom: [1.0, 1.1], entree: "fouet" },
  // (temps 269 → 285 : le Yōtei et Naruto en personnages, plus bas)
  // « every shrine » : Kumano Nachi (la pagode et la cascade), Izumo, Nikkō ; « every road » : le tunnel d'Utsunoya, le pont de
  // lianes d'Iya, la route d'Yushun sous les cerisiers illuminés
  { de: T.sanctuaires, a: T.izumo, src: "reels/nachi.mp4", zoom: [1.14, 1.0], entree: "flash" },
  { de: T.izumo, a: T.nikko, src: "reels/izumo.mp4", zoom: [1.0, 1.1], entree: "punch" },
  { de: T.nikko, a: T.routes, src: "reels/nikko.mp4", zoom: [1.12, 1.0], entree: "rouge" },
  { de: T.routes, a: T.iya, src: "reels/utsunoya.mp4", zoom: [1.0, 1.16], entree: "fouet" },
  { de: T.iya, a: T.yushun, src: "reels/iya.mp4", zoom: [1.0, 1.12], entree: "punch" },
  { de: T.yushun, a: T.pont, src: "reels/yushun-nuit.mp4", zoom: [1.0, 1.14], entree: "flash" },
  // le pont : il dégaine, fait tournoyer sa lame (sa seconde 0 → 2,87) ; le Sakurajima qui fume ; il pique et fait tourner la lame
  // (2,77 → 4,21) ; la cascade de Nachi, la vallée de l'Enfer, la plongée sur la carte
  { de: T.pont, a: T.sakurajima, src: "clips/heros-sabre.mp4", zoom: [1.0, 1.08], entree: "flash" },
  { de: T.sakurajima, a: T.sabre2, src: "reels/sakurajima.mp4", zoom: [1.16, 1.0], entree: "rouge" },
  { de: T.sabre2, a: T.chute, src: "clips/heros-sabre.mp4", t0: 2.77, zoom: [1.06, 1.14], entree: "flash" },
  { de: T.chute, a: T.jigoku, src: "reels/nachi-chute.mp4", zoom: [1.0, 1.12], entree: "punch" },
  { de: T.jigoku, a: T.plongee, src: "reels/jigoku.mp4", zoom: [1.12, 1.0], entree: "fouet" },
  { de: T.plongee, a: T.attends, src: "rushes/p-plongee.mp4", t0: 0.3, v: 1.4, zoom: [1.1, 1.0], entree: "flash" },
  // « Japan, wait for me! »
  { de: T.attends, a: T.kiyomizu, src: "reels/himeji.mp4", zoom: [1.14, 1.0], entree: "flash" },
  { de: T.kiyomizu, a: T.soir, src: "reels/kiyomizu.mp4", zoom: [1.0, 1.12], entree: "fouet" },
  { de: T.soir, a: T.fin + 12, src: "reels/takaya-soir.mp4", zoom: [1.12, 1.02], entree: "punch" },
];
const COUPES_FOUET = [T.okuoi, T.routes, T.jigoku, T.kiyomizu];
const FLOU: [number, number][] = [[T.carte - AVANT_CARTE, T.carte + 6], ...COUPES_FOUET.map((x): [number, number] => [x - FOUET + 2, x + FOUET - 2])];
const CARTE: [number, number][] = [[T.carte - 2, T.okuoi], [T.plongee, T.attends]];

// ---------------------------------------------------------------- les lieux en personnages (les noms de la carte)
const PERSOS: Perso[] = [
  { src: "reels/yotei.mp4", jp: "羊蹄山", en: "MOUNT YOTEI", ou: "HOKKAIDO", couleur: "#dff1ff" },
  { src: "reels/onaruto.mp4", jp: "大鳴門橋", en: "ONARUTO BRIDGE", ou: "HYOGO · TOKUSHIMA", couleur: BLEU },
];

// ---------------------------------------------------------------- les éclairs
const ECLAIRS = [
  { f: T.okuoi - 1, c: "#fff", d: 2, o: 0.7 },
  { f: T.persos, c: "#fff", d: 2 }, { f: b(277), c: BLEU, d: 1 },
  { f: T.sanctuaires, c: "#000", d: 1 }, { f: T.izumo, c: BLEU, d: 1 }, { f: T.nikko, c: "#000", d: 1 }, { f: T.iya, c: "#fff", d: 1, o: 0.7 },
  { f: T.pont - 1, c: "#fff", d: 3 }, { f: T.pont + 2, c: BLEU, d: 1, o: 0.7 }, { f: T.pont + 3, c: "#000", d: 1 },
  { f: T.sakurajima, c: "#000", d: 1 }, { f: T.sabre2, c: "#fff", d: 2 }, { f: T.chute, c: BLEU, d: 1 }, { f: T.plongee, c: "#fff", d: 2 },
  { f: T.attends - 1, c: "#fff", d: 3 }, { f: T.attends + 2, c: BLEU, d: 1, o: 0.7 }, { f: T.soir, c: "#000", d: 1 }, { f: T.fin, c: "#fff", d: 2 },
];

// ---------------------------------------------------------------- le son
const DOUX = 0.6; // les bruitages, sous la chanson (elle joue dès l'image 0)
const BRUITS: Bruit[] = [
  // il surgit dans le cadre ; le téléphone monte vers l'objectif ; la caméra plonge dans l'écran (dans la coupure de la chanson)
  [0.02, "sfx/whoosh-fast.mp3", 0.4 * DOUX],
  [0.62, "sfx/swoosh-quick.mp3", 0.35 * DOUX],
  [T.carte / FPS - 0.32, "sfx/zoom-air-fast.mp3", 0.35 * DOUX],
  [T.carte / FPS, "sfx/impact-deep-whoosh.mp3", 0.3 * DOUX],
  [b(255) / FPS, "sfx/pops.mp3", 0.4 * DOUX],
  ...COUPES_FOUET.map((x): Bruit => [x / FPS - 0.3, "sfx/swoosh-quick.mp3", 0.4 * DOUX]),
  // le pont : il dégaine, la lame siffle, il pique
  [T.pont / FPS + 0.1, "sfx/katana.wav", 0.35 * DOUX, 1.2],
  [T.pont / FPS + 1.3, "sfx/sweep-metal-quick.mp3", 0.35 * DOUX],
  [T.sabre2 / FPS - 0.05, "sfx/sweep-metal-quick.mp3", 0.4 * DOUX],
  [T.fin / FPS, "sfx/shimmer-sparkle-sweep.mp3", 0.4 * DOUX],
];

// ---------------------------------------------------------------- tout
export const Heros3: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const surCarte = CARTE.some(([a, z]) => f >= a && f < z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      {PERSOS.map((p, i) => <Personnage key={i} p={p} i={i} de={b(269 + 8 * i)} a={b(277 + 8 * i)} y={620} />)}
      <AbsoluteFill style={{ zIndex: 50, background: "linear-gradient(rgba(0,0,0,.34) 0px, rgba(0,0,0,0) 640px)", opacity: f >= T.carte && f < T.fin ? 1 : 0 }} />
      <Titre de={T.carte + 3} a={b(259)} ombre={BLEU} />
      <Vitesse de={T.carte} a={T.carte + 18} cx={540} cy={900} force={0.8} />
      <Vitesse de={T.pont} a={T.pont + 24} cx={430} cy={820} rx={300} ry={460} force={0.7} />
      <Vitesse de={T.sabre2} a={T.sabre2 + 20} cx={480} cy={820} rx={300} ry={460} force={0.7} />
      <Vitesse de={T.attends} a={T.attends + 20} cx={540} cy={900} force={0.9} />
      {PAROLES.map((l, i) => <Mots key={i} texte={l.texte} de={l.de} fin={l.fin} a={l.a} />)}
      <Credit role="原作" nom="@random_japan_place" de={T.pont + 6} a={T.sakurajima + 30} />
      <Credit role="舞台" nom="JAPAN · 150+ PLACES" de={T.sabre2 + 6} a={T.attends - 4} />
      <Sources visible={surCarte} />
      <Eclairs liste={ECLAIRS} />
      <Fin de={T.fin} de2={T.allons} ombre={BLEU} />
      <AccrocheTel src="clips/heros-pop.mp4" carte={T.carte} lignes={["IF MY *JAPAN MAP*", "HAD AN *ANIME*", "OPENING 3 ⚔️"]}
        pouls={[b(249), b(251)]}
        vitesses={[{ de: 0, a: 16, cx: 620, cy: 900, rx: 340, ry: 560, force: 0.6 }, { de: T.carte - 26, a: T.carte - 2, cx: 300, cy: 900, rx: 300, ry: 520, force: 0.7 }]} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={220} samples={8}>{image}</CameraMotionBlur> : image}
      <Son bgm={bgm} chanson="musique/chanson-3.wav" v0={V0} bruits={BRUITS} />
    </AbsoluteFill>
  );
};
