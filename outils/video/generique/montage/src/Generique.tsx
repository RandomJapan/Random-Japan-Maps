// La vidéo « générique d'animé » de la carte (2026-11-22, le propriétaire : « une vidéo de la carte […] comme un opening d'animé avec
// une musique […] entraînante », la chanson n° 1, « la carte avec mes rushes », puis le personnage animé qui montre la carte sur son
// téléphone et la caméra qui y entre). 9:16, 60 images/s. Le découpage : outils/video/generique/plan.md ; le temps : temps.ts.
import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Accroche, AVANT_CARTE } from "./Accroche";
import { Credit, Eclairs, FOUET, Mots, Parole, Plans, Sources, Trame, UnPlan, Vitesse } from "./Commun";
import { Fin } from "./Fin";
import { b, C, entre, expoEntree, expoSortie, FPS, houle, POLICE, rebond, s, TITRE, V0 } from "./theme";
import { PAROLES, T } from "./temps";

// ---------------------------------------------------------------- les plans (la carte, ses vrais lieux, l'animé)
const PLANS: UnPlan[] = [
  // la carte s'étend depuis l'écran du téléphone : tout le Japon, puis elle file vers le centre de Honshū et les épingles jaillissent
  { de: T.carte - AVANT_CARTE, a: T.takeda, src: "rushes/tn-japon.mp4", t0: 2.1, zoom: [1.3, 1.0], entree: "sec" },
  // « au-dessus des nuages, au-delà du Fuji »
  { de: T.takeda, a: T.fuji, src: "reels/takeda.mp4", t0: 0.1, zoom: [1.14, 1.0], entree: "fouet" },
  { de: T.fuji, a: T.torii, src: "reels/fuji.mp4", t0: 0.2, zoom: [1.0, 1.14], entree: "punch" },
  // « à travers mille torii » : un par deux temps
  { de: T.torii, a: b(27), src: "reels/takayama.mp4", zoom: [1.0, 1.12], entree: "flash" },
  { de: b(27), a: b(29), src: "reels/motonosumi.mp4", zoom: [1.12, 1.0], entree: "rouge" },
  { de: b(29), a: b(31), src: "reels/itsukushima.mp4", zoom: [1.0, 1.12], entree: "punch" },
  { de: b(31), a: T.persos, src: "reels/shirahige.mp4", zoom: [1.12, 1.0], entree: "rouge" },
  // (b(33) → b(39) : les lieux en personnages, plus bas)
  // le héros d'animé tranche vers l'objectif : la lame passe devant (sa seconde 1,8 à 2,1, avec son éclat) au début du refrain
  { de: T.sabre, a: T.refrain, src: "clips/anime-coupe.mp4", t0: 0.96, zoom: [1.0, 1.05], entree: "flash" },
  // le refrain
  { de: T.refrain, a: T.tottori, src: "rushes/sc-plongee.mp4", t0: 0.35, v: 1.5, zoom: [1.12, 1.0], entree: "flash" },
  { de: T.tottori, a: T.neige, src: "reels/tottori.mp4", t0: 0.1, zoom: [1.12, 1.0], entree: "punch" },
  { de: T.neige, a: T.mer, src: "rushes/p-hiver.mp4", t0: 1.0, zoom: [1.05, 1.14], entree: "fouet" },
  { de: T.mer, a: T.sanctuaires, src: "rushes/ja-mer.mp4", t0: 0.3, zoom: [1.5, 1.62], centre: [0.58, 0.47], entree: "fouet" },
  { de: T.sanctuaires, a: T.route, src: "rushes/tn-filtres.mp4", t0: 0.85, zoom: [1.06, 1.0], entree: "flash" },
  { de: T.route, a: T.heros, src: "rushes/ja-route.mp4", v: 1.2, zoom: [1.06, 1.0], entree: "fouet" },
  { de: T.heros, a: T.feux, src: "clips/anime-tire.mp4", zoom: [1.0, 1.06], entree: "rouge" },
  { de: T.feux, a: T.fin + 12, src: "rushes/kk-feux.mp4", t0: 7.4, zoom: [1.3, 1.15], centre: [0.5, 0.36], entree: "flash" },
];
const COUPES_FOUET = [T.takeda, T.neige, T.mer, T.route];
const FLOU: [number, number][] = [[T.carte - AVANT_CARTE, T.carte + 6], ...COUPES_FOUET.map((x): [number, number] => [x - FOUET + 2, x + FOUET - 2])];
// les images de la carte (ses crédits s'affichent dessus)
const CARTE: [number, number][] = [[T.carte - 2, T.takeda], [T.refrain, T.tottori], [T.neige, T.heros]];

