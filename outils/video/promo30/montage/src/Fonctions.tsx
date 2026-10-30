// Les fonctions de la carte, chacune avec son geste : la fiche d'un lieu qui vole à sa place et joue la vidéo du
// propriétaire ; le dé ; les favoris et leur route tracée à l'encre ; les légendes cachées, la mer vivante et les
// saisons (quatre plans à la fois). Les captures et leurs coordonnées viennent de captures.py (ui/layout.json).
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import layout from "../../../../../videos/carte/promo30/public/ui/layout.json";
import { Arrivee, Cartouche, Cle, Coeur, Curseur, De3D, ecran, Extrait, Fuite, Page, Rush, Sceau, Sources } from "./parts";
import { C, de, ELAN, FELL, GRAIN, HALO, lin, POSE, TITRE } from "./theme";

type Boite = [number, number, number, number];
const L = layout as unknown as Record<string, Boite> & {
  route: { points: [number, number][] }[]; etapes: { texte: string; boite: Boite }[]; temps: { fichier: string; boite: Boite }[];
};
const borne = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Une fiche (découpée de la vraie page) posée à sa place, qui peut jouer un extrait dans son cadre photo. */
const Fiche: React.FC<{ src: string; boite: Boite; clip?: string; clipDe?: number; style?: React.CSSProperties }> = ({ src, boite, clip, clipDe = 1e9, style }) => {
  const f = useCurrentFrame();
  const media = L["fiche-media"];
  const dx = media[0] - L.fiche[0], dy = media[1] - L.fiche[1];
  return (
    <div style={{ position: "absolute", left: boite[0], top: boite[1], width: boite[2], height: boite[3], transformStyle: "preserve-3d", ...style }}>
      <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", boxShadow: "0 18px 40px rgba(40,26,14,.35)" }} />
      {clip && f >= clipDe ? (
        <div style={{ position: "absolute", left: dx, top: dy, width: media[2], height: media[3], overflow: "hidden", opacity: lin(f, clipDe, clipDe + 6) }}>
          <Sequence from={clipDe} layout="none"><Extrait nom={clip} /></Sequence>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 60%, rgba(30,18,8,.35))" }} />
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------------------------------------ la fiche (101 images)
const CAM_FICHE: Cle[] = [
  { f: 0, cx: 470, cy: 290, z: 2.0 }, { f: 22, cx: 455, cy: 276, z: 2.12 },
  { f: 44, cx: 640, cy: 360, z: 1.0 }, { f: 56, cx: 640, cy: 360, z: 1.0 },
  { f: 96, cx: 800, cy: 330, z: 1.36, ry: -7, rx: 3 },
];
export const FicheLieu: React.FC = () => {
  const f = useCurrentFrame();
  const pin = L["pin-himeji-fiche"];
  const [px, py] = ecran(CAM_FICHE, 24, pin[0] + pin[2] / 2, pin[1] + pin[3] / 2);
  const [jx, jy] = ecran(CAM_FICHE, 56, L["fiche-media"][0] + L["fiche-media"][2] / 2, L["fiche-media"][1] + L["fiche-media"][3] / 2);
  // la fiche vole depuis la droite et se pose dans son emplacement (avec un petit dépassement)
  const vol = de(f, 26, 43, [0, 1], POSE);
  const leve = de(f, 62, 80) * (1 - de(f, 96, 101));
  const impulsion = interpolate(f, [24, 28, 34], [0, 1, 0], borne);
  return (
    <Fuite duree={101} sortie={6}>
      <Arrivee entree={6}>
        <Page src="ui/himeji-fond.png" cles={CAM_FICHE}>
          <div style={{ position: "absolute", left: pin[0] - 14, top: pin[1] - 14, width: pin[2] + 28, height: pin[3] + 28, borderRadius: "50%", border: `3px solid ${C.rouge}`, opacity: impulsion, scale: `${1 + impulsion * 0.4}` }} />
          {f >= 26 ? (
            <Fiche src="ui/fiche-himeji.png" boite={L.fiche} clip="himeji-sakura" clipDe={58}
              style={{ translate: `${(1 - vol) * 720}px ${(1 - vol) * -40}px`, rotate: `y ${(1 - vol) * -40}deg`, transform: `translateZ(${leve * 40}px)`, opacity: lin(f, 26, 30) }} />
          ) : null}
        </Page>
        <Sources />
        <AbsoluteFill style={{ background: `radial-gradient(900px 760px at 76% 46%, rgba(255,241,214,.18), rgba(60,38,18,${0.3 * leve}) 100%)` }} />
        <Curseur chemin={[[4, 1500, 1000], [22, px, py], [44, px + 40, py + 30], [55, jx, jy], [70, jx + 30, jy + 120]]} touches={[24, 57]} />
        <Cartouche a={62} style={{ left: 90, top: 880 }}>
          Every place, <span style={{ color: C.rouge }}>its video</span>
        </Cartouche>
      </Arrivee>
    </Fuite>
  );
};

// ------------------------------------------------------------------------------------------------ le dé (50 images)
// (le centre reste assez loin des bords de la capture pour ne jamais montrer au-delà : cx ∈ [960/Z, 1280 − 960/Z])
const CAM_DE: Cle[] = [{ f: 0, cx: 400, cy: 300, z: 1.6 }, { f: 3, cx: 400, cy: 300, z: 1.6 }, { f: 22, cx: 650, cy: 360, z: 1.04 }, { f: 50, cx: 700, cy: 360, z: 1.12 }];
export const LeDe: React.FC = () => {
  const f = useCurrentFrame();
  const btn = L["btn-lancer"];
  const [bx, by] = ecran(CAM_DE, 0, btn[0] + btn[2] / 2, btn[1] + btn[3] / 2);
  // le dé jaillit du bouton, roule en l'air jusqu'au milieu-droit, rebondit, puis s'efface quand la fiche se retourne
  const t = lin(f, 3, 22);
  const tt = Easing.out(Easing.quad)(t);
  const x = bx + (1210 - bx) * tt, y = by + (640 - by) * tt - Math.sin(Math.PI * t) * 380;
  const rebond = f > 22 ? Math.abs(Math.sin((f - 22) * 0.5)) * 40 * Math.exp(-(f - 22) / 4) : 0;
  const s = 150 * (1 - lin(f, 26, 31));
  const retour = de(f, 25, 39, [0, 1], Easing.out(Easing.cubic)), pose = de(f, 39, 45);
  const angle = 90 - 102 * retour + 12 * pose; // dépasse de 12° puis revient
  const reflet = Math.max(0, 1 - Math.abs(angle - 45) / 45);
  return (
    <Fuite duree={50} sortie={5}>
      <Arrivee entree={5}>
        <Page src="ui/hasard.png" cles={CAM_DE}>
          <div style={{ position: "absolute", left: btn[0], top: btn[1], width: btn[2], height: btn[3], borderRadius: 3, backgroundColor: "rgba(255,255,255,.35)", opacity: interpolate(f, [1, 3, 9], [0, 1, 0], borne) }} />
        </Page>
        {/* la fiche du lieu tiré se retourne (card-flip-reveal) : dessinée par-dessus la page, à la place de son
            emplacement à l'écran (dans la page, en 3D, elle passait derrière la capture en tournant) */}
        {f >= 25 ? (() => {
          const k = L["fiche-kinkaku"];
          const [x0, y0] = ecran(CAM_DE, f, k[0], k[1]);
          const [x1] = ecran(CAM_DE, f, k[0] + k[2], k[1]);
          const e = (x1 - x0) / k[2];
          return (
            <div style={{ position: "absolute", left: x0, top: y0, width: k[2], height: k[3], scale: `${e}`, transformOrigin: "0 0", perspective: 1400 }}>
              <div style={{ position: "absolute", inset: 0, transform: `rotateY(${angle}deg)`, transformOrigin: "50% 50%" }}>
                <Fiche src="ui/fiche-kinkaku.png" boite={[0, 0, k[2], k[3]]} clip="kinkaku" clipDe={36} />
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, transparent ${30 + 40 * (1 - retour)}%, rgba(255,250,235,${0.6 * reflet}) ${40 + 40 * (1 - retour)}%, transparent ${50 + 40 * (1 - retour)}%)` }} />
              </div>
            </div>
          );
        })() : null}
        <Sources />
        <Curseur chemin={[[0, bx + 60, by + 26], [2, bx + 40, by + 12], [20, bx + 120, by + 90]]} touches={[2]} />
        {s > 1 ? <De3D s={s} rx={f * 31} ry={f * 23 + 10} rz={f * 7} style={{ left: x - s / 2, top: y - s / 2 - rebond }} /> : null}
        <Cartouche a={2} fin={22} style={{ left: 90, top: 880 }}>Feeling lucky?</Cartouche>
        <Cartouche a={24} style={{ left: 90, top: 880 }}>
          <span style={{ color: C.rouge }}>Roll the dice.</span>
        </Cartouche>
      </Arrivee>
    </Fuite>
  );
};

// ------------------------------------------------------------------------------------------------ la route (89 images)
const CAM_ROUTE: Cle[] = [{ f: 0, cx: 770, cy: 330, z: 1.32 }, { f: 89, cx: 665, cy: 360, z: 1.05 }];
const COEURS = [1, 13, 26, 39]; // les quatre favoris, sur les temps
const TRACE = [40, 80]; // le tracé de la route
const lignes = L.route.map((l) => l.points.filter((_, i) => i % 3 === 0 || i === l.points.length - 1));
const longueurs = lignes.map((pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0));
const total = longueurs.reduce((a, z) => a + z, 0);
export const Route: React.FC = () => {
  const f = useCurrentFrame();
  const etapes = [...L.etapes].sort((a, z) => a.texte.localeCompare(z.texte));
  const p = de(f, TRACE[0], TRACE[1], [0, 1], Easing.inOut(Easing.cubic)) * total;
  const panneau = de(f, 8, 22, [0, 1], POSE);
  let reste = p;
  const traits = lignes.map((pts, i) => {
    const vu = Math.max(0, Math.min(1, reste / longueurs[i]));
    reste -= longueurs[i];
    return { pts, d: "M" + pts.map((q) => q.join(",")).join("L"), vu, long: longueurs[i] };
  });
  // la tête du trait (le pinceau) : le point atteint sur la ligne en cours
  const enCours = traits.find((t) => t.vu > 0 && t.vu < 1);
  const tete = ((): [number, number] | null => {
    if (!enCours) return null;
    let d = enCours.vu * enCours.long;
    const pts = enCours.pts;
    for (let j = 1; j < pts.length; j++) {
      const s = Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
      if (d <= s) { const r = d / s; return [pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * r, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * r]; }
      d -= s;
    }
    return null;
  })();
  return (
    <Fuite duree={89} sortie={5}>
      <Arrivee entree={5}>
        <Page src="ui/route-fond.png" cles={CAM_ROUTE} ease={(t) => t}>
          <svg width={1280} height={720} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {traits.map((t, i) => (
              <g key={i} opacity={t.vu > 0 ? 1 : 0}>
                <path d={t.d} fill="none" stroke={C.clair} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - t.vu} />
                <path d={t.d} fill="none" stroke={C.rouge} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - t.vu} />
              </g>
            ))}
            {tete ? <circle cx={tete[0]} cy={tete[1]} r={6} fill={C.rouge} stroke={C.clair} strokeWidth={2} style={{ filter: "drop-shadow(0 0 6px rgba(168,50,31,.8))" }} /> : null}
          </svg>
          {L.temps.map((t, i) => {
            const fini = TRACE[0] + ((longueurs.slice(0, i + 1).reduce((a, z) => a + z, 0) / total) * (TRACE[1] - TRACE[0]));
            const e = de(f, fini, fini + 10, [0, 1], POSE);
            return f >= fini ? <Img key={i} src={staticFile(`ui/${t.fichier}`)} style={{ position: "absolute", left: t.boite[0], top: t.boite[1], width: t.boite[2], height: t.boite[3], scale: `${e}`, opacity: lin(f, fini, fini + 3) }} /> : null;
          })}
          {etapes.map((e, i) => {
            const a = COEURS[i];
            const k = de(f, a, a + 10, [0, 1], POSE);
            const anneau = lin(f, a, a + 14);
            return f >= a ? (
              <div key={i} style={{ position: "absolute", left: e.boite[0] + e.boite[2] / 2 - 15, top: e.boite[1] - 30 }}>
                <div style={{ position: "absolute", left: 15 - 26 * anneau, top: 15 - 26 * anneau, width: 52 * anneau, height: 52 * anneau, borderRadius: "50%", border: `2px solid ${C.rouge}`, opacity: 1 - anneau }} />
                <Coeur taille={30} style={{ scale: `${k}`, translate: `0 ${-4 * k}px` }} />
              </div>
            ) : null;
          })}
          <Img src={staticFile("ui/panneau-favoris.png")} style={{ position: "absolute", left: L["panneau-favoris"][0], top: L["panneau-favoris"][1], width: L["panneau-favoris"][2], height: L["panneau-favoris"][3], translate: `${(1 - panneau) * -390}px 0`, rotate: `${(1 - panneau) * -4}deg`, boxShadow: "0 18px 40px rgba(40,26,14,.3)" }} />
        </Page>
        <Sources />
        <Cartouche a={44} style={{ right: 90, bottom: 80 }}>
          Your favorites, <span style={{ color: C.rouge }}>one route</span>
        </Cartouche>
      </Arrivee>
    </Fuite>
  );
};

// ------------------------------------------------------------------------------------------------ vivant (114 images)
const CAM_LEGENDE: Cle[] = [{ f: 0, cx: 640, cy: 330, z: 1.55 }, { f: 51, cx: 640, cy: 300, z: 1.3 }];
const Legende: React.FC = () => {
  const f = useCurrentFrame();
  const bulle = L["bulle-orochi"];
  const e = de(f, 13, 24, [0, 1], POSE);
  return (
    <Page src="ui/orochi-fond.png" cles={CAM_LEGENDE}>
      {f >= 13 ? <Img src={staticFile("ui/bulle-orochi.png")} style={{ position: "absolute", left: bulle[0], top: bulle[1], width: bulle[2], height: bulle[3], scale: `${0.3 + 0.7 * e}`, transformOrigin: "50% 100%", opacity: lin(f, 13, 16), boxShadow: "0 14px 30px rgba(40,26,14,.3)" }} /> : null}
    </Page>
  );
};

const SAISONS = [
  { rush: "p-printemps", nom: "Spring", signe: "🌸" }, { rush: "p-ete", nom: "Summer", signe: "🎆" },
  { rush: "p-automne", nom: "Autumn", signe: "🍁" }, { rush: "p-hiver", nom: "Winter", signe: "❄️" },
];
/** Les quatre saisons en même temps (quad-split) : les cases entrent en décalé, leurs étiquettes aussi. */
const Saisons: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.encre }}>
      {SAISONS.map((s, i) => {
        const a = [0, 4, 8, 12][i];
        const e = de(f, a, a + 10, [0, 1], POSE);
        const x = (i % 2) * 960, y = Math.floor(i / 2) * 540;
        return (
          <div key={s.rush} style={{ position: "absolute", left: x + 4, top: y + 4, width: 952, height: 532, overflow: "hidden", scale: `${0.6 + 0.4 * e}`, opacity: lin(f, a, a + 4), borderRadius: 4 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, scale: `${952 / 1920}`, transformOrigin: "0 0" }}>
              <Sequence from={a} layout="none"><Rush nom={s.rush} debut={0.6} cadre={() => [240, 135, 1440]} /></Sequence>
            </div>
            <div style={{ position: "absolute", [i % 2 ? "right" : "left"]: 22, [i < 2 ? "top" : "bottom"]: 18, padding: "8px 22px 10px", backgroundColor: C.clair, backgroundImage: GRAIN, borderRadius: 3, font: `400 40px/1 ${TITRE}`, color: C.encre, boxShadow: "0 6px 16px rgba(40,26,14,.35)", opacity: de(f, a + 5, a + 12), translate: `${(1 - de(f, a + 5, a + 14)) * -30}px 0` }}>
              {s.signe} {s.nom}
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 960, top: 540, translate: "-50% -50%", padding: "18px 40px 20px", backgroundColor: C.rouge, color: C.clair, font: `400 46px/1.1 ${TITRE}`, textAlign: "center", borderRadius: 4, boxShadow: `inset 0 0 0 3px ${C.rouge}, inset 0 0 0 5px ${C.clair}, 0 14px 34px rgba(0,0,0,.45)`, scale: `${de(f, 16, 26, [0, 1], POSE)}`, rotate: "-2deg" }}>
        Real seasons,<br /><span style={{ font: `italic 400 40px/1.1 ${FELL}` }}>live from Japan</span>
      </div>
    </AbsoluteFill>
  );
};

export const Vivant: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={51} name="Légendes">
      <Fuite duree={51} sortie={5}>
        <Arrivee entree={5}>
          <Legende />
          <Sources />
          <Sceau a={20} texte="伝説" taille={96} style={{ right: 300, top: 120 }} />
          <Cartouche a={4} style={{ left: 90, top: 880 }}>
            <span style={{ color: C.rouge }}>22</span> hidden legends
          </Cartouche>
        </Arrivee>
      </Fuite>
    </Sequence>
    <Sequence from={51} durationInFrames={25} name="Mer">
      <Fuite duree={25} sortie={5}>
        <Arrivee entree={5}>
          <Rush nom="p-mer" debut={0.6} />
          <Sources />
          <Cartouche a={2} style={{ left: 90, top: 880 }}>A <span style={{ color: C.sarcelle }}>living</span> sea</Cartouche>
        </Arrivee>
      </Fuite>
    </Sequence>
    <Sequence from={76} name="Saisons">
      <Saisons />
    </Sequence>
  </AbsoluteFill>
);

export { HALO, ELAN };
