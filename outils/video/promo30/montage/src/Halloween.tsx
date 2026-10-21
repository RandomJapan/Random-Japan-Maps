// Halloween (jusqu'au 31 octobre) : la même vue de Kyoto passe du jour à la nuit sur un éclair ; « HALLOWEEN »
// tombe sur des coupes au temps (chapeaux, araignée, chat, chauves-souris) ; deux yōkai du défilé de près ; la
// chasse, le septième yōkai trouvé. Les plans sont ceux des vidéos d'Halloween (preparer.py les copie).
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
// @ts-expect-error : un module JavaScript du site, sans types
import { YOKAI } from "../../../../../site/halloween-dessins.js";
import "../../../../../site/legendes.css";
import "../../../../../site/halloween.css";
import { Arrivee, Cartouche, Fuite, Rush, Sources, useFormat } from "./parts";
import { C, de, FELL, FRAPPE, hasard, lin, OMBRE, TITRE } from "./theme";

const borne = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** L'éclair : quelques flashs bleutés. */
const Eclair: React.FC<{ a: number; duree?: number }> = ({ a, duree = 10 }) => {
  const f = useCurrentFrame() - a;
  const motif = [0.95, 0.25, 0.8, 0.1, 0.45, 0.05, 0, 0, 0, 0];
  const v = f >= 0 && f < duree ? motif[Math.min(motif.length - 1, Math.floor((f / duree) * motif.length))] : 0;
  return <AbsoluteFill style={{ backgroundColor: "#dfe8ff", opacity: v, mixBlendMode: "screen" }} />;
};

/** Le jour devient la nuit d'Halloween (50 images) : la même trajectoire de caméra, coupée sur l'éclair. */
export const Bascule: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Arrivee entree={5}>
      {f < 12 ? <Rush nom="v3-jour" debut={1.0} /> : <Sequence from={12} layout="none"><Rush nom="v3-nuit" debut={1.4} /></Sequence>}
      <Sources nuit={f >= 12} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 45%, transparent 50%, rgba(8,6,16,.55))", opacity: lin(f, 12, 30) }} />
      <Eclair a={12} />
    </Arrivee>
  );
};