// ---------------------------------------------------------------- les lieux en personnages
export type Perso = { src: string; jp: string; en: string; ou: string; couleur: string };
const PERSOS: Perso[] = [
  { src: "reels/aogashima.mp4", jp: "青ヶ島", en: "AOGASHIMA", ou: "TOKYO", couleur: C.mer },
  { src: "reels/nagoro.mp4", jp: "名頃", en: "NAGORO", ou: "TOKUSHIMA", couleur: C.rouge },
  { src: "reels/shirogane.mp4", jp: "白金青い池", en: "SHIROGANE BLUE POND", ou: "HOKKAIDO", couleur: C.or },
];
const DUREE_PERSO = b(35) - b(33);

/** Un lieu présenté comme un personnage d'opening : son vrai plan qui arrive en biais et ralentit presque à l'arrêt, un aplat de sa
 *  couleur en biais tramé, son nom japonais à la verticale, en grand, à droite, et son nom anglais dans un cartouche noir. */
/** (y : le haut du nom japonais ; les vidéos 3 et 4 le descendent, les mots anglais du refrain étant au-dessus) */
export const Personnage: React.FC<{ p: Perso; de: number; a: number; i: number; y?: number }> = ({ p, de, a, i, y = 250 }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const g = f - de;
  const entree = expoSortie(entre(g, 0, 8));
  const v = rebond(f, de + 3, 420, 22);
  const dir = i % 2 ? -1 : 1;
  const coin = 1300 * (1 - entree) * dir;
  return (
    <AbsoluteFill style={{ zIndex: 30, overflow: "hidden", background: C.encre }}>
      {/* le vrai plan, qui glisse en biais puis se pose */}
      <AbsoluteFill style={{ transform: `translateX(${coin.toFixed(1)}px) skewX(${(-12 * (1 - entree) * dir).toFixed(2)}deg) scale(${(1.18 - 0.08 * entre(g, 0, a - de)).toFixed(4)})` }}>
        <Sequence from={de} layout="none">
          <OffthreadVideo src={staticFile(p.src)} muted playbackRate={0.6} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.25) contrast(1.12)" }} />
        </Sequence>
      </AbsoluteFill>
      {/* l'aplat en biais, sa couleur, tramé */}
      <div style={{
        position: "absolute", right: -200, top: 150, width: 520, height: 1100, background: p.couleur, opacity: 0.92, zIndex: 2,
        transform: `rotate(${(14 * dir).toFixed(1)}deg) translateX(${(600 * (1 - v)).toFixed(1)}px)`, transformOrigin: "50% 0",
        boxShadow: `0 0 0 10px ${C.encre}`, overflow: "hidden",
      }}>
        <Trame couleur="rgba(0,0,0,.35)" taille={16} />
      </div>
      {/* le nom japonais, vertical */}
      <div style={{
        position: "absolute", right: 46, top: y, zIndex: 3, writingMode: "vertical-rl", fontFamily: TITRE, fontSize: p.jp.length > 3 ? 128 : 170,
        lineHeight: 1, color: "#fff", WebkitTextStroke: `14px ${C.encre}`, paintOrder: "stroke fill", textShadow: `10px 12px 0 ${C.encre}`,
        transform: `translateY(${(-240 * (1 - v)).toFixed(1)}px) scale(${(1.3 - 0.3 * v).toFixed(3)})`, opacity: Math.min(1, g / 3),
      }}>{p.jp}</div>
      {/* le cartouche anglais */}
      <div style={{
        position: "absolute", left: 120, right: 120, top: 1150, zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center",
        transform: `translateX(${(-700 * dir * (1 - v)).toFixed(1)}px) skewX(-10deg)`,
      }}>
        <div style={{ background: C.encre, color: "#fff", fontFamily: POLICE, fontWeight: 900, fontSize: p.en.length > 12 ? 58 : 80, padding: "6px 30px", border: "5px solid #fff", whiteSpace: "nowrap" }}>{p.en}</div>
        <div style={{ background: p.couleur, color: C.encre, fontFamily: POLICE, fontWeight: 900, fontSize: 36, padding: "2px 20px", marginTop: -4, letterSpacing: 6, border: `5px solid ${C.encre}` }}>{p.ou}</div>
      </div>
      <Vitesse de={de} a={de + 14} cx={540} cy={820} rx={320} ry={520} force={0.8} z={4} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- le titre du « générique »
/** ランダム・ジャパン : il tombe sur la carte quand elle s'ouvre (temps 8), en grand, et repart au temps 14 (la vidéo 2 donne les siens). */
export const Titre: React.FC<{ de?: number; a?: number; ombre?: string }> = ({ de = T.carte, a = b(14), ombre = C.rouge }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a + 10) return null;
  const v = rebond(f, de, 360, 18);
  const sortie = expoEntree(entre(f, a, a + 10));
  const rgb = 14 * Math.exp(-(f - de) / 6) + 3 * Math.abs(houle(f, 0.37));
  const ligne = (texte: string, k: number) => (
    <div style={{
      fontFamily: TITRE, fontSize: 196, lineHeight: 0.98, color: "#fff", WebkitTextStroke: `16px ${C.encre}`, paintOrder: "stroke fill", whiteSpace: "nowrap",
      textShadow: `${(-rgb).toFixed(1)}px 0 rgba(0,230,255,.75), ${rgb.toFixed(1)}px 0 rgba(255,40,60,.75), 12px 14px 0 ${ombre}, 18px 22px 0 ${C.encre}`,
      transform: `translateX(${((k ? 1 : -1) * 500 * (1 - v)).toFixed(1)}px)`,
    }}>{texte}</div>
  );
  return (
    <div style={{
      position: "absolute", left: 160, right: 40, top: 560, zIndex: 92, display: "flex", flexDirection: "column", alignItems: "center",
      transform: `scale(${(2.1 - 1.1 * v - 0.5 * sortie).toFixed(4)}) rotate(${(-5 - 6 * (1 - v)).toFixed(2)}deg) translateY(${(-500 * sortie).toFixed(1)}px)`,
      opacity: Math.min(1, (f - de + 1) / 2) * (1 - sortie),
    }}>
      {ligne("ランダム", 0)}
      {ligne("ジャパン", 1)}
      <div style={{
        marginTop: 26, background: C.rouge, color: "#fff", fontFamily: POLICE, fontWeight: 900, fontSize: 56, letterSpacing: 8, padding: "6px 34px",
        border: `7px solid ${C.encre}`, boxShadow: `8px 10px 0 ${C.encre}`, transform: `skewX(-12deg) scaleX(${rebond(f, de + 6).toFixed(3)})`, whiteSpace: "nowrap",
      }}>RANDOM JAPAN PLACE</div>
    </div>
  );
};

