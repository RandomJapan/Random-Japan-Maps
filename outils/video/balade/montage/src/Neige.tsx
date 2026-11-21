// Vidéo 12 (2026-11-21) : la fête de la neige d'Iiyama, ouverte à tout le monde le 21 novembre. L'accroche, avec les vrais plans du propriétaire :
// toute une ville sculpte la neige (deux habitants qui taillent la grande sculpture au crépuscule), « A whole town carves the snow… » dès
// l'image 0 ; puis le grand tengu de Narazawa qui fait tournoyer sa torche ; sur « ten- » de « tengu », un grand sceau rouge 天狗 s'abat, des
// braises giclent, l'air du lieu démarre sur ce coup. Son introduction porte encore le feu, puis le vrai vieil homme au chapeau de paille sculpté
// dans la neige ; sur son 8e temps, la mélodie entre et le vrai glisse dans le jeu. Puis, dans l'ordre demandé : l'arrivée sous la neige, la rue
// aux arcades et les étals, le dragon de 20 m, les six Jizō, le coup de pelle au daruma, la lanterne de neige, le toboggan, la descente en bouée
// chronométrée et sa médaille, la navette vers le village des kamakura, la marmite dans le kamakura au lampion rouge, le sanctuaire de neige, la
// nuit et ses kamakura allumés, le grand tengu qui danse avec sa torche, le masque du tengu porté ; le secret montré sans être résolu (la flamme
// du tengu portée vers le haut du château, puis le noir) ; la fin. Sur l'air de jour d'Iiyama (96 battements). Le plan : plan-iiyama.md.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoEntree, expoSortie, JAPONAIS, rebond, s } from "./theme";

const B = 60 / 96; // (s) un temps de l'air
/** Le sceau tombe sur « ten- » de « tengu » (mesuré sur la voix : 0,76 s dans n1c, placée à 2,86 s) ; c'est le premier temps de l'air. */
const T0 = 3.62;
const sec = (n: number) => T0 + n * B;
const b = (n: number) => s(sec(n));
export const LONGUEUR = b(74) + s(4.4);

