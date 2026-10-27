// L'accroche (0 à 2,85 s) : la carte imprimée sous une vitre, sur une couverture de déménagement bleue (une photo Flora,
// comme la vitre de la première vidéo du PSG). Un marteau tenu par une main gantée tapote deux fois (« tink », un petit
// éclat à chaque fois), se lève, attend, et frappe : à T0, la vitre se fend en toile d'araignée (des fissures droites
// depuis l'impact, des anneaux entre elles), un éclair, la secousse, le fracas et la musique ; puis les morceaux de la
// vitre, découpés le long de ces fissures, volent vers l'écran et découvrent la carte en 3D, déjà en mouvement dessous.
// Le marteau est une découpe (fond vert enlevé) qu'on fait tourner autour du poignet : plus grand quand il est levé (plus
// près de l'objectif), flou de bougé pendant la frappe (plusieurs poses dans l'image), son ombre sur le verre.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { entre, expoEntree, expoSortie, FPS, hasard, s, T0 } from "./theme";

const IMPACT = s(T0);
const ECLATS = s(T0 + 0.13); // les morceaux partent
export const FIN_VITRE = s(T0 + 0.66);
/** L'impact, en px de la vidéo : le milieu de Honshū sur la carte imprimée. */
const P: [number, number] = [575, 1010];
const PHOTO_H = 1935, PHOTO_HAUT = -8; // la photo, 1080 px de large

// ---------------------------------------------------------------- la toile d'araignée (fixée une fois pour toutes)
type Pt = [number, number];
const R = hasard(7);
const N = 15;
const ANNEAUX = [0, 26, 72, 150, 255, 400, 600, 860, 1250, 2600];
const K = ANNEAUX.length;
const ANGLES = [...Array(N)].map((_, i) => (i / N) * 2 * Math.PI + (R() - 0.5) * 0.3);
const PTS: Pt[][] = ANGLES.map((a) => ANNEAUX.map((r, k) => {
  if (k === 0) return [P[0], P[1]];
  const aa = a + (R() - 0.5) * 0.12, rr = r * (1 + (R() - 0.5) * 0.16);
  return [P[0] + rr * Math.cos(aa), P[1] + rr * Math.sin(aa)];
}));
const decale = (p: Pt, q: Pt, force: number): Pt => {
  const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1];
  const d = (R() - 0.5) * force;
  return [mx - dy * d, my + dx * d];
};
/** Le milieu (un peu de côté) de chaque bout de fissure droite : [i][k], entre l'anneau k et k + 1. */
const MIL_R: Pt[][] = PTS.map((l) => l.slice(0, K - 1).map((p, k) => decale(p, l[k + 1], 0.22)));
/** Le milieu de chaque bout d'anneau : [k][i], entre les fissures i et i + 1. */
const MIL_A: Pt[][] = ANNEAUX.map((_, k) => PTS.map((l, i) => decale(l[k], PTS[(i + 1) % N][k], 0.25)));