// ---------------------------------------------------------------- les éclairs de couleur, entre les plans
const ECLAIRS = [
  { f: T.takeda - 1, c: "#fff", d: 2, o: 0.7 },
  { f: b(27), c: "#000", d: 1 }, { f: b(29), c: C.rouge, d: 1 }, { f: b(31), c: "#000", d: 1 },
  { f: T.persos, c: "#fff", d: 2 }, { f: b(35), c: C.rouge, d: 1 }, { f: b(37), c: "#000", d: 1 },
  { f: T.refrain - 1, c: "#fff", d: 3 }, { f: T.refrain + 2, c: C.rouge, d: 1, o: 0.7 }, { f: T.refrain + 3, c: "#000", d: 1 },
  { f: T.sanctuaires, c: "#fff", d: 2, o: 0.8 }, { f: T.heros, c: C.rouge, d: 2 }, { f: T.feux, c: "#fff", d: 2 },
];

// ---------------------------------------------------------------- le son
const AVANCE = 2; // l'AAC du MP4 retarde le son d'autant
const CHANSON = 0.8;
const DOUX = 0.6; // les bruitages, sous la chanson
/** [seconde de la vidéo, fichier, volume, durée (s)]. */
const SFX: [number, string, number, number?][] = [
  // le hook, avant la chanson : la chambre, le katana qu'on dégaine, la lame qui fend l'air
  [0, "sfx/piece.wav", 0.5, V0 / FPS + 0.3],
  [0.12, "sfx/katana.wav", 0.75, 1.4],
  [T.coupe / FPS + 0.68, "sfx/sweep-metal-quick.mp3", 0.9],
  [V0 / FPS - 0.05, "sfx/transition-snap.mp3", 0.5],
  // l'animé : la caméra entre dans le téléphone ; le titre tombe
  [T.carte / FPS - 0.32, "sfx/zoom-air-fast.mp3", 0.5 * DOUX],
  [T.carte / FPS, "sfx/impact-deep-whoosh.mp3", 0.45 * DOUX],
  [b(11) / FPS, "sfx/pops.mp3", 0.4 * DOUX],
  // les panoramiques éclair
  ...COUPES_FOUET.map((x): [number, string, number] => [x / FPS - 0.3, "sfx/swoosh-quick.mp3", 0.4 * DOUX]),
  // le sabre animé avant le refrain
  [T.refrain / FPS - 0.3, "sfx/sweep-metal-quick.mp3", 0.6 * DOUX],
  [T.refrain / FPS - 0.05, "sfx/katana.wav", 0.35 * DOUX, 0.9],
  [T.heros / FPS + 0.1, "sfx/katana.wav", 0.3 * DOUX, 1.2],
  // la fin
  [T.fin / FPS, "sfx/shimmer-sparkle-sweep.mp3", 0.4 * DOUX],
];

