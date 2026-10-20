// Vidéo 3 : « My map on Halloween night » (16,9 s). L'accroche : la carte de jour avec ses grues, « My 3D map of
// Japan… », puis un éclair sur le temps fort de la musique et la même vue la nuit d'Halloween : chauves-souris,
// chapeaux, feux follets. Quatre détails en rythme (chapeaux, araignée, chat, le défilé), puis la chasse : sept yōkai
// cachés, on trouve le dernier, « Hunt complete! » ; la fin : « Find all 7 before Oct 31 ».
// Musique : 「月と狼」(la lune et le loup) de 魔王魂 (CC BY 4.0), pris à 21,2 s : son entrée (22,8 s) tombe à 1,6 s,
// sur l'éclair ; 156,6 battements par minute.
import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
// @ts-expect-error : un module JavaScript du site, sans types
import { YOKAI } from "../../../../../site/halloween-dessins.js";
import "../../../../../site/legendes.css";
import "../../../../../site/halloween.css";
import {
  Ambiance, C, de, Eclair, Fin, Glisse, GrosTitre, Musique, OMBRE, Rush, Son, SourcesCarte, TITRE, useFormat,
} from "./commun";

const TEMPS = (60 / 156.6) * 30;
const t = (n: number) => Math.round(48 + n * TEMPS); // 48 : l'entrée de la musique, l'éclair
export const DUREE_SPOOKY = t(40);

/** Un titre court en haut de l'écran, sur un bandeau sombre (y : son haut, en px de la vidéo). */
const Bandeau: React.FC<{ texte: React.ReactNode; y?: number }> = ({ texte, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { v } = useFormat();
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 210 } });
  return (
    <div style={{ position: "absolute", top: y ?? (v ? 230 : 92), left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          padding: v ? "16px 34px 20px" : "18px 40px 22px", backgroundColor: "rgba(10,8,18,.74)", borderBottom: `5px solid ${C.orange}`,
          maxWidth: v ? 960 : undefined, textAlign: "center",
          font: `400 ${v ? 56 : 74}px/1.05 ${TITRE}`, color: C.clair, textShadow: OMBRE, scale: interpolate(s, [0, 1], [0.6, 1]), opacity: interpolate(s, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {texte}
      </div>
    </div>
  );
};

// l'ordre de la chasse (halloween.js, du nord au sud) ; Enma, le quatrième, est le dernier trouvé
const CHASSE = ["yurei", "oiwa", "hitotsume", "enma", "okiku", "konaki", "ittan"];

/** La rangée des sept yōkai de la chasse : les trouvés en couleur, le dernier s'allume à `trouve`. */
const Rangee: React.FC<{ trouve: number }> = ({ trouve }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { v } = useFormat();
  const n = f >= trouve ? 7 : 6;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: v ? 470 : 64, display: "flex", justifyContent: "center", translate: `0 ${de(f, 0, 12, [v ? 600 : 200, 0])}px` }}>
      <div style={{ display: "flex", alignItems: "center", gap: v ? 6 : 18, padding: v ? "12px 18px" : "14px 30px", backgroundColor: "rgba(10,8,18,.78)", borderRadius: 18, border: `2px solid rgba(255,155,61,.6)` }}>
        {CHASSE.map((id) => {
          const dernier = id === "enma";
          const allume = !dernier || f >= trouve;
          const s = dernier ? spring({ frame: f - trouve, fps, config: { damping: 9, stiffness: 180 } }) : 1;
          return (
            <div
              key={id}
              className="lg"
              style={{
                width: v ? 100 : 112, height: v ? 94 : 105, filter: allume ? "drop-shadow(0 0 10px rgba(255,160,60,.65))" : "grayscale(1) brightness(.35)",
                scale: dernier && f >= trouve ? interpolate(s, [0, 1], [1.8, 1]) : 1,
              }}
              dangerouslySetInnerHTML={{ __html: (YOKAI as Record<string, string>)[id] }}
            />
          );
        })}
        <div style={{ marginLeft: v ? 8 : 16, font: `400 ${v ? 62 : 76}px/1 ${TITRE}`, color: n === 7 ? C.orange : C.clair, textShadow: OMBRE, minWidth: v ? 116 : 150 }}>{n}/7</div>
      </div>
    </div>
  );
};

type Cadre = (f: number) => [number, number, number];
type Detail = {
  de: number; a: number; rush: string; debut: number; texte: React.ReactNode; grand?: boolean;
  cadre?: Cadre; taille?: [number, number]; y?: number;
  v?: { cadre?: Cadre; taille?: [number, number]; y?: number }; // en vertical, à la place
};