type Morceau = { poly: Pt[]; c: Pt; r: number; alea: number[] };
const MORCEAUX: Morceau[] = [];
for (let i = 0; i < N; i++) {
  const j = (i + 1) % N;
  for (let k = 0; k < K - 1; k++) {
    const poly: Pt[] = [PTS[i][k], MIL_R[i][k], PTS[i][k + 1], MIL_A[k + 1][i], PTS[j][k + 1], MIL_R[j][k]];
    if (k > 0) poly.push(PTS[j][k], MIL_A[k][i]);
    const c: Pt = [poly.reduce((a, p) => a + p[0], 0) / poly.length, poly.reduce((a, p) => a + p[1], 0) / poly.length];
    MORCEAUX.push({ poly, c, r: Math.hypot(c[0] - P[0], c[1] - P[1]), alea: [...Array(7)].map(() => R()) });
  }
}
/** Les fissures visibles : chaque fissure droite jusqu'à un anneau au hasard, et des bouts d'anneaux près de l'impact. */
const FISSURES: { pts: Pt[]; debut: number; long: number }[] = [];
const longueur = (pts: Pt[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
for (let i = 0; i < N; i++) {
  const kmax = 5 + Math.floor(R() * 5);
  const pts: Pt[] = [P];
  for (let k = 0; k < Math.min(kmax, K - 1); k++) pts.push(MIL_R[i][k], PTS[i][k + 1]);
  FISSURES.push({ pts, debut: 0, long: longueur(pts) });
}
for (let k = 1; k <= 5; k++) {
  for (let i = 0; i < N; i++) {
    if (R() < 0.85 - 0.12 * k) {
      const pts: Pt[] = [PTS[i][k], MIL_A[k][i], PTS[(i + 1) % N][k]];
      FISSURES.push({ pts, debut: 1 + k * 0.7, long: longueur(pts) });
    }
  }
}
const ECRASE: Pt[][] = [...Array(26)].map(() => {
  const a = R() * 6.28, r = 4 + R() * 24, l = 6 + R() * 16, b = a + (R() - 0.5) * 2;
  return [[P[0] + r * Math.cos(a), P[1] + r * Math.sin(a)], [P[0] + (r + l) * Math.cos(b), P[1] + (r + l) * Math.sin(b)]];
});
/** Les deux petits éclats des tapotements. */
const etoile = (n: number, lmin: number, lmax: number, o: Pt): Pt[][] => [...Array(n)].map(() => {
  const a = R() * 6.28, l = lmin + R() * (lmax - lmin);
  return [[o[0] + 3 * Math.cos(a), o[1] + 3 * Math.sin(a)], [o[0] + l * Math.cos(a + 0.1), o[1] + l * Math.sin(a + 0.1)]];
});
const ETOILE_1 = etoile(6, 8, 18, [P[0] - 3, P[1] + 2]);
const ETOILE_2 = etoile(8, 14, 44, [P[0] + 2, P[1] - 2]);
const POUSSIERE = [...Array(80)].map(() => ({ a: R() * 6.28, v: 500 + R() * 1500, t: 2 + R() * 4, z: R(), d: R() * 0.08 }));

const chemin = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

// ---------------------------------------------------------------- le marteau
/** La découpe (768 × 1376) : le centre de la panne (le bout rond qui frappe) et le poignet, autour duquel il tourne. */
const PANNE: Pt = [193, 515], POIGNET: Pt = [540, 1150];
const K_IMPACT = 0.6;
/** Où est le poignet dans la vidéo : la panne tombe pile sur l'impact quand le marteau n'est pas tourné. */
const V: Pt = [P[0] + (POIGNET[0] - PANNE[0]) * K_IMPACT, P[1] + (POIGNET[1] - PANNE[1]) * K_IMPACT];
type Pose = { th: number; k: number; dx: number; dy: number };
/** k : la taille relative à celle de l'impact (plus grand = plus près de l'objectif). */
const pose = (th: number, k: number, dx = 0, dy = 0): Pose => ({ th, k: k * K_IMPACT, dx, dy });
const lisse = (u: number) => u * u * (3 - 2 * u);
const accel = (u: number) => Math.pow(u, 2.3);
const frein = (u: number) => 1 - Math.pow(1 - u, 2.3);
const lin = (u: number) => u;
const POSE_IMPACT = pose(0, 1);
/** [seconde, pose, la courbe pour y arriver] */
const CLES: [number, Pose, (u: number) => number][] = [
  [0, pose(10, 1.07), lin],
  [0.36, pose(11.5, 1.09), lisse],
  [0.45, POSE_IMPACT, accel], // premier tapotement
  [0.62, pose(8, 1.06), frein],
  [0.86, pose(9.5, 1.07), lisse],
  [0.95, POSE_IMPACT, accel], // deuxième
  [1.14, pose(11, 1.09), frein],
  [1.24, pose(12, 1.09), lisse],
  [1.7, pose(30, 1.5, 30, 40), lisse], // il se lève (vers l'objectif : plus grand)
  [1.97, pose(31.5, 1.52, 32, 44), lisse], // il attend
  [T0, POSE_IMPACT, accel], // il frappe
  [T0 + 0.1, pose(5, 1.02), frein],
  [T0 + 0.14, pose(5, 1.02), lin],
  [T0 + 0.36, pose(24, 1.31, 640, 820), accel], // il s'en va
];
function poseA(t: number): Pose {
  if (t <= CLES[0][0]) return CLES[0][1];
  for (let i = 1; i < CLES.length; i++) {
    const [t1, p1, courbe] = CLES[i], [t0, p0] = CLES[i - 1];
    if (t <= t1) {
      const u = courbe((t - t0) / (t1 - t0));
      return { th: p0.th + (p1.th - p0.th) * u, k: p0.k + (p1.k - p0.k) * u, dx: p0.dx + (p1.dx - p0.dx) * u, dy: p0.dy + (p1.dy - p0.dy) * u };
    }
  }
  return CLES[CLES.length - 1][1];
}
const styleMarteau = (p: Pose): React.CSSProperties => ({
  position: "absolute", left: V[0] - POIGNET[0], top: V[1] - POIGNET[1], width: 768, height: 1376,
  transformOrigin: `${POIGNET[0]}px ${POIGNET[1]}px`,
  transform: `translate(${p.dx.toFixed(2)}px, ${p.dy.toFixed(2)}px) rotate(${p.th.toFixed(3)}deg) scale(${p.k.toFixed(4)})`,
});

const Marteau: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const p = poseA(t);
  // le flou de bougé : plusieurs poses dans la durée de l'image, chacune d'un poids égal (opacité 1, 1/2, 1/3…)
  const avant = poseA(t - 1 / FPS);
  const vitesse = Math.abs(p.th - avant.th) + Math.abs(p.dx - avant.dx) / 20;
  const n = vitesse > 1.2 ? 10 : 1;
  const poses = [...Array(n)].map((_, j) => poseA(t - (j / n) * (1 / FPS)));
  const h = Math.max(0, (p.k / K_IMPACT - 1) / 0.4) + 0.06; // la hauteur au-dessus du verre (l'ombre s'en écarte)
  return (
    <>
      <Img src={staticFile("img/marteau.png")} style={{
        ...styleMarteau({ ...p, dx: p.dx + 22 + 120 * h, dy: p.dy + 30 + 170 * h }),
        filter: `brightness(0) blur(${(6 + 16 * h).toFixed(1)}px)`, opacity: 0.36 - 0.12 * Math.min(1, h),
      }} />
      {poses.map((q, j) => (
        <Img key={j} src={staticFile("img/marteau.png")} style={{ ...styleMarteau(q), opacity: 1 / (n - j) }} />
      ))}
    </>
  );
};

// ---------------------------------------------------------------- la vitre
const Fissures: React.FC<{ f: number }> = ({ f }) => {
  const g = f - IMPACT;
  const traits = (lignes: Pt[][], large: number) => lignes.map((l, i) => (
    <g key={i}>
      <path d={chemin(l)} stroke="rgba(10,20,30,.5)" strokeWidth={large * 1.9} fill="none" transform="translate(1.2 1.6)" />
      <path d={chemin(l)} stroke="rgba(242,252,255,.95)" strokeWidth={large} fill="none" />
    </g>
  ));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {f >= s(0.45) && traits(ETOILE_1, 1.4)}
      {f >= s(0.95) && traits(ETOILE_2, 1.6)}
      {g >= 0 && FISSURES.map((c, i) => {
        const u = expoSortie(entre(g, c.debut, c.debut + 4));
        if (u <= 0) return null;
        const d = chemin(c.pts);
        return (
          <g key={i} strokeLinecap="round" strokeLinejoin="round">
            <path d={d} stroke="rgba(255,255,255,.28)" strokeWidth={9} fill="none" strokeDasharray={c.long} strokeDashoffset={c.long * (1 - u)} />
            <path d={d} stroke="rgba(10,20,30,.55)" strokeWidth={4} fill="none" transform="translate(1.3 1.8)" strokeDasharray={c.long} strokeDashoffset={c.long * (1 - u)} />
            <path d={d} stroke="rgba(244,253,255,.97)" strokeWidth={2.6} fill="none" strokeDasharray={c.long} strokeDashoffset={c.long * (1 - u)} />
          </g>
        );
      })}
      {g >= 0 && traits(ECRASE, 1.3)}
      {g >= 0 && <circle cx={P[0]} cy={P[1]} r={30} fill="url(#blanc)" />}
      <defs>
        <radialGradient id="blanc"><stop offset="0" stopColor="#fff" stopOpacity={0.95} /><stop offset="0.5" stopColor="#fff" stopOpacity={0.5} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></radialGradient>
      </defs>
    </svg>
  );
};

