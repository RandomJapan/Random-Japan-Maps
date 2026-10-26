// Les pièces communes des trois vidéos de la balade 3D : le plan filmé (une prise de la balade ou un vrai lieu), sur un
// plan 3D qui flotte doucement ; les enchaînements (coupe et coup de zoom, panoramique éclair, volet du vrai lieu vers
// le jeu, portail, éclair blanc) ; la boîte de texte, celle de la balade (le « cadre » des dialogues) ; l'étiquette d'un
// lieu (le titre de la balade, avec son numéro) ; le doigt qui appuie ; la fin.
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import index from "../../../../../videos/balade/public/rushes/index.json";
import { C, entre, expoEntree, expoS, expoSortie, FPS, houle, JAPONAIS, POLICE, rebond, s, TITRE, W } from "./theme";

// ---------------------------------------------------------------- les plans
/** Un plan : de quoi il est fait et quand. de, a : images de la vidéo ; prise : le nom d'une prise de la balade
 *  (rushes.py) ou « reel/<lieu> » (la vidéo du propriétaire) ; t : la seconde de la prise (comptée depuis le début de
 *  la prise, pas du fichier) au début du plan ; vitesse ; zoom [début, fin] et centre [x, y] (0 à 1) : un lent travelling
 *  dans l'image ; entree : comment il arrive. */
export type Plan = {
  de: number; a: number; prise: string; t?: number; vitesse?: number;
  zoom?: [number, number]; centre?: [number, number]; entree?: "coupe" | "fouet" | "punch" | "portail" | "eclair";
  // le vrai lieu, sous lequel le jeu se découvre : un volet (la vidéo du propriétaire, puis la prise, à l'image volet)
  reel?: { lieu: string; t?: number; volet: number };
  // le portail : d'où il s'ouvre (px de la vidéo)
  depuis?: [number, number];
  luminosite?: number;
};
const INDEX = index as Record<string, number>;

/** Le fichier d'une prise et le décalage (s) de son début : une prise filmée en plusieurs passages (rushes.py,
 *  « garder ») a un fichier par passage, <prise>-1.mp4…, et leurs débuts dans index.json. */
export function fichierPrise(prise: string, t: number): [string, number] {
  if (prise.startsWith("reel/")) return [`reels/${prise.slice(5)}.mp4`, 0];
  if (prise.startsWith("carte/")) return [`rushes/${prise.slice(6)}.mp4`, 0];
  if (prise in INDEX) return [`rushes/${prise}.mp4`, INDEX[prise]];
  const passages = Object.keys(INDEX).filter((k) => k.startsWith(prise + "-") && /-\d+$/.test(k)).sort((p, q) => INDEX[p] - INDEX[q]);
  let choix = passages[0];
  for (const k of passages) if (INDEX[k] <= t + 1e-3) choix = k;
  if (!choix) return [`rushes/${prise}.mp4`, 0];
  return [`rushes/${choix}.mp4`, INDEX[choix]];
}

/** Une vidéo (prise ou vrai lieu) plein cadre, depuis la seconde t, avec un lent travelling (zoom, centre). */
export const Video: React.FC<{ prise: string; t?: number; vitesse?: number; zoom?: [number, number]; centre?: [number, number]; duree: number; filtre?: string }> =
  ({ prise, t = 0, vitesse = 1, zoom = [1, 1], centre = [0.5, 0.5], duree, filtre }) => {
    const f = useCurrentFrame();
    const [fichier, decalage] = fichierPrise(prise, t);
    const u = expoS(entre(f, 0, duree)) * 0.35 + entre(f, 0, duree) * 0.65;
    const z = zoom[0] + (zoom[1] - zoom[0]) * u;
    const m = 0.5 / z, cx = Math.min(1 - m, Math.max(m, centre[0])), cy = Math.min(1 - m, Math.max(m, centre[1]));
    return (
      <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
        <OffthreadVideo
          src={staticFile(fichier)} muted trimBefore={Math.max(0, Math.round((t - decalage) * FPS))} playbackRate={vitesse}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", transformOrigin: "50% 50%", filter: filtre,
            transform: `scale(${z.toFixed(5)}) translate(${((0.5 - cx) * 100).toFixed(3)}%, ${((0.5 - cy) * 100).toFixed(3)}%)`,
          }}
        />
      </AbsoluteFill>
    );
  };

