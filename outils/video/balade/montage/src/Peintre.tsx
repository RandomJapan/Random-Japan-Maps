// Vidéo 11 (2026-11-20) : Sumi, le peintre Inkami, dans les 13 lieux de la balade depuis le 19 novembre. « I put myself in my own game » :
// le propriétaire s'est mis dans son jeu, en peintre ambulant à son image (le chapeau blanc à taches grises, la barbe, le pull noir), qui
// peint les personnages du jeu à l'encre sur de vieux journaux japonais. L'accroche : Sumi en gros plan qui peint, la phrase dès l'image 0 ;
// sur « game », le grand sceau rouge 墨紙 de la marque s'abat, l'encre gicle, l'air démarre. Son introduction porte Itsukushima en grand et
// Sumi qui se retourne (« that's me ») ; sa mélodie entre là. Puis Himeji, les dunes de Tottori, Tsubosaka-dera, et les neuf autres lieux en
// un éclair, un compteur jusqu'à 13 ; le pinceau, le journal de près ; on lui parle, « Yes », la fenêtre du tableau ; les tableaux en grand
// (le prêtre, le samouraï, le chamelier, « You, as a samurai ») ; l'offre et le bouton rouge de la boutique ; Sumi la nuit, la fin.
// Jamais dit ni montré que les portraits de la boutique sont peints à la main (le propriétaire) : la voix dit « your own face on real
// Japanese newspapers ». Filmé dans le jeu en ligne, en simple visiteur. Sur « odori », l'air de toute la balade (112 battements).
// Le plan : outils/video/balade/plan-sumi.md.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Doigt, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoEntree, expoSortie, JAPONAIS, POLICE, rebond, s } from "./theme";

const B = 60 / 112; // (s) un temps de l'air
/** Le sceau tombe sur « game » (mesuré sur la voix : le /g/ à 1,285 s dans m1, placée à 0,05 s) ; c'est le premier temps de l'air. */
const T0 = 1.33;
const sec = (n: number) => T0 + n * B;
const b = (n: number) => s(sec(n));
export const LONGUEUR = b(60) + s(4.4);

// les neuf autres lieux, un demi-temps chacun (le compteur va de 5 à 13 ; Itsukushima, Himeji, Tottori et Tsubosaka : 1 à 4)
const ECLAIRS: [string, string][] = [
  ["aogashima", "Aogashima"], ["gokayama", "Gokayama"], ["takachiho", "Takachiho"], ["kinkakuji", "Kinkaku-ji"], ["beppu", "Beppu"],
  ["motonosumi", "Motonosumi"], ["sanjubutsu", "Thirty Buddhas"], ["udo", "Udo Shrine"], ["yakushima", "Yakushima"],
];
const E0 = 19.5; // le premier éclair (en temps de l'air)

// la fenêtre du tableau (la prise la montre réduite à 0,8 et en haut de l'écran, rushes.py FENETRE : le tableau de 96 à 872 px, « What if it
// were you? » à 944, le bouton rouge de 1120 à 1188) : le tableau en grand, de 130 à 1180 px, la boîte de texte dessous
const TABLEAU: Partial<Plan> = { zoom: [1.33, 1.38], centre: [0.5, 0.25] };
// (la seconde de sm-parler où la fenêtre s'ouvre, mesurée sur la prise (sauts.py) ; la question s'écrit à 5,08 s, le choix à 5,80 s)
const T_FENETRE = 6.7;

