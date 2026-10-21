// La version verticale 9:16 (TikTok) des scènes qui changent de mise en page : mêmes temps, mêmes gestes, mais le
// logo carré, la carte filmée en vertical (rushes-v/) et le vrai site de téléphone (captures ui-v/ : la fiche monte
// du bas de l'écran comme sur un téléphone, on la touche du doigt). Les textes restent hors de ce que TikTok couvre :
// ses onglets en haut (~170 px), la légende en bas (dès ~1450 px), ses boutons à droite.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import layoutV from "../../../../../videos/promo30/public/ui-v/layout.json";
// @ts-expect-error : un module JavaScript du site, sans types
import { DEFILE, YOKAI } from "../../../../../site/halloween-dessins.js";
import { Compteur } from "./Debut";
import { Arrivee, Cartouche, Cle, Coeur, De3D, ecran, Extrait, F9, Fuite, Lettres, Page, Rush, Sceau, Sources } from "./parts";
import { C, de, FELL, FILET, FRAPPE, GRAIN, HALO, lin, POSE, SANS, TITRE } from "./theme";

type Boite = [number, number, number, number];
const L = layoutV as unknown as Record<string, Boite> & {
  route: { points: [number, number][] }[]; etapes: { texte: string; boite: Boite }[]; temps: { fichier: string; boite: Boite }[];
};
const borne = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CAMERA = Easing.bezier(0.33, 0, 0.15, 1);
const ec = (cles: Cle[], f: number, x: number, y: number) => ecran(cles, f, x, y, CAMERA, F9);

/** Un doigt qui touche l'écran (un rond de lumière, un anneau rouge qui s'étend), de clé en clé. */
const Doigt: React.FC<{ chemin: [number, number, number][]; touches: number[] }> = ({ chemin, touches }) => {
  const f = useCurrentFrame();
  let a = chemin[0], z = chemin[chemin.length - 1];
  for (let i = 0; i < chemin.length - 1; i++) if (f >= chemin[i][0] && f <= chemin[i + 1][0]) { a = chemin[i]; z = chemin[i + 1]; break; }
  if (f > chemin[chemin.length - 1][0]) a = z;
  const t = a[0] === z[0] ? 1 : de(f, a[0], z[0], [0, 1], Easing.bezier(0.45, 0, 0.2, 1));
  const x = a[1] + (z[1] - a[1]) * t, y = a[2] + (z[2] - a[2]) * t;
  const appui = Math.max(0, ...touches.map((c) => interpolate(f, [c - 3, c, c + 5], [0, 1, 0], borne)));
  const vu = lin(f, chemin[0][0], chemin[0][0] + 5) * (1 - lin(f, chemin[chemin.length - 1][0], chemin[chemin.length - 1][0] + 6));
  return (
    <>
      {touches.map((c) => {
        const r = lin(f, c, c + 16);
        return f >= c && f < c + 16 ? <div key={c} style={{ position: "absolute", left: x - 80 * r, top: y - 80 * r, width: 160 * r, height: 160 * r, borderRadius: "50%", border: `${6 - 4 * r}px solid ${C.rouge}`, opacity: 0.9 * (1 - r) }} /> : null;
      })}
      <div style={{ position: "absolute", left: x - 42, top: y - 42, width: 84, height: 84, borderRadius: "50%", backgroundColor: "rgba(255,250,240,.55)", boxShadow: "0 0 0 3px rgba(53,37,26,.55), 0 8px 18px rgba(40,26,14,.35)", opacity: vu, scale: `${1 - 0.22 * appui}` }} />
    </>
  );
};

