// L'horloge de minuit, dessinée aux couleurs de la carte : un cadran de papier clair dans un cercle d'encre, le double
// filet (encre et rouge) des cartouches, les heures en chiffres romains (XII en rouge), « 真夜中 » (minuit), les
// aiguilles d'encre et la trotteuse rouge, une lueur orange de citrouille derrière. Elle marque 23:59 et des
// secondes (secondesHorloge) : un tic par temps de la musique, minuit pile au temps 33 (la cloche).
// Pour le plongeon dans son centre, elle est dessinée en SVG plein écran dont la vue (viewBox) se resserre autour du
// centre : le dessin reste net même agrandi ×80, sans calque géant à rastériser. Son centre est un trou (le capuchon
// rouge) : le montage y montre la carte (le portail), et redessine l'anneau du capuchon par-dessus (Capuchon).
import React from "react";
import { C, FELL, JAPONAIS, W, H } from "./theme";

const R = 280; // le rayon du cadran (px, au zoom 1)
export const TROU = 15; // le rayon du trou au centre (le portail)
const ROMAINS = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

type Vue = { cx: number; cy: number; zoom: number; rotation?: number };
const vueBox = ({ cx, cy, zoom }: Vue) => `${(-cx / zoom).toFixed(3)} ${(-cy / zoom).toFixed(3)} ${(W / zoom).toFixed(3)} ${(H / zoom).toFixed(3)}`;

/** Le cadran entier ; secondes : 0 → 60 (60 = minuit pile : les trois aiguilles sur XII). */
export const Horloge: React.FC<Vue & { secondes: number; lueur?: number }> = ({ secondes, lueur = 1, ...vue }) => {
  const sec = (secondes / 60) * 360;
  const min = ((59 + secondes / 60) / 60) * 360;
  const heure = ((11 + (59 + secondes / 60) / 60) / 12) * 360;
  return (
    <svg width={W} height={H} viewBox={vueBox(vue)} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id="lueur">
          <stop offset="0.45" stopColor={C.citrouille} stopOpacity={0.55 * lueur} />
          <stop offset="0.7" stopColor={C.orange} stopOpacity={0.22 * lueur} />
          <stop offset="1" stopColor={C.violet} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="papier" cx="0.45" cy="0.4" r="0.65">
          <stop offset="0" stopColor="#fbf5e6" />
          <stop offset="0.7" stopColor={C.papier} />
          <stop offset="1" stopColor="#d9c592" />
        </radialGradient>
      </defs>
      <g transform={`rotate(${(vue.rotation ?? 0).toFixed(2)})`}>
        <circle r={R * 1.75} fill="url(#lueur)" />
        <circle r={R} fill="#24170f" />
        <circle r={R - 5} fill="none" stroke="#5b4030" strokeWidth={3} />
        <circle r={R - 14} fill="url(#papier)" />
        <circle r={R - 24} fill="none" stroke={C.encre} strokeWidth={4.5} />
        <circle r={R - 32} fill="none" stroke={C.rouge} strokeWidth={1.8} />
        {Array.from({ length: 60 }, (_, i) => {
          const grand = i % 5 === 0;
          return <line key={i} x1={0} y1={-(R - 40)} x2={0} y2={-(R - (grand ? 64 : 52))} stroke={C.encre} strokeWidth={grand ? 5 : 2} strokeLinecap="round" transform={`rotate(${i * 6})`} />;
        })}
        {ROMAINS.map((n, i) => {
          const a = (i * 30 * Math.PI) / 180, r = R - 100;
          return (
            <text key={n} x={Math.sin(a) * r} y={-Math.cos(a) * r + 15} textAnchor="middle" fontFamily={FELL} fontSize={i === 0 ? 50 : 42}
              fill={i === 0 ? C.rouge : C.encre}>{n}</text>
          );
        })}
        <text x={0} y={92} textAnchor="middle" fontFamily={JAPONAIS} fontWeight={700} fontSize={34} letterSpacing={6} fill={C.encre}>真夜中</text>
        <rect x={-17} y={112} width={34} height={34} rx={4} fill={C.rouge} transform="rotate(-6 0 129)" />
        <text x={0} y={138} textAnchor="middle" fontFamily={JAPONAIS} fontWeight={700} fontSize={24} fill={C.clair} transform="rotate(-6 0 129)">妖</text>
        {/* les aiguilles : l'heure, la minute (d'encre), la trotteuse (rouge) */}
        <g transform={`rotate(${heure.toFixed(3)})`}>
          <path d="M -11 22 L -7 -96 Q 0 -112 7 -96 L 11 22 Z" fill={C.encre} />
          <circle cy={-104} r={9} fill="none" stroke={C.encre} strokeWidth={5} />
        </g>
        <g transform={`rotate(${min.toFixed(3)})`}>
          <path d="M -8 26 L -4.5 -196 L 0 -214 L 4.5 -196 L 8 26 Z" fill={C.encre} />
        </g>
        <g transform={`rotate(${sec.toFixed(3)})`}>
          <line x1={0} y1={56} x2={0} y2={-228} stroke={C.rouge} strokeWidth={4} strokeLinecap="round" />
          <circle cy={44} r={11} fill={C.rouge} />
        </g>
        {/* le capuchon, et son centre sombre (le trou du portail, recouvert par la carte pendant le plongeon) */}
        <circle r={26} fill={C.rouge} stroke={C.encre} strokeWidth={4} />
        <circle r={TROU} fill="#120c09" />
      </g>
    </svg>
  );
};

/** L'anneau du capuchon seul (redessiné par-dessus la carte du portail, à la même vue). */
export const Capuchon: React.FC<Vue> = (vue) => (
  <svg width={W} height={H} viewBox={vueBox(vue)} style={{ position: "absolute", left: 0, top: 0 }}>
    <circle r={(26 + TROU) / 2} fill="none" stroke={C.rouge} strokeWidth={26 - TROU} />
    <circle r={26} fill="none" stroke={C.encre} strokeWidth={4} />
    <circle r={TROU + 1} fill="none" stroke={C.encre} strokeWidth={2.5} />
  </svg>
);