/** Le flottement du plan 3D (comme la carte de la vidéo « tunnel ») : il tangue un peu, toujours, sans à-coup. */
export const flotte = (f: number, force = 1) =>
  `rotateX(${(1.6 * houle(f, 5.2) * force).toFixed(3)}deg) rotateY(${(1.4 * houle(f, 6.4, 1) * force).toFixed(3)}deg) rotateZ(${(0.35 * houle(f, 7.9, 2) * force).toFixed(3)}deg)`;

const FOUET = s(0.26); // la durée d'un panoramique éclair (la moitié avant la coupe, la moitié après)

/** Tous les plans, enchaînés. Chacun est monté un peu avant son début et gardé un peu après sa fin (les enchaînements). */
export const Plans: React.FC<{ plans: Plan[] }> = ({ plans }) => (
  <AbsoluteFill style={{ backgroundColor: "#000", perspective: 2400 }}>
    {plans.map((p, i) => {
      const suivant = plans[i + 1];
      const avant = p.entree === "fouet" ? FOUET : p.entree === "portail" ? 2 : 0;
      const apres = suivant?.entree === "fouet" ? FOUET : suivant?.entree === "portail" ? s(0.7) : 0;
      const debut = p.de - avant, duree = p.a - p.de + avant + apres;
      return (
        <Sequence key={i} from={debut} durationInFrames={duree} layout="none">
          <UnPlan p={p} avant={avant} sortie={suivant?.entree === "fouet" ? p.a - debut : null} z={i} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

const UnPlan: React.FC<{ p: Plan; avant: number; sortie: number | null; z: number }> = ({ p, avant, sortie, z }) => {
  const f = useCurrentFrame(); // depuis le début de la séquence (avant le début du plan si fouet)
  const g = f - avant; // depuis le début du plan
  const duree = p.a - p.de;
  let x = 0, ry = 0, sc = 1, clip: string | undefined;
  if (p.entree === "fouet") {
    const u = expoSortie(entre(g, -FOUET, FOUET * 0.9));
    x = 1250 * (1 - u); ry = -24 * (1 - u);
  }
  if (sortie !== null) {
    const u = expoEntree(entre(f, sortie - FOUET, sortie + FOUET * 0.4));
    x -= 1250 * u; ry += 24 * u;
  }
  if (p.entree === "punch" || p.entree === "eclair") sc = 1 + 0.085 * (1 - rebond(g, 0, 300, 20));
  if (p.entree === "portail" && p.depuis) {
    const u = expoSortie(entre(g, 0, s(0.5)));
    const [px, py] = p.depuis, r = 60 * (1 - u) + 4;
    clip = u >= 1 ? undefined : `inset(${(py * (1 - u)).toFixed(1)}px ${((W - px) * (1 - u)).toFixed(1)}px ${((1920 - py) * (1 - u)).toFixed(1)}px ${(px * (1 - u)).toFixed(1)}px round ${r.toFixed(1)}px)`;
    sc = 1.25 - 0.25 * u;
  }
  const lum = p.luminosite ?? 1;
  const video = (
    <Video prise={p.prise} t={(p.t ?? 0) - (avant / FPS) * (p.vitesse ?? 1)} vitesse={p.vitesse} zoom={p.zoom} centre={p.centre} duree={duree + avant}
      filtre={lum !== 1 ? `brightness(${lum})` : undefined} />
  );
  return (
    <AbsoluteFill style={{ zIndex: z, clipPath: clip }}>
      <AbsoluteFill style={{ transform: `translateX(${x.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${(1.06 * sc).toFixed(5)}) ${flotte(f)}` }}>
        {video}
        {p.reel && <Volet reel={p.reel} debut={avant} />}
      </AbsoluteFill>
      {p.entree === "eclair" && <AbsoluteFill style={{ background: "#fff", opacity: 1 - entre(g, 0, 9) }} />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- le volet : du vrai lieu au jeu
/** Le vrai lieu (la vidéo du propriétaire) par-dessus le jeu ; à l'image volet, une ligne de lumière en biais le balaie
 *  de droite à gauche et découvre le jeu dessous. Une étiquette de chaque côté : « REAL » et « IN MY GAME ». */
const Volet: React.FC<{ reel: { lieu: string; t?: number; volet: number }; debut: number }> = ({ reel, debut }) => {
  const f = useCurrentFrame();
  const v = reel.volet + debut, D = s(0.42);
  const u = expoS(entre(f, v, v + D));
  if (u >= 1 && f > v + D + s(1.2)) return null;
  // la ligne : de x = 1240 (juste hors champ, à droite) à x = −160, en biais (son pied 300 px plus à gauche que son sommet)
  const x = 1240 - 1400 * u, biais = 300;
  const poly = `polygon(0 0, ${x + biais / 2}px 0, ${x - biais / 2}px 100%, 0 100%)`;
  const reelVisible = u < 1;
  const etiq = (texte: string, gauche: boolean, o: number) => (
    <div style={{
      position: "absolute", top: 1060, [gauche ? "right" : "left"]: gauche ? W - x + 60 : Math.max(40, x + 40), opacity: o,
      fontFamily: POLICE, fontWeight: 800, fontSize: 40, letterSpacing: 3, color: gauche ? C.encre : "#fff",
      background: gauche ? "rgba(255,250,240,.92)" : C.rouge, border: `5px solid ${C.encre}`, borderRadius: 999, padding: "8px 26px",
      boxShadow: "0 8px 24px rgba(0,0,0,.35)", whiteSpace: "nowrap",
    }}>{texte}</div>
  );
  const oReel = f < v ? Math.min(1, Math.max(0, (f - (v - s(0.5))) / 10)) : 1 - entre(f, v + D * 0.5, v + D);
  const oJeu = f < v + D * 0.3 ? 0 : Math.min(1, (f - v - D * 0.3) / 8) * (1 - entre(f, v + D + s(0.8), v + D + s(1.1)));
  return (
    <AbsoluteFill>
      {reelVisible && (
        <AbsoluteFill style={{ clipPath: poly }}>
          <Video prise={`reel/${reel.lieu}`} t={Math.max(0, (reel.t ?? 0) - debut / FPS)} duree={v + D} zoom={[1.0, 1.06]} />
        </AbsoluteFill>
      )}
      {u > 0 && u < 1 && (
        <div style={{
          position: "absolute", top: -100, bottom: -100, left: x - 7, width: 14, background: "#fff",
          transform: `skewX(${(-Math.atan2(biais, 1920) * 180 / Math.PI).toFixed(2)}deg)`, transformOrigin: "50% 50%",
          boxShadow: "0 0 30px 12px rgba(255,255,255,.75), 0 0 90px 30px rgba(255,236,190,.45)",
        }} />
      )}
      {etiq("REAL", true, Math.min(oReel, 1))}
      {etiq("IN MY GAME", false, oJeu)}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- les textes
/** Un mot en rouge : entre * dans le texte (« I turned *Japan* into… ») ; l'emoji reste avec le mot d'avant (une espace
 *  insécable : seul en début de ligne, il faisait une ligne à lui tout seul). */
const morceaux = (texte: string) => texte.replace(/ (\p{Extended_Pictographic})/gu, "\u00a0$1").split("*")
  .map((m, i) => (i % 2 ? <span key={i} style={{ color: C.rouge }}>{m}</span> : <React.Fragment key={i}>{m}</React.Fragment>));

/** La boîte de texte de la balade (le « cadre » de ses dialogues), qui arrive en rebondissant et repart. */
export const Cadre: React.FC<{ texte: string; de: number; a: number; y?: number; taille?: number; nom?: string; largeur?: number }> =
  ({ texte, de, a, y = 250, taille = 62, nom, largeur = 960 }) => {
    const f = useCurrentFrame();
    if (f < de - 1 || f > a + s(0.3)) return null;
    const v = rebond(f, de), sortie = expoEntree(entre(f, a, a + s(0.22)));
    const lignes = texte.split("\n");
    return (
      <div style={{
        position: "absolute", left: (W - largeur) / 2, width: largeur, top: y, display: "flex", justifyContent: "center",
        transform: `translateY(${(-40 * (1 - v) - 30 * sortie).toFixed(1)}px) scale(${((0.55 + 0.45 * v) * (1 - 0.25 * sortie)).toFixed(4)}) rotate(${(-3 * (1 - v)).toFixed(2)}deg)`,
        opacity: Math.min(1, (f - de + 1) / 4) * (1 - sortie), transformOrigin: "50% 0",
      }}>
        <div style={{
          position: "relative", background: C.papier, border: `7px solid ${C.encre}`, borderRadius: 24, padding: "26px 44px 30px",
          boxShadow: `inset 0 0 0 7px ${C.papier}, inset 0 0 0 12px ${C.rouge}, 0 8px 0 rgba(58,50,54,.35), 0 22px 50px rgba(0,0,0,.35)`,
          fontFamily: POLICE, fontWeight: 800, fontSize: taille, lineHeight: 1.22, color: C.encre, textAlign: "center", textWrap: "balance",
        }}>
          {nom && (
            <div style={{
              position: "absolute", left: 36, bottom: "100%", padding: "6px 26px 4px", background: C.rouge, color: "#fff", fontSize: 34,
              border: `7px solid ${C.encre}`, borderBottom: 0, borderRadius: "16px 16px 0 0", fontWeight: 800,
            }}>{nom}</div>
          )}
          {lignes.map((l, i) => <div key={i}>{morceaux(l)}</div>)}
        </div>
      </div>
    );
  };

/** L'étiquette d'un lieu, comme le titre de la balade : un rond rouge avec son numéro, le nom, le nom japonais. */
export const Etiquette: React.FC<{ n?: string; nom: string; ja: string; de: number; a: number; y?: number; sous?: string }> =
  ({ n, nom, ja, de, a, y = 1250, sous }) => {
    const f = useCurrentFrame();
    if (f < de - 1 || f > a + s(0.3)) return null;
    const v = rebond(f, de), sortie = expoEntree(entre(f, a, a + s(0.2)));
    return (
      <div style={{
        position: "absolute", left: 48, top: y, display: "flex", alignItems: "center", gap: 22,
        background: C.papier, border: `7px solid ${C.encre}`, borderRadius: 24, padding: "18px 38px 18px 20px",
        boxShadow: `inset 0 0 0 6px ${C.papier}, inset 0 0 0 11px ${C.rouge}, 0 8px 0 rgba(58,50,54,.35), 0 18px 40px rgba(0,0,0,.35)`,
        transform: `translateX(${(-520 * (1 - v) - 700 * sortie).toFixed(1)}px) rotate(${(-4 * (1 - v)).toFixed(2)}deg)`, opacity: Math.min(1, (f - de + 1) / 3),
      }}>
        {n && (
          <div style={{
            width: 88, height: 88, borderRadius: "50%", background: C.rouge, border: `5px solid ${C.encre}`, color: "#fff",
            display: "grid", placeItems: "center", fontFamily: POLICE, fontWeight: 800, fontSize: n.length > 2 ? 34 : 46,
            transform: `scale(${(0.4 + 0.6 * rebond(f, de + 5)).toFixed(4)})`,
          }}>{n}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 58, color: C.encre, lineHeight: 1.05 }}>{nom}</div>
          <div style={{ fontFamily: JAPONAIS, fontWeight: 700, fontSize: 34, color: C.encre2, lineHeight: 1.3 }}>{ja}{sous ? <span style={{ fontFamily: POLICE, fontWeight: 700 }}> · {sous}</span> : null}</div>
        </div>
      </div>
    );
  };

/** Le doigt qui appuie (de la vidéo « tunnel ») : il arrive le long du chemin [[image, x, y], …], appuie, une onde. */
export const Doigt: React.FC<{ chemin: [number, number, number][]; appui: number }> = ({ chemin, appui }) => {
  const f = useCurrentFrame();
  const debut = chemin[0][0];
  if (f < debut || f > appui + s(0.5)) return null;
  let x = chemin[0][1], y = chemin[0][2];
  for (let i = 1; i < chemin.length; i++) {
    const [f1, x1, y1] = chemin[i], [f0, x0, y0] = chemin[i - 1];
    if (f >= f0) { const u = expoSortie(entre(f, f0, f1)); x = x0 + (x1 - x0) * u; y = y0 + (y1 - y0) * u; }
  }
  const presse = f >= appui && f < appui + 5 ? 0.78 : f >= appui + 5 ? 0.78 + 0.22 * rebond(f, appui + 5) : 1;
  const apparition = Math.min(1, (f - debut) / 6), depart = f > appui + s(0.3) ? 1 - (f - appui - s(0.3)) / s(0.2) : 1;
  const onde = entre(f, appui, appui + s(0.38));
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: Math.max(0, Math.min(apparition, depart)) }}>
      {f >= appui && (
        <div style={{
          position: "absolute", left: 0, top: 0, width: 100 + 220 * expoSortie(onde), height: 100 + 220 * expoSortie(onde), borderRadius: "50%",
          transform: "translate(-50%, -50%)", border: "5px solid rgba(255,255,255,.9)", opacity: 1 - onde,
        }} />
      )}
      <div style={{
        position: "absolute", left: 0, top: 0, width: 104, height: 104, borderRadius: "50%", transform: `translate(-50%, -50%) scale(${presse})`,
        background: "rgba(255,255,255,.38)", border: "4px solid rgba(255,255,255,.95)", boxShadow: "0 14px 34px rgba(0,0,0,.35)",
      }} />
    </div>
  );
};

/** Un koban (la pièce d'or ovale de la balade, 壹両), en SVG. */
export const Koban: React.FC<{ taille: number }> = ({ taille }) => (
  <svg width={taille * 0.66} height={taille} viewBox="0 0 66 100">
    <defs>
      <linearGradient id="or" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#ffe38a" /><stop offset="0.55" stopColor="#e8b941" /><stop offset="1" stopColor="#b8862a" /></linearGradient>
    </defs>
    <ellipse cx="33" cy="50" rx="31" ry="48" fill="url(#or)" stroke="#7a5414" strokeWidth="3" />
    <ellipse cx="33" cy="50" rx="24" ry="40" fill="none" stroke="#a8741c" strokeWidth="2" opacity="0.7" />
    {[...Array(7)].map((_, i) => <line key={i} x1="14" x2="52" y1={22 + i * 9.5} y2={22 + i * 9.5} stroke="#a8741c" strokeWidth="1.6" opacity="0.55" />)}
    <text x="33" y="44" textAnchor="middle" fontSize="15" fontFamily={JAPONAIS} fontWeight="700" fill="#6a4410">壹</text>
    <text x="33" y="64" textAnchor="middle" fontSize="15" fontFamily={JAPONAIS} fontWeight="700" fill="#6a4410">両</text>
  </svg>
);

// ---------------------------------------------------------------- la fin
/** La fin : le jeu derrière, flou et assombri ; le logo dans sa pastille blanche, la phrase, le bouton rouge, l'adresse,
 *  « Link in bio ». titre : la grande phrase (Zen Antique) ; ligne : la petite (M PLUS Rounded) ; credit : la musique. */
export const Fin: React.FC<{ de: number; titre: string; ligne: string; credit?: string }> = ({ de, titre, ligne }) => {
  const f = useCurrentFrame();
  if (f < de) return null;
  const sombre = expoSortie(entre(f, de, de + s(0.6)));
  const vLogo = rebond(f, de + s(0.15)), vTitre = rebond(f, de + s(0.45)), vLigne = rebond(f, de + s(0.75)), vBouton = rebond(f, de + s(1.05));
  const apparait = (v: number, d: number) => ({ opacity: Math.min(1, Math.max(0, (f - d) / 5)), transform: `translateY(${(50 * (1 - v)).toFixed(1)}px) scale(${(0.7 + 0.3 * v).toFixed(4)})` });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backdropFilter: `blur(${(14 * sombre).toFixed(2)}px)`, background: `rgba(20,17,15,${(0.55 * sombre).toFixed(3)})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        <div style={{
          width: 300, height: 300, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center",
          boxShadow: "0 30px 80px rgba(0,0,0,.55), 0 0 0 10px rgba(255,255,255,.14)", opacity: f >= de + s(0.15) ? 1 : 0,
          transform: `scale(${Math.max(0, vLogo).toFixed(4)}) rotate(${(-14 * (1 - vLogo)).toFixed(2)}deg)`,
        }}>
          <Img src={staticFile("logo.jpg")} style={{ width: 268, height: 268, borderRadius: "50%" }} />
        </div>
        <div style={{ ...apparait(vTitre, de + s(0.45)), fontFamily: TITRE, fontSize: 92, lineHeight: 1.1, color: C.papier, textAlign: "center", textShadow: "0 4px 24px rgba(0,0,0,.6)", padding: "0 50px" }}>{titre}</div>
        <div style={{ ...apparait(vLigne, de + s(0.75)), fontFamily: POLICE, fontWeight: 800, fontSize: 46, color: "#fff", textAlign: "center", textShadow: "0 3px 14px rgba(0,0,0,.6)", padding: "0 60px" }}>{ligne}</div>
        <div style={{ ...apparait(vBouton, de + s(1.05)), display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 10 }}>
          <div style={{
            fontFamily: POLICE, fontWeight: 800, fontSize: 52, color: "#fff", background: C.rouge, border: `6px solid ${C.encre}`, borderRadius: 999,
            padding: "16px 54px", boxShadow: `0 7px 0 ${C.rougeFonce}, 0 7px 0 6px ${C.encre}, 0 26px 50px rgba(0,0,0,.4)`,
          }}>Link in bio ↑</div>
          <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 40, color: C.encre, background: C.papier, border: `5px solid ${C.encre}`, borderRadius: 999, padding: "10px 34px" }}>
            map.randomjapanplace.com
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
