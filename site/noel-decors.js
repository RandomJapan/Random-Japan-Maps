// ================================================================
//  Les décorations de Noël sur la carte (2026-11-23, le propriétaire, à qui la ligne « Sur la carte aujourd'hui » des
//  cases promettait des décorations qui n'existaient pas encore : « Je les fabrique »). Chaque case du calendrier de
//  l'Avent (noel.js) ajoute la sienne le jour de la case, et elle reste jusqu'à la fin de l'événement :
//   1  la première neige tombe (les particules de la saison, de près ; les bonnets rouges des épingles : noel.css)
//   2  la nuit, les grandes villes s'illuminent (un halo doré, des ampoules de couleur)
//   3  une guirlande sur le titre de la carte (sur téléphone, sous le logo)
//   4  les cascades gèlent (leur modèle 3D, de près) ; 19 : la nuit, leur glace s'illumine
//   5  des lanternes dans les vieux villages, allumées la nuit
//   6  la neige descend comme en plein hiver (ambiance.js, phenologie.js : HIVER_NOEL) ; 11 : la banquise arrive
//   7  un sapin près de chaque grande ville, allumé la nuit ; 18 : des cadeaux à son pied
//   8  des cygnes sur les lacs du nord
//   9  des grues en papier volent à la place des grues (oiseaux.js)
//  10  des lanternes de neige près du château de Hirosaki
//  13  des fermes au toit de chaume sous la neige (Gokayama, Hida), fenêtres allumées la nuit
//  15  des cartes de vœux traversent l'écran de temps en temps
//  16  des singes des neiges au bain chaud, à Jigokudani
//  17  des kamakura (huttes de neige) dans le nord, allumées la nuit
//  20  la nuit, une guirlande de lumières le long de toutes les côtes du Japon
//  21  deux grues dansent près du pont Tsuru no Maihashi
//  23  les rennes se reposent au cap Sōya (partis la nuit du 24, quand passe le traîneau)
//  (Les cadeaux des cases 12, 14, 22 et 24 : noel-carte.js, qui branche ce module.)
//  Rien ne bouge par script à chaque image : les repères passent par reperes.js (cachés de loin, comme les légendes),
//  leurs petits mouvements sont en CSS et seulement à l'écran (.anime) ; les couches ajoutées à la carte (la guirlande
//  des côtes) ne changent qu'à la tombée de la nuit et au lever du jour : elles sont cuites dans les textures du relief,
//  jamais de peinture animée. (L'étoile du fort de Goryōkaku, illuminée la nuit, a été essayée : de près, le modèle 3D
//  du parc et sa lueur la couvraient presque entièrement.)
// ================================================================

const JOUR = {
  neige: 1, illuminations: 2, guirlande: 3, cascades: 4, lanternes: 5, sapins: 7, cygnes: 8, papier: 9, yukidoro: 10,
  fermes: 13, cartes: 15, singes: 16, kamakura: 17, cadeaux: 18, glaceNuit: 19, cotes: 20, danse: 21, rennes: 23,
};
const ZOOM_DECOR = 6.8; // les repères des décorations, comme les légendes : il faut s'approcher d'une région
const hasard = (a, b) => a + Math.random() * (b - a);
const creer = (balise, classe) => {
  const el = document.createElement(balise);
  if (classe) el.className = classe;
  return el;
};

// ---------------------------------------------------------------- Les dessins (encre et aquarelle, comme les légendes)
const T = 'stroke="#35251a" stroke-linejoin="round" stroke-linecap="round"';

// 5 : une guirlande de chōchin entre deux poteaux, sur la neige ; la nuit, chaque lanterne a son halo (.nz-halo)
function dessinLanternes() {
  const xs = [15, 23.5, 32, 40.5, 49];
  const lanternes = xs.map((x, i) => {
    const t = (x - 7) / 50, y = 9 + 16 * t * (1 - t) + 1.2;
    const c = i % 2 ? '#f4ead8' : '#c33a2b';
    return `<circle class="nz-halo" cx="${x}" cy="${y + 5}" r="7.5" fill="url(#nz-chaud)"/>
      <path d="M${x} ${y - 1.2}v1.6" stroke="#35251a" stroke-width=".8"/>
      <rect x="${x - 2}" y="${y + 0.2}" width="4" height="1.3" rx=".4" fill="#2f2620"/>
      <ellipse class="nz-chochin" cx="${x}" cy="${y + 5.3}" rx="3.4" ry="4.4" fill="${c}" ${T} stroke-width="1"/>
      <path d="M${x - 3.2} ${y + 3.6}q3.2 1 6.4 0M${x - 3.3} ${y + 6.9}q3.3 1 6.6 0" fill="none" stroke="#35251a" stroke-width=".5" opacity=".55"/>
      <rect x="${x - 2}" y="${y + 9.4}" width="4" height="1.3" rx=".4" fill="#2f2620"/>`;
  }).join('');
  return `<svg viewBox="0 0 64 40" aria-hidden="true"><defs><radialGradient id="nz-chaud"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".85"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient></defs>
    <path d="M1 37.5C12 34 24 35.5 32 35.2S52 34 63 37.5Z" fill="#f7f5ef" ${T} stroke-width="1"/>
    <path d="M5.6 37V7.4h2.6V37M55.8 37V7.4h2.6V37" fill="#6e4a2b" ${T} stroke-width="1"/>
    <path d="M4.6 7.6h4.6M54.8 7.6h4.6" stroke="#35251a" stroke-width="1.4"/>
    <path d="M5 6.4h4.2l-.6-1.4h-3ZM55.2 6.4h4.2l-.6-1.4h-3Z" fill="#f7f5ef" ${T} stroke-width=".7"/>
    <path d="M7 9Q32 25 57 9" fill="none" stroke="#35251a" stroke-width=".9"/>${lanternes}</svg>`;
}

// 8 : deux cygnes chanteurs (bec jaune et noir, cou droit) sur l'eau du lac
const CYGNE = `<path d="M14 30C14 24 20 21 28 22C34 22.5 38 25 40 28C41 30 39 32 36 32H18C15.5 32 14 31.2 14 30Z" fill="#fbf8f1" ${T} stroke-width="1.2"/>
  <path d="M35 23.6C38.6 21.6 42.2 20.6 43.4 22.6C41.4 23.8 39.4 25.6 38.4 27.2" fill="#fbf8f1" ${T} stroke-width="1.1"/>
  <path d="M23 26.4C27 25 32 25.4 36 27.4M25 29C28.6 28 32 28.2 35 29.4" fill="none" stroke="#b9b2a2" stroke-width=".8"/>
  <path d="M17 25.6C16 20 16 14 18 10C19 8 22 8 22.6 10C21 13 20.2 18 21.2 24.6Z" fill="#fbf8f1" ${T} stroke-width="1.1"/>
  <path d="M18 10.4C17.8 7.8 20.4 6.6 22 7.4C23 8 23.1 9.4 22.5 10.3Z" fill="#fbf8f1" ${T} stroke-width="1.1"/>
  <path d="M18.4 8.3L16 8.9L16.2 10.2L18.6 10.7Z" fill="#e8c13a" ${T} stroke-width=".8"/>
  <path d="M16 8.9L13.4 9.6L16.2 10.2Z" fill="#2a211b" ${T} stroke-width=".8"/>
  <circle cx="19.6" cy="8.8" r=".55" fill="#2a211b"/>`;
