// La troisième vidéo du jeu, « le créateur » (2026-11-10, le propriétaire : « Ok tu peux refaire une nouvelle vidéo présentation dans un
// autre style »). 22,7 s, 9:16, 60 images/s, en anglais. L'inverse des deux premières : pas de motion design, pas de voix ; l'histoire
// du créateur à la première personne, dans les bulles de texte natives de TikTok, sur un enregistrement d'écran du vrai jeu, avec une
// musique lo-fi composée. L'accroche : un défilé de plus en plus rapide de 22 des lieux filmés par le compte.
// 90 battements par minute : le temps n tombe à l'image 40 n (le découpage : ../plan-createur.md).
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { entre, expoS, expoSortie, FPS, POLICE } from "./theme";
import { Credits, Effet, Son } from "./Commun";

const b = (n: number) => Math.round(n * 40);
const sec = (n: number) => (n * 40) / FPS;
const T = 2 / 3; // un temps (s)
export const DUREE_CREATEUR = b(34);

// ---------------------------------------------------------------- les plans
// une vidéo plein écran de l'image `de` à `a` ; t0 : sa seconde à l'image `de` ; zoom : (image) → [échelle, origine x, origine y]
// calque : une image posée sur la prise, en px de la prise (elle zoome avec elle), et son opacité à l'image f
type Calque = { src: string; x: number; y: number; l: number; h: number; opacite: (f: number) => number };
type Plan = { de: number; a: number; src: string; t0?: number; img?: boolean; zoom?: (f: number) => [number, number, number]; calque?: Calque };

// le défilé : 2 plans d'une croche, 4 d'une double croche, 16 d'une triple (les mêmes coupes que les charlestons de musique.py)
const COUPES = [0, 20, 40, 50, 60, 70, ...Array.from({ length: 16 }, (_, k) => 80 + 5 * k), b(4)];
const DEFILE: Plan[] = COUPES.slice(0, -1).map((de, k) => ({ de, a: COUPES[k + 1], src: `reels/defile/${String(k).padStart(2, "0")}.mp4`, t0: 0.05 }));

/** Un zoom de monteur sur l'enregistrement d'écran : monte vers `z` entre i0 et i1, redescend entre o0 et o1. */
const pousser = (z: number, x: number, y: number, i0: number, i1: number, o0: number, o1: number) => (f: number): [number, number, number] => {
  const u = expoS(entre(f, i0, i1)) * (1 - expoS(entre(f, o0, o1)));
  return [1 + (z - 1) * u, x, y];
};
// le zoom sur la photo de la manche : la photo (mesurée sur la prise, 380 × 304 px en (350, 159), immobile de 1,9 s à 4,6 s de la prise)
// descend un peu sous les onglets de TikTok ; agrandie, l'image de la prise serait floue : la vraie photo du jeu se pose dessus
const ZOOM_MANCHE: [number, number, number, number, number] = [b(8.25), b(8.85), b(10.35), b(10.9), 1.9];
const PHOTO_MANCHE: [number, number] = [540, 200];
const enZoom = (f: number) => expoS(entre(f, ZOOM_MANCHE[0], ZOOM_MANCHE[1])) * (1 - expoS(entre(f, ZOOM_MANCHE[2], ZOOM_MANCHE[3])));
// la vignette de la carte du défi trouvé : on plonge dedans, et c'est le vrai plan
const VIGNETTE_DEFI: [number, number] = [142, 238];