/** Une fiche de téléphone (découpée), qui joue un extrait dans son cadre photo. */
const FicheV: React.FC<{ src: string; clip?: string; clipDe?: number }> = ({ src, clip, clipDe = 1e9 }) => {
  const f = useCurrentFrame();
  const m = L["fiche-media"], fi = L.fiche;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {clip && f >= clipDe ? (
        <div style={{ position: "absolute", left: m[0] - fi[0], top: m[1] - fi[1], width: m[2], height: m[3], overflow: "hidden", opacity: lin(f, clipDe, clipDe + 6) }}>
          <Sequence from={clipDe} layout="none"><Extrait nom={clip} /></Sequence>
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------------------------------------ l'ouverture
const NOM = "Random Japan Place";
const SOUS = "THE 3D MAP OF JAPAN";
export const OuvertureV: React.FC = () => {
  const f = useCurrentFrame();
  // le logo carré (1600 × 1600) sur 1920 × 1920 ; le Japon de papier est vers (600, 960) à l'écran
  const k = f < 84 ? interpolate(f, [0, 84], [1.02, 1.2]) : interpolate(f, [84, 104], [1.2, 3.1], { extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const flou = lin(f, 90, 104, [0, 7]);
  const sortie = de(f, 86, 95, [0, 1], Easing.bezier(0.4, 0, 0.5, 1));
  const entree = de(f, 2, 16);
  const frappe = 30 + SOUS.length * 0.7;
  const tape = Math.floor(Math.max(0, f - 30) / 0.7);
  const curseur = f >= 30 && (f < frappe || Math.floor((f - frappe) / 4) % 2 === 0) && f < 84;
  const lueur = interpolate(f, [94, 103, 112], [0, 0.85, 0], borne);
  return (
    <AbsoluteFill style={{ backgroundColor: C.nuit, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -420, top: 0, width: 1920, height: 1920, scale: `${k}`, transformOrigin: "1020px 960px", filter: flou ? `blur(${flou}px)` : undefined }}>
        <Img src={staticFile("img/logo-carre.jpg")} style={{ width: 1920, height: 1920 }} />
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 52% 46%, transparent 45%, rgba(20,12,6,.55))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center", opacity: entree * (1 - sortie), translate: `0 ${(1 - entree) * 30 - sortie * 40}px`, scale: `${1 - sortie * 0.12}` }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 22, padding: "22px 38px 22px 22px", backgroundColor: C.clair, backgroundImage: GRAIN, boxShadow: FILET, borderRadius: 4 }}>
          <Img src={staticFile("img/logo-carre.jpg")} style={{ width: 104, height: 104, borderRadius: "50%", objectFit: "cover", boxShadow: `0 0 0 4px ${C.clair}, 0 0 0 6px ${C.trait}` }} />
          <div>
            <Lettres texte={NOM} a={8} pas={2.2} style={{ font: `400 70px/1 ${TITRE}`, color: C.encre }} />
            <div style={{ marginTop: 12, height: 26, display: "flex", alignItems: "center", font: `700 21px/1 ${SANS}`, letterSpacing: "0.26em", color: C.encre2 }}>
              <span style={{ whiteSpace: "pre" }}>{SOUS.slice(0, tape)}</span>
              <span style={{ display: "inline-block", width: 11, height: 21, marginLeft: 4, backgroundColor: C.rouge, opacity: curseur ? 0.9 : 0 }} />
            </div>
          </div>
          <Sceau a={58} texte="旅" taille={88} style={{ right: -26, top: -46 }} />
        </div>
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 45% at 60% 30%, rgba(255,236,200,1), rgba(255,214,150,.4) 50%, transparent 75%)", opacity: lueur }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ la plongée
export const PlongeeV: React.FC<{ lieux: number }> = ({ lieux }) => {
  const f = useCurrentFrame();
  const bloc = (a: number, z: number) => ({ e: de(f, a, a + 10), s: lin(f, z, z + 6) });
  const B = bloc(3, 44), A = bloc(51, 94), Cc = bloc(101, 1e9);
  const marqueur = de(f, 114, 128);
  return (
    <AbsoluteFill style={{ opacity: lin(f, 0, 6) }}>
      <Rush nom="p-plongee" debut={0.25} vitesse={1.2} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(246,238,219,.62), rgba(246,238,219,.3) 30%, transparent 48%)" }} />
      <Sources />
      {f < 52 ? (
        <div style={{ position: "absolute", left: 70, top: 230, opacity: B.e * (1 - B.s), translate: `${-B.s * 120}px 0`, filter: B.s ? `blur(${B.s * 14}px)` : undefined }}>
          <Compteur valeur={String(lieux)} a={4} taille={230} couleur={C.rouge} />
          <div style={{ marginTop: 4, font: `400 64px/1 ${TITRE}`, color: C.encre, textShadow: HALO }}>places to explore</div>
        </div>
      ) : null}
      {f >= 50 && f < 101 ? (
        <div style={{ position: "absolute", left: 70, top: 280, opacity: A.e * (1 - A.s), translate: `${-A.s * 120}px 0`, filter: A.s ? `blur(${A.s * 14}px)` : undefined }}>
          <Lettres texte="Every place" a={51} pas={1.6} style={{ font: `400 120px/1 ${TITRE}`, color: C.encre, textShadow: HALO }} />
          <div style={{ marginTop: 18, font: `italic 400 66px/1 ${FELL}`, color: C.rouge, textShadow: HALO, opacity: de(f, 62, 72), translate: `${(1 - de(f, 62, 74)) * -40}px 0` }}>from our TikTok</div>
        </div>
      ) : null}
      {f >= 100 ? (
        <div style={{ position: "absolute", left: 70, top: 260, opacity: Cc.e }}>
          <div><Lettres texte="One living" a={101} pas={1.6} style={{ font: `400 120px/1.05 ${TITRE}`, color: C.encre, textShadow: HALO }} /></div>
          <div style={{ position: "relative", display: "inline-block", marginTop: 6 }}>
            <div style={{ position: "absolute", left: -10, right: -10, bottom: 10, height: 42, backgroundColor: "rgba(168,50,31,.88)", transformOrigin: "left center", scale: `${marqueur} 1`, borderRadius: 4, rotate: "-1deg" }} />
            <Lettres texte="3D map." a={109} pas={1.6} style={{ position: "relative", font: `400 120px/1.05 ${TITRE}`, color: C.encre, textShadow: HALO }} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ la fiche
const CAM_FICHE: Cle[] = [
  { f: 0, cx: 270, cy: 290, z: 1.85 }, { f: 22, cx: 270, cy: 285, z: 1.95 },
  { f: 44, cx: 270, cy: 480, z: 1.0 }, { f: 56, cx: 270, cy: 480, z: 1.0 }, { f: 96, cx: 270, cy: 540, z: 1.22 },
];
export const FicheLieuV: React.FC = () => {
  const f = useCurrentFrame();
  const pin = L["pin-himeji-fiche"], m = L["fiche-media"], fi = L.fiche;
  const [px, py] = ec(CAM_FICHE, 24, pin[0] + pin[2] / 2, pin[1] + pin[3] / 2);
  const [jx, jy] = ec(CAM_FICHE, 56, m[0] + m[2] / 2, m[1] + m[3] / 2);
  const vol = de(f, 26, 43, [0, 1], POSE);
  const impulsion = interpolate(f, [24, 28, 34], [0, 1, 0], borne);
  return (
    <Fuite duree={101} sortie={6}>
      <Arrivee entree={6}>
        <Page src="ui-v/himeji-fond.png" cles={CAM_FICHE}>
          <div style={{ position: "absolute", left: pin[0] - 12, top: pin[1] - 12, width: pin[2] + 24, height: pin[3] + 24, borderRadius: "50%", border: `3px solid ${C.rouge}`, opacity: impulsion, scale: `${1 + impulsion * 0.4}` }} />
          {f >= 26 ? (
            <div style={{ position: "absolute", left: fi[0], top: fi[1], width: fi[2], height: fi[3], translate: `0 ${(1 - vol) * 640}px`, boxShadow: "0 -12px 30px rgba(40,26,14,.3)" }}>
              <FicheV src="ui-v/fiche-himeji.png" clip="himeji-sakura" clipDe={58} />
            </div>
          ) : null}
        </Page>
        <Doigt chemin={[[4, 800, 1300], [22, px, py], [40, px + 60, py + 200], [55, jx, jy], [68, jx + 80, jy + 160]]} touches={[24, 57]} />
        <Cartouche a={62} taille={52} style={{ left: 0, right: 0, top: 230, margin: "0 auto", width: "fit-content" }}>
          Every place, <span style={{ color: C.rouge }}>its video</span>
        </Cartouche>
      </Arrivee>
    </Fuite>
  );
};

// ------------------------------------------------------------------------------------------------ le dé
const CAM_DE: Cle[] = [{ f: 0, cx: 230, cy: 330, z: 1.5 }, { f: 3, cx: 230, cy: 330, z: 1.5 }, { f: 22, cx: 270, cy: 480, z: 1.0 }, { f: 50, cx: 270, cy: 500, z: 1.06 }];
export const LeDeV: React.FC = () => {
  const f = useCurrentFrame();
  const btn = L["btn-lancer"];
  const [bx, by] = ec(CAM_DE, 0, btn[0] + btn[2] / 2, btn[1] + btn[3] / 2);
  const t = lin(f, 3, 22), tt = Easing.out(Easing.quad)(t);
  const x = bx + (740 - bx) * tt, y = by + (1180 - by) * tt - Math.sin(Math.PI * t) * 420;
  const rebond = f > 22 ? Math.abs(Math.sin((f - 22) * 0.5)) * 40 * Math.exp(-(f - 22) / 4) : 0;
  const s = 160 * (1 - lin(f, 26, 31));
  const retour = de(f, 25, 39, [0, 1], Easing.out(Easing.cubic)), pose = de(f, 39, 45);
  const angle = 90 - 102 * retour + 12 * pose;
  const reflet = Math.max(0, 1 - Math.abs(angle - 45) / 45);
  const fi = L["fiche-kinkaku"];
  return (
    <Fuite duree={50} sortie={5}>
      <Arrivee entree={5}>
        <Page src="ui-v/hasard.png" cles={CAM_DE}>
          <div style={{ position: "absolute", left: btn[0], top: btn[1], width: btn[2], height: btn[3], borderRadius: 3, backgroundColor: "rgba(255,255,255,.35)", opacity: interpolate(f, [1, 3, 9], [0, 1, 0], borne) }} />
        </Page>
        {f >= 25 ? (() => {
          const [x0, y0] = ec(CAM_DE, f, fi[0], fi[1]);
          const [x1] = ec(CAM_DE, f, fi[0] + fi[2], fi[1]);
          return (
            <div style={{ position: "absolute", left: x0, top: y0, width: fi[2], height: fi[3], scale: `${(x1 - x0) / fi[2]}`, transformOrigin: "0 0", perspective: 1400 }}>
              <div style={{ position: "absolute", inset: 0, transform: `rotateY(${angle}deg)` }}>
                <FicheV src="ui-v/fiche-kinkaku.png" clip="kinkaku" clipDe={36} />
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, transparent ${30 + 40 * (1 - retour)}%, rgba(255,250,235,${0.6 * reflet}) ${40 + 40 * (1 - retour)}%, transparent ${50 + 40 * (1 - retour)}%)` }} />
              </div>
            </div>
          );
        })() : null}
        <Doigt chemin={[[0, bx + 40, by + 20], [2, bx, by], [16, bx + 60, by + 120]]} touches={[2]} />
        {s > 1 ? <De3D s={s} rx={f * 31} ry={f * 23 + 10} rz={f * 7} style={{ left: x - s / 2, top: y - s / 2 - rebond }} /> : null}
        <Cartouche a={2} fin={22} taille={56} style={{ left: 0, right: 0, top: 230, margin: "0 auto", width: "fit-content" }}>Feeling lucky?</Cartouche>
        <Cartouche a={24} taille={56} style={{ left: 0, right: 0, top: 230, margin: "0 auto", width: "fit-content" }}><span style={{ color: C.rouge }}>Roll the dice.</span></Cartouche>
      </Arrivee>
    </Fuite>
  );
};

// ------------------------------------------------------------------------------------------------ la route
const CAM_ROUTE: Cle[] = [{ f: 0, cx: 270, cy: 520, z: 1.18 }, { f: 89, cx: 270, cy: 480, z: 1.0 }];
const COEURS = [1, 13, 26, 39];
const TRACE = [42, 80];
const lignes = L.route.map((l) => l.points.filter((_, i) => i % 3 === 0 || i === l.points.length - 1));
const longueurs = lignes.map((pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0));
const total = longueurs.reduce((a, z) => a + z, 0);
export const RouteV: React.FC = () => {
  const f = useCurrentFrame();
  const etapes = [...L.etapes].sort((a, z) => a.texte.localeCompare(z.texte));
  const p = de(f, TRACE[0], TRACE[1], [0, 1], Easing.inOut(Easing.cubic)) * total;
  // le panneau des favoris entre, puis se range quand la route se trace (comme sur un téléphone)
  const panneau = de(f, 6, 20, [0, 1], POSE) * (1 - de(f, 33, 41, [0, 1], Easing.in(Easing.cubic)));
  let reste = p;
  const traits = lignes.map((pts, i) => {
    const vu = Math.max(0, Math.min(1, reste / longueurs[i]));
    reste -= longueurs[i];
    return { pts, d: "M" + pts.map((q) => q.join(",")).join("L"), vu, long: longueurs[i] };
  });
  const enCours = traits.find((t) => t.vu > 0 && t.vu < 1);
  const tete = ((): [number, number] | null => {
    if (!enCours) return null;
    let d = enCours.vu * enCours.long;
    for (let j = 1; j < enCours.pts.length; j++) {
      const a = enCours.pts[j - 1], z = enCours.pts[j], s = Math.hypot(z[0] - a[0], z[1] - a[1]);
      if (d <= s) return [a[0] + ((z[0] - a[0]) * d) / s, a[1] + ((z[1] - a[1]) * d) / s];
      d -= s;
    }
    return null;
  })();
  const pf = L["panneau-favoris"], ri = L["resume-itineraire"];
  return (
    <Fuite duree={89} sortie={5}>
      <Arrivee entree={5}>
        <Page src="ui-v/route-fond.png" cles={CAM_ROUTE} ease={(t) => t}>
          <svg width={540} height={960} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {traits.map((t, i) => (
              <g key={i} opacity={t.vu > 0 ? 1 : 0}>
                <path d={t.d} fill="none" stroke={C.clair} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - t.vu} />
                <path d={t.d} fill="none" stroke={C.rouge} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - t.vu} />
              </g>
            ))}
            {tete ? <circle cx={tete[0]} cy={tete[1]} r={6} fill={C.rouge} stroke={C.clair} strokeWidth={2} /> : null}
          </svg>
          {L.temps.map((t, i) => {
            const fini = TRACE[0] + (longueurs.slice(0, i + 1).reduce((a, z) => a + z, 0) / total) * (TRACE[1] - TRACE[0]);
            return f >= fini ? <Img key={i} src={staticFile(`ui-v/${t.fichier}`)} style={{ position: "absolute", left: t.boite[0], top: t.boite[1], width: t.boite[2], height: t.boite[3], scale: `${de(f, fini, fini + 10, [0, 1], POSE)}`, opacity: lin(f, fini, fini + 3) }} /> : null;
          })}
          {etapes.map((e, i) => {
            const a = COEURS[i], k = de(f, a, a + 10, [0, 1], POSE), anneau = lin(f, a, a + 14);
            return f >= a ? (
              <div key={i} style={{ position: "absolute", left: e.boite[0] + e.boite[2] / 2 - 15, top: e.boite[1] - 30 }}>
                <div style={{ position: "absolute", left: 15 - 26 * anneau, top: 15 - 26 * anneau, width: 52 * anneau, height: 52 * anneau, borderRadius: "50%", border: `2px solid ${C.rouge}`, opacity: 1 - anneau }} />
                <Coeur taille={30} style={{ scale: `${k}`, translate: `0 ${-4 * k}px` }} />
              </div>
            ) : null;
          })}
          {f >= 80 ? <Img src={staticFile("ui-v/resume-itineraire.png")} style={{ position: "absolute", left: ri[0], top: ri[1], width: ri[2], height: ri[3], scale: `${de(f, 80, 89, [0, 1], POSE)}`, transformOrigin: "0 50%" }} /> : null}
          {panneau > 0.001 ? <Img src={staticFile("ui-v/panneau-favoris.png")} style={{ position: "absolute", left: pf[0], top: pf[1], width: pf[2], height: pf[3], translate: `${(1 - panneau) * -380}px 0`, boxShadow: "0 18px 40px rgba(40,26,14,.3)" }} /> : null}
        </Page>
        <Sources />
        <Cartouche a={44} taille={52} style={{ left: 0, right: 0, top: 1300, margin: "0 auto", width: "fit-content" }}>
          Your favorites, <span style={{ color: C.rouge }}>one route</span>
        </Cartouche>
      </Arrivee>
    </Fuite>
  );
};

// ------------------------------------------------------------------------------------------------ vivant
const CAM_LEGENDE: Cle[] = [{ f: 0, cx: 290, cy: 420, z: 1.4 }, { f: 51, cx: 290, cy: 430, z: 1.25 }];
const SAISONS = [
  { rush: "p-printemps", nom: "Spring", signe: "🌸" }, { rush: "p-ete", nom: "Summer", signe: "🎆" },
  { rush: "p-automne", nom: "Autumn", signe: "🍁" }, { rush: "p-hiver", nom: "Winter", signe: "❄️" },
];
export const VivantV: React.FC = () => {
  const f = useCurrentFrame();
  const bulle = L["bulle-orochi"];
  const e = de(f, 13, 24, [0, 1], POSE);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={51} name="Légendes">
        <Fuite duree={51} sortie={5}><Arrivee entree={5}>
          <Page src="ui-v/orochi-fond.png" cles={CAM_LEGENDE}>
            {f >= 13 ? <Img src={staticFile("ui-v/bulle-orochi.png")} style={{ position: "absolute", left: bulle[0], top: bulle[1], width: bulle[2], height: bulle[3], scale: `${0.3 + 0.7 * e}`, transformOrigin: "50% 100%", opacity: lin(f, 13, 16), boxShadow: "0 14px 30px rgba(40,26,14,.3)" }} /> : null}
          </Page>
          <Sources />
          <Sceau a={20} texte="伝説" taille={96} style={{ right: 60, top: 1180 }} />
          <Cartouche a={4} taille={52} style={{ left: 0, right: 0, top: 230, margin: "0 auto", width: "fit-content" }}>
            <span style={{ color: C.rouge }}>22</span> hidden legends
          </Cartouche>
        </Arrivee></Fuite>
      </Sequence>
      <Sequence from={51} durationInFrames={25} name="Mer">
        <Fuite duree={25} sortie={5}><Arrivee entree={5}>
          <Rush nom="p-mer" debut={0.6} />
          <Sources />
          <Cartouche a={2} taille={52} style={{ left: 0, right: 0, top: 230, margin: "0 auto", width: "fit-content" }}>A <span style={{ color: C.sarcelle }}>living</span> sea</Cartouche>
        </Arrivee></Fuite>
      </Sequence>
      <Sequence from={76} name="Saisons">
        <SaisonsV />
      </Sequence>
    </AbsoluteFill>
  );
};
const SaisonsV: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.encre }}>
      {SAISONS.map((s, i) => {
        const a = [0, 4, 8, 12][i];
        const e = de(f, a, a + 10, [0, 1], POSE);
        return (
          <div key={s.rush} style={{ position: "absolute", left: (i % 2) * 540 + 4, top: Math.floor(i / 2) * 960 + 4, width: 532, height: 952, overflow: "hidden", scale: `${0.6 + 0.4 * e}`, opacity: lin(f, a, a + 4), borderRadius: 4 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, scale: `${532 / 1080}`, transformOrigin: "0 0" }}>
              <Sequence from={a} layout="none"><Rush nom={s.rush} debut={0.6} cadre={() => [140, 250, 800]} /></Sequence>
            </div>
            <div style={{ position: "absolute", [i % 2 ? "right" : "left"]: 18, [i < 2 ? "top" : "bottom"]: i < 2 ? 190 : 40, padding: "8px 20px 10px", backgroundColor: C.clair, backgroundImage: GRAIN, borderRadius: 3, font: `400 40px/1 ${TITRE}`, color: C.encre, boxShadow: "0 6px 16px rgba(40,26,14,.35)", opacity: de(f, a + 5, a + 12) }}>
              {s.signe} {s.nom}
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 540, top: 960, translate: "-50% -50%", padding: "18px 36px 20px", backgroundColor: C.rouge, color: C.clair, font: `400 46px/1.1 ${TITRE}`, textAlign: "center", borderRadius: 4, boxShadow: `inset 0 0 0 3px ${C.rouge}, inset 0 0 0 5px ${C.clair}, 0 14px 34px rgba(0,0,0,.45)`, scale: `${de(f, 16, 26, [0, 1], POSE)}`, rotate: "-2deg", whiteSpace: "nowrap" }}>
        Real seasons,<br /><span style={{ font: `italic 400 40px/1.1 ${FELL}` }}>live from Japan</span>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ la fin
type El = { cle: string; x: number; y: number; w: number; rot: number; dx: number; dy: number; cue: number; rendu: (w: number) => React.ReactNode };
const img = (src: string, ratio: number) => (w: number) => <Img src={staticFile(src)} style={{ width: w, height: w * ratio, display: "block", boxShadow: "0 14px 30px rgba(40,26,14,.35)" }} />;
const svg = (html: string, ratio: number) => (w: number) => <div className="lg" style={{ width: w, height: w * ratio }} dangerouslySetInnerHTML={{ __html: html }} />;
const ELS: El[] = [
  { cle: "himeji", x: 215, y: 330, w: 190, rot: -6, dx: -420, dy: -80, cue: 2, rendu: img("ui/fiche-himeji.png", 644 / 400) },
  { cle: "kinkaku", x: 865, y: 330, w: 190, rot: 5, dx: 420, dy: -80, cue: 4, rendu: img("ui/fiche-kinkaku.png", 644 / 400) },
  { cle: "orochi", x: 260, y: 1350, w: 280, rot: 3, dx: -420, dy: 300, cue: 6, rendu: img("ui/bulle-orochi.png", 259.2 / 300) },
  { cle: "favoris", x: 840, y: 1370, w: 150, rot: -4, dx: 420, dy: 300, cue: 8, rendu: img("ui/panneau-favoris.png", 568 / 340) },
  { cle: "de", x: 540, y: 250, w: 92, rot: 0, dx: 0, dy: -320, cue: 10, rendu: (w) => <div style={{ position: "relative", width: w, height: w }}><De3D s={w} rx={-24} ry={36} /></div> },
  { cle: "temps", x: 545, y: 1290, w: 150, rot: -3, dx: 0, dy: 320, cue: 12, rendu: img("ui/temps-2.png", 26 / 66) },
  { cle: "coeur", x: 440, y: 1460, w: 70, rot: -8, dx: -60, dy: 320, cue: 14, rendu: (w) => <Coeur taille={w} /> },
  { cle: "enma", x: 650, y: 1450, w: 120, rot: 4, dx: 80, dy: 320, cue: 16, rendu: svg(YOKAI.enma, 60 / 64) },
  { cle: "lanterne", x: 110, y: 1190, w: 110, rot: 6, dx: -360, dy: 0, cue: 18, rendu: svg(DEFILE.chochin, 1) },
  { cle: "erable", x: 975, y: 1190, w: 84, rot: -12, dx: 360, dy: 0, cue: 20, rendu: (w) => <div style={{ font: `${w}px/1 ${SANS}` }}>🍁</div> },
];
export const FinV: React.FC<{ credit?: string }> = ({ credit }) => {
  const f = useCurrentFrame();
  const SCEAU = 20;
  const grue = de(f, 0, 40, [0, 1], Easing.bezier(0.3, 0, 0.2, 1));
  const pousse = lin(f, 40, 89);
  const recul = lin(f, SCEAU, SCEAU + 8);
  const chute = de(f, SCEAU - 5, SCEAU, [0, 1], FRAPPE);
  const kLogo = f < SCEAU ? 2.4 - 1.4 * chute : 1 - 0.05 * Math.exp(-(f - SCEAU) / 3) * Math.sin((f - SCEAU) * 1.4);
  const secousse = f >= SCEAU && f < SCEAU + 6 ? 14 * Math.exp(-(f - SCEAU) / 1.8) : 0;
  const ruban = de(f, 36, 48, [0, 1], POSE);
  const scene = interpolate(f, [SCEAU - 2, SCEAU + 2, SCEAU + 10], [0, 0.45, 0.2], borne);
  return (
    <AbsoluteFill style={{ backgroundColor: C.nuit, overflow: "hidden" }}>
      <AbsoluteFill style={{ translate: `${secousse * Math.sin((f - SCEAU) * 3.3)}px ${secousse * 0.7 * Math.sin((f - SCEAU) * 4.1 + 0.9)}px` }}>
        <AbsoluteFill style={{ transform: `perspective(1400px) rotateX(${4 * (1 - grue)}deg) scale(${1.06 - 0.06 * grue + 0.03 * pousse})`, transformOrigin: "50% 45%" }}>
          <Img src={staticFile("img/logo-carre.jpg")} style={{ position: "absolute", left: -420, width: 1920, height: 1920, filter: `blur(${lin(f, 0, 20, [4, 14])}px) brightness(.9)` }} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 52% at 50% 44%, rgba(246,238,219,.9), rgba(239,228,200,.72) 55%, rgba(60,38,18,.55))" }} />
          <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.5, mixBlendMode: "multiply" }} />
          {ELS.map((e) => {
            const t = de(f, e.cue, e.cue + 12, [0, 1], POSE);
            return (
              <div key={e.cle} style={{ position: "absolute", left: e.x - e.w / 2 + e.dx * (1 - t), top: e.y + e.dy * (1 - t), translate: "0 -50%", rotate: `${e.rot * (2 - t)}deg`, scale: `${1.12 - 0.12 * t}`, opacity: lin(f, e.cue, e.cue + 3) * (1 - 0.14 * recul) }}>
                {e.rendu(e.w)}
              </div>
            );
          })}
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 48% 26% at 50% 44%, rgba(255,232,190,1), transparent 70%)", opacity: scene }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 540, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Img src={staticFile("img/logo-carre.jpg")} style={{ width: 170, height: 170, borderRadius: "50%", objectFit: "cover", boxShadow: `0 0 0 5px ${C.clair}, 0 0 0 8px ${C.rouge}, 0 18px 40px rgba(40,26,14,.45)`, scale: `${kLogo}`, opacity: lin(f, SCEAU - 5, SCEAU - 3) }} />
            <div style={{ marginTop: 24 }}>
              <Lettres texte="Random Japan Place" a={SCEAU + 1} pas={1.0} style={{ font: `400 82px/1 ${TITRE}`, color: C.encre }} />
            </div>
            <div style={{ marginTop: 18, width: 560, height: 3, backgroundColor: C.trait, scale: `${de(f, 34, 46)} 1` }} />
            <div style={{ marginTop: 24, opacity: interpolate(ruban, [0, 0.2], [0, 1], borne), scale: `${interpolate(ruban, [0, 1], [0.3, 1])} 1` }}>
              <div style={{ padding: "20px 56px 22px", backgroundColor: C.rouge, color: C.clair, font: `700 50px/1 ${SANS}`, clipPath: "polygon(0 0, 100% 0, calc(100% - 24px) 50%, 100% 100%, 0 100%, 24px 50%)" }}>
                map.randomjapanplace.com
              </div>
            </div>
            <div style={{ marginTop: 24, padding: "12px 28px 14px", backgroundColor: C.clair, backgroundImage: GRAIN, boxShadow: FILET, font: `400 40px/1 ${TITRE}`, color: C.encre, opacity: de(f, 43, 51), translate: `0 ${(1 - de(f, 43, 53)) * 24}px` }}>
              Free · in 3D · EN · FR · 日本語
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {credit ? <div style={{ position: "absolute", left: 0, right: 0, top: 1190, textAlign: "center", font: `400 24px ${SANS}`, color: "rgba(53,37,26,.75)", opacity: lin(f, 50, 58) }}>{credit}</div> : null}
    </AbsoluteFill>
  );
};
