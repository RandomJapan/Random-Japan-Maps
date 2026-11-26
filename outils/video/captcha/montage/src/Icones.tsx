// Les petites icônes des deux captchas, dessinées ici (aucune n'est le logo de personne) : recharger, le casque (l'audio),
// l'info, l'alerte, la croix, la flèche du curseur, la coche.
import React from "react";

type P = { taille: number; couleur: string; epaisseur?: number };

export const Recharger: React.FC<P> = ({ taille, couleur, epaisseur = 2.4 }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <path d="M20 4v5h-5" />
  </svg>
);

export const Casque: React.FC<P> = ({ taille, couleur, epaisseur = 2.2 }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="3.5" y="14" width="4" height="6.5" rx="1.6" fill={couleur} />
    <rect x="16.5" y="14" width="4" height="6.5" rx="1.6" fill={couleur} />
  </svg>
);

export const Info: React.FC<P> = ({ taille, couleur, epaisseur = 2.2 }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6" />
    <circle cx="12" cy="7.6" r="0.6" fill={couleur} />
  </svg>
);

export const Alerte: React.FC<P> = ({ taille, couleur, epaisseur = 2.2 }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6.5" />
    <circle cx="12" cy="16.6" r="0.6" fill={couleur} />
  </svg>
);

export const Croix: React.FC<P> = ({ taille, couleur, epaisseur = 2.6 }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Fleche: React.FC<P> = ({ taille, couleur, epaisseur = 2.6 }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const Coche: React.FC<P> = ({ taille, couleur, epaisseur = 3 }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 12.5l5 5L19.5 7" />
  </svg>
);
