// Vidéo 9 (2026-11-04) : les dunes de Tottori, ouvertes à tout le monde ce jour-là : un désert au Japon, juste au-dessus de la mer. On monte
// un grand escalier et tout s'ouvre d'un coup. L'accroche : le vrai sable à perte de vue, le vent seul et « This isn't the Sahara… » dès
// l'image 0 ; sur « Japan », un grand sceau rouge 日本 s'abat, le sable gicle, l'air du lieu démarre sur ce coup. Son introduction porte le mur
// de sable au-dessus de la mer et l'escalier (on ne voit que les marches et le ciel) ; sa mélodie entre quand la caméra passe le haut des
// marches : le sable, l'oasis, la crête, la mer, en un seul vol. Puis, dans l'ordre demandé : le Dos de cheval, le chameau, la descente en
// planche et son chrono, le télésiège, le repas, les jumelles, le musée, l'oasis, l'ombrelle de Shan-shan ; le secret, montré sans être
// résolu (les traces, le grelot, un aperçu de la caravane devant la lune) ; la fin. Sur l'air de jour de Tottori (88 battements).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoEntree, expoSortie, JAPONAIS, rebond, s } from "./theme";

const B = 60 / 88; // (s) un temps de l'air
/** Le sceau tombe sur « -pan » de « Japan » (mesuré sur la voix : 2,30 s dans j1, placée à 0,03 s) ; c'est le premier temps de l'air. */
const T0 = 2.33;
const sec = (n: number) => T0 + n * B;
const b = (n: number) => s(sec(n));
export const LONGUEUR = b(66) + s(4.6);

export const PLANS: Plan[] = [
  // l'accroche : le vrai sable
  { de: 0, a: b(2), prise: "reel/tt-sable", t: 0, zoom: [1.0, 1.05] },
  // le mur de sable au-dessus de la mer
  { de: b(2), a: b(5), prise: "tt-mur", t: 0.3, entree: "fouet", reel: { lieu: "tt-mur", t: 0, volet: s(B) } },
  // l'escalier et le vol, une seule prise : la caméra passe le haut des marches sur la mélodie (temps 8)
  { de: b(5), a: b(16), prise: "tt-escalier", t: 0.98, entree: "fouet" },
  { de: b(16), a: b(20), prise: "tt-crete", t: 0.3, entree: "fouet", reel: { lieu: "tt-vue", t: 0, volet: s(B) } },
  { de: b(20), a: b(23), prise: "tt-chameau", t: 13.0, entree: "fouet" },
  // (la descente : l'arche de départ au-dessus d'elle ; puis ×2,4 jusqu'à la ligne, à 24,15 s de la prise : six portes sur six, 15,70 s, l'arche d'arrivée)
  { de: b(23), a: b(26), prise: "tt-planche", t: 9.0, entree: "fouet", reel: { lieu: "tt-planche", t: 0, volet: s(0.5) } },
  { de: b(26), a: b(28), prise: "tt-planche", t: 20.88, vitesse: 2.4, entree: "punch" },
  { de: b(28), a: b(29), prise: "tt-planche", t: 24.15, entree: "punch" },
  { de: b(29), a: b(32), prise: "tt-lift", t: 40.4, entree: "fouet" },
  { de: b(32), a: b(35), prise: "tt-repas", t: 6.0, entree: "fouet" },
  // (les jumelles : la chose trouvée à 3,8 s et à 5,0 s de la prise)
  { de: b(35), a: b(38), prise: "tt-jumelles", t: 3.2, entree: "fouet" },
  { de: b(38), a: b(42), prise: "tt-musee", t: 0.3, entree: "fouet", reel: { lieu: "tt-musee", t: 0, volet: s(0.5) } },
  { de: b(42), a: b(46), prise: "tt-oasis", t: 2.0, entree: "fouet", reel: { lieu: "tt-oasis", t: 0, volet: s(0.6) } },
  // (le tampon à 6,45 s de la prise, la carte de la récompense jusqu'à 13,9 s, le nuage et l'ombrelle à 14,75 s)
  { de: b(46), a: b(49), prise: "tt-tampon", t: 5.6, entree: "fouet" },
  { de: b(49), a: b(50.5), prise: "tt-tampon", t: 12.0, entree: "punch" },
  { de: b(50.5), a: b(51.75), prise: "tt-tampon", t: 14.55, entree: "punch" },
  { de: b(51.75), a: b(54), prise: "tt-ombrelle", t: 0.6, entree: "punch" },
  { de: b(54), a: b(58), prise: "tt-traces", t: 0.3, entree: "fouet" },
  { de: b(58), a: b(61), prise: "tt-grelot", t: 0.3, entree: "fouet" },
  { de: b(61), a: b(66), prise: "tt-lune", t: 0.3, entree: "fouet" },
  { de: b(66), a: LONGUEUR, prise: "tt-fin", t: 0.8, entree: "fouet" },
];