const CYGNES = `<svg viewBox="0 0 72 40" aria-hidden="true">
  <ellipse class="nz-onde" cx="34" cy="33" rx="31" ry="5"/><ellipse class="nz-onde nz-onde2" cx="34" cy="33" rx="20" ry="3.2"/>
  <g class="nz-cygne2"><g transform="matrix(-.8 0 0 .8 76 6.4)">${CYGNE}</g></g>
  <g class="nz-cygne1">${CYGNE}</g></svg>`;

// 10 : trois lanternes de neige (yuki-dōrō), taillées comme les lanternes de pierre des jardins : un socle, un pied, le
// foyer ouvert où brûle une bougie (allumée la nuit), un toit large et sa boule
function dessinYukidoro() {
  const un = (x, s) => `<g transform="translate(${x} 37) scale(${s})">
    <circle class="nz-halo" cx="0" cy="-15" r="11" fill="url(#nz-bougie)"/>
    <path d="M-8.4 0C-8.4-2.8-5.6-4.4 0-4.4S8.4-2.8 8.4 0Z" fill="#f7f5ef" ${T} stroke-width="1.1"/>
    <path d="M-3.2-4.2V-10.2H3.2V-4.2Z" fill="#f7f5ef" ${T} stroke-width="1.1"/>
    <path d="M-6.4-10V-19.6H6.4V-10Z" fill="#f7f5ef" ${T} stroke-width="1.2"/>
    <path d="M4.4-19.4V-10.2M1.4-10.2V-4.4" stroke="#b7c8d2" stroke-width="1.8"/>
    <path class="nz-niche" d="M-3.2-11.6V-16.8Q0-18.8 3.2-16.8V-11.6Z" fill="#5d4c3e" ${T} stroke-width=".9"/>
    <path class="nz-flamme" d="M0-12.6C-1-13.8-.7-15.2 0-16.2.7-15.2 1-13.8 0-12.6Z" fill="#ffd06a"/>
    <path d="M-10.6-19.4C-7-24.4 7-24.4 10.6-19.4 6-18.2-6-18.2-10.6-19.4Z" fill="#fbfaf6" ${T} stroke-width="1.2"/>
    <circle cx="0" cy="-24.6" r="2" fill="#fbfaf6" ${T} stroke-width="1"/></g>`;
  return `<svg viewBox="0 0 64 40" aria-hidden="true"><defs><radialGradient id="nz-bougie"><stop offset="0" stop-color="#ffc45a" stop-opacity=".9"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient></defs>
    <path d="M1 38C12 34.6 22 35 32 34.6S52 34.4 63 38Z" fill="#f7f5ef" ${T} stroke-width="1"/>
    ${un(13, 0.86)}${un(51, 0.9)}${un(32, 1.06)}</svg>`;
}

// 13 : une ferme gasshō-zukuri (toit de chaume très pentu, en mains jointes) sous une épaisse couche de neige ; les
// fenêtres du pignon et du rez-de-chaussée s'allument la nuit (.nz-fenetre)
const FENETRES = [[24.2, 12.6, 7.6, 3.4], [20.4, 18.6, 6.4, 3.6], [29.2, 18.6, 6.4, 3.6], [16.6, 25, 6.4, 3.8], [24.8, 25, 6.4, 3.8], [33, 25, 6.4, 3.8],
  [14.4, 35.4, 7, 5.6], [34.6, 35.4, 7, 5.6]];
const FERME = `<svg viewBox="0 0 56 52" aria-hidden="true"><defs><radialGradient id="nz-fenetre"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient></defs>
  <ellipse class="nz-halo" cx="28" cy="28" rx="24" ry="20" fill="url(#nz-fenetre)"/>
  <path d="M2 50C14 46 42 46 54 50Z" fill="#f7f5ef" ${T} stroke-width="1"/>
  <path d="M10.6 31.4H45.4V46.6H10.6Z" fill="#7a5638" ${T} stroke-width="1.2"/>
  <path d="M12.4 31.4 28 6.6 43.6 31.4Z" fill="#b8956a" ${T} stroke-width="1.1"/>
  <path d="M28 6.6V31.4M16.8 24.4H39.2M21.2 17.4H34.8" stroke="#6e4a2b" stroke-width=".9"/>
  ${FENETRES.map(([x, y, l, h]) => `<rect class="nz-fenetre" x="${x}" y="${y}" width="${l}" height="${h}" fill="#e8dcc0" ${T} stroke-width=".7"/>`).join('')}
  <path d="M24 41.4h8v5.2h-8Z" fill="#4a3628" ${T} stroke-width=".8"/>
  <path d="M3.6 33.6 28 2.4 52.4 33.6 46.6 34.6 28 9.8 9.4 34.6Z" fill="#8a6b45" ${T} stroke-width="1.3"/>
  <path d="M8.6 30.4 28 5.6M47.4 30.4 28 5.6" stroke="#6e5232" stroke-width=".8" opacity=".7"/>
  <path d="M2.2 33.4C4 31 6 30.6 8.4 30.2L28 4.2 47.6 30.2C50 30.6 52 31 53.8 33.4 50.4 33.8 48 33.2 46.6 32.4L28 8 9.4 32.4C8 33.2 5.6 33.8 2.2 33.4Z" fill="#fbfaf6" ${T} stroke-width="1.1"/>
  <path d="M21.6 11.6 28 3.4 34.4 11.6C31.8 10.4 30 9.8 28 7.6 26 9.8 24.2 10.4 21.6 11.6Z" fill="#fbfaf6"/>
  <path d="M6 49.2C9 46.6 12.6 46.2 15.4 47.6M41 47.4C44 46.2 47.6 46.8 50.6 49.2" fill="none" stroke="#b7c8d2" stroke-width="1.2"/></svg>`;

