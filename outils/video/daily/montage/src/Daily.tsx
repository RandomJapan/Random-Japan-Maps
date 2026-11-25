// « Japan Daily » (2026-11-25, le marketing : une énigme par jour, numérotée, de 12 à 20 s ; le format « Devine le lieu » de la
// vidéo du jeu, qui fait jouer le spectateur dès la première seconde). 18 s, 9:16, 60 images/s, en anglais. Un épisode = un lieu
// de la carte (episodes.json) ; tout le reste est le même d'un jour à l'autre, c'est la série.
// 120 battements par minute : le temps n tombe à l'image 30 n (musique.py est calée dessus).
//   0 → 6    l'énigme : le plan du propriétaire, « WHERE IN JAPAN IS THIS? », 3-2-1 (l'image 0 est déjà posée : c'est la couverture)
//   6 → 12   l'indice : la vraie carte, la région qui s'allume en rouge (la prise day-N, 0 → 3 s)
//   12 → 18  « COMMENT YOUR GUESS 👇 » : l'énigme figée, en trame
//   18 → 23  la réponse : la plongée sur le lieu (la prise, 3 → 5,5 s), le nom et la préfecture en gros à l'arrivée (temps 21)
//   23 → 28  le plus beau plan du propriétaire, le nom reste
//   28 → 36  la fin : le défi du jour de la carte (« 6 TRIES »), « FREE · LINK IN BIO », l'adresse
// Le découpage et les choix : ../plan.md.
import React from "react";
import { AbsoluteFill, Audio, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, CHAUD, entre, expoSortie, FPS, POLICE, rebond } from "./theme";
import EPISODES from "./episodes.json";

const b = (n: number) => Math.round(n * 30);
export const DUREE = b(36);
const T = { indice: b(6), gel: b(12), plongee: b(18), nom: b(21), beau: b(23), fin: b(28) };
const PRISE_REPONSE = 3.0; // s : la plongée commence là dans la prise

type Episode = { jour: number; lieu: string; affiche: string; prefecture: string; region: string; vitesseBeau: number };

// ---------------------------------------------------------------- les mots
/** Des mots à la façon de TikTok (la vidéo du jeu) : blancs cernés d'encre, en capitales, qui claquent ; le mot entre * sur une
 *  pastille rouge ; \n coupe la ligne. pose : déjà en place dès sa première image. */
