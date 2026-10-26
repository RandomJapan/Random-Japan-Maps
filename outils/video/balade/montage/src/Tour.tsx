// Vidéo 1 : « I turned the places from my videos into a video game » : les cinq lieux de la balade, chacun d'abord dans la
// vidéo du propriétaire, puis un volet découvre le même lieu dans le jeu ; le choix du compagnon ; ce qu'on y fait, un
// plan par temps ; la carte et son bouton « Visit in 3D », le portail ; la fin. 30 s sur l'air de la danse des fêtes
// (odori, 112 battements, depuis l'entrée de sa mélodie : la vidéo commence sur un temps fort).
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import layout from "../../../../../videos/balade/public/ui/layout.json";
import { Cadre, Doigt, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoEntree, expoSortie, FPS, rebond, s } from "./theme";

const BPM = 112;
/** L'image du temps n (0 : le début de la vidéo, sur l'entrée de la mélodie). */
export const b = (n: number) => Math.round((n * 60 * FPS) / BPM);
const sec = (n: number) => (n * 60) / BPM;

export const PLANS: Plan[] = [
  // le crochet : la vraie plage d'Itsukushima à marée basse, puis le jeu (le voyageur marche vers le torii)
  { de: 0, a: b(8), prise: "it-plage", t: 0.15, zoom: [1.0, 1.1], centre: [0.5, 0.42], reel: { lieu: "itsukushima", t: 0, volet: b(4) } },
  { de: b(8), a: b(12), prise: "ao-belv", t: 0.5, entree: "fouet", reel: { lieu: "aogashima", t: 0, volet: b(1) } },
  { de: b(12), a: b(16), prise: "gk-village", t: 0.7, entree: "fouet", reel: { lieu: "gokayama", t: 0, volet: b(1) } },
  { de: b(16), a: b(20), prise: "hm-pont", t: 0.9, entree: "fouet", reel: { lieu: "himeji", t: 0, volet: b(1) } },
  { de: b(20), a: b(24), prise: "tk-barque", t: 0.6, entree: "fouet", reel: { lieu: "takachiho", t: 0, volet: b(1) } },
  // le choix du compagnon : Pon, Chapu, Kon… et les deux autres s'en vont dans un nuage
  { de: b(24), a: b(30), prise: "trio", t: 2.7, vitesse: 1.25, entree: "punch" },
  // ce qu'on fait dans la balade, un plan tous les deux temps
  { de: b(30), a: b(32), prise: "it-herbes", t: 2.2, entree: "punch" },
  { de: b(32), a: b(34), prise: "it-torii", t: 2.55, entree: "punch" },
  { de: b(34), a: b(36), prise: "hm-koi", t: 3.4, entree: "punch", zoom: [1.18, 1.24], centre: [0.6, 0.6] },
  { de: b(36), a: b(38), prise: "gk-nuit", t: 1.5, entree: "punch", luminosite: 1.4 },
  { de: b(38), a: b(40), prise: "it-feux", t: 5.75, entree: "punch", zoom: [1.22, 1.3], centre: [0.56, 0.4] },
  { de: b(40), a: b(42), prise: "tk-grotte", t: 20.9, entree: "eclair" },
  // la carte : on plonge sur Itsukushima, la fiche s'ouvre, « Visit in 3D »… le portail
  { de: b(42), a: b(45.5), prise: "carte/ca-itsukushima", t: 1.4, vitesse: 1.3, entree: "fouet" },
  // (le portail s'ouvre sur la balade : on y danse, un temps et demi, avant la fin)
  { de: b(45.5), a: b(56), prise: "danse", t: 0.6, entree: "portail", depuis: [702, 1386] },
];

const FICHE = b(43.25); // la fiche du lieu monte
const APPUI = b(45); // le doigt appuie sur « Visit in 3D »
const PORTAIL = b(45.5); // le portail s'ouvre sur la balade
const FIN = b(49);

/** La fiche d'Itsukushima (captures de carte.py) : elle monte du bas comme sur un téléphone ; le bouton s'enfonce. */
const Fiche: React.FC = () => {
  const f = useCurrentFrame();
  if (f < FICHE - 2 || f > PORTAIL + s(0.5)) return null;
  const v = rebond(f, FICHE, 260, 22), sortie = expoEntree(entre(f, PORTAIL, PORTAIL + s(0.35)));
  const [, fy] = layout.fiche, K = 2; // px CSS de la page → px de la vidéo
  const presse = f >= APPUI && f < APPUI + 7;
  const [bx, by, bw, bh] = layout.bouton;
  return (
    <AbsoluteFill style={{ transform: `translateY(${(900 * (1 - v) + 300 * sortie).toFixed(1)}px)`, opacity: 1 - sortie }}>
      <div style={{ position: "absolute", left: 0, top: fy * K, width: 1080, height: 1920 - fy * K, overflow: "hidden", borderRadius: "28px 28px 0 0", boxShadow: "0 -20px 60px rgba(0,0,0,.35)" }}>
        <Img src={staticFile("ui/fiche-itsukushima.png")} style={{ position: "absolute", left: 0, top: -fy * K, width: 1080, height: 1920 }} />
        {/* le bouton « Visit in 3D » : il s'allume avant l'appui, s'enfonce */}
        <div style={{
          position: "absolute", left: bx * K - 6, top: (by - fy) * K - 6, width: bw * K + 12, height: bh * K + 12, borderRadius: 14,
          boxShadow: `0 0 0 ${(6 + 4 * Math.sin(f / 5)).toFixed(1)}px rgba(221,86,56,${(0.55 * entre(f, APPUI - s(0.8), APPUI - s(0.5))).toFixed(3)})`,
          transform: presse ? "scale(0.94)" : "none",
        }} />
      </div>
    </AbsoluteFill>
  );
};

