// La vidéo du défi du jour (2026-11-09). 22,9 s, 9:16, 60 images/s, en anglais. Une photo floue plein écran (un vrai plan du propriétaire) :
// à chaque essai raté, elle devient plus nette. Les coupes alternent : la photo, puis la carte du vrai jeu, où l'essai tombe, de plus en plus
// chaud (froid, tiède, chaud, brûlant), et la musique se construit avec. Trouvé : la photo devient nette, et c'est le vrai lieu. Puis les petits
// carrés du résultat, le même lieu pour tout le monde, un nouveau chaque jour.
// 144 battements par minute : le temps n tombe à l'image 25 n (le découpage : ../plan.md). La prise df-essais commence au temps 7.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { C, CHAUD, entre, FPS, POLICE, rebond } from "./theme";
import { Credits, Effet, Fin, Mots, Plans, Son, UnPlan, Voix } from "./Commun";

const b = (n: number) => Math.round(n * 25);
const sec = (n: number) => (n * 25) / 60;
export const DUREE_DEFI = b(55);
const ZERO = b(7); // la prise commence là
const prise = (de: number, a: number, entree: UnPlan["entree"] = "punch"): UnPlan => ({ de, a, src: "rushes/df-essais.mp4", t0: (de - ZERO) / FPS, zoom: [1, 1], entree });
// le flou de la photo, à plein écran : autant, pour la largeur de l'image, que dans le jeu (defi.js : FLOU)
const FLOUS = [46, 32, 21, 13, 7, 2.5];
const photo = (de: number, a: number, k: number, t0: number): UnPlan => ({ de, a, src: "reels/etang.mp4", t0, zoom: [1.1, 1.02], centre: [0.5, 0.5], flou: FLOUS[k], entree: k ? "flash" : undefined });
const ailleurs = (de: number, a: number, src: string, t0: number): UnPlan => ({ de, a, src: `reels/${src}.mp4`, t0, zoom: [1.1, 1.02], flou: 34, entree: "punch" });

const PLANS: UnPlan[] = [
  photo(0, b(7), 0, 0),
  prise(b(7), b(13), "flash"),
  photo(b(13), b(15), 1, 2.8), prise(b(15), b(17)),
  photo(b(17), b(19), 2, 3.4), prise(b(19), b(21)),
  photo(b(21), b(23), 3, 4.0), prise(b(23), b(25)),
  photo(b(25), b(27), 4, 4.6), prise(b(27), b(29)),
  { de: b(29), a: b(33), src: "reels/etang.mp4", t0: 1.6, zoom: [1.16, 1.0], flou: 16, flou2: 0, entree: "flash" },
  prise(b(33), b(38), "punch"),
  ailleurs(b(38), b(39.75), "kinkaku-1", 0), ailleurs(b(39.75), b(41.5), "motonosumi", 0.6), ailleurs(b(41.5), b(43.25), "aogashima", 0.1), ailleurs(b(43.25), b(45), "moai", 1),
];

/** Le numéro de l'essai, en haut de la photo floue. */
const Essai: React.FC<{ de: number; a: number; n: number }> = ({ de, a, n }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const v = rebond(f, de, 420, 22);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 186, display: "flex", justifyContent: "center", zIndex: 91, transform: `scale(${(1.3 - 0.3 * v).toFixed(3)})` }}>
      <div style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 62, color: C.encre, background: C.clair, border: `6px solid ${C.encre}`, borderRadius: 999, padding: "4px 38px" }}>TRY {n} / 6</div>
    </div>
  );
};

/** La température de l'essai et sa distance (les vraies : la prise). */
const Temperature: React.FC<{ de: number; a: number; mot: string; km: string; couleur: string }> = ({ de, a, mot, km, couleur }) => (
  <Mots texte={`*${mot}*\n${km}`} de={de} a={a} y={1250} taille={108} couleur={couleur} />
);

/** Les petits carrés du résultat, un par temps. */
const Carres: React.FC<{ de: number; a: number }> = ({ de, a }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const couleurs = [CHAUD.froid, CHAUD.tiede, CHAUD.chaud, CHAUD.brulant];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1120, display: "flex", justifyContent: "center", gap: 18, zIndex: 92 }}>
      {[0, 1, 2, 3, 4].map((k) => {
        const d = de + k * 12, v = rebond(f, d, 420, 18);
        if (f < d) return <div key={k} style={{ width: 150, height: 150 }} />;
        return k < 4
          ? <div key={k} style={{ width: 150, height: 150, borderRadius: 22, background: couleurs[k], border: `8px solid ${C.encre}`, boxShadow: "0 10px 0 rgba(0,0,0,.35)", transform: `scale(${Math.max(0, v).toFixed(3)}) rotate(${(-14 * (1 - v)).toFixed(2)}deg)` }} />
          : <div key={k} style={{ width: 150, height: 150, display: "grid", placeItems: "center", fontFamily: POLICE, fontSize: 132, lineHeight: 1, transform: `scale(${Math.max(0, v).toFixed(3)})` }}>🎯</div>;
      })}
    </div>
  );
};

