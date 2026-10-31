// L'accroche (0 → 3 s) : le défilé des cent démons dans Kyoto la nuit, et dès la première image le titre « THIS MAP IS
// HAUNTED » (un éclair à l'image 4 : une première image blanche ferait une miniature grise) ; le mot « HAUNTED » bat
// quand la voix le dit. À 1,6 s l'horloge de minuit surgit au ressort (la carte se floute derrière), « …until
// midnight » ; elle marque 23:59:30 et ses secondes battent la mesure. Puis le titre s'envole, l'horloge recule (l'élan)
// et la caméra plonge dans son centre (×80, en accélérant) : par le trou du capuchon, la carte suivante (les chapeaux),
// qui grandit jusqu'à remplir l'écran au temps 6 (3 s), quand la musique part.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Prise, plan, MotTitre, Flash, TiltShift } from "./Commun";
import { Capuchon, Horloge, TROU } from "./Horloge";
import { b, entre, expoEntree, expoS, plongee, rebond, s } from "./theme";
import { secondesHorloge, T } from "./temps";

export const CX = 540, CY = 985; // le centre de l'horloge à l'écran

/** Le zoom de l'horloge : elle surgit (ressort), recule un peu (l'élan), puis ×80 en accélérant. */
export function zoomHorloge(f: number) {
  const pop = rebond(f, T.horloge);
  const elan = 1 - 0.06 * expoS(entre(f, T.elan[0], T.elan[1]));
  const dive = Math.pow(80, plongee(entre(f, T.plonge[0], T.plonge[1])));
  return pop * elan * dive;
}

export const Accroche: React.FC = () => {
  const f = useCurrentFrame();
  if (f > b(6) + 2) return null;
  const z = zoomHorloge(f);
  const pop = rebond(f, T.horloge);
  const flouFond = 7 * Math.min(1, Math.max(0, (f - T.horloge) / 14));
  const uPlonge = entre(f, T.plonge[0], T.plonge[1]);
  const depart = expoEntree(entre(f, T.depart, T.depart + s(0.3)));
  // la carte du fond pousse doucement, puis suit un peu le plongeon
  const fond = plan(f, 0, 0, 0, 1.0 + 0.06 * entre(f, 0, b(6)) + 0.5 * expoEntree(uPlonge), 0, 0, 0.6);
  // le portail : la prise des chapeaux, dans le trou du capuchon (rayon TROU × zoom), qui se rapproche en même temps
  const rayon = TROU * z;
  const portail = f >= T.elan[0];
  const dansPortail = plan(f, 0, 0, -4 * (1 - uPlonge), 1.7 - 0.7 * expoS(uPlonge));
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "540px 960px" }}>
        <Prise nom="mn-accroche" debut={0} transform={fond} filtre={`brightness(${(0.88 - 0.25 * Math.min(1, flouFond / 7)).toFixed(3)})`} />
      </AbsoluteFill>
      {/* le vignettage : la nuit tombe sur les bords */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 35%, rgba(5,3,10,.72) 100%)" }} />
      <TiltShift flou={flouFond} net={0} />
      <Flash de={4} force={0.4} duree={9} />
      {/* le titre */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 215, display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        transform: `translateY(${(-700 * depart).toFixed(1)}px)`, filter: depart > 0.01 ? `blur(${(10 * depart).toFixed(2)}px)` : undefined,
      }}>
        <div style={{ display: "flex", gap: 26 }}>
          <MotTitre texte="THIS" de={T.titre} taille={104} />
          <MotTitre texte="MAP" de={T.titre + 2} taille={104} />
          <MotTitre texte="IS" de={T.titre + 4} taille={104} />
        </div>
        <MotTitre texte="HAUNTED" de={T.titre + 6} taille={150} pastille rotation={-3} battement={T.haunted} />
      </div>
      {/* l'horloge, le portail et l'anneau du capuchon */}
      {pop > 0.002 && (
        <AbsoluteFill>
          <Horloge cx={CX} cy={CY} zoom={z} rotation={-16 * (1 - pop)} secondes={secondesHorloge(f)} lueur={1 - uPlonge} />
          {portail && (
            <AbsoluteFill style={{ clipPath: `circle(${rayon.toFixed(2)}px at ${CX}px ${CY}px)`, perspective: 2200, perspectiveOrigin: "540px 960px" }}>
              <Prise nom="mn-chapeaux" debut={T.chapeaux} transform={dansPortail} />
            </AbsoluteFill>
          )}
          {portail && <Capuchon cx={CX} cy={CY} zoom={z} />}
        </AbsoluteFill>
      )}
      {/* « …until midnight » */}
      <div style={{ position: "absolute", left: 0, right: 0, top: CY + 300, display: "flex", justifyContent: "center", gap: 22, opacity: 1 - expoEntree(entre(f, T.depart, T.depart + s(0.2))) }}>
        <MotTitre texte="…until" de={T.jusqua} taille={92} />
        <MotTitre texte="midnight" emoji="🕛" de={T.jusqua + 4} taille={92} />
      </div>
    </AbsoluteFill>
  );
};