// 16 : deux singes des neiges (macaques japonais, visage rouge) dans un bassin d'eau chaude entre les rochers ; la vapeur
// monte (.nz-vapeur, seulement à l'écran)
const SINGE = (x, y, s, yeux) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-9 6C-9-1-5.6-4.4 0-4.4S9-1 9 6Z" fill="#9b8a76" ${T} stroke-width="1.1"/>
  <circle cx="0" cy="-9" r="7" fill="#a89580" ${T} stroke-width="1.2"/>
  <path d="M-4.6-11.4C-4.6-13.6-2.6-14.4 0-13.2 2.6-14.4 4.6-13.6 4.6-11.4 4.6-7.6 2.6-4.6 0-4.6S-4.6-7.6-4.6-11.4Z" fill="#e07a68" ${T} stroke-width=".9"/>
  ${yeux ? '<path d="M-2.8-10.4h1.6M1.2-10.4h1.6" stroke="#35251a" stroke-width=".8"/>' : '<circle cx="-2" cy="-10.6" r=".75" fill="#35251a"/><circle cx="2" cy="-10.6" r=".75" fill="#35251a"/>'}
  <path d="M-.9-7.4h1.8" stroke="#8c3a2c" stroke-width=".7"/>
  <path d="M-6.4-13.4C-5-17.2 5-17.2 6.4-13.4C3.6-14.6-3.6-14.6-6.4-13.4Z" fill="#fbfaf6" ${T} stroke-width=".8"/></g>`;
const SINGES = `<svg viewBox="0 0 64 48" aria-hidden="true">
  <path class="nz-vapeur" d="M18 18C15 14 19 11 16.6 7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
  <path class="nz-vapeur nz-v2" d="M34 15C31 11 35 8 32.6 3.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
  <path class="nz-vapeur nz-v3" d="M48 19C45 15 49 12 46.6 8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
  <path d="M3 38C3 29 14 26 32 26S61 29 61 38C61 44 48 46 32 46S3 44 3 38Z" fill="#8c897f" ${T} stroke-width="1.2"/>
  <ellipse cx="32" cy="36" rx="24.6" ry="7.2" fill="#8fbab2" ${T} stroke-width=".9"/>
  ${SINGE(24, 37, 1, false)}${SINGE(41.5, 37.6, 0.86, true)}
  <path d="M7.6 36.6C14 33.4 50 33.4 56.4 36.6C52 38.6 12 38.6 7.6 36.6Z" fill="#8fbab2" opacity=".85"/>
  <path d="M12 37.6C20 36.4 44 36.4 52 37.6" fill="none" stroke="#d6ebe6" stroke-width=".9"/>
  <path d="M4 33C6 28.6 12 27.4 16 28.4C12 29.6 8 31 4 33ZM60 33C58 28.6 52 27.4 48 28.4C52 29.6 56 31 60 33Z" fill="#fbfaf6" ${T} stroke-width=".8"/></svg>`;

// 17 : une kamakura (hutte de neige) ; la nuit, son entrée s'allume
const KAMAKURA = `<svg viewBox="0 0 48 40" aria-hidden="true"><defs><radialGradient id="nz-kamakura"><stop offset="0" stop-color="#ffc45a" stop-opacity=".95"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient></defs>
  <ellipse class="nz-halo" cx="24" cy="31" rx="17" ry="11" fill="url(#nz-kamakura)"/>
  <path d="M1 38C10 35 38 35 47 38Z" fill="#f7f5ef" ${T} stroke-width="1"/>
  <path d="M6 36.4C5.4 20 13 9 24 9S42.6 20 42 36.4Z" fill="#f7f5ef" ${T} stroke-width="1.3"/>
  <path d="M33 12.6C38.6 16.4 41.4 24 41 35" fill="none" stroke="#b7c8d2" stroke-width="2.6"/>
  <path d="M10.6 19.4C12 15.6 15 12.6 18.4 11.4" fill="none" stroke="#fff" stroke-width="1.6"/>
  <path class="nz-entree" d="M16 36.4V28.6C16 23.4 19.6 20.4 24 20.4S32 23.4 32 28.6V36.4Z" fill="#5d4c3e" ${T} stroke-width="1.1"/>
  <path class="nz-flamme" d="M24 33.6C22.8 32.2 23.2 30.6 24 29.6 24.8 30.6 25.2 32.2 24 33.6Z" fill="#ffd06a"/>
  <path d="M15 21.6C17 18.6 20.4 17 24 17S31 18.6 33 21.6" fill="none" stroke="#35251a" stroke-width=".7" opacity=".5"/></svg>`;

// 21 : deux grues du Japon (tanchō) qui dansent face à face : l'une ailes levées haut, l'autre ailes à demi ouvertes,
// la tête dressée pour chanter (calotte rouge, cou et plumes de la queue noirs, bord des ailes noir)
const DANSE_A = `<path d="M19 29C13 21 8 13 3 7.6C4 14 6.4 20.4 10.4 25.4C12.6 28 15.6 30 18.6 31Z" fill="#e6dfcf" ${T} stroke-width="1"/>
  <path d="M3 7.6C4 14 6.4 20.4 10.4 25.4" fill="none" stroke="#2a211b" stroke-width="2.4"/>
  <path d="M17.4 37.6 15.6 48.6 16.6 57M22.4 37.6 24.4 48 23 57" fill="none" stroke="#4a4440" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M14.4 57.2h4.4M21 57.2h4.4" stroke="#4a4440" stroke-width="1.1"/>
  <path d="M11.4 31.6C7.2 31.6 5 35.4 5.8 39.6 7.6 37.8 9.6 36.6 11.6 36.2 10 38.8 10 41 11 42.4 12.8 39.6 14.2 37.4 15.6 35.4Z" fill="#2a211b" ${T} stroke-width=".8"/>
  <ellipse cx="20.4" cy="32.2" rx="11" ry="6.6" transform="rotate(-16 20.4 32.2)" fill="#fbf8f1" ${T} stroke-width="1.2"/>
  <path d="M27.6 28.2C31.2 24.6 31.6 18.6 32.4 12.6" fill="none" stroke="#2a211b" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M26.4 27.6C29.4 23.8 29.8 18.6 30.6 13.6" fill="none" stroke="#fbf8f1" stroke-width="1.1" stroke-linecap="round"/>
  <circle cx="33" cy="10.6" r="2.7" fill="#2a211b"/>
  <path d="M31.4 9.4C31.6 7.8 33.6 7.4 34.6 8.6 34 9.4 32.6 9.8 31.4 9.4Z" fill="#c8302c"/>
  <path d="M35.2 9.8 42.4 8.4 35.4 11.6Z" fill="#9a977a" ${T} stroke-width=".6"/>
  <circle cx="34" cy="10.2" r=".5" fill="#fbf8f1"/>
  <g class="nz-aile-pres"><path d="M18.4 30C17.2 21 18.8 11.4 24.6 2.6 27.6 6.6 29.4 11.6 29.6 17 29.8 21.6 28.6 25.6 26.4 29Z" fill="#fbf8f1" ${T} stroke-width="1.1"/>
  <path d="M24.6 2.6C21 10 19.2 18.4 18.8 27" fill="none" stroke="#2a211b" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M22.6 11.4 25.6 12.4M21.4 16.6 25 17.4M20.8 21.6 24.6 22" stroke="#cfc6b4" stroke-width=".7"/></g>`;