const Son: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const { durationInFrames: duree } = useVideoConfig();
  return (
    <>
      {bgm && (
        <Sequence from={V0 - AVANCE} layout="none">
          <Audio src={staticFile("musique/chanson.wav")} volume={CHANSON} />
        </Sequence>
      )}
      {SFX.map(([a, nom, v, d], i) => (
        <Sequence key={i} from={Math.max(0, s(a) - AVANCE)} durationInFrames={Math.min(s(d ?? 3), duree)} layout="none">
          <Audio src={staticFile(nom)} volume={d === undefined ? v : (g) => v * interpolate(g, [s(d) - 12, s(d)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </Sequence>
      ))}
    </>
  );
};

// ---------------------------------------------------------------- tout
export const Generique: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const surCarte = CARTE.some(([a, z]) => f >= a && f < z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      {PERSOS.map((p, i) => <Personnage key={i} p={p} i={i} de={b(33 + 2 * i)} a={b(33 + 2 * i) + DUREE_PERSO} />)}
      {/* un voile en haut pour les paroles et les mots, sur les plans clairs */}
      <AbsoluteFill style={{ zIndex: 50, background: "linear-gradient(rgba(0,0,0,.32) 0px, rgba(0,0,0,0) 620px)", opacity: f >= T.carte && f < T.fin ? 1 : 0 }} />
      <Titre />
      <Vitesse de={T.refrain} a={T.refrain + 20} cx={540} cy={900} force={0.9} />
      <Vitesse de={T.heros} a={T.heros + 26} cx={430} cy={760} rx={280} ry={430} force={0.7} />
      {PAROLES.jp.map((l, i) => <Parole key={i} {...l} />)}
      {PAROLES.en.map((l, i) => <Mots key={i} texte={l.texte} de={l.de} fin={l.fin} a={l.a} />)}
      <Credit role="原作" nom="@random_japan_place" de={b(15)} a={b(24)} />
      <Credit role="舞台" nom="JAPAN · 150+ PLACES" de={b(25)} a={b(33)} />
      <Sources visible={surCarte} />
      <Eclairs liste={ECLAIRS} />
      <Fin />
      <Accroche />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={220} samples={8}>{image}</CameraMotionBlur> : image}
      <Son bgm={bgm} />
    </AbsoluteFill>
  );
};

