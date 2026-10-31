// La carte (3 → 18 s) : les prises de la vraie carte (rushes.py) sur un plan 3D qui flotte, d'une prise à l'autre par
// des panoramiques éclair, comme la vidéo « tunnel ».
// - les chapeaux (3 → 5 s) : le Kansai, les chapeaux de sorcière tombent sur les épingles (dans la prise même) ;
// - le panneau (5 → 7 s) : la carte floue derrière, le bouton d'Halloween de l'écran du téléphone (capturé, avec ses
//   6/7) surgit au milieu, un doigt le touche, le panneau « Halloween in Japan » se déplie face caméra, le doigt touche
//   « Summon the parade », le panneau repart et la mise au point découvre le défilé ;
// - le défilé (7 → 9 s) : tout le cortège traverse Kyoto, le sceau 百鬼夜行 frappé ;
// - trois gros plans (9 → 12 s, un par seconde, coupés au zoom sur le temps) : la lanterne, l'ombrelle, le kappa, leur
//   nom à côté d'eux (leur place lue dans les boîtes notées au tournage) ;
// - la chasse (12 → 15 s) : six yōkai trouvés, on touche Enma, sa bulle, « Hunt complete! » (l'interface du téléphone) ;
// - minuit (15 → 18 s) : le défilé sous les épingles à chapeau, l'horloge revient, trois tics, minuit : la cloche, un
//   éclair, tout disparaît dans des nuages de fumée (aux places des yōkai) ; la carte reste, vide et grise.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import layout from "../../../../../videos/carte/minuit/public/ui/layout.json";
import procheJson from "../../../../../videos/carte/minuit/public/rushes/mn-proche.json";
import minuitJson from "../../../../../videos/carte/minuit/public/rushes/mn-minuit.json";
import { Credits, Doigt, Etiquette, Flash, NomYokai, plan, Prise, Sceau, TiltShift } from "./Commun";
import { Horloge } from "./Horloge";
import { b, C, entre, expoEntree, expoS, expoSortie, hasard, houle, rebond, s, secousse } from "./theme";
import { secondesHorloge, T } from "./temps";

type Boite = [number, number, number, number] | null;
const proche = procheJson as unknown as { images: Boite[][] };
const minuitBoites = minuitJson as unknown as { images: Boite[][] };

// ---------------------------------------------------------------- le panneau d'Halloween et son bouton
const PANNEAU = layout.panneau;
const LP = 900, KP = LP / PANNEAU.boite[2], HP = Math.round(PANNEAU.boite[3] * KP), XP = (1080 - LP) / 2, YP = 390;
const BOUTON_DEFILE = { x: XP + (PANNEAU.bouton[0] + PANNEAU.bouton[2] / 2) * KP, y: YP + (PANNEAU.bouton[1] + PANNEAU.bouton[3] / 2) * KP };
const BH = layout.boutons.halloween.image; // [x, y, l, h] en px CSS de la page 432 × 768
const LB = 400, HB = Math.round(LB * (BH[3] / BH[2])), XB = 540, YB = 900; // le bouton en grand, au milieu

