// Le nom du lieu et sa préfecture, sur un fond transparent : le propriétaire le pose au-dessus de son premier plan dans DaVinci
// Resolve, en haut de l'image (sous les onglets de TikTok). Style japonais (sa demande du 26/11/2026, « plus japonais, et le nom
// aussi en japonais ») : le nom japonais du Sheet en grand, écrit au pinceau caractère par caractère ; le nom anglais en blanc
// sur un coup de pinceau vermillon ; la préfecture avec un sceau rouge (hanko) à ses kanji. Le vermillon et l'encre sont ceux de
// la carte (le sceau rouge des vidéos de la carte). Sans nom japonais (pas encore dans le Sheet) : le pinceau et le sceau seuls.
import React, { useState } from "react";
import { useCurrentFrame } from "remotion";
import { getInfo as infoAntique, loadFont as antique } from "@remotion/google-fonts/ZenAntique";
import { getInfo as infoSyuku, loadFont as syuku } from "@remotion/google-fonts/YujiSyuku";
import { ajuster } from "./texte";
import { borne, ressort } from "./theme";

export type PropsNom = { fps: number; duree: number; nom: string; prefecture: string; nomJp?: string; prefectureJp?: string; anime: boolean };

const ANTIQUE = "Zen Antique";
const SYUKU = "Yuji Syuku";
const VERMILLON = "#c63a23";
const ENCRE = "#1c120b";

/** Les morceaux d'une police japonaise (découpée par plages de caractères) qui contiennent ces caractères, plus le latin. */
function morceaux(plages: Record<string, string>, texte: string): string[] {
  const codes = [...texte].map((c) => c.codePointAt(0) ?? 0).filter((c) => c > 0x2ff);
  const cles = Object.entries(plages).filter(([cle, plage]) => /^\[\d+\]$/.test(cle) && plage.split(",").some((p) => {
    const [a, b] = p.trim().replace(/^U\+/i, "").split("-");
    const bas = parseInt(a, 16), haut = b ? parseInt(b, 16) : bas;
    return codes.some((c) => c >= bas && c <= haut);
  })).map(([cle]) => cle);
  return [...cles, "latin", "latin-ext"];
}

/** Un nombre au hasard, toujours le même pour une graine (mulberry32). */
function hasard(graine: number) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const graineDe = (texte: string) => [...texte].reduce((h, c) => (Math.imul(h, 31) + (c.codePointAt(0) ?? 0)) >>> 0, 7);

/** Un coup de pinceau horizontal (dans un cadre de 1000 × 200, étiré à la taille du texte) : appuyé à gauche, bords irréguliers,
 *  la fin qui s'effile en poils, et des traînées sèches là où l'encre manque. */
const Pinceau: React.FC<{ graine: number; montre: number }> = ({ graine, montre }) => {
  const r = hasard(graine);
  const arc = (x: number) => -7 * Math.sin((Math.PI * x) / 1000); // le geste, un peu bombé
  // les poils : chacun un trait, ceux du bord partent plus tard (le pinceau posé, arrondi) et finissent plus tôt (il s'effile) ;
  // près de la fin, certains se cassent (l'encre manque : les traînées sèches)
  const N = 30;
  const poils: { d: string; w: number; o: number }[] = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), bord = Math.abs(u - 0.5) * 2;
    const y = 16 + u * 168 + (r() - 0.5) * 3;
    const x0 = 22 + 70 * bord * bord + r() * 16;
    const x1 = Math.max(560, 990 - 150 * Math.pow(bord, 1.4) - r() * 190);
    const w = 9 + r() * 6, o = 0.8 + r() * 0.2, ondule = (r() - 0.5) * 7;
    const trait = (a: number, b: number) =>
      `M${a.toFixed(0)},${(y + arc(a)).toFixed(1)} Q${((a + b) / 2).toFixed(0)},${(y + arc((a + b) / 2) + ondule).toFixed(1)} ${b.toFixed(0)},${(y + arc(b) + ondule * 0.4).toFixed(1)}`;
    if (r() < 0.45) {
      const g0 = x1 - (0.12 + r() * 0.25) * (x1 - x0), g1 = g0 + 12 + r() * 50;
      poils.push({ d: trait(x0, g0), w, o });
      if (g1 < x1 - 8) poils.push({ d: trait(g1, x1), w: w * 0.8, o: o * 0.9 });
    } else {
      poils.push({ d: trait(x0, x1), w, o });
    }
  }
  const id = `p${graine}`;
  return (
    <svg viewBox="0 0 1000 200" preserveAspectRatio="none"
      style={{ position: "absolute", left: "-8%", top: "-44%", width: "120%", height: "190%", overflow: "visible",
        clipPath: `inset(-20% ${(1 - montre) * 100}% -20% -10%)`, filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }}>
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1="0" x2="1000" y1="0" y2="0">
          <stop offset="0" stopColor="#a62815" /><stop offset="0.5" stopColor={VERMILLON} /><stop offset="1" stopColor="#d24e2d" />
        </linearGradient>
      </defs>
      {/* le corps plein sous le texte, puis les poils par-dessus */}
      <path d={`M70,${40 + arc(70)} L660,${36 + arc(660)} L660,${164 + arc(660)} L70,${160 + arc(70)} Z`} fill={`url(#${id}g)`} />
      <ellipse cx={58} cy={100 + arc(58)} rx={46} ry={84} fill={`url(#${id}g)`} />
      <g fill="none" stroke={`url(#${id}g)`} strokeLinecap="round">
        {poils.map((p, k) => <path key={k} d={p.d} strokeWidth={p.w} strokeOpacity={p.o} />)}
      </g>
    </svg>
  );
};