const Mots: React.FC<{ texte: string; de: number; a: number; y: number; taille: number; pose?: boolean }> = ({ texte, de, a, y, taille, pose }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const v = pose ? 1 : rebond(f, de, 420, 22);
  return (
    <div style={{
      position: "absolute", left: 30, right: 30, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 90,
      transform: `scale(${(1.3 - 0.3 * v).toFixed(4)}) rotate(${(-6 * (1 - v) - 2).toFixed(2)}deg)`, transformOrigin: "50% 40%",
      opacity: pose ? 1 : Math.min(1, (f - de + 1) / 2),
    }}>
      {texte.split("\n").map((l, i) => (
        <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: taille, lineHeight: 1.06, textAlign: "center", letterSpacing: -1, whiteSpace: "nowrap" }}>
          {l.split("*").map((m, j) => j % 2
            ? <span key={j} style={{ background: C.rouge, color: "#fff", padding: "0 20px", borderRadius: 18, border: `7px solid ${C.encre}`, boxShadow: "0 8px 0 rgba(0,0,0,.35)", display: "inline-block", transform: "rotate(-2deg)", margin: "0 4px" }}>{m}</span>
            : <span key={j} style={{ color: "#fff", WebkitTextStroke: `14px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 24px rgba(0,0,0,.45)" }}>{m}</span>)}
        </div>
      ))}
    </div>
  );
};

/** La marque de la série, en haut : le sceau rouge 日 (« jour »), JAPAN DAILY, le numéro du jour. */
const Marque: React.FC<{ jour: number }> = ({ jour }) => {
  const f = useCurrentFrame();
  if (f >= T.fin) return null;
  const sortie = entre(f, T.fin - 8, T.fin);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 206, display: "flex", justifyContent: "center", zIndex: 95, opacity: 1 - sortie }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: C.clair, border: `6px solid ${C.encre}`, borderRadius: 999,
        padding: "8px 12px 8px 10px", boxShadow: "0 8px 0 rgba(0,0,0,.3), 0 14px 30px rgba(0,0,0,.35)" }}>
        <div style={{ width: 62, height: 62, borderRadius: 12, background: C.rouge, color: "#fff", display: "grid", placeItems: "center",
          fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif", fontWeight: 700, fontSize: 44, transform: "rotate(-4deg)" }}>日</div>
        <div style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 46, color: C.encre, letterSpacing: 1 }}>JAPAN DAILY</div>
        <div style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 46, color: "#fff", background: C.encre, borderRadius: 999, padding: "2px 26px" }}>DAY {jour}</div>
      </div>
    </div>
  );
};

/** Le compte à rebours de l'énigme : un anneau qui se vide, le chiffre qui claque à chaque seconde (la vidéo « Devine le lieu »). */
const Anneau: React.FC<{ de: number; a: number }> = ({ de, a }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const secondes = (a - de) / FPS;
  const reste = Math.max(0, (a - f) / FPS);
  const n = Math.max(1, Math.ceil(reste));
  const v = f === de && de === 0 ? 1 : rebond(f, Math.max(de, a - n * FPS), 520, 22);
  const part = Math.min(1, reste / secondes);
  const R = 104, tour = 2 * Math.PI * R;
  return (
    <div style={{ position: "absolute", left: 540 - 130, top: 1110, width: 260, height: 260, zIndex: 89 }}>
      <svg width="260" height="260" viewBox="0 0 260 260" style={{ position: "absolute", inset: 0 }}>
        <circle cx="130" cy="130" r="124" fill="rgba(13,18,24,.72)" />
        <circle cx="130" cy="130" r={R} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="20" />
        <circle cx="130" cy="130" r={R} fill="none" stroke={n === 1 ? "#e0563f" : C.rouge} strokeWidth="20" strokeLinecap="round"
          strokeDasharray={`${(part * tour).toFixed(1)} ${tour.toFixed(1)}`} transform="rotate(-90 130 130)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: POLICE, fontWeight: 900, fontSize: 148, color: "#fff", transform: `scale(${(1.45 - 0.45 * v).toFixed(3)})` }}>{n}</div>
    </div>
  );
};

/** Le nom du lieu et sa préfecture, en gros, qui claquent à l'arrivée de la plongée ; ils restent sur le plus beau plan. */
const Nom: React.FC<{ e: Episode }> = ({ e }) => {
  const f = useCurrentFrame();
  if (f < T.nom || f >= T.fin) return null;
  const lignes = e.affiche.split("\n");
  const taille = Math.min(124, Math.floor(980 / (0.64 * Math.max(...lignes.map((l) => l.length)))));
  const vp = rebond(f, T.nom + 9, 420, 20);
  return (
    <>
      <Mots texte={e.affiche} de={T.nom} a={T.fin} y={330} taille={taille} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 330 + lignes.length * taille * 1.06 + 34, display: "flex", justifyContent: "center", zIndex: 91,
        opacity: f >= T.nom + 9 ? 1 : 0, transform: `scale(${(1.4 - 0.4 * vp).toFixed(3)}) rotate(-2deg)` }}>
        <div style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 70, color: "#fff", background: C.rouge, border: `7px solid ${C.encre}`, borderRadius: 22, padding: "2px 32px", boxShadow: "0 8px 0 rgba(0,0,0,.35)" }}>📍 {e.prefecture.toUpperCase()}</div>
      </div>
    </>
  );
};

const plein: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };

/** Un plan, de l'image de à a : un petit coup de zoom sur la coupe (le ressort), puis une poussée lente. */
const Plan: React.FC<{ de: number; a: number; z0?: number; z1?: number; children: React.ReactNode }> = ({ de, a, z0 = 1, z1 = 1.05, children }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const punch = de === 0 ? 0 : 0.07 * (1 - rebond(f, de, 320, 20));
  const z = (z0 + (z1 - z0) * entre(f, de, a)) * (1 + punch);
  return <AbsoluteFill style={{ transform: `scale(${z.toFixed(5)})` }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- la fin : le défi du jour de la carte
const CASES: [string, string][] = [[CHAUD.froid, ""], [CHAUD.froid, ""], [CHAUD.tiede, ""], [CHAUD.chaud, ""], [CHAUD.brulant, ""], ["#fff", "🎯"]];
const caseDe = (k: number) => b(29) + 10 * k;
const T_BOUTON = b(31);

const Fin: React.FC<{ jour: number }> = ({ jour }) => {
  const f = useCurrentFrame();
  if (f < T.fin) return null;
  const g = f - T.fin;
  const vLogo = rebond(f, T.fin, 300, 16), vTitre = rebond(f, T.fin + 6), vBouton = rebond(f, T_BOUTON, 420, 20), vAdr = rebond(f, T_BOUTON + 8);
  const rayons = expoSortie(entre(g, 0, 18));
  return (
    <AbsoluteFill style={{ zIndex: 100 }}>
      {/* le fond : le plus beau plan, figé, flou et assombri */}
      <AbsoluteFill style={{ filter: "blur(14px) brightness(.45)", transform: "scale(1.1)" }}>
        <Freeze frame={60}><OffthreadVideo src={staticFile(`ep/${jour}/beau.mp4`)} muted style={plein} /></Freeze>
      </AbsoluteFill>
      <AbsoluteFill style={{
        background: "repeating-conic-gradient(from 0deg at 50% 410px, rgba(255,246,220,.5) 0deg 7deg, rgba(255,246,220,0) 7deg 18deg)",
        WebkitMaskImage: "radial-gradient(circle at 50% 410px, #000 0, rgba(0,0,0,.6) 360px, transparent 860px)",
        opacity: rayons, transform: `rotate(${(g * 0.25).toFixed(2)}deg) scale(${(0.6 + 0.4 * rayons).toFixed(3)})`, transformOrigin: "50% 410px",
      }} />
      <AbsoluteFill style={{ background: "#fff", opacity: 0.85 * (1 - entre(g, 0, 8)) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <div style={{
          width: 220, height: 220, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center",
          boxShadow: "0 30px 90px rgba(0,0,0,.6), 0 0 0 10px rgba(255,255,255,.18)",
          transform: `scale(${Math.max(0, 0.2 + 0.8 * vLogo).toFixed(4)}) rotate(${(-18 * (1 - vLogo)).toFixed(2)}deg)`,
        }}>
          <Img src={staticFile("ui/logo.jpg")} style={{ width: 198, height: 198, borderRadius: "50%" }} />
        </div>
        <div style={{
          fontFamily: POLICE, fontWeight: 900, fontSize: 92, lineHeight: 1.04, textAlign: "center", color: "#fff", padding: "0 40px",
          WebkitTextStroke: `13px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 30px rgba(0,0,0,.5)",
          opacity: f >= T.fin + 6 ? 1 : 0, transform: `translateY(${(60 * (1 - vTitre)).toFixed(1)}px) scale(${(0.7 + 0.3 * vTitre).toFixed(4)})`,
        }}>TODAY'S MYSTERY<br />PLACE IS ON<br />MY MAP 🗺️</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: f >= caseDe(0) ? 1 : 0 }}>
          <div style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 46, color: "#fff", WebkitTextStroke: `9px ${C.encre}`, paintOrder: "stroke fill", letterSpacing: 1 }}>DAILY CHALLENGE · 6 TRIES</div>
          <div style={{ display: "flex", gap: 16 }}>
            {CASES.map(([couleur, signe], k) => {
              const v = rebond(f, caseDe(k), 520, 20);
              return (
                <div key={k} style={{
                  width: 104, height: 104, borderRadius: 18, border: `6px solid ${C.encre}`, display: "grid", placeItems: "center", fontSize: 62,
                  background: f >= caseDe(k) ? couleur : "rgba(255,255,255,.2)", boxShadow: "0 7px 0 rgba(0,0,0,.35)",
                  transform: `scale(${(f >= caseDe(k) ? 1.35 - 0.35 * v : 0.9).toFixed(3)})`, fontFamily: POLICE,
                }}>{f >= caseDe(k) ? signe : ""}</div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 8, opacity: f >= T_BOUTON ? 1 : 0 }}>
          <div style={{
            fontFamily: POLICE, fontWeight: 900, fontSize: 62, color: "#fff", background: C.rouge, border: `7px solid ${C.encre}`, borderRadius: 999,
            padding: "12px 52px", boxShadow: `0 9px 0 ${C.rougeFonce}, 0 9px 0 7px ${C.encre}, 0 30px 60px rgba(0,0,0,.45)`,
            transform: `scale(${(1.6 - 0.6 * vBouton).toFixed(4)}) rotate(${(-3 * (1 - vBouton) - 1.5).toFixed(2)}deg)`,
          }}>FREE · LINK IN BIO</div>
          <div style={{
            fontFamily: POLICE, fontWeight: 800, fontSize: 46, color: C.encre, background: C.papier, border: `6px solid ${C.encre}`, borderRadius: 999,
            padding: "10px 36px", opacity: f >= T_BOUTON + 8 ? 1 : 0, transform: `translateY(${(40 * (1 - vAdr)).toFixed(1)}px)`,
          }}>map.randomjapanplace.com</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- le son
const AVANCE = 2; // l'AAC du MP4 retarde le son d'autant
/** [seconde, fichier de sfx/, volume, durée (s) : coupé et fondu au bout] */
type Effet = [number, string, number, number?];
const sec = (n: number) => n * 0.5; // la seconde du temps n
const EFFETS: Effet[] = [
  [0, "jd-tic.wav", 0.45], [1, "jd-toc.wav", 0.45], [2, "jd-tic.wav", 0.45],
  [sec(6) - 0.03, "transition-snap.mp3", 0.22], [sec(6.5), "jd-indice.wav", 0.3],
  [sec(12) - 0.15, "click-camera.mp3", 0.8],
  [sec(18) - 0.25, "air-whoosh-powerful.mp3", 0.28],
  [sec(21), "jd-reponse.wav", 0.32],
  [sec(23) - 0.05, "swoosh-quick.mp3", 0.22],
  [sec(28), "sparkle-touch.mp3", 0.25],
  ...CASES.map((_, k): Effet => [caseDe(k) / FPS, k === 5 ? "jd-trouve.wav" : "jd-case.wav", k === 5 ? 0.3 : 0.18]),
  [T_BOUTON / FPS, "ui-message-pop.mp3", 0.35],
];
const VOLUME_MUSIQUE = 0.42;

const Son: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const { durationInFrames: duree } = useVideoConfig();
  const s = (x: number) => Math.round(x * FPS);
  return (
    <>
      {bgm && <Audio src={staticFile("musique/daily.wav")} volume={VOLUME_MUSIQUE} />}
      {EFFETS.map(([a, nom, v, d], i) => (
        <Sequence key={i} from={Math.max(0, s(a) - AVANCE)} durationInFrames={Math.min(s(d ?? 3), duree)} layout="none">
          <Audio src={staticFile(`sfx/${nom}`)} volume={d === undefined ? v : (f) => v * interpolate(f, [s(d) - 12, s(d)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </Sequence>
      ))}
    </>
  );
};

/** Les crédits de la carte, sur ses images. */
const Credits: React.FC = () => {
  const f = useCurrentFrame();
  const vu = (f >= T.indice && f < T.gel) || (f >= T.plongee && f < T.beau);
  return (
    <div style={{ position: "absolute", left: 30, bottom: 8, zIndex: 85, fontFamily: POLICE, fontSize: 23, fontWeight: 700, color: "rgba(255,255,255,.92)", textShadow: "0 1px 4px rgba(0,0,0,.75)", opacity: vu ? 1 : 0 }}>
      © Mapterhorn · © OpenStreetMap · Natural Earth
    </div>
  );
};

// ---------------------------------------------------------------- tout
export const Daily: React.FC<{ jour: number; bgm: boolean }> = ({ jour, bgm }) => {
  const f = useCurrentFrame();
  const e = (EPISODES as Record<string, Episode>)[String(jour)];
  const dossier = `ep/${jour}`;
  const gel = f >= T.gel && f < T.plongee;
  return (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      {/* l'énigme : le plan du propriétaire, assombri en haut pour les mots */}
      <Plan de={0} a={T.indice} z0={1} z1={1.07}>
        <OffthreadVideo src={staticFile(`${dossier}/enigme.mp4`)} muted style={plein} />
        <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,0) 38%)" }} />
      </Plan>
      {/* l'indice : la prise de carte, de 0 à 3 s */}
      <Sequence from={T.indice} durationInFrames={T.gel - T.indice} layout="none">
        <Plan de={0} a={T.gel - T.indice} z0={1} z1={1}>
          <OffthreadVideo src={staticFile(`rushes/day-${jour}.mp4`)} muted style={plein} />
          <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.3), rgba(0,0,0,0) 32%)" }} />
        </Plan>
      </Sequence>
      {/* « comment your guess » : la dernière image de l'énigme, figée (un éclair blanc d'appareil photo), en couleurs : il faut
          la voir pour deviner (la trame des vidéos du jeu faisait du bruit avec un paysage de forêt) */}
      {gel && (
        <AbsoluteFill style={{ transform: `scale(${(1.07 + 0.05 * entre(f, T.gel, T.plongee)).toFixed(4)})` }}>
          <AbsoluteFill style={{ filter: "saturate(.8) brightness(.78)" }}>
            <Freeze frame={T.indice - 2}><OffthreadVideo src={staticFile(`${dossier}/enigme.mp4`)} muted style={plein} /></Freeze>
          </AbsoluteFill>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 35%, rgba(0,0,0,.55) 100%)" }} />
          <AbsoluteFill style={{ background: "#fff", opacity: 0.75 * (1 - entre(f, T.gel, T.gel + 7)) }} />
        </AbsoluteFill>
      )}
      {/* la réponse : la plongée (la prise, à partir de 3 s), puis le plus beau plan */}
      <Sequence from={T.plongee} durationInFrames={T.beau - T.plongee} layout="none">
        <Plan de={0} a={T.beau - T.plongee} z0={1} z1={1}>
          <OffthreadVideo src={staticFile(`rushes/day-${jour}.mp4`)} muted trimBefore={Math.round(PRISE_REPONSE * FPS)} style={plein} />
          <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.3), rgba(0,0,0,0) 34%)" }} />
        </Plan>
      </Sequence>
      <Sequence from={T.beau} durationInFrames={T.fin - T.beau} layout="none">
        <Plan de={0} a={T.fin - T.beau} z0={1.02} z1={1.08}>
          <OffthreadVideo src={staticFile(`${dossier}/beau.mp4`)} muted playbackRate={e.vitesseBeau} style={plein} />
          <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.38), rgba(0,0,0,0) 40%)" }} />
        </Plan>
      </Sequence>

      <Credits />
      <Marque jour={jour} />
      <Mots texte={"WHERE IN JAPAN\n*IS THIS?*"} de={0} a={T.indice} y={330} taille={112} pose />
      <Anneau de={0} a={T.indice} />
      <Mots texte={`HINT: IT'S IN\n*${e.region}*`} de={b(6.5)} a={T.gel} y={330} taille={108} />
      <Mots texte={"COMMENT\nYOUR *GUESS*\n👇"} de={T.gel + 4} a={T.plongee} y={640} taille={124} />
      <Nom e={e} />
      <Fin jour={jour} />
      <Son bgm={bgm} />
    </AbsoluteFill>
  );
};