const DANSE_B = `<path d="M18 30C12 26 7 22 2.6 21 5 25.6 8.6 29.6 13 32Z" fill="#e6dfcf" ${T} stroke-width="1"/>
  <path d="M2.6 21C5 25.6 8.6 29.6 13 32" fill="none" stroke="#2a211b" stroke-width="2.4"/>
  <path d="M17.4 37.6 16 46 18.6 52M22.4 37.6 23.6 47 22 54" fill="none" stroke="#4a4440" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M16.6 52.2h4.2M19.8 54.2h4.4" stroke="#4a4440" stroke-width="1.1"/>
  <path d="M11.4 31.6C7.2 31.6 5 35.4 5.8 39.6 7.6 37.8 9.6 36.6 11.6 36.2 10 38.8 10 41 11 42.4 12.8 39.6 14.2 37.4 15.6 35.4Z" fill="#2a211b" ${T} stroke-width=".8"/>
  <ellipse cx="20.4" cy="32.2" rx="11" ry="6.6" transform="rotate(-12 20.4 32.2)" fill="#fbf8f1" ${T} stroke-width="1.2"/>
  <path d="M27.6 28.4C29.6 23 29.8 16 29 9.6" fill="none" stroke="#2a211b" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M26.2 27.8C28 22.6 28 16.4 27.4 10.6" fill="none" stroke="#fbf8f1" stroke-width="1.1" stroke-linecap="round"/>
  <circle cx="29.2" cy="7.6" r="2.7" fill="#2a211b"/>
  <path d="M27.6 6.4C27.8 4.8 29.8 4.4 30.8 5.6 30.2 6.4 28.8 6.8 27.6 6.4Z" fill="#c8302c"/>
  <path d="M31.2 6 36.8 1.4 31.8 8Z" fill="#9a977a" ${T} stroke-width=".6"/>
  <circle cx="30.2" cy="7.2" r=".5" fill="#fbf8f1"/>
  <g class="nz-aile-pres"><path d="M19 30C15.6 24.6 13.4 18.6 13 12.4 17.4 14.6 21.6 18.4 24.4 23 25.6 25 26.2 27 26 29Z" fill="#fbf8f1" ${T} stroke-width="1.1"/>
  <path d="M13 12.4C14 18 16 23.6 19 28.6" fill="none" stroke="#2a211b" stroke-width="2.6" stroke-linecap="round"/></g>`;
const GRUES_DANSE = `<svg viewBox="0 0 88 60" aria-hidden="true">
  <ellipse cx="44" cy="57.6" rx="38" ry="2.8" fill="#f7f5ef" stroke="#b7c8d2" stroke-width="1"/>
  <g class="nz-danse1"><g transform="translate(2 0)">${DANSE_A}</g></g>
  <g class="nz-danse2"><g transform="matrix(-1 0 0 1 86 0)">${DANSE_B}</g></g></svg>`;

// 23 : deux rennes au repos près du traîneau garé (les rennes et le traîneau de noel-carte.js, debout, sans harnais)
function renne(x, y, s, rudolph, broute) {
  const bois = (d, l) => `<path d="${d}" fill="none" stroke="#35251a" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${l}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  const patte = (d) => `<path d="${d}" stroke="#35251a" stroke-width="5.2" stroke-linecap="round"/><path d="${d}" stroke="#7a5030" stroke-width="3.4" stroke-linecap="round"/>`;
  const tete = `<path d="M11-9.5C14-17 19-23 25-25.5L31.5-19.5C27.5-15 24.5-9 22-1Z" fill="#8d5d36" ${T} stroke-width="1.3"/>
    <path d="M21-2C22-9 25-15 30-18.6L29.4-14.4 31.6-13.2 28.4-9.6 30.2-8 26.6-4.6 27.6-2.6 23-.6 23.4 1.6Z" fill="#f1e8d8" ${T} stroke-width="1"/>
    ${bois('M29.2-31.2C25.2-39.2 19.2-45.2 17.2-53.2 16.2-57.2 18.2-60.2 22.2-61.2M23.7-41.2 29.2-47.2M19.6-48.2 24.7-55.2M18.2-51.2 12.2-55.2M28.2-33.2 33.2-37.2 36.2-35.2', '#b89d77')}
    ${bois('M26-30C22-38 16-44 14-52 13-56 15-59 19-60M20.5-40 26-46M16.4-47 21.5-54M15-50 9-54M25-32 30-36 33-34', '#d6bd96')}
    <path d="M22-26C23-32 31-33 35-29L42-23C44-20.5 42-17.5 39-18L32-18.5C27-19 22-21 22-26Z" fill="#8d5d36" ${T} stroke-width="1.3"/>
    <path d="M34-19C37-19.4 40-19 42-21 42-18.5 40-17.6 38-17.8Z" fill="#c39567"/>
    <path d="M23-29C19-32 15-32 13-30 16-27.5 20-27 23-27Z" fill="#8d5d36" ${T} stroke-width="1"/>
    <circle cx="31" cy="-26.6" r="1.3" fill="#35251a"/><circle cx="31.4" cy="-27" r=".42" fill="#fff"/>
    ${rudolph ? '<circle class="nz-nez-lueur" cx="42.6" cy="-21.6" r="7" fill="url(#nz-nez)"/><circle cx="42.4" cy="-21.6" r="2.7" fill="#e0312a" stroke="#35251a" stroke-width=".9"/><circle cx="41.6" cy="-22.4" r=".8" fill="#ffd3c4"/>' : '<ellipse cx="42.2" cy="-21.4" rx="1.7" ry="1.35" fill="#35251a"/>'}`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${patte('M-15 3-17 23')}${patte('M15 4 17 23')}
    <path d="M-20-5C-26-8-28-3-24 0-23-1-21-2-19.6-2Z" fill="#f1e8d8" ${T} stroke-width="1"/>
    <path d="M-21 0C-22-7-16-10-6-10 2-10.5 10-12.5 16-9.5 21-6.5 22 0 19 5 15 10 4 10.4-4 9.8-12 9.2-20 7-21 0Z" fill="#8d5d36" ${T} stroke-width="1.3"/>
    <path d="M-16 6.6C-8 9.4 4 9.8 14 7.6 10 5-4 5-14 4.6Z" fill="#c39567"/>
    ${patte('M-10 5-9 23')}${patte('M10 6 10.6 23')}
    <g${broute ? ' transform="rotate(48 14 -6)"' : ''}>${tete}</g></g>`;
}
const RENNES = `<svg viewBox="0 0 104 60" aria-hidden="true"><defs><radialGradient id="nz-nez"><stop offset="0" stop-color="#ff6a52" stop-opacity=".9"/><stop offset="1" stop-color="#ff6a52" stop-opacity="0"/></radialGradient></defs>
  <path d="M1 58C20 53 84 53 103 58Z" fill="#f7f5ef" ${T} stroke-width="1"/>
  <g transform="translate(2 22) scale(.3)">
    <path d="M38 92 36 104M74 92 74 104M108 90 112 104" stroke="#35251a" stroke-width="5" stroke-linecap="round"/>
    <path d="M38 92 36 104M74 92 74 104M108 90 112 104" stroke="#d9a441" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M16 104H118C134 104 146 98 146 88 146 80 138 78 134 82 131 86 134 90 138 89" fill="none" stroke="#35251a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 104H118C134 104 146 98 146 88 146 80 138 78 134 82 131 86 134 90 138 89" fill="none" stroke="#e3b84f" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M22 50C18 36 24 24 34 22 44 20 52 28 52 40V58H24Z" fill="#8a6b45" ${T} stroke-width="2.6"/>
    <rect x="25" y="13" width="12" height="11" rx="1" fill="#3f7a52" ${T} stroke-width="2" transform="rotate(-12 31 18)"/>
    <rect x="37" y="15" width="11" height="10" rx="1" fill="#4f7fb0" ${T} stroke-width="2" transform="rotate(10 42 20)"/>
    <path d="M20 96C12 96 8 86 9 72 10 58 12 46 18 40 23 35 30 38 28 44 26 48 22 48 22 52 22 56 26 58 30 58H92C104 58 114 62 120 68 126 74 132 74 134 68 136 62 130 56 126 60 124 62 125 65 127 65 128 74 122 86 112 92 106 95 100 96 94 96Z" fill="#b8402c" ${T} stroke-width="3"/>
    <path d="M16 88C14 76 15 62 20 52M26 90H104C112 88 118 82 122 74M30 58H92" fill="none" stroke="#e3b84f" stroke-width="3" stroke-linecap="round"/></g>
  ${renne(76, 31, 0.5, false, true)}${renne(58, 33, 0.56, true, false)}</svg>`;