const Photo: React.FC = () => (
  <Img src={staticFile("img/vitre.jpg")} style={{ position: "absolute", left: 0, top: PHOTO_HAUT, width: 1080, height: PHOTO_H }} />
);

/** Un morceau de la vitre : la photo découpée le long de ses fissures ; il tremble à l'impact, puis s'envole vers l'écran. */
const UnMorceau: React.FC<{ m: Morceau; f: number }> = ({ m, f }) => {
  const [a1, a2, a3, a4, a5, a6, a7] = m.alea;
  const retard = Math.min(0.1, m.r / 5000) * FPS;
  const u = entre(f, ECLATS + retard, ECLATS + retard + s(0.5));
  const e = Math.pow(u, 1.7);
  const dx = (m.c[0] - P[0]) / (m.r || 1), dy = (m.c[1] - P[1]) / (m.r || 1);
  const loin = 160 + 1500 * e * (0.6 + 0.8 * a1);
  const tremble = f < ECLATS ? 1.6 : 0;
  const tx = dx * (u > 0 ? loin : 0) + tremble * (a2 - 0.5), ty = dy * (u > 0 ? loin : 0) + tremble * (a3 - 0.5);
  const tz = e * (380 + 900 * a4);
  const clip = `polygon(${m.poly.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(", ")})`;
  return (
    <div style={{
      position: "absolute", inset: 0, clipPath: clip, transformOrigin: `${m.c[0].toFixed(1)}px ${m.c[1].toFixed(1)}px`,
      transform: `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, ${tz.toFixed(1)}px) rotateX(${(e * (a5 - 0.5) * 160).toFixed(2)}deg) rotateY(${(e * (a6 - 0.5) * 160).toFixed(2)}deg) rotateZ(${(e * (a7 - 0.5) * 90).toFixed(2)}deg)`,
      filter: `brightness(${(0.94 + 0.16 * a2 + 0.5 * e * a3).toFixed(3)})`,
    }}>
      <div style={{ position: "absolute", left: 0, top: PHOTO_HAUT, width: 1080, height: PHOTO_H, backgroundImage: `url(${staticFile("img/vitre.jpg")})`, backgroundSize: "100% 100%" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <polygon points={m.poly.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(245,253,255,.9)" strokeWidth={f >= ECLATS ? 4 : 0} />
      </svg>
    </div>
  );
};

export const Vitre: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= FIN_VITRE) return null;
  const t = f / FPS, g = f - IMPACT;
  // la caméra à la main : une petite dérive, et elle s'approche de l'impact ; la secousse au choc (et un peu aux tapotements)
  const choc = g >= 0 ? 26 * Math.exp(-g / 7) : 0;
  const tape = [s(0.45), s(0.95)].reduce((a, ft) => a + (f >= ft ? 4 * Math.exp(-(f - ft) / 3) : 0), 0);
  const x = 5 * Math.sin(t * 1.3) + 3 * Math.sin(t * 2.9 + 1) + (choc + tape) * Math.sin(f * 2.1);
  const y = 4 * Math.sin(t * 1.1 + 2) + 2 * Math.sin(t * 3.3) + (choc + tape) * Math.cos(f * 2.7);
  const z = 1.03 + 0.05 * expoSortie(entre(f, 0, IMPACT)) + 0.04 * entre(f, s(1.2), IMPACT);
  const brise = f >= IMPACT;
  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <AbsoluteFill style={{
        transformOrigin: `${P[0]}px ${P[1]}px`, perspective: 1100, perspectiveOrigin: `${P[0]}px ${P[1]}px`,
        transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${(0.3 * Math.sin(t * 0.9) + choc * 0.02 * Math.sin(f * 1.7)).toFixed(3)}deg) scale(${z.toFixed(4)})`,
      }}>
        <div style={{ opacity: brise ? 0 : 1 }}><Photo /></div>
        {brise && MORCEAUX.map((m, i) => <UnMorceau key={i} m={m} f={f} />)}
        {f < ECLATS + 2 && <Fissures f={f} />}
        {brise && POUSSIERE.map((p, i) => {
          const u = (g / FPS) - p.d;
          if (u < 0 || u > 0.6) return null;
          const r = p.v * u, sz = p.t * (1 + 3 * p.z * u / 0.6);
          return <div key={i} style={{
            position: "absolute", left: P[0] + r * Math.cos(p.a) - sz / 2, top: P[1] + r * Math.sin(p.a) - sz / 2, width: sz, height: sz, borderRadius: "50%",
            background: "#f4fdff", boxShadow: "0 0 8px rgba(255,255,255,.9)", opacity: 1 - u / 0.6,
          }} />;
        })}
        <Marteau f={f} />
      </AbsoluteFill>
      {brise && <AbsoluteFill style={{ background: `radial-gradient(circle at ${P[0]}px ${P[1]}px, rgba(255,255,255,.95) 0, rgba(255,255,255,.5) 140px, rgba(255,255,255,0) 420px)`, opacity: 1 - expoSortie(entre(g, 0, 10)) }} />}
      {brise && <AbsoluteFill style={{ background: "#fff", opacity: 0.4 * (1 - entre(g, 0, 4)) }} />}
      {/* (l'éclat de lumière au moment où les morceaux partent) */}
      {f >= ECLATS && <AbsoluteFill style={{ background: "#fff", opacity: 0.25 * (1 - expoEntree(entre(f, ECLATS, ECLATS + 6))) }} />}
    </AbsoluteFill>
  );
};