const BANDE: Bande = {
  musique: { fichier: "odori.wav", debut: 0.15 + sec(8), volume: 2.6 },
  voix: [["a1", 0.15], ["a2", sec(8) + 0.05], ["a3", sec(24) + 0.1], ["a4", sec(30) + 0.05], ["a5", sec(42) + 0.1], ["a6", sec(50)]],
  durees: { a1: 3.62, a2: 3.36, a3: 1.18, a4: 4.34, a5: 1.78, a6: 1.4 },
  sfx: [
    [0.0, "sfx-jeu/oiseau-mouette.wav", 0.35],
    [sec(4) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.9], [sec(4), "sfx-jeu/magie.wav", 0.7],
    ...[8, 12, 16, 20].flatMap((n): [number, string, number][] => [
      [sec(n) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(n + 1), "sfx/transition-snap.mp3", 0.55], [sec(n + 1) + 0.25, "sfx/pop.mp3", 0.55],
    ]),
    [sec(24), "sfx/impact-deep-whoosh.mp3", 0.6],
    [sec(30), "sfx-jeu/sauvage.wav", 1.6], [sec(32), "sfx-jeu/pression.wav", 1.0], [sec(32) + 0.1, "sfx-jeu/tampon.wav", 1.2],
    [sec(34), "sfx-jeu/plouf.wav", 1.0], [sec(36), "sfx/light-spell.mp3", 0.6], [sec(38), "sfx-jeu/feu-boum.wav", 0.9],
    [sec(38) + 0.4, "sfx-jeu/feu-crepite.wav", 0.6], [sec(40), "sfx/impact-epic-trailer.mp3", 0.8], [sec(40), "sfx-jeu/roc.wav", 0.6],
    [sec(42) - 0.14, "sfx/zoom-air-fast.mp3", 0.9], [sec(43.25), "sfx/paper-slide.mp3", 0.8], [sec(45), "sfx/tap.mp3", 1.6],
    [sec(45) + 0.1, "sfx/plongee.mp3", 1.1], [sec(46.5), "sfx-jeu/cri-kon.wav", 0.7],
    [sec(49) + 0.15, "sfx/bass-hit-short.mp3", 0.9], [sec(49) + 0.2, "sfx/pop.mp3", 0.8], [sec(50), "sfx/switch-click-quick.mp3", 0.5],
    [sec(51), "sfx/sparkle-touch.mp3", 0.8],
  ],
};

const Textes: React.FC = () => (
  <>
    <Cadre texte={"I turned the places\nfrom my *TikToks*…"} de={-12} a={b(4) - 6} />
    <Cadre texte="…into a *video game* 🎮" de={b(4) + 8} a={b(8) - 8} taille={70} />
    <Etiquette n="1" nom="Itsukushima" ja="厳島神社 · Hiroshima" de={b(5)} a={b(8) - 6} />
    <Etiquette n="2" nom="Aogashima" ja="青ヶ島 · Tokyo islands" de={b(9) + 14} a={b(12) - 6} />
    <Etiquette n="3" nom="Gokayama" ja="五箇山 · Toyama" de={b(13) + 14} a={b(16) - 6} />
    <Etiquette n="4" nom="Himeji Castle" ja="姫路城 · Hyōgo" de={b(17) + 14} a={b(20) - 6} />
    <Etiquette n="5" nom="Takachiho" ja="高千穂 · Miyazaki" de={b(21) + 14} a={b(24) - 6} />
    <Cadre texte="Pick your *companion*" de={b(24) + 6} a={b(30) - 6} />
    <Cadre texte="Wild encounters 🦌" de={b(30) + 3} a={b(32) - 3} taille={56} />
    <Cadre texte="Collect *stamps*" de={b(32) + 3} a={b(34) - 3} taille={56} />
    <Cadre texte="Feed the koi 🐟" de={b(34) + 3} a={b(36) - 3} taille={56} />
    <Cadre texte="Day & *night* 🌙" de={b(36) + 3} a={b(38) - 3} taille={56} />
    <Cadre texte="Fireworks 🎆" de={b(38) + 3} a={b(40) - 3} taille={56} />
    <Cadre texte="Hidden *secrets* 🤫" de={b(40) + 3} a={b(42) - 3} taille={56} />
    <Cadre texte="It's right on my *map* 🗾" de={b(42) + 6} a={b(44) - 2} />
    <Cadre texte="Tap “*Visit in 3D*”" de={b(44) + 12} a={PORTAIL + 6} />
    <Doigt chemin={[[b(44), 860, 1700], [APPUI - 6, 702, 1386]]} appui={APPUI} />
    <Fin de={FIN} titre="Explore Japan in 3D" ligne="5 places · free · on your phone" />
  </>
);

// le flou de mouvement, seulement pendant les panoramiques éclair (et le portail)
const FLOU: [number, number][] = [...[8, 12, 16, 20, 42].map((n): [number, number] => [b(n) - 18, b(n) + 18]), [PORTAIL - 2, PORTAIL + 30]];

export const Tour: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      <Fiche />
      {/* en haut, sous les onglets de TikTok : un voile sombre pour lire les textes */}
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.32) 0px, rgba(0,0,0,.12) 380px, rgba(0,0,0,0) 640px)", opacity: f < FIN ? 1 : 1 - expoSortie(entre(f, FIN, FIN + 20)) }} />
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