// 9 : une grue en papier (orizuru) de profil, vers la droite, aux couleurs du papier origami du calendrier (case du 9) :
// rouge, sarcelle ou or selon l'oiseau (.z1, .z2, .z3) ; ses ailes battent (.gp-aile)
export const GRUE_PAPIER = `<svg viewBox="0 0 80 40" aria-hidden="true">
  <path class="gp-aile gp-loin" d="M36 22 45 1.6 47.6 22Z" ${T} stroke-width="1"/>
  <path class="gp-corps" d="M31 24 15 8.6 34 22Z" ${T} stroke-width="1"/>
  <path class="gp-corps" d="M47 23 63.4 8.4 50.6 24.4Z" ${T} stroke-width="1"/>
  <path class="gp-corps" d="M63.4 8.4 69.4 12.6 63 10.4Z" ${T} stroke-width=".9"/>
  <path class="gp-ventre" d="M30 24 40.4 18.6 51.4 24.2 40.4 30.4Z" ${T} stroke-width="1.1"/>
  <path d="M40.4 18.6V30.4" stroke="#35251a" stroke-width=".6" opacity=".6"/>
  <g class="gp-aile"><path class="gp-face" d="M33.6 22.6 38 .2 47.2 22.6Z" ${T} stroke-width="1.1"/>
  <path class="gp-pli" d="M38 .2 40.6 22.6" fill="none" stroke-width=".9"/></g></svg>`;

// 15 : une carte de vœux (nengajō) : 賀正, une branche de pin, un timbre rouge
const CARTE_VOEUX = `<svg viewBox="0 0 36 26" aria-hidden="true">
  <rect x="1" y="1" width="34" height="24" rx="1.5" fill="#fbf7ec" stroke="#8a6b45" stroke-width="1"/>
  <rect x="26" y="3.4" width="6.4" height="7.6" fill="#c33a2b" stroke="#7a2418" stroke-width=".6"/>
  <path d="M27.2 5h4M27.2 7h4M27.2 9h4" stroke="#f4d9c4" stroke-width=".5"/>
  <text x="12.6" y="17.6" font-family="'Zen Antique', serif" font-size="11" fill="#b8402c" text-anchor="middle">賀正</text>
  <path d="M4 21.6C8 20 12 20.6 15 22.4M7 20.4 6 18.6M10 20.2 9.6 18.2M12.6 20.8 13.4 19" fill="none" stroke="#3f6b46" stroke-width="1.1" stroke-linecap="round"/>
  <circle cx="29.2" cy="19.8" r="2.4" fill="none" stroke="#c33a2b" stroke-width=".7"/></svg>`;