export const PLANS: Plan[] = [
  // l'accroche : la grande sculpture que deux habitants taillent au crépuscule (ralentie), puis le vrai grand tengu et sa torche
  { de: 0, a: s(2.07), prise: "reel/iy-sculpteurs", t: 0, zoom: [1.0, 1.06], centre: [0.5, 0.45] },
  { de: s(2.07), a: b(5), prise: "reel/iy-tengu", t: 0, entree: "punch", zoom: [1.0, 1.1], centre: [0.5, 0.5] },
  // le vrai vieil homme au chapeau de paille, glissé dans celui du jeu sur le 8e temps (la mélodie entre) ; la caméra recule sur la terrasse
  { de: b(5), a: b(11), prise: "iy-vieux", t: 0.05, entree: "fouet", reel: { lieu: "iy-vieux", t: 0, volet: s(3 * B) } },
  { de: b(11), a: b(14), prise: "iy-arrivee", t: 0.4, entree: "fouet" },
  { de: b(14), a: b(16), prise: "iy-rue", t: 0.6, entree: "fouet" },
  { de: b(16), a: b(18), prise: "iy-etal", t: 0.5, entree: "punch" },
  { de: b(18), a: b(21), prise: "iy-dragon", t: 0.3, entree: "fouet" },
  { de: b(21), a: b(24), prise: "iy-jizo", t: 0.3, entree: "fouet", reel: { lieu: "iy-jizo", t: 0, volet: s(B) } },
  { de: b(24), a: b(27), prise: "iy-daruma", t: 5.9, vitesse: 1.2, entree: "fouet" },
  { de: b(27), a: b(30), prise: "iy-lanterne", t: 7.0, entree: "fouet" },
  { de: b(30), a: b(32), prise: "iy-toboggan", t: 2.0, vitesse: 1.3, entree: "fouet" },
  // la descente en bouée, accélérée ; la ligne d'arrivée ; de face, la page de la médaille (« Gold medal! »)
  { de: b(32), a: b(35), prise: "iy-bouee", t: 15.0, vitesse: 2.4, entree: "fouet" },
  { de: b(35), a: b(36), prise: "iy-bouee", t: 23.0, entree: "punch" },
  { de: b(36), a: b(38), prise: "iy-bouee", t: 28.6, entree: "punch" },
  { de: b(38), a: b(42), prise: "iy-navette", t: 0.2, entree: "fouet" },
  // la vraie marmite qu'on découvre, glissée dans celle du kamakura au lampion rouge
  { de: b(42), a: b(46), prise: "iy-nabe", t: 4.0, entree: "fouet", reel: { lieu: "iy-nabe", t: 0, volet: s(B) } },
  // le vrai sanctuaire de neige sous son torii, glissé dans celui du jeu ; la prière, dedans
  { de: b(46), a: b(49), prise: "iy-torii", t: 0.3, entree: "fouet", reel: { lieu: "iy-jinja", t: 0, volet: s(B) } },
  { de: b(49), a: b(51), prise: "iy-priere", t: 4.6, entree: "punch" },
  // la nuit : un vrai kamakura allumé, glissé dans celui du jeu
  { de: b(51), a: b(56), prise: "iy-nuit", t: 0.3, entree: "fouet", luminosite: 1.3, reel: { lieu: "iy-kamakura", t: 0, volet: s(1.5 * B) } },
  // le grand tengu : son vrai feu, en écho, glissé dans celui du jeu (resserré : la prise le filme de loin, sa torche entière ; à 3,2 s un spectateur
  // passe devant la caméra)
  { de: b(56), a: b(61), prise: "iy-tengu", t: 0.0, entree: "fouet", luminosite: 1.2, zoom: [1.22, 1.3], centre: [0.5, 0.47], reel: { lieu: "iy-feu", t: 0, volet: s(B) } },
  // les cinq tampons (au-dessus de son chapeau), puis un éclair blanc : le masque du tengu, de face (au nuage, le jeu le fait saluer en se
  // retournant : on coupe après)
  { de: b(61), a: b(64), prise: "iy-masque", t: 0.1, entree: "fouet", luminosite: 1.3 },
  { de: b(64), a: b(67), prise: "iy-masque", t: 3.05, entree: "eclair", luminosite: 1.3 },
  // le secret : la flamme du tengu portée vers le haut du château ; tout s'éteint
  { de: b(67), a: b(74), prise: "iy-flamme", t: 16.1, entree: "fouet", luminosite: 1.3 },
  { de: b(74), a: LONGUEUR, prise: "iy-fin", t: 0.5, entree: "fouet", luminosite: 1.2 },
];

const DOUX = 0.6;

