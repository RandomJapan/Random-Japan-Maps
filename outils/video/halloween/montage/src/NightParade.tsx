// Vidéo 2 : « The Night Parade of 100 Demons » (17,6 s). L'accroche : la lanterne-fantôme en gros plan, « Every
// night until Halloween… THIS walks across my map » ; le cortège en plan large sur Kyoto, le tampon 百鬼夜行 ; sept
// gros plans en rythme, chacun avec son nom ; la légende ; la fin (on peut le faire passer sur la carte). Le conteur
// (voix off « George », ElevenLabs par Flora) dit l'accroche, le nom du défilé, la légende et la fin.
// Les gros plans sont recadrés dans le rush « v2-proche » grâce aux boîtes des yōkai (rushes/v2-proche.json).
// Musique : 民族09「揺れる提灯」(les lanternes qui se balancent) de 魔王魂 (CC BY 4.0), 123 battements par minute.
import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Boites, centre, MEMBRES, useBoites } from "./boites";
import {
  Ambiance, C, de, Eclair, Fin, Flash, Glisse, GrosTitre, Musique, OMBRE, Rush, Son, SourcesCarte, TITRE, FELL, useFormat, Voix,
} from "./commun";

const TEMPS = (60 / 123) * 30; // un temps, en images
export const DEBUT_MUSIQUE_DEFILE = 0.51; // le morceau commence par un silence ; son premier temps est à 0,51 s
const bb = (n: number) => Math.round(n * TEMPS);
export const DUREE_DEFILE = bb(36);

/** Un gros plan sur un yōkai du cortège : le cadre le suit dans le rush, et un halo de lumière le distingue des
 *  autres (le reste un peu dans l'ombre). largeur : du cadre, en px du rush (par défaut 1150 en 16:9, 860 en
 *  vertical) ; hauteur : où tombe le yōkai dans l'image (0,55 = un peu sous le milieu). */