const carteVisible = (f: number) => [[b(7), b(13)], [b(15), b(17)], [b(19), b(21)], [b(23), b(25)], [b(27), b(29)], [b(33), b(38)]].some(([x, y]) => f >= x && f < y);

// ---------------------------------------------------------------- le son
const COUPES = [13, 15, 17, 19, 21, 23, 25, 27];
const APPUIS: [number, number, string, number][] = [[8.1, 9.3, "froid.wav", 0.3], [15.15, 15.85, "tiede.wav", 0.3], [19.15, 19.85, "chaud.wav", 0.32], [23.15, 23.85, "brulant.wav", 0.34], [27.15, 27.85, "trouve.wav", 0.4]];
const EFFETS: Effet[] = [
  ...COUPES.map((n): Effet => [sec(n), "transition-snap.mp3", 0.22]),
  [sec(7) - 0.03, "swoosh-quick.mp3", 0.3],
  ...APPUIS.flatMap(([a, v, son, vol]): Effet[] => [[sec(a), "tap.mp3", 0.6], [sec(a) + 0.02, "epingle.wav", 0.5], [sec(v), "tap.mp3", 0.6], [sec(v) + 0.05, son, vol]]),
  [sec(29) - 0.04, "impact-deep-whoosh.mp3", 0.32], [sec(29) + 0.02, "shimmer-sparkle-sweep.mp3", 0.22],
  [sec(33) - 0.02, "swoosh-quick.mp3", 0.28],
  ...[0, 1, 2, 3, 4].map((k): Effet => [sec(34) + (k * 12) / FPS, "pop.mp3", 0.34]),
  ...[38, 39.75, 41.5, 43.25].map((n): Effet => [sec(n), "transition-snap.mp3", 0.25]),
  [sec(45), "sparkle-touch.mp3", 0.25], [sec(49), "ui-success-soft.mp3", 0.2],
];
const VOIX: Voix[] = [
  [0.05, "f-photo"], [sec(3.9), "f-essais"],
  [sec(7.15), "f-tap"],
  [sec(9.55), "f-froid"],
  [sec(11.3), "f-net"],
  [sec(16), "f-tiede"],
  [sec(20), "f-chaud"],
  [sec(24), "f-brule"],
  [sec(27.85), "f-trouve"],
  [sec(29.15), "f-nom"],
  [sec(34.55), "f-score"],
  [sec(38.1), "f-meme"],
  [sec(41.75), "f-jour"],
  [sec(45.5), "f-attend"],
  [sec(49.1), "f-bio"],
];
const FLOU: [number, number][] = [[b(29) - 2, b(29) + 12]];

// ---------------------------------------------------------------- tout
export const Defi: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      <Credits visible={carteVisible(f)} />
      <Mots texte={"ONE *BLURRY*\nPHOTO"} de={0} a={b(3.9)} y={330} taille={130} pose />
      <Mots texte={"*6 TRIES*"} de={b(3.9)} a={b(7)} y={420} taille={170} />
      <Mots texte={"TAP THE MAP"} de={b(7)} a={b(9.4)} y={1200} taille={118} />
      <Temperature de={b(9.5)} a={b(11.3)} mot="COLD" km="898 KM" couleur={CHAUD.froid} />
      <Mots texte={"EVERY MISS\nMAKES IT\n*SHARPER*"} de={b(11.3)} a={b(15)} y={b(11.3) <= f && f < b(13) ? 1120 : 620} taille={118} />
      <Essai de={b(13)} a={b(15)} n={2} /><Essai de={b(17)} a={b(19)} n={3} /><Essai de={b(21)} a={b(23)} n={4} /><Essai de={b(25)} a={b(27)} n={5} />
      <Temperature de={b(16)} a={b(17)} mot="WARM" km="337 KM" couleur={CHAUD.tiede} />
      <Temperature de={b(20)} a={b(21)} mot="HOT" km="116 KM" couleur={CHAUD.chaud} />
      <Temperature de={b(24)} a={b(25)} mot="BURNING" km="38 KM" couleur={CHAUD.brulant} />
      <Mots texte={"*FOUND IT!*"} de={b(28)} a={b(29)} y={1200} taille={150} couleur={CHAUD.trouve} />
      <Mots texte={"SHIROGANE\n*BLUE POND*\nHOKKAIDO"} de={b(29)} a={b(33)} y={470} taille={126} />
      <Mots texte={"SHARE YOUR *SCORE*"} de={b(34.5)} a={b(38)} y={1310} taille={84} />
      <Carres de={b(34)} a={b(38)} />
      <Mots texte={"SAME PLACE\nFOR *EVERYONE*"} de={b(38)} a={b(41.7)} y={740} taille={118} />
      <Mots texte={"A NEW ONE\n*EVERY DAY*"} de={b(41.7)} a={b(45)} y={740} taille={118} />
      <Fin de={b(45)} de2={b(49)} titre={<>TODAY'S PLACE<br />IS WAITING</>} sous="1 PHOTO · 6 TRIES · EVERY DAY" fond="reels/etang.mp4" t0={2.2} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={200} samples={6}>{image}</CameraMotionBlur> : image}
      <Son bgm={bgm} musique="musique/defi.wav" volume={0.34} voix={VOIX} effets={EFFETS} />
    </AbsoluteFill>
  );
};
