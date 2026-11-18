// Vidéo 10 (2026-11-18) : Tsubosaka-dera, ouvert à tout le monde le 12 novembre : un temple pour les yeux, avec des statues géantes taillées
// en Inde. L'accroche : le vrai visage du grand Bouddha dans les cerisiers, « A temple for your eyes » dès l'image 0 ; le vrai grand Kannon d'en
// bas ; sur « India », un grand sceau rouge 天竺 (l'Inde, dans le vieux japonais du temple : 天竺渡来, « venu d'Inde ») s'abat, des pétales
// giclent, l'air du lieu démarre sur ce coup. Son introduction porte la vraie place du grand Bouddha glissée dans le jeu et l'arrivée en bus ; sa
// mélodie entre quand la caméra monte l'escalier vers la porte des Niō et que le grand Bouddha apparaît. Puis, dans l'ordre demandé : l'encens,
// le gong et la prière pour les yeux, le test des yeux, les lunettes perdues, les poupées du grand pavillon, le thé, la grotte de pierre et le
// tour du stupa, le Bouddha couché, le grand Kannon de 20 m, la marche de Sawaichi les yeux fermés, son shamisen (le cinquième tampon, puis on
// en joue immobile), la nuit et ses ombrelles ; le secret, montré sans être résolu (les rakan des rochers de la forêt) ; la fin. Sur l'air de
// jour de Tsubosaka (80 battements). Le plan : outils/video/balade/plan-tsubosaka.md.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoEntree, expoSortie, JAPONAIS, rebond, s } from "./theme";

const B = 60 / 80; // (s) un temps de l'air
/** Le sceau tombe sur « In- » de « India » (mesuré sur la voix : 1,72 s dans k1b, placée à 1,50 s) ; c'est le premier temps de l'air. */
const T0 = 3.22;
const sec = (n: number) => T0 + n * B;
const b = (n: number) => s(sec(n));
export const LONGUEUR = b(66) + s(4.6);

export const PLANS: Plan[] = [
  // l'accroche : le vrai visage du grand Bouddha, puis le vrai grand Kannon (ralentis)
  { de: 0, a: s(1.46), prise: "reel/ts-visage", t: 0, zoom: [1.0, 1.07], centre: [0.5, 0.45] },
  { de: s(1.46), a: b(2), prise: "reel/ts-kannon", t: 0, vitesse: 0.92, entree: "punch", zoom: [1.0, 1.12], centre: [0.5, 0.42] },
  // la vraie place du grand Bouddha, glissée dans celle du jeu
  { de: b(2), a: b(6), prise: "ts-place", t: 0.3, entree: "fouet", reel: { lieu: "ts-place", t: 0, volet: s(B) } },
  { de: b(6), a: b(8), prise: "ts-bus", t: 0.4, entree: "fouet" },
  // l'escalier, la porte des Niō, le grand Bouddha au-dessus d'elle : la mélodie entre
  { de: b(8), a: b(11), prise: "ts-nio", t: 1.2, entree: "fouet" },
  { de: b(11), a: b(14), prise: "ts-encens", t: 0.9, entree: "fouet" },
  { de: b(14), a: b(17), prise: "ts-gong", t: 0.5, entree: "fouet" },
  { de: b(17), a: b(20), prise: "ts-test", t: 5.1, entree: "fouet" },
  { de: b(20), a: b(23), prise: "ts-lunettes", t: 0.3, entree: "fouet" },
  { de: b(23), a: b(26), prise: "ts-poupees", t: 0.3, entree: "fouet" },
  { de: b(26), a: b(29), prise: "ts-the", t: 6.3, entree: "fouet" },
  { de: b(29), a: b(33), prise: "ts-grotte", t: 1.4, entree: "fouet" },
  { de: b(33), a: b(36), prise: "ts-stupa", t: 1.5, entree: "fouet" },
  { de: b(36), a: b(39), prise: "ts-nehan", t: 0.3, entree: "fouet" },
  // le grand Kannon : le vrai de l'accroche, en écho, glissé dans celui du jeu
  { de: b(39), a: b(43), prise: "ts-kannon", t: 0.3, entree: "fouet", reel: { lieu: "ts-kannon", t: 1.2, volet: s(B) } },
  // la marche de Sawaichi : les vrais hortensias, le couloir du jeu, puis les yeux fermés
  { de: b(43), a: b(45), prise: "ts-couloir", t: 0.3, entree: "fouet", reel: { lieu: "ts-hortensias", t: 0, volet: s(B * 0.8) } },
  { de: b(45), a: b(47), prise: "ts-sawaichi", t: 8.3, entree: "punch" },
  // le cinquième tampon, la carte du shamisen ; on en joue, immobile
  // (le tampon à 13,0 s de la prise ; la carte du shamisen à 17,6 s ; le nuage et le shamisen en main à 22,0 s)
  { de: b(47), a: b(49), prise: "ts-tampon", t: 12.85, entree: "fouet" },
  { de: b(49), a: b(50), prise: "ts-tampon", t: 17.55, entree: "punch" },
  { de: b(50), a: b(51), prise: "ts-tampon", t: 21.9, entree: "punch" },
  { de: b(51), a: b(54), prise: "ts-shamisen", t: 2.6, entree: "punch" },
  // la nuit : les vraies ombrelles allumées, glissées dans celles du jeu
  { de: b(54), a: b(57), prise: "ts-nuit", t: 0.3, entree: "fouet", luminosite: 1.3, reel: { lieu: "ts-ombrelles", t: 0, volet: s(B) } },
  // le secret : le sentier, un rocher de rakan
  { de: b(57), a: b(61), prise: "ts-sentier", t: 0.3, entree: "fouet" },
  { de: b(61), a: b(66), prise: "ts-rocher", t: 0.3, entree: "fouet" },
  { de: b(66), a: LONGUEUR, prise: "ts-fin", t: 0.5, entree: "fouet" },
];