const DOUX = 0.6;

// Chaque morceau de réplique (voix.py) tombe avec son texte à l'écran ; Son vérifie qu'ils ne se superposent pas.
const BANDE: Bande = {
  musique: [
    // rien avant le sceau, le vent seul ; l'introduction de l'air, plus douce, jusqu'au haut de l'escalier, où sa mélodie entre
    { fichier: "tottori.wav", debut: 0.15, volume: 3.0, de: T0, a: sec(8) + 0.05 },
    { fichier: "tottori.wav", debut: 0.15 + 8 * B, volume: 2.1, de: sec(8) },
  ],
  voix: [
    // (six morceaux sortis de Flora 2 à 5 dB plus bas que les autres, remontés)
    ["j1", 0.03, 1.25], ["j2", sec(2) + 0.03, 1.4],
    ["j3a", sec(5) + 0.04], ["j3b", sec(8) + 0.12],
    ["j4a", sec(10.45)], ["j4b", sec(11.71), 1.15], ["j4c", sec(13.15), 1.1], ["j4d", sec(14.69)],
    ["j5a", sec(16) + 0.05], ["j5b", sec(20) + 0.04], ["j5c", sec(23) + 0.04], ["j5d", sec(26) + 0.04],
    ["j6a", sec(29) + 0.04], ["j6b", sec(32) + 0.04], ["j6c", sec(35) + 0.04],
    ["j7a", sec(38) + 0.04], ["j7b", sec(42) + 0.04],
    ["j8a", sec(46) + 0.04], ["j8b", sec(49) + 0.04],
    ["j9a", sec(54) + 0.04, 1.5], ["j9b", sec(58) + 0.04, 1.4], ["j9c", sec(61) + 0.04], ["j10", sec(61) + 2.15],
    ["j11a", sec(66) + 0.3], ["j11b", sec(66) + 1.62], ["j11c", sec(66) + 2.5],
  ],
  durees: {
    j1: 2.82, j2: 1.97, j3a: 2.04, j3b: 1.44, j4a: 0.77, j4b: 0.9, j4c: 0.97, j4d: 0.86, j5a: 1.7, j5b: 0.77, j5c: 1.9, j5d: 0.86,
    j6a: 1.0, j6b: 0.88, j6c: 1.65, j7a: 2.33, j7b: 1.84, j8a: 1.39, j8b: 2.72, j9a: 2.57, j9b: 1.87, j9c: 1.97, j10: 0.97, j11a: 1.24, j11b: 0.75, j11c: 0.82,
  },
  sfx: ([
    // les fonds : le vent (l'accroche : lui seul) ; les vagues
    [0.0, "sfx-jeu/boucle-ventFort.wav", 0.08, T0 + 0.5],
    [T0, "sfx-jeu/boucle-ventDoux.wav", 0.04, sec(14.6) - T0],
    [sec(14.6), "sfx-jeu/boucle-vagues.wav", 0.05, sec(20) - sec(14.6)],
    [sec(20), "sfx-jeu/boucle-ventDoux.wav", 0.04, sec(54) - sec(20)],
    [sec(54), "sfx-jeu/boucle-ventDoux.wav", 0.05, sec(61) - sec(54)],
    [sec(61) - 0.2, "sfx-jeu/boucle-insectes.wav", 0.04, sec(66) - sec(61) + 0.2],
    // le sceau
    [T0 - 0.02, "sfx/tampon.mp3", 0.9], [T0, "sfx/bass-hit-short.mp3", 0.55], [T0 + 0.02, "sfx-jeu/pouf.wav", 0.4],
    // le mur
    [sec(2) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(3) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    // l'escalier : ça monte ; la mélodie entre, tout s'ouvre
    [sec(5) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(8) - 2.5, "sfx/montee.mp3", 0.35], [sec(8) - 0.05, "sfx/air-whoosh-powerful.mp3", 0.7],
    [sec(10.4), "sfx/air-whoosh-powerful.mp3", 0.5], [sec(14.4), "sfx/air-whoosh-powerful.mp3", 0.4],
    // le Dos de cheval
    [sec(16) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(17) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    // le chameau
    [sec(20) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(20) + 0.7, "sfx-jeu/oiseau-chameau.wav", 0.4],
    // la planche
    [sec(23) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(23) + 0.45, "sfx/shimmer-sparkle-sweep.mp3", 0.5], [sec(23) + 0.9, "sfx-jeu/oiseau-glisse.wav", 0.6, 3.2], [sec(26) + 0.78, "sfx-jeu/oiseau-porte.wav", 0.5], [sec(28), "sfx-jeu/oiseau-arrivee.wav", 0.6],
    // le télésiège, le repas, les jumelles
    [sec(29) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(29) + 0.6, "sfx-jeu/oiseau-poulies.wav", 0.7],
    [sec(32) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    [sec(35) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(35) + 0.6, "sfx-jeu/oiseau-trouve.wav", 0.6], [sec(35) + 1.8, "sfx-jeu/oiseau-trouve.wav", 0.6],
    // le musée, l'oasis
    [sec(38) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(38) + 0.45, "sfx/shimmer-sparkle-sweep.mp3", 0.5],
    [sec(42) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(42) + 0.55, "sfx/shimmer-sparkle-sweep.mp3", 0.5],
    // le tampon, l'ombrelle
    [sec(46) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(46) + 0.8, "sfx-jeu/pression.wav", 0.38], [sec(46) + 0.86, "sfx-jeu/tampon.wav", 0.45],
    [sec(49) + 0.05, "sfx-jeu/cadeau.wav", 0.5], [sec(50.5) + 0.2, "sfx-jeu/pouf.wav", 0.4], [sec(51.75) + 0.1, "sfx-jeu/oiseau-grelots.wav", 0.5], [sec(53) + 0.05, "sfx-jeu/oiseau-grelots.wav", 0.4],
    // le secret
    [sec(54) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    [sec(58) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(58) + 0.7, "sfx-jeu/oiseau-grelots.wav", 0.3],
    [sec(61) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(61) + 0.2, "sfx/light-spell.mp3", 0.18, 2.0], [sec(61) + 0.5, "sfx-jeu/oiseau-grelots.wav", 0.3], [sec(61) + 1.6, "sfx-jeu/oiseau-grelots.wav", 0.22],
    // la fin
    [sec(66) - 0.14, "sfx/whoosh-fast.mp3", 0.4], [sec(66) + 0.25, "sfx/bass-hit-short.mp3", 0.27], [sec(66) + 0.3, "sfx/pop.mp3", 0.27],
  ] as Bande["sfx"]).map(([a, nom, v, d]): Bande["sfx"][number] => (d === undefined ? [a, nom, v * DOUX] : [a, nom, v, d])),
};

// ---------------------------------------------------------------- le sceau et le sable
/** Un hasard fixe (le rendu reste le même à chaque image). */
const hasard = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Le sable qui gicle sous le sceau : une bouffée de poussière derrière lui, des grains de toutes les tailles qui partent en étoile et retombent. */
const Gicle: React.FC<{ g: number; cx: number; cy: number }> = ({ g, cx, cy }) => {
  if (g < 0 || g > 70) return null;
  const u = expoSortie(g / 30), fin = entre(g, 18, 70);
  return (
    <>
      {[0, 1, 2, 3, 4, 5, 6].map((k) => {
        const a = (k / 7) * 2 * Math.PI + 0.4, r = 150 + 210 * u, t = 420 + 90 * hasard(k + 40);
        return (
          <div key={k} style={{
            position: "absolute", left: cx + Math.cos(a) * r - t / 2, top: cy + Math.sin(a) * r * 0.62 + 40 * u - t / 2, width: t, height: t, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(226,198,150,.72) 0%, rgba(226,198,150,.34) 42%, rgba(226,198,150,0) 70%)",
            transform: `scale(${(0.55 + 0.6 * u).toFixed(3)})`, opacity: 1 - fin,
          }} />
        );
      })}
      {[...Array(90)].map((_, k) => {
        const a = hasard(k) * 2 * Math.PI, v = 200 + 560 * hasard(k + 500) ** 2, taille = 3 + 13 * hasard(k + 1300) ** 2.4;
        const r = 170 + v * u, chute = 620 * (g / 70) * (g / 70);
        return (
          <div key={k} style={{
            position: "absolute", left: cx + Math.cos(a) * r - taille / 2, top: cy + Math.sin(a) * r * 0.8 + chute - taille / 2, width: taille, height: taille, borderRadius: "50%",
            background: k % 3 ? "#ecd6a8" : "#c7a671", opacity: 1 - entre(g, 30 + 30 * hasard(k + 900), 70),
          }} />
        );
      })}
    </>
  );
};

/** Le sceau rouge 日本, de la carte et du carnet de tampons : il s'abat au milieu de l'image, l'encre un peu usée. */
const Sceau: React.FC = () => {
  const f = useCurrentFrame(), t0 = s(T0);
  if (f < t0 - 3 || f > b(2) + 16) return null;
  const v = rebond(f, t0 - 3, 900, 34), fuite = expoEntree(entre(f, b(2) - 16, b(2) + 6));
  const L = 480;
  return (
    <AbsoluteFill style={{ transform: `translateX(${(-1250 * fuite).toFixed(1)}px)`, opacity: 1 - fuite }}>
      <Gicle g={f - t0} cx={540} cy={1000} />
      <div style={{
        position: "absolute", left: 540 - L / 2, top: 1000 - L / 2, width: L, height: L, transformOrigin: "50% 50%",
        transform: `scale(${(2.6 - 1.6 * Math.min(1, v)).toFixed(4)}) rotate(${(-6 - 5 * (1 - Math.min(1, v))).toFixed(2)}deg)`, opacity: f >= t0 - 3 ? 1 : 0,
        filter: "drop-shadow(0 14px 22px rgba(70,30,10,.45))",
      }}>
        <svg width={L} height={L} viewBox="0 0 430 430">
          <rect x={8} y={8} width={414} height={414} rx={44} fill={C.rouge} />
          <rect x={30} y={30} width={370} height={370} rx={28} fill="none" stroke={C.papier} strokeWidth={10} />
          <text x={215} y={190} textAnchor="middle" fontFamily={JAPONAIS} fontWeight={700} fontSize={170} fill={C.papier}>日</text>
          <text x={215} y={362} textAnchor="middle" fontFamily={JAPONAIS} fontWeight={700} fontSize={170} fill={C.papier}>本</text>
          {/* l'encre usée : quelques manques, sur le papier et les signes */}
          {[...Array(46)].map((_, k) => (
            <circle key={k} cx={20 + 390 * hasard(k + 2000)} cy={20 + 390 * hasard(k + 2400)} r={1.2 + 4.6 * hasard(k + 2800) ** 2} fill={k % 4 ? C.rougeFonce : C.papier} opacity={k % 4 ? 0.55 : 0.8} />
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/** Un petit éclat sur le grelot, avec son tintement : il dit que c'est du métal. */
const Reflet: React.FC<{ de: number; x: number; y: number; taille: number }> = ({ de, x, y, taille }) => {
  const f = useCurrentFrame(), u = entre(f, de, de + 26);
  if (u <= 0 || u >= 1) return null;
  const v = Math.sin(Math.PI * u);
  return (
    <svg width={taille} height={taille} viewBox="-1 -1 2 2" style={{ position: "absolute", left: x - taille / 2, top: y - taille / 2, transform: `scale(${v.toFixed(3)}) rotate(${(24 * u).toFixed(1)}deg)`, filter: "drop-shadow(0 0 16px rgba(255,214,120,.95))" }}>
      <path d="M0 -1 Q.1 -.1 1 0 Q.1 .1 0 1 Q-.1 .1 -1 0 Q-.1 -.1 0 -1 Z" fill="#fffbe6" />
    </svg>
  );
};

/** La caravane : à peine un aperçu. Le bord de l'image reste dans le noir et, pour « Can you find out? », tout s'éteint. */
const Ombre: React.FC = () => {
  const f = useCurrentFrame();
  if (f < b(61) || f > b(66) + 4) return null;
  const noir = expoSortie(entre(f, s(sec(61) + 2.05), s(sec(61) + 2.65)));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 92% 54% at 50% 46%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 52%, rgba(0,0,0,.6) 100%)" }} />
      <AbsoluteFill style={{ background: "#000", opacity: 0.86 * noir }} />
    </AbsoluteFill>
  );
};

const Textes: React.FC = () => (
  <>
    <Cadre texte="This isn't the *Sahara*…" de={-30} a={s(1.5)} />
    <Cadre texte="…it's *Japan*!" de={s(1.84)} a={b(2) - 8} />
    <Cadre texte={"A *desert*, right\nabove the *sea* 🌊"} de={b(2) + 3} a={b(5) - 4} />
    <Cadre texte={"In my game, climb\nthe *big stairs*…"} de={b(5) + 3} a={b(8) - 4} />
    <Cadre texte={"…and it all opens\n*at once*!"} de={b(8) + 5} a={s(sec(10.3))} />
    <Etiquette n="12" nom="Tottori Sand Dunes" ja="鳥取砂丘 · Tottori" sous="NEW" de={b(8.6)} a={b(14) - 6} />
    <Cadre texte="The *sand*," de={b(10.45) - 2} a={b(11.66) - 3} />
    <Cadre texte="the *oasis*," de={b(11.71) - 2} a={b(13.1) - 3} />
    <Cadre texte="the great *ridge*…" de={b(13.15) - 2} a={b(14.64) - 3} />
    <Cadre texte="and the *sea*!" de={b(14.69) - 2} a={b(16) - 4} />
    <Cadre texte={"Stand on top of the\n*Horse's Back*"} de={b(16) + 2} a={b(20) - 4} />
    <Cadre texte="Ride a *camel* 🐫" de={b(20) + 2} a={b(23) - 4} />
    <Cadre texte={"Race down to the beach\non a *sandboard*,"} de={b(23) + 2} a={b(26) - 4} y={190} taille={56} />
    <Cadre texte="against the *clock*! ⏱️" de={b(26) + 2} a={b(29) - 4} />
    <Cadre texte="Take the *chairlift*" de={b(29) + 2} a={b(32) - 4} />
    <Cadre texte="Eat at the *restaurant* 🍔" de={b(32) + 2} a={b(35) - 4} taille={56} />
    <Cadre texte={"Play the *binocular game*\non the roof"} de={b(35) + 2} a={b(38) - 4} y={190} taille={56} />
    <Cadre texte={"See a *Sagrada Família*\nmade of sand"} de={b(38) + 2} a={b(42) - 4} />
    <Cadre texte={"…and walk right\ninto the *oasis* 💧"} de={b(42) + 2} a={b(46) - 4} />
    <Cadre texte="Get all *five stamps*…" de={b(46) + 2} a={b(49) - 4} />
    <Cadre texte={"…and earn the *Shan-shan\numbrella*, with its little *bells*! 🔔"} de={b(49) + 2} a={b(54) - 4} taille={52} largeur={1040} />
    <Cadre texte={"But who left these big\n*tracks* on the ridge?"} de={b(54) + 2} a={b(58) - 4} />
    <Cadre texte={"Why is this *bell*\nhalf buried?"} de={b(58) + 2} a={b(61) - 4} />
    <Cadre texte={"And what crosses\nthe *moon* at night?"} de={b(61) + 2} a={s(sec(61) + 2.08)} />
    <Cadre texte="Can you *find out*? 👀" de={s(sec(61) + 2.13)} a={b(66) - 4} />
    <Fin de={b(66)} titre={"Tottori Sand Dunes\nin 3D"} ligne="+ 11 more places · free" />
  </>
);

const FLOU: [number, number][] = [b(2), b(5), b(16), b(20), b(23), b(29), b(32), b(35), b(38), b(42), b(46), b(54), b(58), b(61), b(66)].map((n): [number, number] => [n - 18, n + 18]);

export const Dunes: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  // le choc du sceau : l'image tremble
  const choc = entre(f, s(T0), s(T0) + 16), force = f >= s(T0) && choc < 1 ? (1 - choc) * (1 - choc) : 0;
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit, transform: force ? `translate(${(30 * force * Math.sin(f * 2.4)).toFixed(1)}px, ${(38 * force * Math.cos(f * 3.1)).toFixed(1)}px)` : undefined }}>
      <Plans plans={PLANS} />
      <Ombre />
      <AbsoluteFill style={{ top: -60, left: -60, width: 1200, height: 2040, background: "linear-gradient(rgba(0,0,0,.32) 60px, rgba(0,0,0,.12) 440px, rgba(0,0,0,0) 700px)", opacity: f < b(66) ? 1 : 1 - expoSortie(entre(f, b(66), b(66) + 20)) }} />
      <Sceau />
      <Reflet de={b(58) + s(0.62)} x={640} y={700} taille={210} />
      <Reflet de={b(58) + s(1.2)} x={450} y={760} taille={120} />
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
