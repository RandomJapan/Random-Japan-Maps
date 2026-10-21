// Les icônes de l'interface TikTok, redessinées en vecteurs d'après les captures du propriétaire (nettes à
// n'importe quel zoom de la caméra).
import React from "react";

type P = { taille: number; couleur?: string; style?: React.CSSProperties };
const svg = (taille: number, style: React.CSSProperties | undefined, enfants: React.ReactNode, vb = "0 0 24 24") => (
  <svg width={taille} height={taille} viewBox={vb} style={{ display: "block", overflow: "visible", ...style }}>{enfants}</svg>
);

export const Coeur = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <path fill={couleur} d="M12 21.2s-7.6-4.6-9.7-9.3C.7 8.3 3 4.3 6.9 4.3c2.2 0 3.7 1.2 5.1 3 1.4-1.8 2.9-3 5.1-3 3.9 0 6.2 4 4.6 7.6-2.1 4.7-9.7 9.3-9.7 9.3z" />);
export const Bulle = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <>
    <path fill={couleur} d="M12 3.2c5.3 0 9.6 3.6 9.6 8.1 0 4.4-4.3 8-9.6 8-.9 0-1.8-.1-2.6-.3L4.6 21l1.2-3.6c-2.1-1.5-3.4-3.6-3.4-6 0-4.5 4.3-8.2 9.6-8.2z" />
    {[8, 12, 16].map((x) => <circle key={x} cx={x} cy={11.4} r={1.25} fill="#1a1a1a" />)}
  </>);
export const Signet = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <path fill={couleur} d="M6.2 2.8h11.6c.6 0 1 .4 1 1v17.4l-6.8-4.6-6.8 4.6V3.8c0-.6.4-1 1-1z" />);
export const Partage = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <path fill={couleur} d="M13.6 4.2l8.2 7.3-8.2 7.3v-4.3c-5.5 0-9.1 1.6-11.6 5.4 1-5.6 4.4-10.2 11.6-11.2V4.2z" />);
export const Loupe = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <>
    <circle cx={10.5} cy={10.5} r={6.5} fill="none" stroke={couleur} strokeWidth={2.4} />
    <path d="M15.4 15.4 21 21" stroke={couleur} strokeWidth={2.6} strokeLinecap="round" />
  </>);
export const Note = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <path fill={couleur} d="M9 4.5 20 2.5v12.3a3.2 3.2 0 1 1-2-3V6.6l-7 1.3v9.2a3.2 3.2 0 1 1-2-3V4.5z" />);
export const Plus = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <path d="M12 5v14M5 12h14" stroke={couleur} strokeWidth={3} strokeLinecap="round" />);
export const Retour = ({ taille, couleur = "#161823", style }: P) =>
  svg(taille, style, <path d="M15.5 4 7.5 12l8 8" fill="none" stroke={couleur} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />);
export const Cloche = ({ taille, couleur = "#161823", style }: P) =>
  svg(taille, style, <>
    <path d="M12 3.2c3.4 0 5.9 2.6 5.9 6v4.2l1.8 3.2H4.3l1.8-3.2V9.2c0-3.4 2.5-6 5.9-6z" fill="none" stroke={couleur} strokeWidth={2.1} strokeLinejoin="round" />
    <path d="M9.6 19.2a2.5 2.5 0 0 0 4.8 0" fill="none" stroke={couleur} strokeWidth={2.1} strokeLinecap="round" />
  </>);
export const PartageContour = ({ taille, couleur = "#161823", style }: P) =>
  svg(taille, style, <path d="M13.8 4.6 21 11.3l-7.2 6.7v-3.9c-5 0-8.2 1.4-10.6 4.8.9-5.1 4-9.2 10.6-10V4.6z" fill="none" stroke={couleur} strokeWidth={2.1} strokeLinejoin="round" />);
export const AjoutAmi = ({ taille, couleur = "#161823", style }: P) =>
  svg(taille, style, <>
    <circle cx={13.5} cy={8} r={3.8} fill={couleur} />
    <path d="M6.6 20c.6-4 3.4-6.3 6.9-6.3s6.3 2.3 6.9 6.3z" fill={couleur} />
    <path d="M5 6v6M2 9h6" stroke={couleur} strokeWidth={2} strokeLinecap="round" />
  </>);
export const Grille = ({ taille, couleur = "#161823", style }: P) =>
  svg(taille, style, <>{[5, 12, 19].map((x) => <path key={x} d={`M${x} 4v6M${x} 14v6`} stroke={couleur} strokeWidth={2.2} strokeLinecap="round" />)}</>);
export const Reposte = ({ taille, couleur = "#8a8b91", style }: P) =>
  svg(taille, style, <path d="M7 5 4 8l3 3M4 8h11a4 4 0 0 1 4 4M17 19l3-3-3-3M20 16H9a4 4 0 0 1-4-4" fill="none" stroke={couleur} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />);
export const Lecture = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <path d="M7 4.5v15l12-7.5z" fill="none" stroke={couleur} strokeWidth={2.3} strokeLinejoin="round" />);
export const Maison = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <path d="M3.5 11 12 4l8.5 7v9h-5.5v-6h-6v6H3.5z" fill={couleur} />);
export const Amis = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <>
    <circle cx={9} cy={8.5} r={3.3} fill="none" stroke={couleur} strokeWidth={2} />
    <path d="M3 19.5c.5-3.4 2.9-5.4 6-5.4s5.5 2 6 5.4" fill="none" stroke={couleur} strokeWidth={2} strokeLinecap="round" />
    <circle cx={16.5} cy={9} r={2.6} fill="none" stroke={couleur} strokeWidth={2} />
    <path d="M17 14.3c2.3.3 3.8 2 4.2 4.6" fill="none" stroke={couleur} strokeWidth={2} strokeLinecap="round" />
  </>);
export const Messages = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <path d="M4 5h16v11H9.5L5.5 19.5V16H4z" fill="none" stroke={couleur} strokeWidth={2} strokeLinejoin="round" />);
export const Personne = ({ taille, couleur = "#fff", style }: P) =>
  svg(taille, style, <>
    <circle cx={12} cy={8} r={3.8} fill="none" stroke={couleur} strokeWidth={2} />
    <path d="M4.5 20c.7-4 3.6-6.3 7.5-6.3s6.8 2.3 7.5 6.3" fill="none" stroke={couleur} strokeWidth={2} strokeLinecap="round" />
  </>);
/** La barre d'état du téléphone : l'heure, le réseau, le wifi, la batterie. */
export const Etat = ({ couleur }: { couleur: string }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 110, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 74px", color: couleur, fontSize: 40, fontWeight: 600 }}>
    <span>10:30</span>
    <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
      <svg width={40} height={30} viewBox="0 0 20 15">{[0, 1, 2, 3].map((i) => <rect key={i} x={i * 5} y={11 - i * 3.4} width={3.4} height={4 + i * 3.4} rx={0.8} fill={couleur} />)}</svg>
      <svg width={40} height={30} viewBox="0 0 20 15"><path d="M10 14 1 4.6a13 13 0 0 1 18 0z" fill={couleur} /></svg>
      <svg width={62} height={30} viewBox="0 0 31 15"><rect x={0.8} y={0.8} width={26} height={13.4} rx={4} fill="none" stroke={couleur} strokeWidth={1.4} opacity={0.5} /><rect x={3} y={3} width={19} height={9} rx={2.2} fill={couleur} /><rect x={28} y={5} width={2} height={5} rx={1} fill={couleur} opacity={0.5} /></svg>
    </span>
  </div>
);
