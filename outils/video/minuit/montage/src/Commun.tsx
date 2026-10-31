// Les pièces communes de la vidéo « minuit » : une prise de la carte sur son plan 3D qui flotte (celui de la vidéo
// « tunnel »), le flou à bascule, le doigt qui touche, les étiquettes (le cartouche de la carte : papier clair, double
// filet d'encre et de rouge, les mots rouges entre *), les grands titres (à la façon de TikTok : blanc cerné de noir, un
// mot sur une pastille orange), le sceau rouge et les crédits de la carte.
import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, entre, expoEntree, expoSortie, houle, JAPONAIS, POLICE, rebond, s, TITRE } from "./theme";

/** Le plan 3D d'une prise : il flotte doucement ; ox, oy, rz, sc, rx, ry s'ajoutent (arrivées, panoramiques). */
export function plan(f: number, ox = 0, oy = 0, rzEnPlus = 0, sc = 1, rxEnPlus = 0, ryEnPlus = 0, calme = 1) {
  const rx = (3 + 2 * houle(f, 5.2)) * calme + rxEnPlus, ry = 2.2 * houle(f, 6.4, 1) * calme + ryEnPlus, rz = 0.7 * houle(f, 7.9, 2) * calme + rzEnPlus;
  return `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${(1.1 * sc).toFixed(5)})`;
}

/** Une prise de la carte (rushes.py) sur son plan 3D ; debut : l'image de la vidéo où la prise commence (t = 0),
 *  ou depuis : la seconde de la prise montrée à l'image a (pour en prendre un morceau). */
export const Prise: React.FC<{ nom: string; debut: number; transform: string; filtre?: string; depuis?: number }> = ({ nom, debut, transform, filtre, depuis = 0 }) => (
  <AbsoluteFill style={{ transform, filter: filtre }}>
    <Sequence from={debut} layout="none">
      <OffthreadVideo src={staticFile(`rushes/${nom}.mp4`)} muted trimBefore={depuis > 0 ? s(depuis) : undefined}
        style={{ position: "absolute", inset: 0, width: 1080, height: 1920, objectFit: "cover" }} />
    </Sequence>
  </AbsoluteFill>
);

/** Le flou à bascule : la carte est floue en haut et en bas, nette dans une bande au milieu (net : la demi-hauteur de
 *  la bande, en fraction de l'image ; 0 = tout flou). */
export const TiltShift: React.FC<{ flou: number; net: number }> = ({ flou, net }) => {
  if (flou < 0.2) return null;
  const c2 = Math.max(0, 50 - net * 100), c3 = Math.min(100, 50 + net * 100);
  const masque = net <= 0.001 ? "linear-gradient(#000, #000)"
    : `linear-gradient(#000 0%, #000 ${Math.max(0, c2 - 18)}%, transparent ${c2}%, transparent ${c3}%, #000 ${Math.min(100, c3 + 18)}%, #000 100%)`;
  return <AbsoluteFill style={{ backdropFilter: `blur(${flou.toFixed(2)}px)`, WebkitMaskImage: masque, maskImage: masque }} />;
};

/** Le doigt (le rond d'un enregistrement d'écran) : il glisse de clé en clé [image, x, y], touche à `appui`. */
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
          transform: "translate(-50%, -50%)", border: "5px solid rgba(255,255,255,.85)", opacity: 1 - onde,
        }} />
      )}
      <div style={{
        position: "absolute", left: 0, top: 0, width: 104, height: 104, borderRadius: "50%", transform: `translate(-50%, -50%) scale(${presse})`,
        background: "rgba(255,255,255,.38)", border: "4px solid rgba(255,255,255,.95)", boxShadow: "0 14px 34px rgba(0,0,0,.35)",
      }} />
    </div>
  );
};

