// Le début : l'ouverture sur le logo (le diorama de papier, ses lanternes), le nom pressé lettre à lettre sur son
// cartouche et le sceau 旅 ; la poussée vers le Japon de papier, qui devient la vraie carte au retour de la musique ;
// puis la plongée en 3D sur le château de Himeji, avec les mots de la voix et le compteur des lieux.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Lettres, Rush, Sceau, Sources } from "./parts";
import { C, de, FELL, FILET, GRAIN, HALO, lin, POSE, SANS, TITRE } from "./theme";

// le diorama du logo (2000 × 1116) affiché sur 1935 × 1080 ; le Japon de papier est vers (1008, 503) à l'écran
const P = [1008, 503];
const LANTERNES: [number, number][] = [[110, 250], [228, 470], [228, 700], [430, 340], [552, 300], [1575, 300], [1460, 380], [1765, 560], [1830, 175]];
const NOM = "Random Japan Place";
const SOUS = "THE 3D MAP OF JAPAN";

export const Ouverture: React.FC = () => {
  const f = useCurrentFrame();
  // la poussée : lente, puis elle accélère vers le Japon de papier jusqu'au retour de la musique (103)
  const k = f < 84 ? interpolate(f, [0, 84], [1.02, 1.2]) : interpolate(f, [84, 104], [1.2, 3.1], { extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const flou = lin(f, 90, 104, [0, 7]);
  const sortie = de(f, 86, 95, [0, 1], Easing.bezier(0.4, 0, 0.5, 1));
  const entree = de(f, 2, 16);
  const frappe = 30 + SOUS.length * 0.7;
  const tape = Math.floor(Math.max(0, f - 30) / 0.7);
  const curseur = f >= 30 && (f < frappe || Math.floor((f - frappe) / 4) % 2 === 0) && f < 84;
  const lueur = interpolate(f, [94, 103, 112], [0, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: C.nuit, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -7.5, top: 0, width: 1935, height: 1080, scale: `${k}`, transformOrigin: `${P[0] + 7.5}px ${P[1]}px`, filter: flou ? `blur(${flou}px)` : undefined }}>
        <Img src={staticFile("img/logo-large.jpg")} style={{ width: 1935, height: 1080 }} />
        {LANTERNES.map(([x, y], i) => {
          const a = 0.16 + 0.07 * Math.sin(f * 0.31 + i * 1.7) + 0.04 * Math.sin(f * 0.83 + i * 2.3);
          return <div key={i} style={{ position: "absolute", left: x * 0.9675 - 120, top: y * 0.9675 - 120, width: 240, height: 240, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(255,196,120,${a}), transparent)`, mixBlendMode: "screen" }} />;
        })}
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 62% at 52% 46%, transparent 45%, rgba(20,12,6,.55))" }} />

      {/* le cartouche du nom, comme l'en-tête du site */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 650, display: "flex", justifyContent: "center", opacity: entree * (1 - sortie), translate: `0 ${(1 - entree) * 30 - sortie * 40}px`, scale: `${1 - sortie * 0.12}` }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 30, padding: "26px 52px 26px 30px", backgroundColor: C.clair, backgroundImage: GRAIN, boxShadow: FILET, borderRadius: 4 }}>
          <Img src={staticFile("img/logo-carre.jpg")} style={{ width: 128, height: 128, borderRadius: "50%", objectFit: "cover", boxShadow: `0 0 0 4px ${C.clair}, 0 0 0 6px ${C.trait}` }} />
          <div>
            <Lettres texte={NOM} a={8} pas={2.2} style={{ font: `400 92px/1 ${TITRE}`, color: C.encre }} />
            <div style={{ marginTop: 14, height: 30, display: "flex", alignItems: "center", font: `700 25px/1 ${SANS}`, letterSpacing: "0.3em", color: C.encre2 }}>
              <span style={{ whiteSpace: "pre" }}>{SOUS.slice(0, tape)}</span>
              <span style={{ display: "inline-block", width: 13, height: 24, marginLeft: 4, backgroundColor: C.rouge, opacity: curseur ? 0.9 : 0 }} />
            </div>
          </div>
          <Sceau a={58} texte="旅" taille={96} style={{ right: -40, top: -46 }} />
        </div>
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 55% at 62% 30%, rgba(255,236,200,1), rgba(255,214,150,.4) 50%, transparent 75%)", opacity: lueur }} />
    </AbsoluteFill>
  );
};

/** Un compteur qui roule comme un totalisateur : chaque chiffre tourne puis se cale, de gauche à droite. */
export const Compteur: React.FC<{ valeur: string; a: number; taille: number; couleur: string }> = ({ valeur, a, taille, couleur }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", height: taille * 1.2, overflow: "hidden" }}>
      {valeur.split("").map((ch, i) => {
        const cible = Number(ch);
        const e = de(f, a + i * 5, a + i * 5 + 22, [0, 1], POSE);
        const v = cible + 20 * (1 - e);
        const vitesse = Math.abs(de(f + 1, a + i * 5, a + i * 5 + 22, [0, 1], POSE) - e) * 20;
        return (
          <div key={i} style={{ width: taille * 0.62, position: "relative", filter: `blur(${Math.min(6, vitesse * 1.2)}px)` }}>
            <div style={{ position: "absolute", left: 0, top: -((v % 10) + 10) * taille * 1.2, display: "flex", flexDirection: "column" }}>
              {Array.from({ length: 30 }, (_, j) => (
                <div key={j} style={{ height: taille * 1.2, font: `400 ${taille}px/${taille * 1.2}px ${TITRE}`, color: couleur, textAlign: "center", textShadow: HALO }}>{j % 10}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** La plongée : tout le Japon, puis Himeji en 3D ; à gauche, les mots de la voix. */
export const Plongee: React.FC<{ lieux: number }> = ({ lieux }) => {
  const f = useCurrentFrame();
  const apparition = lin(f, 0, 6);
  const bloc = (a: number, z: number) => ({ e: de(f, a, a + 10), s: lin(f, z, z + 6) });
  // les mots suivent la voix : le compteur pendant « Meet Random Japan Place », puis « every place from our TikTok »,
  // puis « on one living 3D map »
  const B = bloc(3, 44), A = bloc(51, 94), Cc = bloc(101, 1e9);
  const marqueur = de(f, 114, 128);
  return (
    <AbsoluteFill style={{ opacity: apparition }}>
      <Rush nom="p-plongee" debut={0.25} vitesse={1.2} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(246,238,219,.6), rgba(246,238,219,.28) 32%, transparent 55%)" }} />
      <Sources />
      {f < 52 ? (
        <div style={{ position: "absolute", left: 110, top: 230, opacity: B.e * (1 - B.s), translate: `${-B.s * 120}px 0`, filter: B.s ? `blur(${B.s * 14}px)` : undefined }}>
          <Compteur valeur={String(lieux)} a={4} taille={250} couleur={C.rouge} />
          <div style={{ marginTop: 6, font: `400 66px/1 ${TITRE}`, color: C.encre, textShadow: HALO }}>places to explore</div>
        </div>
      ) : null}
      {f >= 50 && f < 101 ? (
        <div style={{ position: "absolute", left: 110, top: 300, opacity: A.e * (1 - A.s), translate: `${-A.s * 120}px 0`, filter: A.s ? `blur(${A.s * 14}px)` : undefined }}>
          <Lettres texte="Every place" a={51} pas={1.6} style={{ font: `400 132px/1 ${TITRE}`, color: C.encre, textShadow: HALO }} />
          <div style={{ marginTop: 18, font: `italic 400 70px/1 ${FELL}`, color: C.rouge, textShadow: HALO, opacity: de(f, 62, 72), translate: `${(1 - de(f, 62, 74)) * -40}px 0` }}>
            from our TikTok
          </div>
        </div>
      ) : null}
      {f >= 100 ? (
        <div style={{ position: "absolute", left: 110, top: 300, opacity: Cc.e }}>
          <div><Lettres texte="One living" a={101} pas={1.6} style={{ font: `400 132px/1.05 ${TITRE}`, color: C.encre, textShadow: HALO }} /></div>
          <div style={{ position: "relative", display: "inline-block", marginTop: 6 }}>
            <div style={{ position: "absolute", left: -10, right: -10, bottom: 10, height: 46, backgroundColor: "rgba(168,50,31,.88)", transformOrigin: "left center", scale: `${marqueur} 1`, borderRadius: 4, rotate: "-1deg" }} />
            <Lettres texte="3D map." a={109} pas={1.6} style={{ position: "relative", font: `400 132px/1.05 ${TITRE}`, color: C.encre, textShadow: HALO }} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