const GrosPlan: React.FC<{ b: Boites; membre: number; n0: number; largeur?: number; hauteur?: number; halo?: boolean }> = ({
  b, membre, n0, largeur: l, hauteur = 0.55, halo = true,
}) => {
  const f = useCurrentFrame();
  const { W: Wv, H: Hv, v } = useFormat();
  const largeur = l ?? (v ? 860 : 1150);
  const [W, Hh] = b.taille;
  const haut = (largeur * Hv) / Wv;
  const cadre = (g: number): [number, number, number] => {
    const c = centre(b, membre, n0 + g) ?? [W / 2, Hh / 2];
    const x = Math.max(0, Math.min(W - largeur, c[0] - largeur / 2));
    const y = Math.max(0, Math.min(Hh - haut, c[1] - haut * hauteur));
    return [x, y, largeur];
  };
  const [x, y] = cadre(f);
  const c = centre(b, membre, n0 + f) ?? [W / 2, Hh / 2];
  const k = Wv / largeur;
  // le halo : un peu plus grand que le yōkai (365 × 389 px quand il est agrandi 1,67 fois, comme en 16:9)
  const r = k / (1920 / 1150);
  const px = (c[0] - x) * k, py = (c[1] - y) * k - 43 * r;
  return (
    <AbsoluteFill>
      <Rush nom="v2-proche" taille={[W, Hh]} debut={n0 / 30} cadre={cadre} />
      {halo ? (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse ${Math.round(365 * r)}px ${Math.round(389 * r)}px at ${px.toFixed(0)}px ${py.toFixed(0)}px, rgba(255,190,110,.10), transparent 70%, rgba(4,3,10,.62) 100%)` }} />
      ) : null}
    </AbsoluteFill>
  );
};

const NOMS: Record<string, [string, string, string]> = {
  renard: ["Kitsune", "狐", "the fox and its foxfire"],
  kasa: ["Kasa-obake", "唐傘", "a 100-year-old umbrella, alive"],
  tanuki: ["Tanuki", "狸", "the drumming shape-shifter"],
  kappa: ["Kappa", "河童", "the river imp (bring cucumbers)"],
  oni: ["Oni", "鬼", "the demon and its iron club"],
  tengu: ["Tengu", "天狗", "the long-nosed mountain goblin"],
  rokurokubi: ["Rokurokubi", "轆轤首", "her neck stretches at night"],
};

/** Le nom d'un yōkai : un sceau rouge (son nom en kanji), son nom, ce qu'il est. */
const Nom: React.FC<{ nom: string; kanji: string; quoi: string }> = ({ nom, kanji, quoi }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { v } = useFormat();
  const s = spring({ frame: f - 1, fps, config: { damping: 12, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", left: v ? 64 : 96, bottom: v ? 480 : 104, display: "flex", alignItems: "center", gap: v ? 26 : 30 }}>
      <div
        style={{
          minWidth: 132, height: 132, padding: "0 14px", display: "grid", placeItems: "center", backgroundColor: C.rouge, color: C.clair,
          font: `400 ${kanji.length > 2 ? 52 : 74}px/1 ${TITRE}`, borderRadius: 10,
          boxShadow: `inset 0 0 0 5px ${C.rouge}, inset 0 0 0 8px ${C.clair}, 0 10px 24px rgba(0,0,0,.5)`,
          scale: interpolate(s, [0, 1], [2.2, 1]), rotate: `${interpolate(s, [0, 1], [14, -4])}deg`, opacity: interpolate(s, [0, 0.15], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {kanji}
      </div>
      <div>
        <div style={{ font: `400 ${v ? 88 : 96}px/1 ${TITRE}`, color: C.clair, textShadow: OMBRE, clipPath: `inset(-40px ${de(f, 2, 12, [100, 0])}% -40px -40px)` }}>{nom}</div>
        <div style={{ marginTop: 8, font: `italic 400 46px/1.1 ${FELL}`, color: C.orange, textShadow: OMBRE, opacity: de(f, 6, 13) }}>{quoi}</div>
      </div>
    </div>
  );
};

/** Le tampon 百鬼夜行, posé d'un coup (en vertical, sous le cortège qui traverse le milieu de l'image). */
const Tampon: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { v } = useFormat();
  const s = spring({ frame: f - 4, fps, config: { damping: 10, stiffness: 220 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", translate: v ? "0 220px" : undefined }}>
      <div
        style={{
          padding: "26px 34px", backgroundColor: "rgba(168,50,31,.92)", color: C.clair, font: `400 150px/1 ${TITRE}`, letterSpacing: ".08em",
          borderRadius: 14, boxShadow: `inset 0 0 0 8px rgba(168,50,31,.92), inset 0 0 0 12px ${C.clair}, 0 20px 50px rgba(0,0,0,.6)`,
          scale: interpolate(s, [0, 1], [2.6, 1]), rotate: `${interpolate(s, [0, 1], [10, -3])}deg`, opacity: interpolate(s, [0, 0.12], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        百鬼夜行
      </div>
      <div style={{ marginTop: 34, font: `400 ${v ? 68 : 76}px/1.05 ${TITRE}`, maxWidth: v ? 900 : undefined, color: C.clair, textShadow: OMBRE, opacity: de(f, 14, 22), translate: `0 ${de(f, 14, 26, [24, 0])}px` }}>
        The Night Parade of 100 Demons
      </div>
    </AbsoluteFill>
  );
};

export const NightParade: React.FC<{ musique: boolean }> = ({ musique }) => {
  const b = useBoites("v2-proche");
  const { v } = useFormat();
  if (!b) return null;
  // dans le rush, la caméra suit chaque yōkai 2,6 s, l'un après l'autre (plans.js) : on le prend une fois rejoint
  const quand = (m: string) => Math.round((MEMBRES.indexOf(m) * 2.6 + 1.25) * 30);
  const gros = ["renard", "kasa", "tanuki", "kappa", "oni", "tengu", "rokurokubi"];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* L'accroche : la lanterne-fantôme */}
      <Sequence durationInFrames={bb(7)} name="Lanterne">
        <Glisse duree={bb(7)}>
          {/* en vertical : le titre en haut, la lanterne plus bas */}
          <GrosPlan b={b} membre={0} n0={6} largeur={v ? 1000 : 1300} hauteur={v ? 0.62 : 0.55} halo={false} />
          <AbsoluteFill style={{ background: v ? "linear-gradient(rgba(0,0,0,.55), transparent 38%)" : "linear-gradient(transparent 55%, rgba(0,0,0,.55))" }} />
          <GrosTitre haut="EVERY NIGHT UNTIL HALLOWEEN…" titre={<>…<span style={{ color: C.orange }}>this</span> walks across my map of Japan</>} y={v ? -560 : 330} taille={84} />
        </Glisse>
      </Sequence>

      {/* Le cortège entier sur Kyoto, et le tampon */}
      <Sequence from={bb(7)} durationInFrames={bb(11) - bb(7)} name="Large">
        <Glisse duree={bb(11) - bb(7)}>
          <Rush nom="v2-large" debut={0.4} />
          <SourcesCarte />
          <AbsoluteFill style={{ backgroundColor: "rgba(5,4,12,.25)" }} />
          <Tampon />
        </Glisse>
      </Sequence>
      <Sequence from={bb(7) - 1} durationInFrames={8}><Flash force={0.55} /></Sequence>

      {/* Sept gros plans, deux temps chacun */}
      {gros.map((m, i) => {
        const [nom, kanji, quoi] = NOMS[m];
        const debut = bb(11 + 2 * i), duree = bb(13 + 2 * i) - debut;
        return (
          <Sequence key={m} from={debut} durationInFrames={duree} name={nom}>
            <Glisse duree={duree} sortie={5}>
              <GrosPlan b={b} membre={MEMBRES.indexOf(m)} n0={quand(m)} />
              <SourcesCarte />
              <AbsoluteFill style={{ background: v ? "linear-gradient(0deg, rgba(0,0,0,.55) 22%, transparent 45%)" : "linear-gradient(90deg, rgba(0,0,0,.5), transparent 45%)" }} />
              <Nom nom={nom} kanji={kanji} quoi={quoi} />
            </Glisse>
          </Sequence>
        );
      })}

      {/* La légende, sur le plan large (les chauves-souris passent) */}
      <Sequence from={bb(25)} durationInFrames={bb(31) - bb(25)} name="Légende">
        <Rush nom="v2-large" debut={5.2} />
        <SourcesCarte />
        <AbsoluteFill style={{ backgroundColor: "rgba(5,4,12,.35)" }} />
        <GrosTitre haut="百鬼夜行 · HYAKKI YAGYŌ" titre="Legend says that on certain nights, 100 demons paraded through old Kyoto" bas="Best to stay home!" taille={v ? 78 : 84} y={v ? -120 : 0} />
      </Sequence>
      <Sequence from={bb(25) - 1} durationInFrames={9}><Eclair duree={9} force={0.6} /></Sequence>

      {/* La fin */}
      <Sequence from={bb(31)} name="Fin">
        <Rush nom="v2-large" debut={9} />
        <SourcesCarte />
        <Fin accroche="Summon it on my 3D map of Japan" sous="every night until October 31 🏮" credit={musique ? "♪ 民族09「揺れる提灯」· 魔王魂 (CC BY 4.0)" : undefined} />
      </Sequence>

      <Ambiance force={0.8} />

      {musique ? (
        <Musique nom="maou-bgm-ethnic09" debut={DEBUT_MUSIQUE_DEFILE} fin={DUREE_DEFILE} volume={0.8}
          baisses={[[0, 108], [108, 163], [bb(25) + 3, bb(25) + 92], [bb(31) + 3, bb(31) + 70]]} />
      ) : null}
      {/* le conteur : l'accroche, le nom du défilé sur le tampon, la légende, la fin */}
      <Voix nom="defile-accroche" a={0} />
      <Voix nom="defile-titre" a={108} />
      <Voix nom="defile-legende" a={bb(25) + 3} />
      <Voix nom="defile-fin" a={bb(31) + 3} />
      <Son nom="light-spell" a={bb(7) + 2} volume={0.6} />
      <Son nom="impact-deep-whoosh" a={bb(7) - 3} volume={0.5} />
      {gros.map((m, i) => <Son key={m} nom="swoosh-quick" a={bb(11 + 2 * i) - 3} volume={0.5} />)}
      {gros.map((m, i) => <Son key={`t${m}`} nom="bass-hit-short" a={bb(11 + 2 * i) + 1} volume={0.45} />)}
      <Son nom="wing-flutter" a={bb(25) + 6} volume={0.5} />
      <Son nom="impact-deep-whoosh" a={bb(31) - 4} volume={0.6} />
    </AbsoluteFill>
  );
};