// Chaque morceau de réplique (voix.py, MORCEAUX) tombe avec son texte à l'écran ; Son vérifie qu'ils ne se superposent pas.
const BANDE: Bande = {
  musique: [
    // rien avant le sceau, la voix seule ; l'introduction de l'air, plus douce, jusqu'au jeu, où sa mélodie entre
    { fichier: "iiyama.wav", debut: 0.15, volume: 3.0, de: T0, a: sec(8) + 0.05 },
    { fichier: "iiyama.wav", debut: 0.15 + 8 * B, volume: 1.95, de: sec(8) },
  ],
  // (cinq morceaux sortis 1,2 à 2,2 dB sous la moyenne de la voix, mesurés sur le premier rendu : remontés ; la musique de 2,1 à 1,95)
  voix: [
    ["n1a", 0.0, 1.12], ["n1b", 2.09], ["n1c", 2.86],
    ["n2a", sec(5) + 0.04], ["n2b", sec(8) + 0.04],
    ["n3a", sec(11) + 0.04], ["n3b", sec(14) + 0.04], ["n3c", sec(18) + 0.04], ["n3d", sec(21) + 0.04],
    ["n4a", sec(24) + 0.04], ["n4b", sec(27) + 0.04], ["n4c", sec(30) + 0.04], ["n4d", sec(32) + 0.04], ["n4e", sec(35) + 0.04],
    ["n5a", sec(38) + 0.04], ["n5b", sec(42) + 0.04], ["n5c", sec(46) + 0.04, 1.15],
    ["n6a", sec(51) + 0.04, 1.12], ["n6b", sec(56) + 0.04],
    ["n7a", sec(61) + 0.04], ["n7b", sec(64) + 0.04],
    ["n8", sec(67) + 0.04, 1.25], ["n9", sec(72) + 0.1, 1.15],
    ["n10a", sec(74) + 0.3], ["n10b", sec(74) + 1.95], ["n10c", sec(74) + 2.95],
  ],
  durees: {
    n1a: 2.01, n1b: 0.69, n1c: 3.59, n2a: 1.4, n2b: 1.75, n3a: 1.67, n3b: 2.19, n3c: 1.79, n3d: 1.27, n4a: 1.75, n4b: 1.43, n4c: 1.03, n4d: 1.66,
    n4e: 0.72, n5a: 2.19, n5b: 1.89, n5c: 1.98, n6a: 2.5, n6b: 2.47, n7a: 1.31, n7b: 1.32, n8: 2.53, n9: 1.05, n10a: 1.55, n10b: 0.83, n10c: 0.78,
  },
  sfx: ([
    // la nuit : le vent doux, très bas (pas de fond sous l'accroche : la voix seule, puis le feu)
    [sec(51) - 0.2, "sfx-jeu/boucle-ventDoux.wav", 0.04, sec(74) - sec(51) + 0.2],
    // l'accroche : le tengu et sa torche ; le sceau, les braises
    [2.07 - 0.05, "sfx/swoosh-quick.mp3", 0.3], [2.3, "sfx-jeu/oiseau-torche.wav", 0.35],
    [T0 - 0.02, "sfx/tampon.mp3", 0.9], [T0, "sfx/bass-hit-short.mp3", 0.55], [T0 + 0.03, "sfx-jeu/oiseau-torche.wav", 0.45],
    // le vieil homme : le vrai glisse dans le jeu, la mélodie entre
    [sec(5) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(8) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    // l'arrivée, la rue, l'étal
    [sec(11) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(14) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    [sec(16) - 0.05, "sfx/swoosh-quick.mp3", 0.4], [sec(16) + 0.5, "sfx-jeu/slurp.wav", 0.4],
    // le dragon, les Jizō (le vrai glisse dans le jeu)
    [sec(18) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(19) - 0.05, "sfx/sparkle-touch.mp3", 0.4],
    [sec(21) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(22) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.5],
    // le daruma : trois coups de pelle ; la lanterne : deux, et un nuage ; le toboggan
    [sec(24) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(24) + 0.39, "sfx-jeu/pelle.wav", 0.45], [sec(24) + 1.34, "sfx-jeu/pelle.wav", 0.45],
    [sec(27) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(27) + 0.55, "sfx-jeu/pelle.wav", 0.4], [sec(27) + 1.0, "sfx-jeu/pouf.wav", 0.4],
    [sec(30) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(30) + 0.2, "sfx-jeu/oiseau-glisse.wav", 0.45],
    // la bouée : la descente, l'arrivée, la médaille
    [sec(32) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(32) + 0.1, "sfx/air-whoosh-powerful.mp3", 0.35],
    [sec(35) + 0.3, "sfx-jeu/oiseau-arrivee.wav", 0.5], [sec(36) - 0.02, "sfx/sparkle-touch.mp3", 0.5],
    // la navette, la marmite, le sanctuaire, la prière
    [sec(38) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    [sec(42) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(43) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.5],
    [sec(46) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(47) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.5],
    [sec(49) - 0.05, "sfx/swoosh-quick.mp3", 0.4], [sec(49) + 0.15, "sfx-jeu/claque.wav", 0.35], [sec(49) + 0.45, "sfx-jeu/claque.wav", 0.35],
    // la nuit, les kamakura (le vrai glisse dans le jeu)
    [sec(51) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(52.5) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.5],
    // le grand tengu (le vrai feu glisse dans celui du jeu)
    [sec(56) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(57) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.4],
    // les cinq tampons ; le nuage, le masque
    [sec(61) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    ...[0, 1, 2, 3, 4].map((k): [number, string, number] => [sec(61.5 + k / 2) - 0.02, "sfx-jeu/tampon.wav", 0.45]),
    [sec(64) - 0.03, "sfx-jeu/pouf.wav", 0.45], [sec(64) + 0.2, "sfx-jeu/cadeau.wav", 0.45],
    // le secret : la flamme, puis le noir
    [sec(67) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(72) + 0.05, "sfx/light-spell.mp3", 0.16, 2.0],
    // la fin
    [sec(74) - 0.14, "sfx/whoosh-fast.mp3", 0.4], [sec(74) + 0.25, "sfx/bass-hit-short.mp3", 0.27], [sec(74) + 0.3, "sfx/pop.mp3", 0.27],
  ] as Bande["sfx"]).map(([a, nom, v, d]): Bande["sfx"][number] => (d === undefined ? [a, nom, v * DOUX] : [a, nom, v, d])),
};

// ---------------------------------------------------------------- le sceau et les braises
/** Un hasard fixe (le rendu reste le même à chaque image). */
const hasard = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Les braises qui giclent sous le sceau : une bouffée de fumée chaude derrière lui, des étincelles qui partent en étoile, montent, puis retombent en
 *  s'éteignant. */
const Braises: React.FC<{ g: number; cx: number; cy: number }> = ({ g, cx, cy }) => {
  if (g < 0 || g > 90) return null;
  const u = expoSortie(g / 28), fin = entre(g, 14, 60);
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const a = (k / 6) * 2 * Math.PI + 0.3, r = 140 + 190 * u, t = 400 + 100 * hasard(k + 40);
        return (
          <div key={k} style={{
            position: "absolute", left: cx + Math.cos(a) * r - t / 2, top: cy + Math.sin(a) * r * 0.6 - 30 * u - t / 2, width: t, height: t, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,150,60,.42) 0%, rgba(160,70,40,.22) 45%, rgba(60,30,20,0) 70%)",
            transform: `scale(${(0.5 + 0.6 * u).toFixed(3)})`, opacity: 1 - fin,
          }} />
        );
      })}
      {[...Array(80)].map((_, k) => {
        const a = hasard(k) * 2 * Math.PI, v = 240 + 640 * hasard(k + 500) ** 1.5, taille = 6 + 14 * hasard(k + 1300) ** 2;
        const r = 160 + v * u, chute = 520 * (g / 90) ** 2, braise = 1 - entre(g, 30 + 40 * hasard(k + 900), 90);
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.85 - 120 * u + chute;
        const coul = k % 3 === 0 ? "#fff2b0" : k % 3 === 1 ? "#ffc24a" : "#ff7a2a";
        return (
          <div key={k} style={{
            position: "absolute", left: x - taille / 2, top: y - taille / 2, width: taille, height: taille, borderRadius: "50%", background: coul,
            boxShadow: `0 0 ${(taille * 1.6).toFixed(0)}px ${(taille * 0.5).toFixed(0)}px rgba(255,140,40,.75)`, opacity: braise,
          }} />
        );
      })}
    </>
  );
};