/** Le sceau rouge (hanko) : les kanji de la préfecture en blanc, l'encre un peu irrégulière comme un vrai tampon. */
const Sceau: React.FC<{ texte: string; taille: number; graine: number }> = ({ texte, taille, graine }) => {
  const n = [...texte].length;
  const l = taille * (0.98 * n + 0.42), h = taille * 1.42;
  const id = `s${graine}`;
  return (
    <svg width={l} height={h} viewBox={`0 0 ${l} ${h}`} style={{ overflow: "visible", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.35))" }}>
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed={graine % 97} result="b" />
          <feDisplacementMap in="SourceGraphic" in2="b" scale={taille * 0.07} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        <rect x={2} y={2} width={l - 4} height={h - 4} rx={taille * 0.16} fill={VERMILLON} />
        <rect x={taille * 0.12} y={taille * 0.12} width={l - taille * 0.24} height={h - taille * 0.24} rx={taille * 0.1} fill="none"
          stroke="#fbeee0" strokeWidth={taille * 0.045} />
        <text x={l / 2} y={h / 2 + taille * 0.36} textAnchor="middle" fontFamily={ANTIQUE} fontSize={taille} fill="#fbeee0"
          letterSpacing={taille * -0.02}>{texte}</text>
      </g>
    </svg>
  );
};

/** Du blanc cerclé d'encre : le contour sous le remplissage (paint-order), et une ombre douce pour se détacher de l'image. */
const encre = (epaisseur: number): React.CSSProperties => ({
  color: "#fffaf2", WebkitTextStroke: `${epaisseur}px ${ENCRE}`, paintOrder: "stroke fill",
  textShadow: `0 ${epaisseur * 0.6}px ${epaisseur * 2.2}px rgba(0,0,0,0.45)`,
});

export const Nom: React.FC<PropsNom> = ({ fps, nom, prefecture, nomJp = "", prefectureJp = "", anime }) => {
  // seulement les morceaux des polices japonaises qui servent (chacune est coupée en 120 morceaux)
  useState(() => {
    antique("normal", { weights: ["400"], subsets: morceaux(infoAntique().unicodeRanges, nom + prefectureJp) as "latin"[] });
    if (nomJp) syuku("normal", { weights: ["400"], subsets: morceaux(infoSyuku().unicodeRanges, nomJp) as "latin"[] });
    return true;
  });
  const image = useCurrentFrame();
  const t = anime ? image / fps : 10;
  const graine = graineDe(nom);
  const jp = [...nomJp.trim()];
  const tJp = Math.min(130, 940 / Math.max(1, jp.length * 1.04));
  const en = ajuster(nom.toUpperCase(), 820, 92, 60, 0.74);
  const debutEn = jp.length ? 0.16 : 0.02;
  const p = ressort(t - (debutEn + 0.28)); // le sceau
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, display: "flex", flexDirection: "column", alignItems: "center",
      textAlign: "center" }}>
      {jp.length > 0 && (
        <div style={{ display: "flex", fontFamily: SYUKU, fontSize: tJp, lineHeight: 1.12, letterSpacing: tJp * 0.04, marginBottom: 34 }}>
          {jp.map((c, k) => {
            const a = borne((t - 0.02 - k * 0.055) / 0.2); // chaque caractère « écrit » de haut en bas
            return (
              <span key={k} style={{ ...encre(tJp * 0.085), display: "inline-block", clipPath: `inset(0 0 ${(1 - a) * 100}% 0)`,
                transform: `translateY(${(1 - a) * -10}px)`, opacity: borne(a * 3) }}>{c}</span>
            );
          })}
        </div>
      )}
      {en.lignes.map((ligne, k) => {
        const d = debutEn + k * 0.1;
        const m = borne((t - d) / 0.3), a = ressort(t - d - 0.12);
        return (
          <div key={k} style={{ position: "relative", margin: `${k ? 40 : 8}px 0 0`, padding: `0 ${en.taille * 0.2}px` }}>
            <Pinceau graine={graine + k * 17} montre={1 - Math.pow(1 - m, 3)} />
            <div style={{ position: "relative", fontFamily: ANTIQUE, fontSize: en.taille, lineHeight: 1.08, letterSpacing: en.taille * 0.06,
              color: "#fffaf2", whiteSpace: "nowrap", textShadow: "0 2px 0 rgba(90,20,8,0.55)", opacity: borne(a * 1.8),
              transform: `translateY(${(1 - a) * 14}px)` }}>{ligne}</div>
          </div>
        );
      })}
      {prefecture && (
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 20 }}>
          {prefectureJp && (
            <div style={{ transform: `scale(${1.45 - 0.45 * p}) rotate(${(1 - p) * -8 - 3}deg)`, opacity: borne(p * 2.2) }}>
              <Sceau texte={prefectureJp} taille={58} graine={graine} />
            </div>
          )}
          <span style={{ ...encre(9), fontFamily: ANTIQUE, fontSize: 60, whiteSpace: "nowrap", letterSpacing: 1.5,
            opacity: borne(ressort(t - debutEn - 0.36) * 1.8), transform: `translateX(${(1 - ressort(t - debutEn - 0.36)) * 24}px)` }}>
            {prefecture}, Japan
          </span>
        </div>
      )}
    </div>
  );
};
