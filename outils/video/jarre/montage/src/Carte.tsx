// La carte (temps 10 → 42) : ce qu'il y a dans la jarre, et ce qu'on peut y faire. Les prises de la vraie carte (rushes.py) et de
// la balade, une fonction par coupe, sur la grille de la musique ; par-dessus, l'interface du téléphone (captures.py), chaque
// pièce sur son calque, et un doigt : on touche une épingle, sa fiche se déplie, on touche la vidéo et le vrai plan du lieu joue ;
// le bouton Random, le vol, la fiche d'Aogashima ; « Visit in 3D » et le portail vers la balade.
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import layout from "../../../../../videos/carte/jarre/public/ui/layout.json";
import { Credits, Doigt, FOUET, Mots, Plans, TiltShift, UnPlan } from "./Commun";
import { C, entre, expoEntree, expoSortie, houle, rebond, t } from "./theme";
import { T, TROU } from "./temps";

const ANNEAU = 18; // images : le portail s'ouvre sur tout l'écran

// le premier plan de la carte : on le voit d'abord tout petit, au fond de la jarre (voir plongee)
const PREMIER: UnPlan[] = [{ de: T.plongee, a: T.itsuku, src: "rushes/ja-plongee.mp4", v: 1.7, zoom: [1.04, 1.0], entree: "sec" }];
const PLANS: UnPlan[] = [
  { de: T.itsuku, a: T.des, src: "rushes/ja-itsuku.mp4", t0: 0.1, zoom: [1.04, 1.0], entree: "fouet" },
  { de: T.des, a: T.saisons, src: "rushes/ja-vol.mp4", zoom: [1, 1], entree: "fouet" },
  { de: T.saisons, a: t(25.75), src: "rushes/p-printemps.mp4", t0: 0.8, entree: "flash" },
  { de: t(25.75), a: t(26.5), src: "rushes/p-ete.mp4", t0: 0.9, entree: "punch" },
  { de: t(26.5), a: t(27.25), src: "rushes/p-automne.mp4", t0: 1.0, entree: "punch" },
  { de: t(27.25), a: T.mer, src: "rushes/p-hiver.mp4", t0: 1.1, entree: "punch" },
  { de: T.mer, a: T.legende, src: "rushes/ja-mer.mp4", t0: 0.3, zoom: [1.5, 1.62], centre: [0.58, 0.47], entree: "fouet" },
  { de: T.legende, a: T.route, src: "rushes/ja-legende.mp4", zoom: [1.3, 1.36], centre: [0.5, 0.56], entree: "punch" },
  { de: T.route, a: T.gel, src: "rushes/ja-route.mp4", zoom: [1.05, 1.0], entree: "fouet" },
  { de: T.gel, a: T.portail, src: "rushes/ja-route.mp4", t0: (T.gel - T.route) / 60, zoom: [1, 1], gel: true },
  { de: T.portail, a: T.balade + ANNEAU, src: "rushes/ja-itsuku.mp4", t0: 2.0, zoom: [1.1, 1.1], assombrir: 0.28, flou: 9, entree: "flash" },
];
// la balade : elle s'ouvre par le portail (dessinée au-dessus), une coupe sur le temps
const BALADE: UnPlan[] = [
  { de: T.balade, a: t(39.33), src: "rushes/mt-tunnel.mp4", t0: 1.0, zoom: [1.1, 1.02], entree: "sec" },
  { de: t(39.33), a: t(40.67), src: "rushes/tk-barque.mp4", t0: 1.4, zoom: [1.1, 1.0], entree: "punch" },
  { de: t(40.67), a: T.fin, src: "rushes/kk-feux.mp4", t0: 4.0, zoom: [1.12, 1.03], entree: "punch" },
];

/** La balade dans le portail : un cercle qui grandit depuis le bouton, cerclé d'or le temps qu'il s'ouvre. */
const Balade: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.balade || f >= T.fin) return null;
  const r = 1500 * expoSortie(entre(f, T.balade, T.balade + ANNEAU)) ** 1.4;
  const ouvert = f >= T.balade + ANNEAU;
  return (
    <>
      <AbsoluteFill style={{ zIndex: 20, clipPath: ouvert ? undefined : `circle(${r.toFixed(1)}px at 540px 930px)` }}><Plans plans={BALADE} /></AbsoluteFill>
      {!ouvert && (
        <div style={{
          position: "absolute", zIndex: 21, left: 540 - r, top: 930 - r, width: 2 * r, height: 2 * r, borderRadius: "50%",
          border: "14px solid #ffe9b0", boxShadow: "0 0 60px 18px rgba(255,214,120,.8), inset 0 0 60px 18px rgba(255,214,120,.8)",
        }} />
      )}
    </>
  );
};

