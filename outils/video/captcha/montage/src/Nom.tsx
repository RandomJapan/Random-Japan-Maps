// Le nom du lieu et sa préfecture, en grand, blanc cerclé de noir (le texte « classique » de TikTok), sur un fond transparent :
// le propriétaire le pose au-dessus de son premier plan dans DaVinci Resolve. En haut de l'image, sous les onglets de TikTok.
// Le nom arrive d'un petit bond (le ressort des vidéos de la carte), la préfecture un dixième de seconde après.
import React from "react";
import { useCurrentFrame } from "remotion";
import { ajuster } from "./texte";
import { borne, EMOJI, ressort, TIKTOK } from "./theme";

export type PropsNom = { fps: number; duree: number; nom: string; prefecture: string; anime: boolean };

const POLICE = `${TIKTOK}, ${EMOJI}, sans-serif`;

/** Du blanc cerclé de noir : le contour sous le remplissage (paint-order), pour que les lettres restent grasses. */
const contour = (epaisseur: number): React.CSSProperties => ({
  color: "#fff", WebkitTextStroke: `${epaisseur}px #000`, paintOrder: "stroke fill",
  textShadow: "0 4px 12px rgba(0,0,0,0.35)",
});

/** L'épingle, blanche cerclée de noir comme le texte. */
const Epingle: React.FC<{ taille: number }> = ({ taille }) => (
  <svg width={taille * 0.78} height={taille} viewBox="-2 -2 28 36" style={{ overflow: "visible" }}>
    <path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 32 12 32s12-11.6 12-20.3C24 5.2 18.6 0 12 0z" fill="#fff" stroke="#000" strokeWidth={3.2}
      strokeLinejoin="round" paintOrder="stroke" />
    <circle cx="12" cy="11.6" r="4.4" fill="#d8382a" stroke="#000" strokeWidth={1.6} />
  </svg>
);

export const Nom: React.FC<PropsNom> = ({ fps, nom, prefecture, anime }) => {
  const image = useCurrentFrame();
  const t = anime ? image / fps : 10;
  const g = ajuster(nom, 940, 128, 84, 0.6);
  const a = ressort(t - 0.02), b = ressort(t - 0.12);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 292, display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: POLICE, textAlign: "center" }}>
      <div style={{ transform: `scale(${0.72 + 0.28 * a})`, opacity: borne(a * 1.6) }}>
        {g.lignes.map((ligne, k) => (
          <div key={k} style={{ ...contour(g.taille * 0.15), fontSize: g.taille, fontWeight: 900, lineHeight: 1.04, whiteSpace: "nowrap" }}>{ligne}</div>
        ))}
      </div>
      {prefecture && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 14, transform: `translateY(${(1 - b) * 26}px)`, opacity: borne(b * 1.6) }}>
          <Epingle taille={66} />
          <span style={{ ...contour(10), fontSize: 66, fontWeight: 900, whiteSpace: "nowrap" }}>{prefecture}, Japan</span>
        </div>
      )}
    </div>
  );
};