// les prises (rushes.py, plans.js) : cr-debut commence au temps 5 ; les essais du défi tombent sur les temps 1, 4, 7, 10 de la prise
const PLANS: Plan[] = [
  ...DEFILE,
  { de: b(4), a: b(5), src: "reels/cr-fuji.mp4", zoom: (f) => [1 + 0.04 * entre(f, b(4), b(5)), 540, 960] },
  { de: b(5), a: b(15), src: "rushes/cr-debut.mp4", t0: 0, zoom: pousser(ZOOM_MANCHE[4], ...PHOTO_MANCHE, ...(ZOOM_MANCHE.slice(0, 4) as [number, number, number, number])),
    calque: { src: "photos/jeu-fuji.jpg", x: 350, y: 159, l: 380, h: 304, opacite: enZoom } },
  { de: b(15), a: b(18), src: "rushes/cr-score.mp4", t0: 0.25 * T },
  { de: b(18), a: b(20.5), src: "rushes/cr-defi.mp4", t0: 0 },
  { de: b(20.5), a: b(22.5), src: "rushes/cr-defi.mp4", t0: 6.5 * T },
  { de: b(22.5), a: b(25.5), src: "rushes/cr-defi.mp4", t0: 9.5 * T, zoom: (f) => [1 + 5 * Math.pow(entre(f, b(25.5) - 9, b(25.5)), 3), ...VIGNETTE_DEFI] },
  { de: b(25.5), a: b(27), src: "reels/cr-takachiho.mp4", t0: 0.2, zoom: (f) => [1 + 0.35 * (1 - expoSortie(entre(f, b(25.5), b(25.5) + 18))), 540, 960] }, // (on atterrit dans le vrai plan)
  { de: b(27), a: b(27 + 2 / 3), src: "ui/salon-1.jpg", img: true },
  { de: b(27 + 2 / 3), a: b(28 + 1 / 3), src: "ui/salon-2.jpg", img: true },
  { de: b(28 + 1 / 3), a: b(29), src: "ui/salon-3.jpg", img: true },
  { de: b(29), a: b(31.5), src: "reels/cr-shirahige-a.mp4", t0: 0, zoom: (f) => [1.04 - 0.04 * entre(f, b(29), b(31.5)), 540, 1100] },
  { de: b(31.5), a: b(34), src: "reels/cr-shirahige-b.mp4", t0: 0.1, zoom: (f) => [1 + 0.05 * entre(f, b(31.5), b(34)), 540, 1000] },
];
// les plans de la carte, pour ses crédits
const CARTE: [number, number][] = [[b(5), b(25.5)], [b(27), b(29)]];