const Panneau: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.bouton || f > T.panneau[1] + s(0.4)) return null;
  // le bouton : il surgit, le doigt l'enfonce, puis il se fond dans le panneau qui se déplie
  const vB = rebond(f, T.bouton);
  const presse = f >= T.tapBouton && f < T.tapBouton + 5 ? 0.86 : 1;
  const fondu = expoEntree(entre(f, T.panneau[0], T.panneau[0] + s(0.18)));
  const pulse = 0.6 + 0.4 * Math.sin((f - T.bouton) / 5);
  // le panneau : charnière en bas, le ressort ; la caméra s'approche du bouton du défilé ; il repart en basculant
  const [a, z] = T.panneau;
  const v = rebond(f, a);
  const sortie = expoEntree(entre(f, z, z + s(0.3)));
  const approche = expoS(entre(f, s(5.95), T.tapDefile - 2));
  const rx = -100 * (1 - v) + 88 * sortie + 2 * houle(f, 3.3);
  const appuye = f >= T.tapDefile && f < T.tapDefile + 6;
  return (
    <AbsoluteFill style={{ perspective: 2000, perspectiveOrigin: "540px 1000px" }}>
      {fondu < 1 && (
        <div style={{
          position: "absolute", left: XB - LB / 2, top: YB - HB / 2, width: LB, height: HB,
          transform: `scale(${((0.3 + 0.7 * vB) * presse * (1 + 0.6 * fondu)).toFixed(4)})`, opacity: Math.min(1, (f - T.bouton) / 4) * (1 - fondu),
        }}>
          <div style={{ position: "absolute", inset: -140, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(255,154,60,${(0.55 * pulse).toFixed(3)}), rgba(122,79,208,${(0.25 * pulse).toFixed(3)}) 60%, transparent)` }} />
          <Img src={staticFile("ui/halloween.png")} style={{ position: "relative", width: LB, height: HB }} />
        </div>
      )}
      {f >= a - 1 && (
        <div style={{
          position: "absolute", left: XP, top: YP, width: LP, height: HP, transformOrigin: "50% 100%",
          transform: `translate3d(0, ${(-160 * sortie).toFixed(1)}px, ${(60 * (1 - v)).toFixed(1)}px) rotateX(${rx.toFixed(3)}deg)`,
          opacity: Math.min(1, (f - a + 1) / 4) * (1 - sortie * sortie),
        }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: `${BOUTON_DEFILE.x - XP}px ${BOUTON_DEFILE.y - YP}px`, transform: `scale(${(1 + 0.07 * approche).toFixed(4)})` }}>
            <Img src={staticFile("ui/panneau.png")} style={{ width: LP, height: HP, borderRadius: 26, filter: "drop-shadow(0 40px 60px rgba(10,6,14,.6))" }} />
            {appuye && (
              <div style={{ position: "absolute", left: PANNEAU.bouton[0] * KP, top: PANNEAU.bouton[1] * KP, width: PANNEAU.bouton[2] * KP, height: PANNEAU.bouton[3] * KP, borderRadius: 8, background: "rgba(0,0,0,.22)" }} />
            )}
          </div>
        </div>
      )}
      <Doigt chemin={[[T.bouton + 8, 780, 1500], [T.tapBouton - 3, XB + 30, YB + 20]]} appui={T.tapBouton} />
      <Doigt chemin={[[a + s(0.35), 860, 1720], [T.tapDefile - 3, BOUTON_DEFILE.x + 60, BOUTON_DEFILE.y + 8]]} appui={T.tapDefile} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- les gros plans
const PROCHES = [
  { depuis: 1.0, rang: 0, nom: "Chōchin-obake", japonais: "提灯お化け" },
  { depuis: 3.6, rang: 2, nom: "Kasa-obake", japonais: "傘お化け" },
  { depuis: 6.2, rang: 4, nom: "Kappa", japonais: "河童" },
];
/** La boîte d'un yōkai dans une prise (px de la vidéo), à la seconde t de la prise. */
const boite = (donnees: { images: Boite[][] }, rang: number, t: number): Boite => {
  const i = Math.max(0, Math.min(donnees.images.length - 1, Math.round(t * 60)));
  return donnees.images[i]?.[rang] ?? null;
};
/** Un point de la prise (px) → l'écran, à travers le plan (échelle autour du centre). */
const versEcran = (x: number, y: number, echelle: number) => [540 + (x - 540) * echelle, 960 + (y - 960) * echelle];

const GrosPlans: React.FC = () => {
  const f = useCurrentFrame();
  const k = PROCHES.findIndex((_, i) => f >= T.proches[i] && f < (T.proches[i + 1] ?? T.fouet2[1] + 2));
  if (f < T.proches[0] || k < 0) return null;
  const p = PROCHES[k], debut = T.proches[k];
  const punch = 1 + 0.2 * (1 - rebond(f, debut, 520, 26));
  const sortie = k === 2 ? expoEntree(entre(f, T.fouet2[0], T.fouet2[1])) : 0;
  const [sx, sy] = secousse(f, debut, 16, 0.3);
  const echelle = 1.1 * punch;
  const bx = boite(proche, p.rang, p.depuis + (f - debut) / 60);
  const [ex, ey] = bx ? versEcran(bx[0] + bx[2] / 2, bx[1], echelle) : [540, 700];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "540px 960px" }}>
        <Prise nom="mn-proche" debut={debut} depuis={p.depuis} transform={plan(f, sx - 1300 * sortie, sy, 0, punch, 0, 20 * sortie, 0.5)} />
      </AbsoluteFill>
      {/* le projecteur : le yōkai nommé dans la lumière, le reste dans l'ombre */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${ex.toFixed(0)}px ${(ey + 120).toFixed(0)}px, rgba(0,0,0,0) 210px, rgba(6,4,12,.62) 520px)`, opacity: 1 - sortie }} />
      <NomYokai nom={p.nom} japonais={p.japonais} de={debut + 3} a={debut + s(1.0) - 2} x={Math.min(760, Math.max(320, ex))} y={Math.max(300, ey - 40)} />
      <Flash de={debut} force={0.55} duree={7} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- minuit : la fumée aux places des yōkai
const Fumees: React.FC = () => {
  const f = useCurrentFrame();
  const de = T.cloche;
  if (f < de || f > de + s(1.4)) return null;
  const membres = (minuitBoites.images[Math.min(minuitBoites.images.length - 1, s(1.5) - 1)] as Boite[]).filter((m): m is [number, number, number, number] => !!m && m[2] > 0);
  const echelle = 1.1;
  return (
    <AbsoluteFill>
      {membres.map(([x, y, w, h], i) => {
        const [cx, cy] = versEcran(x + w / 2, y + h * 0.55, echelle);
        const u = (f - de - i * 1.2) / s(1.1);
        if (u < 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: cx, top: cy }}>
            {Array.from({ length: 7 }, (_, j) => {
              const a = (j / 7) * Math.PI * 2 + hasard(i * 7 + j) * 0.8;
              const d = 18 + 70 * expoSortie(Math.min(1, u * 1.4)) * (0.6 + 0.4 * hasard(j + i));
              const r = (38 + 26 * hasard(j * 3 + i)) * (0.5 + 0.9 * expoSortie(Math.min(1, u * 1.6)));
              return (
                <div key={j} style={{
                  position: "absolute", left: Math.cos(a) * d - r, top: Math.sin(a) * d * 0.7 - r - 30 * u, width: 2 * r, height: 2 * r, borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 35%, rgba(246,238,219,.95), rgba(200,190,215,.75) 55%, rgba(150,140,170,0) 72%)",
                  opacity: Math.max(0, 1 - u * u),
                }} />
              );
            })}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** L'horloge de minuit : elle tombe d'en haut au ressort, bat trois secondes, frappe minuit, puis s'en va. */
const HorlogeMinuit: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.horloge2 || f > T.cloche + s(0.75)) return null;
  const v = rebond(f, T.horloge2);
  const coup = f >= T.cloche ? 0.14 * Math.exp(-(f - T.cloche) / 10) * Math.cos((f - T.cloche) / 3) : 0;
  const part = expoEntree(entre(f, T.cloche + s(0.3), T.cloche + s(0.75)));
  const [sx, sy] = secousse(f, T.cloche, 22, 0.4);
  return (
    <AbsoluteFill style={{ opacity: 1 - part }}>
      <Horloge cx={540 + sx} cy={640 - 520 * (1 - v) + sy} zoom={(0.78 + coup) * (1 + 0.5 * part)} rotation={10 * (1 - v)} secondes={secondesHorloge(f)} />
    </AbsoluteFill>
  );
};

export const Carte: React.FC = () => {
  const f = useCurrentFrame();
  if (f < b(6) || f > T.fin + s(0.3)) return null;
  // A : les chapeaux (sorti du portail : le plan continue celui du portail) ; repart à gauche
  const uA = entre(f, T.fouet1[0], T.fouet1[1]);
  const punchA = 1 + 0.03 * Math.sin(Math.PI * entre(f, T.chute, T.chute + s(0.6)));
  const planA = plan(f, -1300 * expoEntree(uA), 0, 0, punchA, 0, 20 * expoEntree(uA));
  // B : le défilé (arrive de droite, flou derrière le panneau, net à 7 s ; s'approche)
  const eB = expoSortie(entre(f, s(4.98), s(5.28)));
  const net = expoS(entre(f, T.net[0], T.net[1]));
  const planB = plan(f, 1300 * (1 - eB), 0, 0, 1 + 0.1 * entre(f, T.net[1], b(18)), 0, -20 * (1 - eB));
  // D : la chasse (arrive de droite, repart à gauche ; peu de houle : l'interface se lit)
  const eD = expoSortie(entre(f, s(11.98), s(12.28))), uD = entre(f, T.fouet3[0], T.fouet3[1]);
  const planD = plan(f, 1300 * (1 - eD) - 1300 * expoEntree(uD), 0, 0, 1, 0, -20 * (1 - eD) + 20 * expoEntree(uD), 0.4);
  // E : minuit (arrive de droite) ; après la cloche, la carte se vide et grisaille ; puis la fin la recouvre
  const eE = expoSortie(entre(f, s(14.98), s(15.28)));
  const [sxE, syE] = secousse(f, T.cloche, 24, 0.45);
  const planE = plan(f, 1300 * (1 - eE) + sxE, syE, 0, 1 + 0.04 * entre(f, T.minuit, T.fin), 0, -20 * (1 - eE));
  const gris = expoSortie(entre(f, T.cloche, T.cloche + s(0.5)));
  const flouPanneau = f < T.net[0] ? 16 : 16 * (1 - net);
  return (
    <AbsoluteFill style={{ background: C.nuit }}>
      <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "540px 960px" }}>
        {f < T.fouet1[1] + 2 && <Prise nom="mn-chapeaux" debut={T.chapeaux} transform={planA} />}
        {f >= T.defile && f < T.proches[0] && (
          <Prise nom="mn-defile" debut={T.defile} transform={planB} filtre={`brightness(${(0.62 + 0.38 * (f < T.net[0] ? 0 : net)).toFixed(3)})`} />
        )}
        {f >= T.chasse && f < T.fouet3[1] + 2 && <Prise nom="mn-chasse" debut={T.chasse} transform={planD} />}
        {f >= T.minuit - 1 && (
          <Prise nom="mn-minuit" debut={T.minuit} transform={planE} filtre={gris > 0 ? `saturate(${(1 - 0.65 * gris).toFixed(3)}) brightness(${(1 - 0.18 * gris).toFixed(3)})` : undefined} />
        )}
      </AbsoluteFill>
      {f >= T.defile && f < T.proches[0] && <TiltShift flou={flouPanneau} net={0} />}
      {f < T.proches[0] && f >= T.defile && f >= T.net[1] && <TiltShift flou={4.5} net={0.27} />}
      {f < T.fouet1[1] && <TiltShift flou={4} net={0.3} />}
      <GrosPlans />
      <Panneau />
      <Sceau texte={["百鬼", "夜行"]} de={T.sceau} x={300} y={1230} taille={250} a={b(18) - s(0.2)} />
      <HorlogeMinuit />
      <Fumees />
      <Flash de={T.cloche} force={0.92} duree={16} />
      {/* les étiquettes : les mots de la voix, quand elle les dit */}
      <Etiquette texte={"Every pin wears\na *witch hat* 🧙"} de={s(3.08)} a={T.fouet1[0]} y={300} />
      <Etiquette texte={"Summon the *Night Parade*…"} de={s(5.1)} a={T.net[0]} y={220} />
      <Etiquette texte={"…of a *hundred demons*! 👹"} de={s(7.05)} a={b(18) - s(0.25)} y={300} />
      <Etiquette texte={"and hunt *7 hidden yōkai*! 🔎"} de={s(12.13)} a={T.fouet3[0]} y={205} />
      <Etiquette texte={"But at *midnight*…"} de={s(15.1)} a={T.cloche - 2} y={215} taille={60} />
      <Etiquette texte={"…it all *disappears*."} de={s(16.62)} a={T.fin - 2} y={1120} taille={66} />
      <Credits />
    </AbsoluteFill>
  );
};