/** « HALLOWEEN » qui tombe (score-slam sans secousse d'écran : anneau et poussières seulement), sur des coupes au temps. */
export const Titre: React.FC = () => {
  const f = useCurrentFrame();
  const { W, v } = useFormat();
  const IMPACT = 4;
  const cy = v ? 780 : 470; // le centre du titre
  const k = f < IMPACT ? interpolate(f, [-2, IMPACT], [2.5, 0.97], { ...borne, easing: FRAPPE }) : interpolate(f, [IMPACT, IMPACT + 8], [0.97, 1], { ...borne, easing: Easing.out(Easing.cubic) });
  const anneau = lin(f, IMPACT, IMPACT + 14);
  // (en vertical, les plans d'Halloween refilmés en 9:16 : la toile et le chat sur une page 1620 × 2880)
  const coupes: [number, React.ReactNode][] = v ? [
    [0, <Rush nom="v3-chapeaux" debut={0.8} cadre={(g) => [interpolate(g, [0, 13], [40, 110], borne), interpolate(g, [0, 13], [40, 90], borne), interpolate(g, [0, 13], [1000, 860], borne)]} />],
    [13, <Rush nom="v3-coin" debut={1.0} taille={[1620, 2880]} cadre={() => [900, 0, 720]} />],
    [25, <Rush nom="v3-coin" debut={3.9} taille={[1620, 2880]} cadre={() => [0, 1106, 700]} />],
    [38, <Rush nom="v2-large" debut={5.6} cadre={() => [90, 190, 900]} />],
  ] : [
    [0, <Rush nom="v3-chapeaux" debut={0.8} cadre={(g) => [interpolate(g, [0, 13], [100, 200], borne), 0, interpolate(g, [0, 13], [1720, 1560], borne)]} />],
    [13, <Rush nom="v3-coin" debut={1.0} taille={[3840, 2160]} cadre={() => [2160, 0, 1680]} />],
    [25, <Rush nom="v3-coin" debut={3.9} taille={[3840, 2160]} cadre={() => [120, 1520, 1100]} />],
    [38, <Rush nom="v2-large" debut={5.6} cadre={() => [240, 150, 1440]} />],
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      {coupes.map(([a, plan], i) => {
        const fin = i < coupes.length - 1 ? coupes[i + 1][0] : 51;
        return f >= a && f < fin ? <Sequence key={i} from={a} layout="none"><AbsoluteFill>{plan}</AbsoluteFill></Sequence> : null;
      })}
      <AbsoluteFill style={{ backgroundColor: "rgba(8,6,16,.42)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 55% 40% at 50% 50%, rgba(255,140,40,.22), transparent 70%)", opacity: lin(f, IMPACT, IMPACT + 6) }} />
      {f >= IMPACT && f < IMPACT + 16 ? (
        <div style={{ position: "absolute", left: W / 2 - 500 * anneau - 60, top: cy - 500 * anneau - 60, width: 1000 * anneau + 120, height: 1000 * anneau + 120, borderRadius: "50%", border: `${6 - 4 * anneau}px solid ${C.orange}`, opacity: 0.8 * (1 - anneau) }} />
      ) : null}
      {f >= IMPACT && f < IMPACT + 18 ? Array.from({ length: 14 }, (_, i) => {
        const ang = hasard(i) * Math.PI * 2, d = 200 + hasard(i + 40) * 260, t = de(f, IMPACT, IMPACT + 16, [0, 1], Easing.out(Easing.cubic));
        return <div key={i} style={{ position: "absolute", left: W / 2 + Math.cos(ang) * d * t, top: cy + Math.sin(ang) * d * t * 0.6 + 40 * t * t, width: 10 + hasard(i + 9) * 12, height: 10 + hasard(i + 9) * 12, backgroundColor: i % 3 ? C.orange : C.violet, opacity: 1 - lin(f, IMPACT, IMPACT + 18), rotate: `${hasard(i + 3) * 90}deg` }} />;
      }) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: v ? 680 : 330, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ font: `400 ${v ? 122 : 230}px/1 ${TITRE}`, color: C.orange, WebkitTextStroke: `5px #1a0d05`, letterSpacing: "0.02em", textShadow: "0 10px 0 rgba(0,0,0,.45), 0 0 60px rgba(255,140,40,.65)", scale: `${k}`, rotate: `${interpolate(f, [-2, IMPACT], [6, -2], borne)}deg`, opacity: lin(f, -2, 1) }}>
          HALLOWEEN
        </div>
        <div style={{ marginTop: 14, font: `italic 400 ${v ? 64 : 74}px/1 ${FELL}`, color: C.clair, textShadow: OMBRE, opacity: de(f, IMPACT + 6, IMPACT + 14), translate: `0 ${(1 - de(f, IMPACT + 6, IMPACT + 16)) * 26}px` }}>
          🎃 until October 31 🎃
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ le défilé, de près
type Boites = { taille: [number, number]; images: ([number, number, number, number] | null)[][] };
const MEMBRES = ["chochin", "renard", "kasa", "tanuki", "kappa", "oni", "tengu", "rokurokubi", "zori"];
const useBoites = (nom: string) => {
  const [b, setB] = useState<Boites | null>(null);
  const [attente] = useState(() => delayRender(`boîtes ${nom}`));
  useEffect(() => {
    fetch(staticFile(`${nom}.json`)).then((r) => r.json()).then((j: Boites) => { setB(j); continueRender(attente); })
      .catch(() => continueRender(attente));
  }, [nom, attente]);
  return b;
};
const centre = (b: Boites, m: number, n: number): [number, number] | null => {
  let sx = 0, sy = 0, k = 0;
  for (let j = -6; j <= 6; j++) {
    const r = b.images[Math.max(0, Math.min(b.images.length - 1, n + j))]?.[m];
    if (r) { sx += r[0] + r[2] / 2; sy += r[1] + r[3] / 2; k++; }
  }
  return k ? [sx / k, sy / k] : null;
};
/** Un yōkai du défilé de près : le cadre le suit dans le rush, un halo le distingue des autres. */
const GrosPlan: React.FC<{ b: Boites; membre: number; n0: number }> = ({ b, membre, n0 }) => {
  const f = useCurrentFrame();
  const { W: Wv, H: Hv, v } = useFormat();
  const [W, H] = b.taille, l = v ? 860 : 1150, h = (l * Hv) / Wv;
  const cadre = (g: number): [number, number, number] => {
    const c = centre(b, membre, n0 + g) ?? [W / 2, H / 2];
    return [Math.max(0, Math.min(W - l, c[0] - l / 2)), Math.max(0, Math.min(H - h, c[1] - h * 0.55)), l];
  };
  const [x, y] = cadre(f);
  const c = centre(b, membre, n0 + f) ?? [W / 2, H / 2];
  const k = Wv / l, r = k / (1920 / 1150); // le halo : à la taille du yōkai agrandi
  return (
    <AbsoluteFill>
      <Rush nom="v2-proche" debut={n0 / 30} cadre={cadre} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse ${Math.round(365 * r)}px ${Math.round(389 * r)}px at ${((c[0] - x) * k).toFixed(0)}px ${((c[1] - y) * k - 43 * r).toFixed(0)}px, rgba(255,190,110,.10), transparent 70%, rgba(4,3,10,.62) 100%)` }} />
    </AbsoluteFill>
  );
};
const Nom: React.FC<{ nom: string; kanji: string; quoi: string }> = ({ nom, kanji, quoi }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { v } = useFormat();
  const s = spring({ frame: f - 1, fps, config: { damping: 12, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", left: v ? 64 : 96, bottom: v ? 480 : 100, display: "flex", alignItems: "center", gap: 28 }}>
      <div style={{ minWidth: 128, height: 128, padding: "0 12px", display: "grid", placeItems: "center", backgroundColor: C.rouge, color: C.clair, font: `400 ${kanji.length > 1 ? 56 : 74}px/1 ${TITRE}`, borderRadius: 10, boxShadow: `inset 0 0 0 5px ${C.rouge}, inset 0 0 0 8px ${C.clair}, 0 10px 24px rgba(0,0,0,.5)`, scale: `${interpolate(s, [0, 1], [2.2, 1])}`, rotate: `${interpolate(s, [0, 1], [14, -4])}deg`, opacity: interpolate(s, [0, 0.15], [0, 1], borne) }}>{kanji}</div>
      <div>
        <div style={{ font: `400 92px/1 ${TITRE}`, color: C.clair, textShadow: OMBRE, clipPath: `inset(-40px ${de(f, 2, 12, [100, 0])}% -40px -40px)` }}>{nom}</div>
        <div style={{ marginTop: 8, font: `italic 400 44px/1.1 ${FELL}`, color: C.orange, textShadow: OMBRE, opacity: de(f, 6, 13) }}>{quoi}</div>
      </div>
    </div>
  );
};
export const Defile: React.FC = () => {
  const { v } = useFormat();
  const b = useBoites(v ? "rushes-v/v2-proche" : "rushes/v2-proche");
  if (!b) return null;
  // dans le rush, la caméra rejoint chaque yōkai 1,25 s après son tour (2,6 s chacun)
  const quand = (m: string) => Math.round((MEMBRES.indexOf(m) * 2.6 + 1.25) * 30);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence durationInFrames={25}>
        <Fuite duree={25} sortie={4}><Arrivee entree={5}>
          <GrosPlan b={b} membre={1} n0={quand("renard")} />
          <Nom nom="Kitsune" kanji="狐" quoi="the fox and its foxfire" />
        </Arrivee></Fuite>
      </Sequence>
      <Sequence from={25}>
        <Fuite duree={26} sortie={5}><Arrivee entree={4}>
          <GrosPlan b={b} membre={5} n0={quand("oni")} />
          <Nom nom="Oni" kanji="鬼" quoi="the demon and its iron club" />
        </Arrivee></Fuite>
      </Sequence>
      <Sources nuit />
      <Cartouche a={3} taille={v ? 42 : 46} style={{ left: 0, right: 0, top: v ? 230 : 70, margin: "0 auto", width: "fit-content", backgroundColor: "rgba(16,12,24,.82)", backgroundImage: "none", color: C.clair, boxShadow: `inset 0 0 0 2px ${C.orange}, 0 10px 30px rgba(0,0,0,.5)` }}>
        The Night Parade of <span style={{ color: C.orange }}>100 Demons</span>
      </Cartouche>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ la chasse
const CHASSE = ["yurei", "oiwa", "hitotsume", "enma", "okiku", "konaki", "ittan"];
const Rangee: React.FC<{ trouve: number }> = ({ trouve }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { v } = useFormat();
  const n = f >= trouve ? 7 : 6;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: v ? 470 : 64, display: "flex", justifyContent: "center", translate: `0 ${de(f, 0, 12, [v ? 600 : 200, 0])}px` }}>
      <div style={{ display: "flex", alignItems: "center", gap: v ? 4 : 16, padding: v ? "10px 16px" : "12px 28px", backgroundColor: "rgba(10,8,18,.8)", borderRadius: 18, border: "2px solid rgba(255,155,61,.6)" }}>
        {CHASSE.map((id) => {
          const dernier = id === "enma";
          const allume = !dernier || f >= trouve;
          const s = dernier ? spring({ frame: f - trouve, fps, config: { damping: 9, stiffness: 180 } }) : 1;
          return <div key={id} className="lg" style={{ width: v ? 98 : 104, height: v ? 92 : 98, filter: allume ? "drop-shadow(0 0 10px rgba(255,160,60,.65))" : "grayscale(1) brightness(.35)", scale: dernier && f >= trouve ? `${interpolate(s, [0, 1], [1.8, 1])}` : "1" }} dangerouslySetInnerHTML={{ __html: (YOKAI as Record<string, string>)[id] }} />;
        })}
        <div style={{ marginLeft: v ? 6 : 14, font: `400 ${v ? 58 : 70}px/1 ${TITRE}`, color: n === 7 ? C.orange : C.clair, textShadow: OMBRE, minWidth: v ? 108 : 140 }}>{n}/7</div>
      </div>
    </div>
  );
};
export const Chasse: React.FC = () => {
  const { v } = useFormat();
  return (
  <Arrivee entree={5}>
    <Rush nom="v3-chasse" debut={0.7} />
    <Cartouche a={3} taille={v ? 46 : 52} style={{ left: 0, right: 0, top: v ? 230 : 150, margin: "0 auto", width: "fit-content", backgroundColor: "rgba(16,12,24,.85)", backgroundImage: "none", color: C.clair, boxShadow: `inset 0 0 0 2px ${C.orange}, 0 10px 30px rgba(0,0,0,.5)` }}>
      Find all <span style={{ color: C.orange }}>7 hidden yōkai</span>
    </Cartouche>
    <Rangee trouve={26} />
  </Arrivee>
  );
};