const LePlan: React.FC<{ p: Plan }> = ({ p }) => {
  const f = useCurrentFrame() + p.de;
  const [z, ox, oy] = p.zoom ? p.zoom(f) : [1, 540, 960];
  const plein: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };
  const c = p.calque, o = c ? c.opacite(f) : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${z.toFixed(5)})`, transformOrigin: `${ox}px ${oy}px` }}>
      {p.img
        ? <Img src={staticFile(p.src)} style={plein} />
        : <OffthreadVideo src={staticFile(p.src)} muted trimBefore={Math.round((p.t0 ?? 0) * FPS)} style={plein} />}
      {c && o > 0.001 && <Img src={staticFile(c.src)} style={{ position: "absolute", left: c.x, top: c.y, width: c.l, height: c.h, opacity: o }} />}
    </div>
  );
};

// ---------------------------------------------------------------- les bulles de TikTok
/** Le texte natif de TikTok, avec son fond : des lignes noires sur des bulles blanches arrondies qui se touchent, au centre. Il apparaît
 *  d'un coup sur le temps, comme dans l'appli. \n coupe la ligne. */
const Bulle: React.FC<{ texte: string; de: number; a: number; y: number; taille?: number }> = ({ texte, de, a, y, taille = 62 }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: y, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 90 }}>
      {texte.split("\n").map((l, i) => (
        <div key={i} style={{
          fontFamily: POLICE, fontWeight: 700, fontSize: taille, lineHeight: 1.18, color: "#121212", background: "#fff",
          padding: `${taille * 0.16}px ${taille * 0.34}px`, borderRadius: taille * 0.3, textAlign: "center", whiteSpace: "nowrap",
          marginTop: i ? -taille * 0.12 : 0, letterSpacing: -0.3,
        }}>{l}</div>
      ))}
    </div>
  );
};

const TEXTES: { texte: string; de: number; a: number; y: number; taille?: number }[] = [
  { texte: "I filmed 160 places\nin Japan 🎥", de: 0, a: b(4), y: 470 },
  { texte: "so I turned them\ninto a game 🎮", de: b(4), a: b(8), y: 470 },
  { texte: "guess where the\nphoto was taken 📍", de: b(8), a: b(11), y: 1060 },
  { texte: "the closer you are,\nthe more points", de: b(11.5), a: b(15), y: 1220 },
  { texte: "5 places · 30 seconds each ⏳", de: b(15), a: b(18), y: 1150 },
  { texte: "+ a new mystery place\nevery day", de: b(18), a: b(21.5), y: 1180 },
  { texte: "every miss makes\nthe photo sharper", de: b(21.5), a: b(25.5), y: 1180 },
  { texte: "📍 Takachiho Gorge", de: b(25.5), a: b(27), y: 470 },
  { texte: "or challenge\nyour friends 👀", de: b(27), a: b(29), y: 1180 },
  { texte: "can you beat 4,361? 👀", de: b(29), a: b(31.5), y: 470 },
  { texte: "free · link in bio 🔗\nmap.randomjapanplace.com", de: b(31.5), a: DUREE_CREATEUR, y: 230, taille: 56 },
];

// ---------------------------------------------------------------- le son
// les appuis de la prise cr-debut (prise 0 = temps 5) : Menu 0,5, la tuile 1,5, Play solo 2,5, la carte 6, Confirm 7 (en temps)
const APPUIS = [5.5, 6.5, 7.5, 11, 12, 15.25, 19, 20, 21, 22, 23, 24];
const EFFETS: Effet[] = [
  ...APPUIS.map((n): Effet => [sec(n), "cr-appui.wav", 0.22]),
  [sec(11), "cr-epingle.wav", 0.32], [sec(19), "cr-epingle.wav", 0.26], [sec(21), "cr-epingle.wav", 0.26], [sec(23), "cr-epingle.wav", 0.26],
  [sec(12) + 0.15, "cr-reponse.wav", 0.3, 2.2],
  [sec(15.25) + 0.12, "pts.wav", 0.12],
  [sec(20) + 0.1, "cr-froid.wav", 0.26, 1.6], [sec(22) + 0.1, "cr-brulant.wav", 0.26, 1.6], [sec(24) + 0.1, "cr-trouve.wav", 0.3, 2.4],
  [sec(25.5) - 0.12, "swoosh-quick.mp3", 0.14],
  [sec(27), "cr-appui.wav", 0.12], [sec(27 + 2 / 3), "ui-message-pop.mp3", 0.1], [sec(28 + 1 / 3), "ui-message-pop.mp3", 0.1],
];

export const Createur: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const surCarte = CARTE.some(([a, z]) => f >= a && f < z);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {PLANS.map((p, i) => (
        <Sequence key={i} from={p.de} durationInFrames={p.a - p.de} layout="none">
          <AbsoluteFill style={{ overflow: "hidden" }}><LePlan p={p} /></AbsoluteFill>
        </Sequence>
      ))}
      <Credits visible={surCarte} />
      {TEXTES.map((t, i) => <Bulle key={i} {...t} />)}
      <Son bgm={bgm} musique="musique/createur.wav" volume={1} voix={[]} effets={EFFETS} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- la miniature : une mosaïque des lieux, les deux premières bulles
const MOSAIQUE = [0, 1, 2, 3, 5, 6, 7, 9, 10, 12, 14, 15, 16, 19, 20];
export const MiniatureCreateur: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {MOSAIQUE.map((k, i) => (
      <div key={k} style={{ position: "absolute", left: (i % 3) * 360, top: Math.floor(i / 3) * 384, width: 360, height: 384, overflow: "hidden" }}>
        <OffthreadVideo src={staticFile(`reels/defile/${String(k).padStart(2, "0")}.mp4`)} muted trimBefore={6} style={{ width: 360, height: 640, objectFit: "cover", marginTop: -128 }} />
      </div>
    ))}
    <Bulle texte={"I filmed 160 places\nin Japan 🎥"} de={0} a={1} y={600} taille={70} />
    <Bulle texte={"so I turned them\ninto a game 🎮"} de={0} a={1} y={1010} taille={70} />
  </AbsoluteFill>
);