// la fiche d'un lieu, plus petite que la page : elle flotte, sa photo fait la largeur (px de la vidéo)
const L_FICHE = 920, K_FICHE = L_FICHE / 432;
const FICHE_H = Math.round(layout.fiches.itsukushima.fiche[3] * K_FICHE);
const MEDIA = layout.fiches.itsukushima.media.map((v) => v * K_FICHE);

/** Une fiche, dépliée face caméra (charnière en bas, le ressort « nerveux »), qui flotte. */
const Fiche: React.FC<{ nom: string; de: number; a: number; bas: number; apres?: number }> = ({ nom, de, a, bas, apres = 0 }) => {
  const f = useCurrentFrame();
  if (f < de - 2 || f >= a) return null;
  const v = rebond(f, de);
  return (
    <AbsoluteFill style={{ perspective: 2000, perspectiveOrigin: "540px 900px", zIndex: 40 }}>
      <div style={{
        position: "absolute", left: 540 - L_FICHE / 2, top: bas - FICHE_H, width: L_FICHE, height: FICHE_H, transformOrigin: "50% 100%",
        transform: `translate3d(0, ${(180 * apres).toFixed(1)}px, ${(70 + 60 * (1 - v)).toFixed(1)}px) rotateX(${(-100 * (1 - v) + 2.5 * houle(f, 3.3)).toFixed(3)}deg) rotateY(${(4 * houle(f, 4.1, 0.6)).toFixed(3)}deg) scale(${(1 - 0.12 * apres).toFixed(4)})`,
        opacity: Math.min(1, (f - de + 2) / 4), filter: `drop-shadow(0 40px 60px rgba(30,20,10,.55))${apres > 0 ? ` blur(${(10 * apres).toFixed(1)}px) brightness(${1 - 0.3 * apres})` : ""}`,
      }}>
        <Img src={staticFile(`ui/fiche-${nom}.png`)} style={{ width: L_FICHE, height: FICHE_H }} />
      </div>
    </AbsoluteFill>
  );
};

/** La vraie vidéo du lieu : elle part de la photo de la fiche et grandit jusqu'au format 9:16 du lecteur, dans le cadre de papier
 *  de la carte. */
const Reel: React.FC<{ bas: number }> = ({ bas }) => {
  const f = useCurrentFrame();
  if (f < T.reel || f >= T.des + FOUET / 2) return null;
  const v = rebond(f, T.reel, 300, 20);
  const x0 = 540 - L_FICHE / 2 + MEDIA[0], y0 = bas - FICHE_H + MEDIA[1], w0 = MEDIA[2], h0 = MEDIA[3];
  const w1 = 700, h1 = 1244, x1 = 540 - w1 / 2, y1 = 372;
  const w = w0 + (w1 - w0) * v, h = h0 + (h1 - h0) * v, x = x0 + (x1 - x0) * v, y = y0 + (y1 - y0) * v;
  const sortie = expoEntree(entre(f, T.des - FOUET / 2, T.des + FOUET * 0.2));
  return (
    <div style={{
      position: "absolute", zIndex: 45, left: x, top: y, width: w, height: h, borderRadius: 26, overflow: "hidden", background: C.clair,
      border: `8px solid ${C.clair}`, boxShadow: `0 0 0 3px ${C.encre}, 0 36px 80px rgba(0,0,0,.6)`, transform: `translateX(${(-1300 * sortie).toFixed(1)}px) rotate(${(-1.2 * v).toFixed(2)}deg)`,
    }}>
      <Sequence from={T.reel} layout="none">
        <OffthreadVideo src={staticFile("reels/itsukushima.mp4")} muted trimBefore={30} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: 18 }} />
      </Sequence>
    </div>
  );
};

/** Un bouton de l'interface, en grand (largeur l), qui surgit en (x, y) et s'enfonce quand on le touche. */
const Bouton: React.FC<{ src: string; de: number; appui: number; a: number; x: number; y: number; l: number; ratio: number }> = ({ src, de, appui, a, x, y, l, ratio }) => {
  const f = useCurrentFrame();
  if (f < de || f >= a) return null;
  const v = rebond(f, de);
  const presse = f >= appui ? 1 - 0.14 * Math.exp(-(f - appui) / 5) : 1;
  const sortie = expoEntree(entre(f, appui + 6, a));
  return (
    <Img src={staticFile(src)} style={{
      position: "absolute", zIndex: 50, left: x - l / 2, top: y - (l * ratio) / 2, width: l, height: l * ratio,
      transform: `scale(${((0.3 + 0.7 * v) * presse * (1 - 0.8 * sortie)).toFixed(4)}) rotate(${(-8 * (1 - v)).toFixed(2)}deg)`,
      opacity: Math.min(1, (f - de + 1) / 3) * (1 - sortie), filter: "drop-shadow(0 26px 40px rgba(0,0,0,.5))",
    }} />
  );
};