/** Le sceau rouge 天狗 (le tengu), de la carte et du carnet de tampons : il s'abat au-dessus du danseur, l'encre un peu usée. */
const Sceau: React.FC = () => {
  const f = useCurrentFrame(), t0 = s(T0);
  if (f < t0 - 3 || f > b(3) + 16) return null;
  const v = rebond(f, t0 - 3, 900, 34), fuite = expoEntree(entre(f, b(3) - 16, b(3) + 6));
  const L = 420, cx = 540, cy = 820;
  return (
    <AbsoluteFill style={{ transform: `translateX(${(-1250 * fuite).toFixed(1)}px)`, opacity: 1 - fuite }}>
      <Braises g={f - t0} cx={cx} cy={cy} />
      <div style={{
        position: "absolute", left: cx - L / 2, top: cy - L / 2, width: L, height: L, transformOrigin: "50% 50%",
        transform: `scale(${(2.6 - 1.6 * Math.min(1, v)).toFixed(4)}) rotate(${(-6 - 5 * (1 - Math.min(1, v))).toFixed(2)}deg)`, opacity: f >= t0 - 3 ? 1 : 0,
        filter: "drop-shadow(0 14px 22px rgba(40,20,20,.55))",
      }}>
        <svg width={L} height={L} viewBox="0 0 430 430">
          <rect x={8} y={8} width={414} height={414} rx={44} fill={C.rouge} />
          <rect x={30} y={30} width={370} height={370} rx={28} fill="none" stroke={C.papier} strokeWidth={10} />
          <text x={215} y={190} textAnchor="middle" fontFamily={JAPONAIS} fontWeight={700} fontSize={170} fill={C.papier}>天</text>
          <text x={215} y={362} textAnchor="middle" fontFamily={JAPONAIS} fontWeight={700} fontSize={170} fill={C.papier}>狗</text>
          {[...Array(46)].map((_, k) => (
            <circle key={k} cx={20 + 390 * hasard(k + 2000)} cy={20 + 390 * hasard(k + 2400)} r={1.2 + 4.6 * hasard(k + 2800) ** 2} fill={k % 4 ? C.rougeFonce : C.papier} opacity={k % 4 ? 0.55 : 0.8} />
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- les cinq tampons
const TAMPONS = ["yukizo", "toro", "slider", "nabe", "jinja"];
/** « Get all five stamps… » : les cinq vrais tampons du lieu (tampons.py --lieu iiyama) se posent un à un, sur les demi-temps, puis s'envolent au
 *  nuage du masque. */
const CinqTampons: React.FC = () => {
  const f = useCurrentFrame(), de = b(61.5), fin = b(64);
  if (f < de - 6 || f > fin + 4) return null;
  const saut = expoEntree(entre(f, fin - 14, fin + 2));
  return (
    <AbsoluteFill style={{ opacity: 1 - saut, transform: `translateY(${(-160 * saut).toFixed(1)}px)` }}>
      <div style={{ position: "absolute", left: 50, width: 980, top: 505, display: "flex", justifyContent: "space-between" }}>
        {TAMPONS.map((id, k) => {
          const t = de + s((k * B) / 2), pose = rebond(f, t, 520, 26);
          return (
            <div key={id} style={{
              width: 168, height: 168, borderRadius: "50%", background: "rgba(255,250,240,.94)", border: `5px solid ${C.encre}`, display: "grid", placeItems: "center",
              boxShadow: "0 10px 26px rgba(0,0,0,.4)", opacity: Math.min(1, (f - de + 6) / 6),
            }}>
              <Img src={staticFile(`ui/tampon-${id}.png`)} style={{ width: 152, height: 152, opacity: f >= t ? 1 : 0, transform: `scale(${(1.7 - 0.7 * pose).toFixed(4)}) rotate(${(((k * 7) % 11) - 5) * 1.6}deg)` }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** « Can you find out why? » : l'image s'assombrit autour de la flamme, puis presque tout s'éteint. */
const Ombre: React.FC = () => {
  const f = useCurrentFrame();
  if (f < b(67) || f > b(74) + 4) return null;
  const bord = expoSortie(entre(f, b(69), b(71))), noir = expoSortie(entre(f, s(sec(72) + 0.02), s(sec(72) + 0.6)));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 46% at 50% 52%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,.6) 100%)", opacity: bord }} />
      <AbsoluteFill style={{ background: "#000", opacity: 0.88 * noir }} />
    </AbsoluteFill>
  );
};

const Textes: React.FC = () => (
  <>
    <Cadre texte={"A whole town\n*carves the snow*… ❄️"} de={-30} a={s(2.0)} />
    <Cadre texte={"…and at night, a giant *tengu*\ndances with a torch\n*over two metres long*! 🔥"} de={s(2.09)} a={b(5) - 8} taille={54} largeur={1040} />
    <Cadre texte="The *Iiyama Snow Festival*…" de={b(5) + 3} a={s(sec(8))} taille={56} />
    <Cadre texte={"…is now in my\n*3D game*!"} de={s(sec(8) + 0.02)} a={b(11) - 4} />
    <Etiquette n="14" nom="Iiyama Snow Festival" ja="飯山雪まつり" sous="NEW" de={b(8.4)} a={b(11) - 6} />
    <Cadre texte={"Arrive under the\n*falling snow* ❄️"} de={b(11) + 2} a={b(14) - 4} />
    <Cadre texte={"stroll the *arcades*\nand the *food stalls*,"} de={b(14) + 2} a={b(18) - 4} />
    <Cadre texte={"see a *twenty-metre*\n*snow dragon* 🐉"} de={b(18) + 2} a={b(21) - 4} />
    <Cadre texte="and the *six Jizō*." de={b(21) + 2} a={b(24) - 4} />
    <Cadre texte={"Help finish a *daruma*\nwith your *shovel*,"} de={b(24) + 2} a={b(27) - 4} />
    <Cadre texte={"make your own\n*snow lantern*,"} de={b(27) + 2} a={b(30) - 4} />
    <Cadre texte="ride the *snow slide*," de={b(30) + 2} a={b(32) - 4} />
    <Cadre texte={"and race down\non a *snow tube*…"} de={b(32) + 2} a={b(35) - 4} />
    <Cadre texte="…for a *medal*! 🥇" de={b(35) + 2} a={b(38) - 4} />
    <Cadre texte={"Then take the *shuttle*\nto the *kamakura village*,"} de={b(38) + 2} a={b(42) - 4} taille={56} />
    <Cadre texte={"eat a *hot pot*\ninside a snow hut 🍲"} de={b(42) + 2} a={b(46) - 4} />
    <Cadre texte={"and pray at a\n*shrine made of snow* ⛩️"} de={b(46) + 2} a={b(51) - 4} />
    <Cadre texte={"At night, every\n*kamakura* glows…"} de={b(51) + 2} a={b(56) - 4} />
    <Cadre texte={"…and the great *tengu*\ndances with his *torch*! 🔥"} de={b(56) + 2} a={b(61) - 4} />
    <Cadre texte="Get all *five stamps*…" de={b(61) + 2} a={b(64) - 4} />
    <Cadre texte={"…and wear\n*his mask*! 👺"} de={b(64) + 2} a={b(67) - 4} />
    <Cadre texte={"But his *flame* must reach\nthe *top of the castle*…"} de={b(67) + 2} a={s(sec(72))} taille={56} />
    <Cadre texte="Can you *find out why*? 👀" de={s(sec(72) + 0.08)} a={b(74) - 4} />
    <Fin de={b(74)} titre={"Iiyama Snow Festival\nin 3D"} ligne="+ 13 more places · free" />
  </>
);

const FLOU: [number, number][] = [b(5), b(11), b(14), b(18), b(21), b(24), b(27), b(30), b(32), b(38), b(42), b(46), b(51), b(56), b(61), b(67), b(74)].map((n): [number, number] => [n - 18, n + 18]);

export const Neige: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  // le choc du sceau : l'image tremble
  const choc = entre(f, s(T0), s(T0) + 16), force = f >= s(T0) && choc < 1 ? (1 - choc) * (1 - choc) : 0;
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit, transform: force ? `translate(${(30 * force * Math.sin(f * 2.4)).toFixed(1)}px, ${(38 * force * Math.cos(f * 3.1)).toFixed(1)}px)` : undefined }}>
      <Plans plans={PLANS} />
      <Ombre />
      <AbsoluteFill style={{ top: -60, left: -60, width: 1200, height: 2040, background: "linear-gradient(rgba(0,0,0,.32) 60px, rgba(0,0,0,.12) 440px, rgba(0,0,0,0) 700px)", opacity: f < b(74) ? 1 : 1 - expoSortie(entre(f, b(74), b(74) + 20)) }} />
      <Sceau />
      <CinqTampons />
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