export const PLANS: Plan[] = [
  // l'accroche : Sumi en gros plan qui peint (Itsukushima)
  { de: 0, a: b(2), prise: "sm-visage", t: 0.3, zoom: [1.0, 1.03], centre: [0.5, 0.5] },
  // Itsukushima en grand, puis Sumi qui se retourne vers le voyageur : la mélodie entre
  { de: b(2), a: b(6), prise: "sm-large", t: 0.3, entree: "fouet" },
  { de: b(6), a: b(10), prise: "sm-salut", t: 0.3, entree: "fouet" },
  // Himeji, Tottori, Tsubosaka-dera
  { de: b(10), a: b(14), prise: "sm-himeji", t: 0.3, entree: "fouet" },
  { de: b(14), a: b(17), prise: "sm-tottori", t: 0.3, entree: "fouet" },
  { de: b(17), a: b(E0), prise: "sm-tsubosaka", t: 0.3, entree: "fouet" },
  // les neuf autres, un demi-temps chacun
  ...ECLAIRS.map(([lieu], k): Plan => ({ de: b(E0 + k / 2), a: b(E0 + (k + 1) / 2), prise: `sm-p-${lieu}`, t: 0.5, entree: "punch" })),
  // le pinceau, le journal de près
  { de: b(24), a: b(28), prise: "sm-pinceau", t: 0.4, entree: "fouet" },
  { de: b(28), a: b(34), prise: "sm-journal", t: 0.3, entree: "fouet" },
  // on lui parle : la question, « Yes », la fenêtre s'ouvre ; le prêtre d'Itsukushima en grand
  { de: b(34), a: b(38), prise: "sm-parler", t: T_FENETRE - 1.65, entree: "fouet" },
  { de: b(38), a: b(41), prise: "sm-parler", t: T_FENETRE + 0.5, entree: "punch", ...TABLEAU },
  // le samouraï de Himeji, le chamelier des dunes, « You, as a samurai »
  { de: b(41), a: b(44), prise: "sm-samourai", t: 0.7, entree: "fouet", ...TABLEAU },
  { de: b(44), a: b(47), prise: "sm-chamelier", t: 0.7, entree: "fouet", ...TABLEAU },
  { de: b(47), a: b(51), prise: "sm-voyageur", t: 0.7, entree: "fouet", ...TABLEAU },
  // l'offre (« What if it were you? »), puis le bouton rouge, de plus près
  { de: b(51), a: b(56), prise: "sm-voyageur", t: 0.7 + 4 * B, entree: "punch", zoom: [1.6, 1.68], centre: [0.5, 0.555] },
  { de: b(56), a: b(60), prise: "sm-voyageur", t: 0.7 + 9 * B, entree: "punch", zoom: [1.85, 1.92], centre: [0.5, 0.6] },
  // la fin : Sumi la nuit, à la lumière de son lampion
  { de: b(60), a: LONGUEUR, prise: "sm-nuit", t: 0.4, entree: "fouet", luminosite: 1.3 },
];

const DOUX = 0.6;