/** La carte au fond de la jarre : elle tient dans le trou (son centre sur celui du trou, 62 % de sa taille), et vient vers nous
 *  bien plus vite que la jarre : le trou ne montre jamais son bord. */
const plongee = (f: number) => {
  const p = expoSortie(entre(f, T.ouvre, T.ouvre + 24));
  return `translate(${((TROU[0] - 540) * (1 - p)).toFixed(1)}px, ${((TROU[1] - 960) * (1 - p)).toFixed(1)}px) scale(${(0.62 + 0.38 * p).toFixed(4)})`;
};

export const Carte: React.FC = () => {
  const f = useCurrentFrame();
  // le flou derrière la fiche d'Itsukushima
  const derriere = Math.min(expoSortie(entre(f, T.fiche - 3, T.fiche + 16)), 1 - entre(f, T.des - 2, T.des));
  const reel = rebond(f, T.reel, 300, 20);
  const BAS_FICHE = 1560;
  return (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <AbsoluteFill style={{ transform: plongee(f) }}><Plans plans={PREMIER} /></AbsoluteFill>
      <Plans plans={PLANS} />
      <Balade />
      {f >= T.itsuku && f < T.des && <TiltShift flou={12 * derriere} net={0} z={30} />}
      <AbsoluteFill style={{ zIndex: 35, background: "linear-gradient(rgba(0,0,0,.3) 0px, rgba(0,0,0,0) 560px)", opacity: f >= T.plongee + 15 && f < T.fin ? 1 : 0 }} />

      <Mots texte={"*150+* PLACES"} de={t(12.75)} a={t(14.25)} />
      <Mots texte={"ONE *3D* MAP"} de={t(14.25)} a={T.itsuku} />

      {/* on touche une épingle ; sa fiche ; sa vidéo */}
      <Doigt de={T.itsuku + 8} appui={T.tapEpingle} x0={900} y0={1180} x={EPINGLE[0]} y={EPINGLE[1]} />
      <Fiche nom="itsukushima" de={T.fiche} a={T.des} bas={BAS_FICHE} apres={f >= T.reel ? reel : 0} />
      <Doigt de={T.fiche + 9} appui={T.tapVideo} x0={880} y0={1260} x={540} y={BAS_FICHE - FICHE_H + MEDIA[1] + MEDIA[3] / 2} />
      <Reel bas={BAS_FICHE} />
      <Mots texte={"TAP A *PIN*"} de={T.itsuku + 6} a={T.reel} />
      <Mots texte={"WATCH THE *VIDEO*"} de={T.reel} a={T.des} y={208} taille={88} />

      {/* le dé */}
      <Bouton src="ui/hasard.png" de={T.des + 4} appui={T.tapDes} a={T.tapDes + 16} x={540} y={1000} l={430} ratio={layout.hasard.image[3] / layout.hasard.image[2]} />
      <Doigt de={T.des + 7} appui={T.tapDes} x0={860} y0={1300} x={540} y={1000} />
      <Fiche nom="aogashima" de={T.ficheDes} a={T.saisons} bas={2080} />
      <Mots texte={"ROLL THE *DICE*"} de={T.des} a={T.saisons} />

      <Mots texte={"*4* SEASONS"} de={T.saisons} a={T.mer} />
      <Mots texte={"LIVING *SEA*"} de={T.mer} a={T.legende} />
      <Doigt de={T.legende + 4} appui={T.legende + 20} x0={860} y0={1460} x={LEGENDE[0]} y={LEGENDE[1]} />
      <Mots texte={"HIDDEN *LEGENDS*"} de={T.legende} a={T.route} y={1282} taille={80} />
      <Mots texte={"PLAN YOUR\nROAD *TRIP*"} de={T.route} a={T.gel} y={240} taille={96} />

      {/* le portail */}
      <Bouton src="ui/bouton-3d.png" de={T.portail} appui={T.tapPortail} a={T.balade + 6} x={540} y={930} l={820} ratio={185 / 550} />
      <Doigt de={T.portail + 4} appui={T.tapPortail} x0={860} y0={1260} x={600} y={930} />
      <Mots texte={"WALK IT\nIN *3D*"} de={T.balade + 2} a={T.fin} y={250} taille={110} />

      <Credits visible={f >= T.plongee + 15 && f < T.balade} />
    </AbsoluteFill>
  );
};

// (px de la vidéo : mesurés sur les prises)
const EPINGLE: [number, number] = [540, 680];
const LEGENDE: [number, number] = [544, 1150];