export const SpookyMap: React.FC<{ musique: boolean }> = ({ musique }) => {
  const { v } = useFormat();
  const tous: Detail[] = [
    { de: t(0), a: t(4), rush: "v3-nuit", debut: 2.1, texte: "…on Halloween night 🎃", grand: true },
    { de: t(4), a: t(8), rush: "v3-chapeaux", debut: 0.6, cadre: (f) => [interpolate(f, [0, 46], [60, 330]), 0, interpolate(f, [0, 46], [1800, 1320])], texte: "Witch hats on every pin", y: 850,
      v: { cadre: (f) => [interpolate(f, [0, 46], [0, 110]), interpolate(f, [0, 46], [0, 90]), interpolate(f, [0, 46], [1080, 860])], y: 1240 } },
    { de: t(8), a: t(12), rush: "v3-coin", debut: 0.55, taille: [3840, 2160], cadre: () => [2160, 0, 1680], texte: <>A jorō spider in the corner <span style={{ fontSize: 60 }}>🕷️</span></>, y: 850,
      v: { taille: [1620, 2880], cadre: () => [900, 0, 720], y: 1240 } },
    { de: t(12), a: t(16), rush: "v3-coin", debut: 3.9, taille: [3840, 2160], cadre: () => [120, 1520, 1100], texte: "A black cat on the title",
      v: { taille: [1620, 2880], cadre: () => [0, 1106, 700] } },
    { de: t(16), a: t(20), rush: "v2-large", debut: 3, cadre: (f) => [interpolate(f, [0, 46], [240, 300]), interpolate(f, [0, 46], [150, 170]), 1440], texte: "…and a parade of 100 demons",
      v: { cadre: (f) => [interpolate(f, [0, 46], [70, 100]), interpolate(f, [0, 46], [180, 200]), 900] } },
  ];
  const details = tous.map((d) => (v && d.v ? { ...d, ...d.v } : d));
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* De jour : la carte de toujours, ses grues */}
      <Sequence durationInFrames={48} name="Jour">
        <Rush nom="v3-jour" debut={0.5} />
        <SourcesCarte />
        <GrosTitre titre="My 3D map of Japan…" y={v ? -560 : -300} taille={v ? 96 : 104} />
      </Sequence>

      {/* La nuit d'Halloween, puis les détails, en rythme */}
      {details.map((d, i) => (
        <Sequence key={i} from={d.de} durationInFrames={d.a - d.de} name={`Détail ${i}`}>
          <Glisse duree={d.a - d.de} sortie={5}>
            <Rush nom={d.rush} debut={d.debut} taille={d.taille} cadre={d.cadre} />
            <SourcesCarte />
            {d.grand ? <GrosTitre titre={d.texte} y={v ? -560 : -300} taille={v ? 100 : 112} /> : <Bandeau texte={d.texte} y={d.y} />}
          </Glisse>
        </Sequence>
      ))}
      <Sequence from={47} durationInFrames={12}><Eclair duree={12} /></Sequence>

      {/* La chasse aux yōkai : on touche Enma, le septième ; « Hunt complete! » */}
      <Sequence from={t(20)} durationInFrames={t(32) - t(20)} name="Chasse">
        <Glisse duree={t(32) - t(20)} sortie={5}>
          <Rush nom="v3-chasse" debut={0.7} />
          <SourcesCarte />
          <Sequence durationInFrames={70}><Bandeau texte={<>7 yōkai are hiding on my map…</>} y={v ? 230 : 150} /></Sequence>
          <Sequence from={70}><Bandeau texte={<span style={{ color: C.orange }}>Can you find them all?</span>} y={v ? 230 : 150} /></Sequence>
          <Rangee trouve={26} />
        </Glisse>
      </Sequence>

      {/* La fin */}
      <Sequence from={t(32)} name="Fin">
        <Rush nom="fin-japon" debut={0.5} />
        <SourcesCarte />
        <Fin accroche="Find all 7 yōkai before Oct 31" sous="on my 3D map of Japan 🎃" credit={musique ? "♪ 月と狼 · 魔王魂 (CC BY 4.0)" : undefined} />
      </Sequence>

      <Ambiance force={0.7} />

      {musique ? <Musique nom="maou-04-tsuki-to-okami" debut={21.2} fin={DUREE_SPOOKY} volume={0.8} /> : null}
      <Son nom="impact-epic-trailer" a={46} volume={0.85} />
      <Son nom="wing-flutter" a={60} volume={0.55} />
      {[t(4), t(8), t(12), t(16), t(20), t(32)].map((a) => <Son key={a} nom="whoosh-fast" a={a - 5} volume={0.5} />)}
      <Son nom="ui-message-pop" a={t(20) + 24} volume={0.6} />
      <Son nom="ui-success-soft" a={t(20) + 26} volume={0.7} />
      <Son nom="shimmer-sparkle-sweep" a={t(20) + 50} volume={0.55} />
    </AbsoluteFill>
  );
};