// Chaque morceau de réplique (voix.py, MORCEAUX) tombe avec son texte à l'écran ; Son vérifie qu'ils ne se superposent pas.
const BANDE: Bande = {
  musique: [
    // rien avant le sceau, la voix seule ; l'introduction de l'air, plus douce, jusqu'à ce que Sumi se retourne, où sa mélodie entre
    { fichier: "odori.wav", debut: 0.15, volume: 3.0, de: T0, a: sec(8) + 0.05 },
    { fichier: "odori.wav", debut: 0.15 + 8 * B, volume: 2.1, de: sec(8) },
  ],
  // (cinq morceaux sortis 1 à 2,7 dB sous la moyenne de la voix, mesurés sur le premier rendu : remontés)
  voix: [
    ["m1", 0.05],
    ["m2a", sec(2) + 0.05], ["m2b", sec(6) + 0.05],
    ["m3a", sec(10) + 0.05], ["m3b", sec(14) + 0.05], ["m3c", sec(17) + 0.02, 1.1], ["m3d", sec(20) + 0.05],
    ["m4a", sec(24) + 0.05], ["m4b", sec(28) + 0.05],
    ["m5", sec(34) + 0.05],
    ["m6a", sec(38) + 0.08, 1.2], ["m6b", sec(41) + 0.05], ["m6c", sec(44) + 0.05, 1.15], ["m6d", sec(47) + 0.05, 1.15],
    ["m7a", sec(51) + 0.05], ["m7b", sec(56) + 0.05],
    ["m8a", sec(60) + 0.3, 1.35], ["m8b", sec(60) + 1.4],
  ],
  durees: {
    m1: 2.18, m2a: 1.94, m2b: 1.30, m3a: 1.73, m3b: 1.13, m3c: 1.06, m3d: 1.76, m4a: 1.45, m4b: 2.63, m5: 2.07,
    m6a: 1.30, m6b: 1.33, m6c: 1.49, m6d: 1.88, m7a: 2.39, m7b: 1.65, m8a: 0.89, m8b: 0.88,
  },
  sfx: ([
    // l'accroche : le pinceau ; le sceau
    [0.2, "sfx-jeu/pinceau.wav", 0.35],
    [T0 - 0.02, "sfx/tampon.mp3", 0.9], [T0, "sfx/bass-hit-short.mp3", 0.55], [T0 + 0.03, "sfx-jeu/plouf.wav", 0.3],
    // Itsukushima, Sumi se retourne
    [sec(2) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    [sec(6) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(8) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.5],
    // Himeji, Tottori, Tsubosaka
    [sec(10) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(14) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(17) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    // les éclairs : un petit déclic chacun, puis 13
    ...ECLAIRS.map((_, k): [number, string, number] => [sec(E0 + k / 2) - 0.02, "sfx/tap.mp3", 0.35]),
    [sec(23.5) + 0.02, "sfx/sparkle-touch.mp3", 0.5],
    // le pinceau, le journal
    [sec(24) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(24) + 0.4, "sfx-jeu/pinceau.wav", 0.4], [sec(26) + 0.1, "sfx-jeu/pinceau.wav", 0.3],
    [sec(28) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(28) + 0.3, "sfx/paper-slide.mp3", 0.35],
    // on lui parle, la fenêtre ; les tableaux
    [sec(34) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    [sec(38) - 0.02, "sfx-jeu/choix.wav", 0.5], [sec(38) + 0.02, "sfx/paper-move-quick.mp3", 0.4],
    [sec(41) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(44) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(47) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    [sec(47) + 1.0, "sfx/sparkle-touch.mp3", 0.4],
    // l'offre, le bouton
    [sec(51) - 0.02, "sfx/paper-move-quick.mp3", 0.4], [sec(56) - 0.02, "sfx/paper-move-quick.mp3", 0.3],
    [sec(58) - 0.03, "sfx/tap.mp3", 0.7], [sec(58) + 0.05, "sfx/sparkle-touch.mp3", 0.45],
    // la nuit, la fin
    [sec(60) - 0.2, "sfx-jeu/boucle-insectes.wav", 0.04, LONGUEUR / 60 - sec(60) + 0.2],
    [sec(60) - 0.14, "sfx/whoosh-fast.mp3", 0.4], [sec(60) + 0.25, "sfx/bass-hit-short.mp3", 0.27], [sec(60) + 0.3, "sfx/pop.mp3", 0.27],
  ] as Bande["sfx"]).map(([a, nom, v, d]): Bande["sfx"][number] => (d === undefined ? [a, nom, v * DOUX] : [a, nom, v, d])),
};

// ---------------------------------------------------------------- le sceau et l'encre
/** Un hasard fixe (le rendu reste le même à chaque image). */
const hasard = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** L'encre qui gicle sous le sceau : des gouttes noires qui partent en éventail vers le bas, s'étirent dans leur course et retombent, quelques taches qui
 *  restent un instant. */
const Encre: React.FC<{ g: number; cx: number; cy: number }> = ({ g, cx, cy }) => {
  if (g < 0 || g > 80) return null;
  const u = expoSortie(g / 26);
  return (
    <>
      {[...Array(54)].map((_, k) => {
        const a = hasard(k) * 2 * Math.PI, v = 160 + 560 * hasard(k + 500) ** 1.6, r = 150 + v * u, taille = 9 + 30 * hasard(k + 1300) ** 2;
        const chute = 420 * (g / 80) ** 2, etire = 1 + 2.2 * (1 - u) * (g > 1 ? 1 : 0);
        // (vers les côtés et le bas seulement : les gouttes qui montaient tachaient le visage de Sumi, comme des boutons)
        const x = cx + Math.cos(a) * r, y = cy + Math.abs(Math.sin(a)) * r * 0.85 + chute;
        return (
          <div key={k} style={{
            position: "absolute", left: x - taille / 2, top: y - taille / 2, width: taille, height: taille, borderRadius: "50%", background: "#141012",
            transform: `rotate(${(a * 180 / Math.PI).toFixed(1)}deg) scaleX(${etire.toFixed(3)})`, opacity: 1 - entre(g, 40 + 30 * hasard(k + 900), 80),
          }} />
        );
      })}
    </>
  );
};

/** Le sceau rouge 墨紙 (« encre, papier » : celui de la marque, sur l'enseigne de Sumi) : il s'abat sous le visage, à droite, l'encre un peu usée. */
const Sceau: React.FC = () => {
  const f = useCurrentFrame(), t0 = s(T0);
  if (f < t0 - 3 || f > b(2) + 16) return null;
  const v = rebond(f, t0 - 3, 900, 34), fuite = expoEntree(entre(f, b(2) - 16, b(2) + 6));
  const L = 340, cx = 720, cy = 1480;
  return (
    <AbsoluteFill style={{ transform: `translateX(${(-1250 * fuite).toFixed(1)}px)`, opacity: 1 - fuite }}>
      <Encre g={f - t0} cx={cx} cy={cy} />
      <div style={{
        position: "absolute", left: cx - L / 2, top: cy - L / 2, width: L, height: L, transformOrigin: "50% 50%",
        transform: `scale(${(2.6 - 1.6 * Math.min(1, v)).toFixed(4)}) rotate(${(6 + 5 * (1 - Math.min(1, v))).toFixed(2)}deg)`, opacity: f >= t0 - 3 ? 1 : 0,
        filter: "drop-shadow(0 14px 22px rgba(40,20,20,.5))",
      }}>
        <svg width={L} height={L} viewBox="0 0 430 430">
          <rect x={8} y={8} width={414} height={414} rx={44} fill={C.rouge} />
          <rect x={30} y={30} width={370} height={370} rx={28} fill="none" stroke={C.papier} strokeWidth={10} />
          <text x={215} y={190} textAnchor="middle" fontFamily={JAPONAIS} fontWeight={700} fontSize={170} fill={C.papier}>墨</text>
          <text x={215} y={362} textAnchor="middle" fontFamily={JAPONAIS} fontWeight={700} fontSize={170} fill={C.papier}>紙</text>
          {[...Array(46)].map((_, k) => (
            <circle key={k} cx={20 + 390 * hasard(k + 2000)} cy={20 + 390 * hasard(k + 2400)} r={1.2 + 4.6 * hasard(k + 2800) ** 2} fill={k % 4 ? C.rougeFonce : C.papier} opacity={k % 4 ? 0.55 : 0.8} />
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- le compteur des lieux
/** Pendant les éclairs : une étiquette, le nombre de lieux où l'on a vu Sumi (5 à 13), le nom du lieu ; 13 tamponné à la fin. */
const Compteur: React.FC = () => {
  const f = useCurrentFrame(), d = b(E0), fin = b(24);
  if (f < d - 1 || f > fin + s(0.3)) return null;
  const k = Math.min(ECLAIRS.length - 1, Math.max(0, Math.floor((f - d) / (b(E0 + 0.5) - d))));
  const debutK = b(E0 + k / 2), n = 5 + k, dernier = n === 13;
  const v = rebond(f, d), pop = rebond(f, debutK, dernier ? 500 : 700, dernier ? 14 : 22), sortie = expoEntree(entre(f, fin, fin + s(0.2)));
  return (
    <div style={{
      position: "absolute", left: 48, top: 1250, display: "flex", alignItems: "center", gap: 22,
      background: C.papier, border: `7px solid ${C.encre}`, borderRadius: 24, padding: "18px 38px 18px 20px",
      boxShadow: `inset 0 0 0 6px ${C.papier}, inset 0 0 0 11px ${C.rouge}, 0 8px 0 rgba(58,50,54,.35), 0 18px 40px rgba(0,0,0,.35)`,
      transform: `translateX(${(-520 * (1 - v) - 700 * sortie).toFixed(1)}px)`, opacity: Math.min(1, (f - d + 1) / 3),
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: "50%", background: C.rouge, border: `5px solid ${C.encre}`, color: "#fff",
        display: "grid", placeItems: "center", fontFamily: POLICE, fontWeight: 800, fontSize: 50,
        transform: `scale(${(dernier ? 1.6 - 0.6 * pop : 1.25 - 0.25 * pop).toFixed(4)})`,
      }}>{n}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 52, color: C.encre, lineHeight: 1.05 }}>{ECLAIRS[k][1]}</div>
        <div style={{ fontFamily: POLICE, fontWeight: 700, fontSize: 34, color: C.encre2, lineHeight: 1.3 }}>{n} / 13</div>
      </div>
    </div>
  );
};

const Textes: React.FC = () => (
  <>
    <Cadre texte={"I put *myself*\nin my own game 🎮"} de={-30} a={b(2) - 8} />
    <Cadre texte={"Meet *Sumi*,\na travelling painter…"} de={b(2) + 3} a={b(6) - 4} />
    <Etiquette n="墨" nom="Sumi" ja="絵かきの スミ" sous="NEW" de={b(3)} a={b(6) - 6} />
    <Cadre texte="…yes, that's *me*! 👋" de={b(6) + 2} a={b(10) - 4} />
    {/* (sur une ligne, et l'étiquette sur le mur : en deux lignes, la boîte cachait le haut du donjon, et l'étiquette le chapeau de Sumi) */}
    <Cadre texte="You'll find him at *Himeji Castle*," de={b(10) + 2} a={b(14) - 4} taille={50} largeur={1040} />
    <Etiquette n="4" nom="Himeji Castle" ja="姫路城" de={b(10.5)} a={b(14) - 6} y={880} />
    <Cadre texte="on the *Tottori dunes*," de={b(14) + 2} a={b(17) - 4} />
    <Etiquette n="12" nom="Tottori Sand Dunes" ja="鳥取砂丘" de={b(14.4)} a={b(17) - 6} />
    <Cadre texte="at *Tsubosaka-dera*…" de={b(17) + 2} a={b(E0) - 4} />
    <Etiquette n="13" nom="Tsubosaka-dera" ja="壺阪寺" de={b(17.3)} a={b(E0) - 4} />
    <Cadre texte="…in all *13 places*!" de={b(20) + 2} a={b(24) - 4} />
    <Compteur />
    <Cadre texte={"He *paints* the people\nhe meets…"} de={b(24) + 2} a={b(28) - 4} />
    <Cadre texte={"in *black ink*, on old\n*Japanese newspapers* 📰"} de={b(28) + 2} a={b(34) - 4} />
    <Cadre texte={"*Talk* to him, and see\nhis painting *up close*!"} de={b(34) + 2} a={b(38) - 4} />
    <Cadre texte="The *priest* of Itsukushima," de={b(38) + 4} a={b(41) - 4} y={1250} taille={58} />
    <Cadre texte="the *samurai* of Himeji," de={b(41) + 2} a={b(44) - 4} y={1250} />
    <Cadre texte="the *camel driver* of the dunes…" de={b(44) + 2} a={b(47) - 4} y={1250} taille={54} />
    <Cadre texte="…and even *you*, as a samurai! 🫵" de={b(47) + 2} a={b(51) - 4} y={1250} taille={54} />
    <Cadre texte={"Want *your own face* on real\nJapanese newspapers? 🤔"} de={b(51) + 2} a={b(56) - 4} taille={56} />
    <Cadre texte={"This *red button* takes\nyou to my *shop*! 🛍️"} de={b(56) + 2} a={b(60) - 4} />
    {/* (le bouton rouge, à 0,6 de la hauteur de la prise, zoomé 1,85 à 1,92 : son milieu à 962 px) */}
    <Doigt chemin={[[b(57), 900, 1650], [b(58) - 6, 545, 968]]} appui={b(58)} />
    <Fin de={b(60)} titre={"Go say hi\nto Sumi! 👋"} ligne="in all 13 places · free" />
  </>
);

const FLOU: [number, number][] = [b(2), b(6), b(10), b(14), b(17), b(24), b(28), b(34), b(41), b(44), b(47), b(60)].map((n): [number, number] => [n - 18, n + 18]);

export const Peintre: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  // le choc du sceau : l'image tremble
  const choc = entre(f, s(T0), s(T0) + 16), force = f >= s(T0) && choc < 1 ? (1 - choc) * (1 - choc) : 0;
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit, transform: force ? `translate(${(30 * force * Math.sin(f * 2.4)).toFixed(1)}px, ${(38 * force * Math.cos(f * 3.1)).toFixed(1)}px)` : undefined }}>
      <Plans plans={PLANS} />
      <AbsoluteFill style={{ top: -60, left: -60, width: 1200, height: 2040, background: "linear-gradient(rgba(0,0,0,.32) 60px, rgba(0,0,0,.12) 440px, rgba(0,0,0,0) 700px)", opacity: f < b(60) ? 1 : 1 - expoSortie(entre(f, b(60), b(60) + 20)) }} />
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