const DOUX = 0.6;

// Chaque morceau de réplique (voix.py, MORCEAUX) tombe avec son texte à l'écran ; Son vérifie qu'ils ne se superposent pas.
const BANDE: Bande = {
  musique: [
    // rien avant le sceau, la voix seule ; l'introduction de l'air, plus douce, jusqu'à la porte des Niō, où sa mélodie entre
    { fichier: "tsubosaka.wav", debut: 0.15, volume: 3.0, de: T0, a: sec(8) + 0.05 },
    { fichier: "tsubosaka.wav", debut: 0.15 + 8 * B, volume: 2.1, de: sec(8) },
  ],
  // (six morceaux sortis 1,5 à 4 dB plus bas que la moyenne de la voix, mesurés sur le premier rendu : remontés)
  voix: [
    ["k1a", 0.02], ["k1b", 1.50],
    ["k2a", sec(2) + 0.04], ["k2b", sec(2) + 0.98],
    ["k3a", sec(6) + 0.04], ["k3b", sec(8) + 0.04], ["k3c", sec(11) + 0.04], ["k3d", sec(14) + 0.04], ["k3e", sec(17) + 0.04],
    ["k3f", sec(20) + 0.04], ["k3g", sec(23) + 0.02], ["k3h", sec(26) + 0.04, 1.2],
    ["k4a", sec(29) + 0.04], ["k4b", sec(33) + 0.04], ["k4c", sec(36) + 0.04], ["k4d", sec(39) + 0.04],
    ["k5a", sec(43) + 0.04, 1.15], ["k5b", sec(45) + 0.04, 1.5],
    ["k6a", sec(47) + 0.04], ["k6b", sec(49) + 0.04], ["k6c", sec(51) + 0.04],
    ["k7", sec(54) + 0.04],
    ["k8a", sec(57) + 0.04, 1.25], ["k8b", sec(61) + 0.1, 1.4], ["k9", sec(64) + 0.1, 1.2],
    ["k10a", sec(66) + 0.3], ["k10b", sec(66) + 1.3], ["k10c", sec(66) + 2.3],
  ],
  durees: {
    k1a: 1.39, k1b: 2.19, k2a: 0.82, k2b: 1.70, k3a: 1.0, k3b: 1.24, k3c: 1.92, k3d: 2.10, k3e: 1.03, k3f: 1.90, k3g: 2.15, k3h: 1.45,
    k4a: 2.14, k4b: 1.10, k4c: 1.51, k4d: 2.0, k5a: 1.31, k5b: 1.15, k6a: 1.17, k6b: 1.23, k6c: 1.82, k7: 1.88, k8a: 2.98, k8b: 2.06, k9: 0.69,
    k10a: 0.87, k10b: 0.85, k10c: 0.83,
  },
  sfx: ([
    // les fonds : les insectes la nuit, les feuilles dans la forêt. Plus de feuilles sous l'accroche (le propriétaire, 2026-11-18 : « des
    // bruits… peut-être des frottements… au début, trop forts ») : seules avant la musique, ce souffle tout en aigus n'était qu'à 11 dB
    // sous la voix ; et sa boucle de 7 s s'arrêtait net à 10 s.
    [sec(54) - 0.2, "sfx-jeu/boucle-insectes.wav", 0.04, sec(57) - sec(54) + 0.2],
    [sec(57), "sfx-jeu/boucle-feuilles.wav", 0.04, sec(66) - sec(57)],
    // l'accroche : le passage au Kannon ; le sceau
    [1.46 - 0.05, "sfx/swoosh-quick.mp3", 0.3],
    [T0 - 0.02, "sfx/tampon.mp3", 0.9], [T0, "sfx/bass-hit-short.mp3", 0.55], [T0 + 0.02, "sfx-jeu/pouf.wav", 0.4],
    // la place, le bus
    [sec(2) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(3) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [sec(6) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    // l'escalier, la porte : la mélodie entre, tout s'ouvre
    [sec(8) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(8) + 0.4, "sfx/air-whoosh-powerful.mp3", 0.5],
    // l'encens, le gong, le test, les lunettes
    [sec(11) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(11) + 0.6, "sfx-jeu/pouf.wav", 0.3],
    [sec(14) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(14) + 0.15, "sfx-jeu/waniguchi.wav", 0.6],
    [sec(17) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(17) + 0.65, "sfx-jeu/choix.wav", 0.5], [sec(17) + 1.9, "sfx-jeu/choix.wav", 0.5],
    [sec(20) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(20) + 0.6, "sfx/sparkle-touch.mp3", 0.4],
    // les poupées, le thé
    [sec(23) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(23) + 0.4, "sfx/shimmer-sparkle-sweep.mp3", 0.4],
    [sec(26) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(26) + 1.4, "sfx-jeu/slurp.wav", 0.5],
    // la grotte, le stupa, le Bouddha couché, le Kannon
    [sec(29) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(29) + 0.6, "sfx-jeu/roc.wav", 0.3],
    [sec(33) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    [sec(36) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    [sec(39) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(40) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    // la marche de Sawaichi : le masque, la canne, le shamisen qui guide
    [sec(43) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(43.8) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.5],
    [sec(45) + 0.1, "sfx-jeu/caillou.wav", 0.4], [sec(45) + 0.5, "sfx-jeu/oiseau-shamisen0.wav", 0.5], [sec(45) + 0.9, "sfx-jeu/caillou.wav", 0.3], [sec(46) + 0.4, "sfx-jeu/oiseau-shamisen2.wav", 0.5],
    // le tampon, la carte, le shamisen
    [sec(47) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(47) + 0.15, "sfx-jeu/pression.wav", 0.38], [sec(47) + 0.21, "sfx-jeu/tampon.wav", 0.45],
    [sec(49) + 0.05, "sfx-jeu/cadeau.wav", 0.5], [sec(50) + 0.1, "sfx-jeu/pouf.wav", 0.4],
    ...[0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8].map((d, i): [number, string, number] => [sec(51) + 0.15 + d, `sfx-jeu/oiseau-shamisen${[0, 2, 4, 2, 3, 4, 5][i]}.wav`, 0.5]),
    // la nuit
    [sec(54) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(55) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.5],
    // le secret
    [sec(57) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    [sec(61) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(61) + 0.4, "sfx/light-spell.mp3", 0.16, 2.0],
    // la fin
    [sec(66) - 0.14, "sfx/whoosh-fast.mp3", 0.4], [sec(66) + 0.25, "sfx/bass-hit-short.mp3", 0.27], [sec(66) + 0.3, "sfx/pop.mp3", 0.27],
  ] as Bande["sfx"]).map(([a, nom, v, d]): Bande["sfx"][number] => (d === undefined ? [a, nom, v * DOUX] : [a, nom, v, d])),
};

// ---------------------------------------------------------------- le sceau et les pétales
/** Un hasard fixe (le rendu reste le même à chaque image). */
const hasard = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Les pétales de cerisier qui giclent sous le sceau : une bouffée de poussière de pierre derrière lui, des pétales qui partent en étoile, tournent et
 *  retombent en flottant. */
const Petales: React.FC<{ g: number; cx: number; cy: number }> = ({ g, cx, cy }) => {
  if (g < 0 || g > 90) return null;
  const u = expoSortie(g / 30), fin = entre(g, 18, 70);
  return (
    <>
      {[0, 1, 2, 3, 4, 5, 6].map((k) => {
        const a = (k / 7) * 2 * Math.PI + 0.4, r = 150 + 200 * u, t = 420 + 90 * hasard(k + 40);
        return (
          <div key={k} style={{
            position: "absolute", left: cx + Math.cos(a) * r - t / 2, top: cy + Math.sin(a) * r * 0.62 + 40 * u - t / 2, width: t, height: t, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,228,220,.62) 0%, rgba(236,228,220,.28) 42%, rgba(236,228,220,0) 70%)",
            transform: `scale(${(0.55 + 0.6 * u).toFixed(3)})`, opacity: 1 - fin,
          }} />
        );
      })}
      {[...Array(70)].map((_, k) => {
        const a = hasard(k) * 2 * Math.PI, v = 220 + 600 * hasard(k + 500) ** 2, taille = 14 + 22 * hasard(k + 1300);
        const r = 170 + v * u, chute = 380 * (g / 90) * (g / 90), tour = (hasard(k + 700) - 0.5) * 900 * (g / 90), balance = 30 * Math.sin(g / 9 + k);
        return (
          <svg key={k} width={taille} height={taille} viewBox="-1 -1 2 2" style={{
            position: "absolute", left: cx + Math.cos(a) * r - taille / 2 + balance, top: cy + Math.sin(a) * r * 0.8 + chute - taille / 2,
            transform: `rotate(${(hasard(k + 900) * 360 + tour).toFixed(1)}deg) scaleX(${(0.45 + 0.55 * Math.abs(Math.cos(g / 7 + k))).toFixed(3)})`,
            opacity: 1 - entre(g, 45 + 30 * hasard(k + 900), 90),
          }}>
            {/* un pétale : une goutte, l'encoche au bout */}
            <path d="M0 1 C -0.9 0.3 -0.7 -0.8 -0.18 -0.95 L 0 -0.7 L 0.18 -0.95 C 0.7 -0.8 0.9 0.3 0 1 Z" fill={k % 3 ? "#f7d6dc" : "#f2bcc8"} />
          </svg>
        );
      })}
    </>
  );
};

/** Le sceau rouge 天竺 (l'Inde), de la carte et du carnet de tampons : il s'abat au milieu de l'image, l'encre un peu usée. */
const Sceau: React.FC = () => {
  const f = useCurrentFrame(), t0 = s(T0);
  if (f < t0 - 3 || f > b(2) + 16) return null;
  const v = rebond(f, t0 - 3, 900, 34), fuite = expoEntree(entre(f, b(2) - 16, b(2) + 6));
  const L = 480;
  return (
    <AbsoluteFill style={{ transform: `translateX(${(-1250 * fuite).toFixed(1)}px)`, opacity: 1 - fuite }}>
      <Petales g={f - t0} cx={540} cy={1060} />
      <div style={{
        position: "absolute", left: 540 - L / 2, top: 1060 - L / 2, width: L, height: L, transformOrigin: "50% 50%",
        transform: `scale(${(2.6 - 1.6 * Math.min(1, v)).toFixed(4)}) rotate(${(-6 - 5 * (1 - Math.min(1, v))).toFixed(2)}deg)`, opacity: f >= t0 - 3 ? 1 : 0,
        filter: "drop-shadow(0 14px 22px rgba(40,20,20,.5))",
      }}>
        <svg width={L} height={L} viewBox="0 0 430 430">
          <rect x={8} y={8} width={414} height={414} rx={44} fill={C.rouge} />
          <rect x={30} y={30} width={370} height={370} rx={28} fill="none" stroke={C.papier} strokeWidth={10} />
          <text x={215} y={190} textAnchor="middle" fontFamily={JAPONAIS} fontWeight={700} fontSize={170} fill={C.papier}>天</text>
          <text x={215} y={362} textAnchor="middle" fontFamily={JAPONAIS} fontWeight={700} fontSize={170} fill={C.papier}>竺</text>
          {/* l'encre usée : quelques manques, sur le papier et les signes */}
          {[...Array(46)].map((_, k) => (
            <circle key={k} cx={20 + 390 * hasard(k + 2000)} cy={20 + 390 * hasard(k + 2400)} r={1.2 + 4.6 * hasard(k + 2800) ** 2} fill={k % 4 ? C.rougeFonce : C.papier} opacity={k % 4 ? 0.55 : 0.8} />
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/** « Can you find it? » : l'image s'assombrit autour du rocher, puis presque tout s'éteint. */
const Ombre: React.FC = () => {
  const f = useCurrentFrame();
  if (f < b(61) || f > b(66) + 4) return null;
  const noir = expoSortie(entre(f, s(sec(64) + 0.05), s(sec(64) + 0.65)));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 92% 54% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 52%, rgba(0,0,0,.55) 100%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 34% at 50% 52%, rgba(0,0,0,.25) 0%, rgba(0,0,0,.92) 100%)", opacity: noir }} />
    </AbsoluteFill>
  );
};

/** Les yeux qui se ferment (la marche de Sawaichi) : deux paupières noires qui se rejoignent, juste avant le masque du jeu. */
const Paupieres: React.FC = () => {
  const f = useCurrentFrame(), d = b(45) - s(0.28);
  if (f < d - 2 || f > b(45) + 2) return null;
  const u = expoEntree(entre(f, d, b(45)));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: -100, right: -100, top: -60, height: 60 + 1020 * u, background: "#07070e", borderRadius: "0 0 50% 50% / 0 0 180px 180px" }} />
      <div style={{ position: "absolute", left: -100, right: -100, bottom: -60, height: 60 + 1020 * u, background: "#07070e", borderRadius: "50% 50% 0 0 / 180px 180px 0 0" }} />
    </AbsoluteFill>
  );
};

const Textes: React.FC = () => (
  <>
    <Cadre texte="A temple for your *eyes* 👁️" de={-30} a={s(1.30)} />
    <Cadre texte={"…with *giant statues*\ncarved in *India*!"} de={s(1.48)} a={b(2) - 8} />
    <Cadre texte="*Tsubosaka-dera*…" de={b(2) + 3} a={s(sec(2) + 0.88)} />
    <Cadre texte={"…is now in my\n*3D game*!"} de={s(sec(2) + 0.96)} a={b(6) - 4} />
    <Etiquette n="13" nom="Tsubosaka-dera" ja="壺阪寺 · Nara" sous="NEW" de={b(3.2)} a={b(6) - 6} />
    <Cadre texte="Arrive by *bus*," de={b(6) + 2} a={b(8) - 4} />
    <Cadre texte="walk through the *Niō gate*," de={b(8) + 2} a={b(11) - 4} taille={56} />
    <Cadre texte={"offer *incense* to the\nGreat Buddha,"} de={b(11) + 2} a={b(14) - 4} />
    <Cadre texte={"ring the *gong* and pray\nfor your *eyes*,"} de={b(14) + 2} a={b(17) - 4} />
    <Cadre texte="take the *eye test*," de={b(17) + 2} a={b(20) - 4} />
    <Cadre texte={"find an old man's\nlost *glasses* 👓"} de={b(20) + 2} a={b(23) - 4} />
    <Cadre texte={"see hundreds of *dolls*\nin the great hall,"} de={b(23) + 2} a={b(26) - 4} />
    <Cadre texte={"and have *tea* at\nthe tea house 🍵"} de={b(26) + 2} a={b(29) - 4} />
    <Cadre texte={"Step inside a *stone cave*\nfrom *India*,"} de={b(29) + 2} a={b(33) - 4} taille={56} />
    <Cadre texte="walk around its *stupa*," de={b(33) + 2} a={b(36) - 4} />
    <Cadre texte={"meet the *reclining\nBuddha*…"} de={b(36) + 2} a={b(39) - 4} />
    <Cadre texte={"…and look up at the\n*20-metre Kannon*!"} de={b(39) + 2} a={b(43) - 4} />
    <Cadre texte="Walk *Sawaichi's* path…" de={b(43) + 2} a={b(45) - 4} />
    <Cadre texte={"…with your\n*eyes closed* 🙈"} de={b(45) + 2} a={b(47) - 4} />
    <Cadre texte="Get all *five stamps*," de={b(47) + 2} a={b(49) - 4} />
    <Cadre texte={"and earn his\n*shamisen* 🪕"} de={b(49) + 2} a={b(51) - 4} />
    <Cadre texte={"Stand still…\nand you *play it*! 🎶"} de={b(51) + 2} a={b(54) - 4} />
    <Cadre texte={"At night, the\n*umbrellas* light up…"} de={b(54) + 2} a={b(57) - 4} />
    <Cadre texte={"But in the forest, *stone monks*\nare carved into the rocks."} de={b(57) + 2} a={b(61) - 4} taille={52} largeur={1040} />
    <Cadre texte={"They say one of them\nhas a *face you know*…"} de={b(61) + 2} a={s(sec(64))} />
    <Cadre texte="Can you *find it*? 👀" de={s(sec(64) + 0.08)} a={b(66) - 4} />
    <Fin de={b(66)} titre={"Tsubosaka-dera\nin 3D"} ligne="+ 12 more places · free" />
  </>
);

const FLOU: [number, number][] = [b(2), b(6), b(8), b(11), b(14), b(17), b(20), b(23), b(26), b(29), b(33), b(36), b(39), b(43), b(47), b(54), b(57), b(61), b(66)].map((n): [number, number] => [n - 18, n + 18]);

export const Temple: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  // le choc du sceau : l'image tremble
  const choc = entre(f, s(T0), s(T0) + 16), force = f >= s(T0) && choc < 1 ? (1 - choc) * (1 - choc) : 0;
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit, transform: force ? `translate(${(30 * force * Math.sin(f * 2.4)).toFixed(1)}px, ${(38 * force * Math.cos(f * 3.1)).toFixed(1)}px)` : undefined }}>
      <Plans plans={PLANS} />
      <Paupieres />
      <Ombre />
      <AbsoluteFill style={{ top: -60, left: -60, width: 1200, height: 2040, background: "linear-gradient(rgba(0,0,0,.32) 60px, rgba(0,0,0,.12) 440px, rgba(0,0,0,0) 700px)", opacity: f < b(66) ? 1 : 1 - expoSortie(entre(f, b(66), b(66) + 20)) }} />
      <Sceau />
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