// 3 : la guirlande du titre (un bandeau de 240 de large) : du sapin en deux festons, des boules de couleur qui scintillent
// en trois groupes (.nz-g1, .nz-g2, .nz-g3), des nœuds rouges aux attaches
function guirlande(l, festons, creux) {
  const pas = l / festons;
  let d = 'M2 4';
  const boules = [];
  const couleurs = ['#d8443a', '#e8c13a', '#3f8fc4', '#5aa86a'];
  for (let i = 0; i < festons; i++) {
    const x0 = 2 + i * pas, x1 = 2 + (i + 1) * pas;
    d += `Q${(x0 + x1) / 2} ${4 + 2 * creux} ${x1} 4`;
    for (let k = 1; k <= 4; k++) {
      const t = k / 5, x = x0 + (x1 - x0) * t, y = 4 + 2 * creux * t * (1 - t);
      boules.push(`<circle class="nz-g${1 + ((i * 4 + k) % 3)}" cx="${x.toFixed(1)}" cy="${(y + 3.4).toFixed(1)}" r="2.2" fill="${couleurs[(i * 4 + k) % 4]}" stroke="#35251a" stroke-width=".6"/>`);
    }
  }
  const noeuds = Array.from({ length: festons + 1 }, (_, i) => {
    const x = 2 + i * pas;
    return `<path d="M${x} 4.4C${x - 5} 0 ${x - 6} 6 ${x} 4.4C${x + 6} 6 ${x + 5} 0 ${x} 4.4ZM${x} 4.6L${x - 2.4} 10M${x} 4.6L${x + 2.6} 9.6" fill="#c33a2b" stroke="#35251a" stroke-width=".7" stroke-linejoin="round"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${l + 4} ${2 * creux + 12}" aria-hidden="true">
    <path d="${d}" fill="none" stroke="#2f5537" stroke-width="5.4" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#4f7f52" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="1.4 1.6"/>
    ${boules.join('')}${noeuds}</svg>`;
}

// ---------------------------------------------------------------- Où sont les décorations
// des lacs où les cygnes chanteurs passent vraiment l'hiver, parmi ceux que la carte dessine (eaux-japon.geojson : Utonai
// et Hyōko n'y sont pas) ; chaque point en eau libre, le plus loin possible des rives, à plus de 4 km de toute épingle
const LACS_CYGNES = [
  { ou: [144.3491, 43.6513], nom: { en: 'Lake Kussharo', fr: 'Lac Kussharo', ja: '屈斜路湖' } },
  { ou: [145.2601, 43.3389], nom: { en: 'Lake Fūren', fr: 'Lac Fūren', ja: '風蓮湖' } },
  { ou: [141.3249, 40.8159], nom: { en: 'Lake Ogawara', fr: 'Lac Ogawara', ja: '小川原湖' } },
  { ou: [141.1071, 38.7181], nom: { en: 'Izunuma', fr: 'Étang d’Izunuma', ja: '伊豆沼' } },
  { ou: [140.0651, 37.4989], nom: { en: 'Lake Inawashiro', fr: 'Lac Inawashiro', ja: '猪苗代湖' } },
];
const KAMAKURAS = [
  { ou: [140.553, 39.311], nom: { en: 'Yokote (Akita)', fr: 'Yokote (Akita)', ja: '横手（秋田県）' } },
  { ou: [138.365, 36.852], nom: { en: 'Iiyama (Nagano)', fr: 'Iiyama (Nagano)', ja: '飯山（長野県）' } },
  { ou: [139.596, 36.935], nom: { en: 'Yunishigawa (Tochigi)', fr: 'Yunishigawa (Tochigi)', ja: '湯西川（栃木県）' } },
];
const FERMES = ['gokayama', 'hida-folk-village']; // des fermes gasshō-zukuri (pas Nenba : ses toits sont d'un autre style)
const HIROSAKI = 'hirosaki-castle', MAIHASHI = 'tsuru-no-maihashi-bridge';
const JIGOKUDANI = { ou: [138.4627, 36.7327], nom: { en: 'Jigokudani Monkey Park', fr: 'Parc des singes de Jigokudani', ja: '地獄谷野猿公苑' } };
const SOYA = { ou: [141.94, 45.474], nom: { en: 'Cape Sōya', fr: 'Cap Sōya', ja: '宗谷岬' } };

// Les textes des bulles (en, fr, ja)
const TEXTES = {
  lanternes: {
    titre: { en: 'Lanterns in the old village', fr: 'Les lanternes du vieux village', ja: '古い村のちょうちん' },
    texte: { en: 'In winter, Japan’s old villages and post towns hang paper lanterns along their streets; at dusk they glow over the snow.',
      fr: 'L’hiver, les vieux villages et les anciens relais du Japon suspendent des lanternes de papier le long de leurs rues ; au crépuscule, elles brillent sur la neige.',
      ja: '冬、日本の古い村や宿場町では、通りに提灯をつるします。夕暮れになると、雪の上でやさしく光ります。' },
  },
  cygnes: {
    titre: { en: 'Whooper swans', fr: 'Les cygnes chanteurs', ja: 'オオハクチョウ' },
    texte: { en: 'Every autumn, whooper swans fly in from Siberia and spend the winter on Japan’s lakes, from Hokkaidō to Niigata, until March.',
      fr: 'Chaque automne, les cygnes chanteurs arrivent de Sibérie et passent l’hiver sur les lacs du Japon, de Hokkaidō à Niigata, jusqu’en mars.',
      ja: '毎年秋、オオハクチョウがシベリアから渡ってきて、北海道から新潟までの湖で3月まで冬を越します。' },
  },
  yukidoro: {
    titre: { en: 'The snow lanterns of Hirosaki', fr: 'Les lanternes de neige de Hirosaki', ja: '弘前の雪燈籠' },
    texte: { en: 'Every February, for its Snow Lantern Festival, Hirosaki Castle’s park fills with lanterns and little huts made of snow, lit by candles at night.',
      fr: 'Chaque février, pour sa fête des lanternes de neige, le parc du château de Hirosaki se remplit de lanternes et de petites huttes en neige, éclairées à la bougie la nuit.',
      ja: '毎年2月の弘前城雪燈籠まつりでは、公園が雪でつくった燈籠や小さなかまくらでいっぱいになり、夜はろうそくがともります。' },
  },
  fermes: {
    titre: { en: 'Farmhouses under the snow', fr: 'Les fermes sous la neige', ja: '雪の中の合掌造り' },
    texte: { en: 'Their steep thatched roofs, shaped like hands joined in prayer (gasshō), let the heavy snow slide off. At night, their windows glow through the snow.',
      fr: 'Leurs toits de chaume très pentus, en forme de mains jointes pour prier (gasshō), laissent glisser la neige épaisse. La nuit, leurs fenêtres brillent dans la neige.',
      ja: '手を合わせたような急な茅葺き屋根（合掌造り）は、重い雪をすべり落とします。夜は、雪の中に窓の明かりがともります。' },
  },
  singes: {
    titre: { en: 'Snow monkeys in the hot spring', fr: 'Les singes des neiges au bain', ja: '温泉に入るスノーモンキー' },
    texte: { en: 'Japanese macaques live farther north than any other monkey. At Jigokudani, in the mountains of Nagano, they warm up in a hot spring pool while the snow falls.',
      fr: 'Les macaques japonais sont les singes qui vivent le plus au nord du monde. À Jigokudani, dans les montagnes de Nagano, ils se réchauffent dans un bassin d’eau chaude pendant que la neige tombe.',
      ja: 'ニホンザルは、世界でいちばん北に暮らすサルです。長野の山あいの地獄谷では、雪の降る中で温泉に入って温まります。' },
  },
  kamakura: {
    titre: { en: 'Kamakura, the snow huts', fr: 'Les kamakura, huttes de neige', ja: 'かまくら' },
    texte: { en: 'In the snowy north, children build kamakura: snow huts with a small altar to the water god inside, where they light candles and share rice cakes. The most famous are in Yokote, every February.',
      fr: 'Dans le nord enneigé, les enfants construisent des kamakura : des huttes de neige avec un petit autel au dieu de l’eau, où l’on allume des bougies et partage des gâteaux de riz. Les plus célèbres sont à Yokote, chaque février.',
      ja: '雪国では子どもたちがかまくらを作ります。中に水神さまをまつり、ろうそくをともして餅をいただきます。いちばん有名なのは、毎年2月の横手のかまくらです。' },
  },
  danse: {
    titre: { en: 'The dance of the cranes', fr: 'La danse des grues', ja: '鶴の舞' },
    texte: { en: 'In late winter, red-crowned cranes court by dancing: they bow, call, leap and open their wings. In Japan they stand for a long life and a happy couple.',
      fr: 'À la fin de l’hiver, les grues du Japon se font la cour en dansant : elles s’inclinent, chantent, sautent et ouvrent les ailes. Au Japon, elles symbolisent une longue vie et un couple heureux.',
      ja: '冬の終わり、タンチョウは求愛のダンスをします。おじぎをし、鳴き交わし、跳びはねて翼を広げます。日本では長寿と夫婦円満のしるしです。' },
  },
  rennes: {
    titre: { en: 'The reindeer get ready', fr: 'Les rennes se préparent', ja: '出発を待つトナカイ' },
    texte: { en: 'Before the big night, Santa’s reindeer rest at Cape Sōya, the northern tip of Japan. On the night of the 24th, look at the sky of the map.',
      fr: 'Avant la grande nuit, les rennes du Père Noël se reposent au cap Sōya, la pointe nord du Japon. Le soir du 24, regarde le ciel de la carte.',
      ja: '大事な夜の前に、サンタのトナカイが日本の最北端、宗谷岬でひと休み。24日の夜は、マップの空を見上げてみて。' },
  },
};

/** Les dessins des repères (pour la planche d'essai des dessins). */
export const DESSINS_NOEL = { lanternes: dessinLanternes(), cygnes: CYGNES, yukidoro: dessinYukidoro(), fermes: FERME, singes: SINGES,
  kamakura: KAMAKURA, danse: GRUES_DANSE, rennes: RENNES, papier: GRUE_PAPIER, carte: CARTE_VOEUX, guirlande: guirlande(236, 2, 7) };

/**
 * outils (de noel-carte.js) : { reperes, poser(lngLat, html, classe, aria, appui, zoomMin), ouvrirBulle(lngLat, contenu,
 * hauteur), contenu(titre, second, texte, compte), retirer(r), enL, tx, lieux(), ambiance() (ambiance.js, ou null),
 * choisirOiseaux, modeles3d, basDesBandeaux(), sansMouvement }.
 * Renvoie { maj(jour), eteindre(), reperes() : les repères posés (pour le zoom, noel-carte.js) }.
 */
export function brancherDecors(map, outils) {
  const { poser, ouvrirBulle, contenu, retirer, enL, tx, lieux, choisirOiseaux, modeles3d, sansMouvement } = outils;
  let jour = 0;
  const poses = new Map(); // nom → [repères]
  const etat = {}; // ce qui est déjà fait (pour ne refaire que ce qui change)
  const lieu = (id) => lieux().find((l) => l.id === id);
  const nuit = () => document.body.classList.contains('nuit');

  // ---- Les repères : un groupe par décoration, posé le jour venu, retiré à la fin
  function groupe(nom, actif, fabriquer) {
    if (actif && !poses.has(nom)) poses.set(nom, fabriquer().filter(Boolean));
    if (!actif && poses.has(nom)) { poses.get(nom).forEach(retirer); poses.delete(nom); }
  }
  function repere(nom, ou, dessin, second, hauteur) {
    const t = TEXTES[nom];
    const r = poser(ou, dessin, `noel-deco nz-${nom}`, enL(t.titre),
      () => ouvrirBulle(ou, contenu(enL(t.titre), second, enL(t.texte), tx('date', JOUR[nom])), hauteur), ZOOM_DECOR);
    return r;
  }
  const pres = (l, dx, dy) => (l ? [l.lng + dx, l.lat + dy] : null);
  const villages = () => lieux().filter((l) => l.cat?.icone === 'village');

  // ---- La couche de la carte, la nuit : la guirlande des côtes (20)
  /** Juste au-dessus du trait des côtes (sous les épingles, les modèles 3D et les noms). */
  function apresCote() {
    const ordre = map.getLayersOrder?.() || map.getStyle().layers.map((c) => c.id);
    const i = ordre.indexOf('cote-encre');
    return i >= 0 ? ordre[i + 1] : undefined;
  }
  const COUCHES = {
    cotes: () => {
      if (!map.hasImage('noel-ampoules')) map.addImage('noel-ampoules', ampoules(), { pixelRatio: 2 });
      return [{ id: 'noel-cotes', type: 'line', source: 'cote', maxzoom: 8.2, layout: { 'line-join': 'round' },
        paint: { 'line-pattern': 'noel-ampoules', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 5, 7.5, 7],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6.5, 1, 8, 0] } }];
    },
  };
  /** Le motif de la guirlande des côtes : quatre ampoules (or, rouge, vert, bleu) et leur lueur, sur fond transparent. */
  function ampoules() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 16;
    const g = c.getContext('2d');
    ['#ffd36b', '#ff6f5e', '#7fe39a', '#8fd0ff'].forEach((couleur, i) => {
      const x = 8 + 16 * i;
      const lueur = g.createRadialGradient(x, 8, 0, x, 8, 8);
      lueur.addColorStop(0, `${couleur}cc`);
      lueur.addColorStop(1, `${couleur}00`);
      g.fillStyle = lueur;
      g.fillRect(x - 8, 0, 16, 16);
      g.beginPath();
      g.arc(x, 8, 2.6, 0, Math.PI * 2);
      g.fillStyle = '#fffbe8';
      g.fill();
    });
    return g.getImageData(0, 0, 64, 16);
  }
  const couchesPosees = new Set();
  function couche(nom, voulu) {
    if (voulu && !couchesPosees.has(nom) && map.getSource('cote')) {
      const avant = apresCote();
      for (const c of COUCHES[nom]()) if (!map.getLayer(c.id)) map.addLayer(c, avant);
      couchesPosees.add(nom);
    }
    if (!voulu && couchesPosees.has(nom)) {
      for (const id of map.getStyle().layers.map((c) => c.id).filter((id) => id.startsWith(`noel-${nom}`))) map.removeLayer(id);
      couchesPosees.delete(nom);
    }
  }

  // ---- Les éléments hors de la carte : la guirlande du titre (et du logo sur téléphone), les cartes de vœux
  let guirlandes = [];
  function poserGuirlandes(oui) {
    if (oui && !guirlandes.length) {
      const bandeau = document.querySelector('.bandeau');
      const entete = document.querySelector('.entete');
      if (bandeau) {
        const g = creer('div', 'noel-guirlande nz-titre');
        g.innerHTML = guirlande(236, 2, 7);
        bandeau.append(g);
        guirlandes.push(g);
      }
      if (entete) {
        const g = creer('div', 'noel-guirlande nz-logo');
        g.innerHTML = guirlande(60, 1, 6);
        entete.append(g);
        guirlandes.push(g);
      }
    }
    if (!oui && guirlandes.length) { guirlandes.forEach((g) => g.remove()); guirlandes = []; }
  }

  let cartes = null, minuterieCartes = null;
  function volCartes() {
    if (!cartes || document.hidden) return;
    const b = document.body.classList;
    if (b.contains('en-jeu') || b.contains('en-visite') || b.contains('plongeon') || b.contains('mode-film')) return;
    const bas = outils.basDesBandeaux() + 10;
    cartes.style.setProperty('--haut', `${Math.round(hasard(bas, bas + Math.max(40, innerHeight * 0.3)))}px`);
    cartes.classList.remove('vole');
    void cartes.offsetWidth; // relance l'animation
    cartes.classList.add('vole');
  }
  function poserCartes(oui) {
    if (oui && !cartes && !sansMouvement) {
      cartes = creer('div', 'noel-cartes');
      cartes.setAttribute('aria-hidden', 'true');
      cartes.innerHTML = [0, 1, 2].map((i) => `<div class="nz-carte nz-c${i}">${CARTE_VOEUX}</div>`).join('');
      // la dernière à finir son vol : la deuxième (1,4 s + 16 s)
      cartes.addEventListener('animationend', (e) => { if (e.target.classList?.contains('nz-c1')) cartes?.classList.remove('vole'); });
      document.body.append(cartes);
      const suivant = () => { minuterieCartes = setTimeout(() => { volCartes(); suivant(); }, hasard(70, 150) * 1000); };
      minuterieCartes = setTimeout(() => { volCartes(); suivant(); }, hasard(12, 25) * 1000);
    }
    if (!oui && cartes) { clearTimeout(minuterieCartes); cartes.remove(); cartes = null; }
  }

  // ---- La nuit : les couches lumineuses, et les rennes partis le soir du 24
  function majNuit() {
    const n = nuit();
    couche('cotes', jour >= JOUR.cotes && n);
    document.body.classList.toggle('noel-rennes-partis', jour > 24 || (jour === 24 && n));
  }
  let nuitVue = null;
  const observateur = new MutationObserver(() => { if (nuit() !== nuitVue) { nuitVue = nuit(); majNuit(); } });
  observateur.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // ---------------------------------------------------------------- Le jour du calendrier
  function maj(j) {
    jour = j;
    const a = (nom) => j >= JOUR[nom];
    const b = document.body.classList;
    b.toggle('noel-illuminations', a('illuminations'));
    b.toggle('noel-sapins', a('sapins'));
    b.toggle('noel-cadeaux', a('cadeaux'));
    // la neige tombe dès le 1er décembre (les feuilles d'automne de la saison jusqu'au 5, sinon)
    const amb = outils.ambiance?.();
    if (amb && etat.ambiance !== amb) {
      etat.ambiance = amb;
      amb.remplacerParticules((m) => (m.particules === 'feuilles' ? 'neige' : undefined));
    }
    amb?.hiverNoel(j); // 6 et 11 : la neige plus bas, la banquise (sans effet si rien ne change)
    // 4 et 19 : les cascades gelées, de près (leur modèle 3D), et leur glace qui luit la nuit
    const cascades = `${a('cascades')}|${a('glaceNuit')}`;
    if (etat.cascades !== cascades && modeles3d?.forcerSaison) {
      etat.cascades = cascades;
      const glaceNuit = a('glaceNuit');
      modeles3d.forcerSaison(a('cascades') ? (l) => (l.cat?.icone === 'waterfall' ? { neige: 1, glaceNuit } : null) : null);
    }
    // 9 : les grues en papier
    if (etat.papier !== a('papier')) {
      etat.papier = a('papier');
      choisirOiseaux?.(a('papier') ? { svg: GRUE_PAPIER, classe: 'grue-papier', nombre: [3, 5], vitesse: 0.9, entre: [20, 50] } : null);
    }
    poserGuirlandes(a('guirlande'));
    poserCartes(a('cartes'));
    // les repères
    groupe('lanternes', a('lanternes'), () => villages().map((l) => repere('lanternes', pres(l, 0.034, -0.018), dessinLanternes(), enL(l.nom), 46)));
    groupe('cygnes', a('cygnes'), () => LACS_CYGNES.map((c) => repere('cygnes', c.ou, CYGNES, enL(c.nom), 44)));
    groupe('yukidoro', a('yukidoro'), () => {
      const l = lieu(HIROSAKI);
      return [l && repere('yukidoro', pres(l, 0.036, -0.022), dessinYukidoro(), enL(l.nom), 46)];
    });
    groupe('fermes', a('fermes'), () => FERMES.map((id) => {
      const l = lieu(id);
      return l && repere('fermes', pres(l, -0.042, 0.014), FERME, enL(l.nom), 58);
    }));
    groupe('singes', a('singes'), () => [repere('singes', JIGOKUDANI.ou, SINGES, enL(JIGOKUDANI.nom), 50)]);
    groupe('kamakura', a('kamakura'), () => KAMAKURAS.map((k) => repere('kamakura', k.ou, KAMAKURA, enL(k.nom), 44)));
    groupe('danse', a('danse'), () => {
      const l = lieu(MAIHASHI);
      return [l && repere('danse', pres(l, 0.11, -0.01), GRUES_DANSE, enL(l.nom), 62)];
    });
    groupe('rennes', a('rennes'), () => [repere('rennes', SOYA.ou, RENNES, enL(SOYA.nom), 60)]);
    nuitVue = nuit();
    majNuit();
  }

  function eteindre() {
    observateur.disconnect();
    for (const nom of [...poses.keys()]) groupe(nom, false);
    couche('cotes', false);
    poserGuirlandes(false);
    poserCartes(false);
    etat.ambiance?.remplacerParticules(null);
    (etat.ambiance || outils.ambiance?.())?.hiverNoel(0);
    if (etat.cascades) modeles3d?.forcerSaison?.(null);
    if (etat.papier) choisirOiseaux?.(null);
    for (const c of ['noel-illuminations', 'noel-sapins', 'noel-cadeaux', 'noel-rennes-partis']) document.body.classList.remove(c);
  }

  return { maj, eteindre, reperes: () => [...poses.values()].flat() };
}