/** Un texte dont les mots entre * sont rouges ; \n coupe la ligne (une phrase rouge qui passe à la ligne a ses * des deux côtés). */
export const Mots: React.FC<{ texte: string; rouge?: string }> = ({ texte, rouge = C.rouge }) => (
  <>
    {texte.split("\n").map((ligne, i) => (
      <div key={i}>
        {ligne.split("*").map((m, j) => (j % 2 ? <span key={j} style={{ color: rouge }}>{m}</span> : <React.Fragment key={j}>{m}</React.Fragment>))}
      </div>
    ))}
  </>
);

/** Une étiquette : le cartouche de la carte (papier clair, double filet), qui surgit en rebondissant et repart. */
export const Etiquette: React.FC<{ texte: string; de: number; a: number; y: number; taille?: number }> = ({ texte, de, a, y, taille = 54 }) => {
  const f = useCurrentFrame();
  if (f < de || f > a + s(0.3)) return null;
  const v = rebond(f, de), sortie = expoEntree(entre(f, a, a + s(0.22)));
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center",
      transform: `translateY(${(40 * (1 - v)).toFixed(1)}px) scale(${((0.6 + 0.4 * v) * (1 - 0.25 * sortie)).toFixed(4)})`,
      opacity: Math.min(1, (f - de) / 4) * (1 - sortie),
    }}>
      <div style={{
        fontFamily: POLICE, fontWeight: 800, fontSize: taille, lineHeight: 1.18, color: C.encre, background: C.clair, textAlign: "center",
        padding: "22px 40px", borderRadius: 18, border: `4px solid ${C.encre}`, boxShadow: `inset 0 0 0 4px ${C.clair}, inset 0 0 0 6px ${C.rouge}, 0 16px 40px rgba(0,0,0,.45)`,
        maxWidth: 900,
      }}>
        <Mots texte={texte} />
      </div>
    </div>
  );
};

/** Un mot de grand titre : blanc cerné de noir (TikTok Sans 900), ou blanc sur une pastille orange ; il surgit au
 *  ressort à l'image `de`. */
export const MotTitre: React.FC<{ texte: string; de: number; taille: number; pastille?: boolean; rotation?: number; battement?: number; emoji?: string }> = ({ texte, de, taille, pastille, rotation = 0, battement, emoji }) => {
  const f = useCurrentFrame();
  const v = rebond(f, de);
  const bat = battement !== undefined && f >= battement ? 1 + 0.16 * Math.exp(-(f - battement) / 9) * Math.cos((f - battement) / 3.2) : 1;
  const style: React.CSSProperties = pastille
    ? { color: "#fff", background: C.orange, padding: `${taille * 0.08}px ${taille * 0.22}px ${taille * 0.02}px`, borderRadius: taille * 0.16,
      border: `${Math.round(taille * 0.045)}px solid #1a0f08`, boxShadow: "0 18px 40px rgba(0,0,0,.5)", WebkitTextStroke: `${Math.round(taille * 0.05)}px #1a0f08`, paintOrder: "stroke fill" }
    : { color: "#fff", WebkitTextStroke: `${Math.round(taille * 0.11)}px #000`, paintOrder: "stroke fill", textShadow: "0 8px 26px rgba(0,0,0,.55)" };
  return (
    <span style={{
      display: "inline-block", fontFamily: POLICE, fontWeight: 900, fontSize: taille, lineHeight: 1.05, letterSpacing: "-0.01em", ...style,
      opacity: f < de ? 0 : Math.min(1, (f - de) / 3),
      transform: `translateY(${(50 * (1 - v)).toFixed(1)}px) scale(${((0.55 + 0.45 * v) * bat).toFixed(4)}) rotate(${(rotation * v).toFixed(2)}deg)`,
    }}>{texte}{emoji && <span style={{ WebkitTextStroke: 0, marginLeft: taille * 0.2, filter: "drop-shadow(0 6px 14px rgba(0,0,0,.5))" }}>{emoji}</span>}</span>
  );
};

