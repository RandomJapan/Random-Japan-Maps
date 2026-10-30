// La carte (8,6 → 30 s) : trois prises de la vraie carte (rushes.py), plein cadre, sur un plan en 3D qui « virevolte »
// (arrivée en rebond, houle lente, panoramiques éclair d'une prise à l'autre, recul final), avec par-dessus les
// boutons du site de téléphone (captures.py), chacun sur son calque, qui surgissent en rebondissant. Trois arrêts :
// les épingles qui surgissent (13 s, dans la prise même), la fiche d'Aogashima qui se déplie en 3D face caméra
// (18 s, la carte floue derrière), le menu des catégories (22 s) qui ne garde que les sanctuaires.
// La profondeur de champ : un flou à bascule (tilt-shift) en haut et en bas de l'image, réglable (flou, bande nette).
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import layout from "../../../../../videos/carte/tunnel/public/ui/layout.json";
import { Doigt } from "./TikTok";
import { C, entre, expoEntree, expoS, expoSortie, houle, POLICE_TIKTOK, rebond, s } from "./theme";
import { T } from "./temps";

const K = 2.5; // px de la page de téléphone (432 × 768) → px de la vidéo (1080 × 1920)

/** Le flou à bascule : la vidéo derrière est floue en haut et en bas, nette dans une bande au milieu (net : la
 *  demi-hauteur de la bande, en fraction de l'image ; 0 = tout flou). */
const TiltShift: React.FC<{ flou: number; net: number }> = ({ flou, net }) => {
  if (flou < 0.2) return null;
  const c2 = Math.max(0, 50 - net * 100), c3 = Math.min(100, 50 + net * 100);
  const masque = net <= 0.001 ? "linear-gradient(#000, #000)"
    : `linear-gradient(#000 0%, #000 ${Math.max(0, c2 - 18)}%, transparent ${c2}%, transparent ${c3}%, #000 ${Math.min(100, c3 + 18)}%, #000 100%)`;
  return <AbsoluteFill style={{ backdropFilter: `blur(${flou.toFixed(2)}px)`, WebkitMaskImage: masque, maskImage: masque }} />;
};

/** Une prise de la carte sur son plan 3D. */
const Prise: React.FC<{ nom: string; debut: number; transform: string; filtre?: string }> = ({ nom, debut, transform, filtre }) => (
  <AbsoluteFill style={{ transform, filter: filtre }}>
    <Sequence from={debut} layout="none">
      <OffthreadVideo src={staticFile(`rushes/${nom}.mp4`)} muted style={{ position: "absolute", inset: 0, width: 1080, height: 1920, objectFit: "cover" }} />
    </Sequence>
  </AbsoluteFill>
);

function plan(f: number, ox = 0, oy = 0, rzEnPlus = 0, sc = 1, rxEnPlus = 0, ryEnPlus = 0) {
  const rx = 3 + 2 * houle(f, 5.2) + rxEnPlus, ry = 2.2 * houle(f, 6.4, 1) + ryEnPlus, rz = 0.7 * houle(f, 7.9, 2) + rzEnPlus;
  return `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${(1.1 * sc).toFixed(5)})`;
}

/** La fiche d'Aogashima, capturée sur le site (le tiroir du bas du téléphone) : elle se déplie face caméra
 *  (charnière en bas, le ressort « nerveux »), flotte, puis repart en basculant. */
const Fiche: React.FC = () => {
  const f = useCurrentFrame();
  const [a, z] = T.fiche;
  if (f < a - 2 || f > z + s(0.35)) return null;
  const v = rebond(f, a);
  const sortie = expoEntree(entre(f, z, z + s(0.32)));
  const L = 920, H = Math.round(L * (layout.fiche[3] / layout.fiche[2]));
  const rx = -100 * (1 - v) + 88 * sortie + 2.5 * houle(f, 3.3);
  const ry = 4 * houle(f, 4.1, 0.6) * (1 - sortie);
  return (
    <AbsoluteFill style={{ perspective: 2000, perspectiveOrigin: "540px 900px" }}>
      <div style={{
        position: "absolute", left: 540 - L / 2, top: 1460 - H, width: L, height: H, transformOrigin: "50% 100%",
        transform: `translate3d(0, ${(-160 * sortie).toFixed(1)}px, ${(70 + 60 * (1 - v)).toFixed(1)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`,
        opacity: Math.min(1, (f - a + 2) / 4) * (1 - sortie * sortie),
      }}>
        <Img src={staticFile("ui/fiche-aogashima.png")} style={{ width: L, height: H, filter: "drop-shadow(0 40px 60px rgba(30,20,10,.55))" }} />
      </div>
    </AbsoluteFill>
  );
};

// le menu des catégories, découpé en bandes (l'en-tête, puis les quatre premières catégories) qui arrivent l'une
// après l'autre ; la carte reste visible dessous (les épingles s'y effacent puis reviennent)
const MENU = layout.menu;
const BANDES: [number, number][] = [[0, 107], ...MENU.lignes.slice(1, 5).map((l) => [l.boite[1], l.boite[3]] as [number, number]), [MENU.boite[3] - 9, 9]];
const Menu: React.FC = () => {
  const f = useCurrentFrame();
  const [a, z] = T.menu;
  if (f < a || f > z + s(0.6)) return null;
  const etat = f < T.tapRien + 3 ? "tout" : f < T.tapSanctuaires + 3 ? "rien" : "sanctuaires";
  const [mx, my, mw, mh] = MENU.boite;
  let y = 0;
  return (
    <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: "540px 300px" }}>
      {BANDES.map(([sy, h], i) => {
        const top = (my + y) * K;
        y += i === 0 ? 107 : h;
        const v = rebond(f, a + i * 2.4);
        const sortie = expoEntree(entre(f, z + (BANDES.length - i) * 1.6, z + (BANDES.length - i) * 1.6 + s(0.3)));
        return (
          <div key={i} style={{
            position: "absolute", left: mx * K, top, width: mw * K, height: (i === 0 ? 107 : h) * K + 1,
            backgroundImage: `url(${staticFile(`ui/menu-${etat}.png`)})`, backgroundSize: `${mw * K}px ${mh * K}px`, backgroundPosition: `0 ${-sy * K}px`,
            transform: `translate3d(0, ${(-110 * (1 - v) - 1500 * sortie).toFixed(1)}px, ${(220 * (1 - v)).toFixed(1)}px) rotateX(${(-38 * (1 - v)).toFixed(2)}deg)`,
            transformOrigin: "50% 0", opacity: Math.min(1, (f - a - i * 2.4) / 4),
            boxShadow: "0 18px 30px rgba(40,26,14,.22)",
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Les boutons du site de téléphone, chacun sur son calque (z) : ils surgissent l'un après l'autre. */
const ORDRE = ["logo", "horloge", "favoris", "hasard", "menu", "chercher", "rose", "pres", "recentrer"] as const;
const Interface: React.FC<{ part: number; flou: number }> = ({ part, flou }) => {
  const f = useCurrentFrame();
  if (f < T.ui - 2 || part >= 1) return null;
  return (
    <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "540px 960px", filter: flou > 0.2 ? `blur(${flou.toFixed(2)}px)` : undefined, opacity: 1 - part }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: plan(f, 0, 0, 0, 1 / 1.1) }}>
        {ORDRE.map((nom, i) => {
          const b = layout.boutons[nom].image;
          const v = rebond(f, T.ui + i * 3.5);
          return (
            <Img key={nom} src={staticFile(`ui/${nom}.png`)} style={{
              position: "absolute", left: b[0] * K, top: b[1] * K, width: b[2] * K, height: b[3] * K,
              transform: `translateZ(${(36 + 170 * (1 - v) - 300 * part).toFixed(1)}px) scale(${(0.5 + 0.5 * v).toFixed(4)})`,
              opacity: Math.min(1, Math.max(0, (f - T.ui - i * 3.5) / 4)),
            }} />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Une étiquette d'arrêt (pour qui regarde sans le son), qui surgit en rebondissant. */
const Etiquette: React.FC<{ texte: string; de: number; a: number; y: number }> = ({ texte, de, a, y }) => {
  const f = useCurrentFrame();
  if (f < de || f > a + s(0.3)) return null;
  const v = rebond(f, de), sortie = expoEntree(entre(f, a, a + s(0.25)));
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center",
      transform: `translateY(${(36 * (1 - v)).toFixed(1)}px) scale(${((0.62 + 0.38 * v) * (1 - 0.2 * sortie)).toFixed(4)})`, opacity: Math.min(1, (f - de) / 4) * (1 - sortie),
    }}>
      <div style={{
        fontFamily: POLICE_TIKTOK, fontWeight: 800, fontSize: 50, color: C.noir, background: "rgba(255,255,255,.95)", padding: "20px 40px",
        borderRadius: 999, boxShadow: "0 14px 34px rgba(0,0,0,.28)", display: "flex", alignItems: "center", gap: 18,
      }}>
        <span style={{ width: 18, height: 18, borderRadius: "50%", background: C.rougeTiktok }} />{texte}
      </div>
    </div>
  );
};

export const Carte: React.FC = () => {
  const f = useCurrentFrame();
  // A : tout le Japon, puis les épingles ; arrivée en rebond (le blanc du lien s'ouvre sur elle)
  const vA = rebond(f, T.carte);
  const punch = 1 + 0.035 * Math.sin(Math.PI * entre(f, T.epingles, T.epingles + s(0.5)));
  const uA = entre(f, T.fouet1[0], T.fouet1[1]);
  const planA = plan(f, -1300 * expoEntree(uA), 0, -6 * (1 - vA), (1.22 - 0.22 * vA) * punch, 0, 20 * expoEntree(uA));
  // B : Aogashima (arrive de droite, repart à gauche)
  const eB = expoSortie(entre(f, T.aoga, T.aoga + s(0.3))), uB = entre(f, T.fouet2[0], T.fouet2[1]);
  const planB = plan(f, 1300 * (1 - eB) - 1300 * expoEntree(uB), 0, 0, 1, 0, -20 * (1 - eB) + 20 * expoEntree(uB));
  // C : l'ouest du Japon, les filtres, puis la fin : la carte recule, bascule et s'assombrit
  const eC = expoSortie(entre(f, T.filtres, T.filtres + s(0.3)));
  const r = expoS(entre(f, T.fin, T.fin + s(0.95)));
  const planC = plan(f, 1300 * (1 - eC), -70 * r, 0, 1 - 0.2 * r, 24 * r, -20 * (1 - eC));
  // la profondeur de champ : légère en survol, toute floue derrière la fiche
  const fiche = Math.min(expoSortie(entre(f, T.fiche[0] - 3, T.fiche[0] + s(0.3))), 1 - expoSortie(entre(f, T.fiche[1], T.fiche[1] + s(0.3))));
  const flou = 4.5 + 10 * fiche, net = 0.25 * (1 - fiche);
  return (
    <AbsoluteFill style={{ background: "#0d1a1c" }}>
      <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "540px 960px" }}>
        {f < T.fouet1[1] + 2 && <Prise nom="tn-japon" debut={T.carte} transform={planA} />}
        {f >= T.aoga - 1 && f < T.fouet2[1] + 2 && <Prise nom="tn-aogashima" debut={T.aoga} transform={planB} filtre={fiche > 0 ? `brightness(${1 - 0.18 * fiche})` : undefined} />}
        {f >= T.filtres - 1 && <Prise nom="tn-filtres" debut={T.filtres} transform={planC} filtre={r > 0 ? `brightness(${1 - 0.64 * r}) blur(${(3 * r).toFixed(2)}px)` : undefined} />}
      </AbsoluteFill>
      <TiltShift flou={flou * (1 - r)} net={net} />
      <Interface part={entre(f, T.fin, T.fin + s(0.4))} flou={9 * fiche} />
      <Etiquette texte="One 3D map · 140 places" de={s(9.55)} a={s(12.6)} y={330} />
      <Etiquette texte="Every pin = a video" de={s(13.25)} a={s(16.8)} y={330} />
      <Etiquette texte="Tap a place" de={s(17.95)} a={s(20.9)} y={250} />
      <Etiquette texte="Filter in one tap" de={s(22.35)} a={s(24.6)} y={860} />
      <AbsoluteFill style={{ perspective: 1600 }}><Doigt chemin={[[s(17.45), 900, 1180], [s(17.84), 596, 772]]} appui={s(17.88)} z={0} clair /></AbsoluteFill>
      <Fiche />
      <Menu />
      <AbsoluteFill style={{ perspective: 1600 }}>
        <Doigt chemin={[[s(22.2), 940, 760], [s(22.52), 782, 240]]} appui={T.tapRien} z={0} />
        <Doigt chemin={[[s(22.75), 782, 240], [s(23.02), 101, 350]]} appui={T.tapSanctuaires} z={0} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 30, bottom: 8, fontFamily: POLICE_TIKTOK, fontSize: 23, fontWeight: 600, color: "rgba(255,255,255,.92)",
        textShadow: "0 1px 4px rgba(0,0,0,.6)", opacity: f < T.ui ? 0 : 1 }}>© Mapterhorn · © OpenStreetMap · Natural Earth</div>
    </AbsoluteFill>
  );
};