/** Le sceau rouge (un hanko) : des caractères japonais en colonnes, frappé au ressort à l'image `de`. */
export const Sceau: React.FC<{ texte: string[]; de: number; x: number; y: number; taille: number; rotation?: number; a?: number }> = ({ texte, de, x, y, taille, rotation = -7, a }) => {
  const f = useCurrentFrame();
  if (f < de) return null;
  const v = rebond(f, de, 520, 22);
  const sortie = a !== undefined ? expoEntree(entre(f, a, a + s(0.25))) : 0;
  const cote = taille;
  return (
    <div style={{
      position: "absolute", left: x - cote / 2, top: y - cote / 2, width: cote, height: cote,
      transform: `scale(${(1.8 - 0.8 * v) * (1 - 0.3 * sortie)}) rotate(${rotation}deg)`, opacity: Math.min(1, (f - de) / 3) * (1 - sortie),
      background: C.rouge, borderRadius: cote * 0.1, boxShadow: `inset 0 0 0 ${cote * 0.04}px ${C.clair}, inset 0 0 0 ${cote * 0.07}px ${C.rouge}, inset 0 0 0 ${cote * 0.085}px ${C.clair}, 0 14px 30px rgba(0,0,0,.45)`,
      display: "flex", flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: cote * 0.04,
    }}>
      {texte.map((colonne, i) => (
        <div key={i} style={{ fontFamily: JAPONAIS, fontWeight: 700, fontSize: cote * (texte.length > 1 ? 0.36 : 0.62), lineHeight: 1.02, color: C.clair, writingMode: "vertical-rl" }}>{colonne}</div>
      ))}
    </div>
  );
};

/** Le nom d'un yōkai (les gros plans) : son nom en Zen Antique sur le papier clair, son nom japonais, un sceau « 妖 ». */
export const NomYokai: React.FC<{ nom: string; japonais: string; de: number; a: number; x: number; y: number }> = ({ nom, japonais, de, a, x, y }) => {
  const f = useCurrentFrame();
  if (f < de || f > a) return null;
  const v = rebond(f, de);
  return (
    <div style={{
      position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) translateY(${(30 * (1 - v)).toFixed(1)}px) scale(${(0.6 + 0.4 * v).toFixed(4)})`,
      opacity: Math.min(1, (f - de) / 3), display: "flex", alignItems: "center", gap: 18, background: C.clair, padding: "16px 30px 16px 18px",
      borderRadius: 16, border: `4px solid ${C.encre}`, boxShadow: `inset 0 0 0 4px ${C.clair}, inset 0 0 0 6px ${C.rouge}, 0 16px 40px rgba(0,0,0,.5)`, whiteSpace: "nowrap",
    }}>
      <div style={{ width: 78, height: 78, background: C.rouge, borderRadius: 9, display: "grid", placeItems: "center", fontFamily: JAPONAIS, fontWeight: 700, fontSize: 52, color: C.clair, transform: "rotate(-6deg)" }}>妖</div>
      <div>
        <div style={{ fontFamily: TITRE, fontSize: 60, lineHeight: 1.05, color: C.encre }}>{nom}</div>
        <div style={{ fontFamily: JAPONAIS, fontWeight: 700, fontSize: 34, color: C.rouge, letterSpacing: "0.08em" }}>{japonais}</div>
      </div>
    </div>
  );
};

/** Les crédits de la carte, toujours sur les images de la carte. */
export const Credits: React.FC<{ opacite?: number }> = ({ opacite = 1 }) => (
  <div style={{ position: "absolute", left: 30, bottom: 8, fontFamily: POLICE, fontSize: 23, fontWeight: 600, color: "rgba(255,255,255,.9)", textShadow: "0 1px 4px rgba(0,0,0,.7)", opacity: opacite }}>
    © Mapterhorn · © OpenStreetMap · Natural Earth
  </div>
);

/** Un éclair blanc (les coupes, la cloche) : fort à l'image `de`, éteint en `duree` images. */
export const Flash: React.FC<{ de: number; force?: number; duree?: number }> = ({ de, force = 0.85, duree = 10 }) => {
  const f = useCurrentFrame();
  if (f < de || f > de + duree) return null;
  return <AbsoluteFill style={{ background: "#fff", opacity: force * Math.pow(1 - (f - de) / duree, 2) }} />;
};
