// ================================================================
//  Noël sur la carte : les cadeaux du calendrier de l'Avent (noel.js) qui se posent sur la carte elle-même
//  (le propriétaire, 2026-11-21 : « commence par les cases de la carte »). Chacun apparaît le jour de sa case et reste
//  jusqu'à la fin de l'événement :
//  - le 12 : une tempête de neige tourne autour de Yuki-onna, la légende cachée dans les montagnes de Niigata ;
//  - le 14 : le kanji de l'année, écrit au pinceau sur une grande feuille posée sur Kyoto (lu par le robot le 12
//    décembre dans data/kanji-annee.json, ou CONFIG.noel.kanji) : une
//    image drapée sur le relief, sous les épingles (une feuille en repère HTML se perdait parmi les épingles de Kyoto) ;
//  - le 22 (Tōji) : un yuzu flotte près de chaque onsen de la carte ; tous trouvés, un koban pour la boutique de
//    Bunbuku, dans la balade 3D (localStorage baladeSecrets, comme un secret de la balade) ;
//  - le 24 : six Jizō sous la neige près du Murō-ji ; on pose un chapeau de paille sur chacun, comme dans le conte
//    « Kasa Jizō », et ils offrent le bonnet de Père Noël de la balade (localStorage noelTenue) ; la nuit, le traîneau
//    du Père Noël, tiré par quatre rennes, traverse le ciel sous les bandeaux du haut et lâche des cadeaux.
//  Les repères passent par reperes.js, comme les légendes et les yōkai d'Halloween (même classe .legende : cachés de
//  loin, posés sous les épingles). Rien ne bouge par script à chaque image : les petits mouvements sont en CSS
//  (transform), et seulement à l'écran (.anime).
// ================================================================

import { DESSINS } from './legendes-dessins.js';
import { LEGENDES, ouvrirLegende } from './legendes.js';
import { echapper } from './commun.js';
import { brancherDecors } from './noel-decors.js';

const JOUR_TEMPETE = 12, JOUR_KANJI = 14, JOUR_YUZU = 22, JOUR_JIZO = 24;
const ZOOM_YUZU = 6.5; // comme les légendes : de plus loin, on ne les voit pas
const KANJI_2025 = '熊'; // le kanji de 2025 (l'ours), montré tant que celui de 2026 n'est pas connu
// le kanji de l'année lu par le robot (outils/kanji_annee.py, chaque nuit et le 12 décembre après l'annonce)
const KANJI_LU = 'data/kanji-annee.json';
const KYOTO = [135.768, 34.985]; // le centre de la feuille du kanji (la ville, le Kiyomizu-dera à l'est)
// la feuille : 400 × 480 pixels, 27 km de large sur Kyoto (1° de longitude ≈ 91 km, 1° de latitude ≈ 111 km à 35° N)
const FEUILLE = { l: 0.30, h: 0.295 };
// les six Jizō : de petites statues 3D posées au pied du modèle du temple du Murō-ji (couche3d.js, decors), en rang
// devant son podium de pierre, trois de chaque côté de l'escalier, tournées vers le visiteur (unités du modèle : x vers
// l'est, z vers le sud ; le podium va jusqu'à z = 0,34, l'escalier jusqu'à 0,49 entre x = ±0,13). Rangés le long des
// côtés du podium, ils s'empilaient à l'écran (la carte regarde d'ordinaire vers le nord). Avant le 2026-11-22, un
// repère HTML à 2 km de là : il passait devant le temple, et le propriétaire voulait de vrais Jizō autour.
const MUROJI = 'muro-ji';
const PLACES_JIZO = [[-0.55, 0.55, 0.12], [-0.4, 0.57, 0.06], [-0.25, 0.58, 0], [0.25, 0.58, 0], [0.4, 0.57, -0.06], [0.55, 0.55, -0.12]];
const ZOOM_VOIR_JIZO = 13.4;
const MEMO_YUZU = 'noelYuzus', MEMO_JIZO = 'noelJizo', MEMO_TENUE = 'noelTenue';
const SECRET_YUZU = 'noel2026-yuzu'; // compté par la balade comme un secret trouvé : un koban
const hasard = (a, b) => a + Math.random() * (b - a);

const lire = (cle, defaut) => { try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; } };
const garder = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch { /* navigation privée */ } };
const creer = (balise, classe, texte) => {
  const el = document.createElement(balise);
  if (classe) el.className = classe;
  if (texte != null) el.textContent = texte;
  return el;
};
const decalages = (h) => ({
  top: [0, 6], 'top-left': [0, 6], 'top-right': [0, 6],
  bottom: [0, -h], 'bottom-left': [0, -h], 'bottom-right': [0, -h],
  left: [30, -h / 2], right: [-30, -h / 2],
});

export const ICONE_HOUX = '<svg class="houx" viewBox="0 0 26 22" aria-hidden="true"><g stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><path fill="#5f7f4f" d="M12 12C9 9 7 10 4 7c1 3-1 4 0 6-2 0-3 1-3 2 3-1 6 1 11-3z"/><path fill="#5f7f4f" d="M14 12c3-3 5-2 8-5-1 3 1 4 0 6 2 0 3 1 3 2-3-1-6 1-11-3z"/><circle fill="#b8402c" cx="11" cy="15" r="2.6"/><circle fill="#b8402c" cx="15.4" cy="15.6" r="2.6"/><circle fill="#b8402c" cx="13.2" cy="18.8" r="2.6"/></g></svg>';

// Un yuzu qui flotte, avec sa feuille et des ronds dans l'eau
const YUZU = `<svg viewBox="0 0 48 44" aria-hidden="true">
  <ellipse class="nz-onde" cx="24" cy="36" rx="19" ry="4.6"/><ellipse class="nz-onde nz-onde2" cx="24" cy="36" rx="12" ry="2.8"/>
  <g class="nz-yuzu"><circle cx="24" cy="26" r="10.5" fill="#ecc23a" stroke="#35251a" stroke-width="1.5"/>
  <path d="M24 15.6 Q27 10 33.6 10.8 Q30.4 16.4 24 15.6 Z" fill="#5f7f4f" stroke="#35251a" stroke-width="1.3" stroke-linejoin="round"/>
  <g fill="#c99a1c"><circle cx="20" cy="23" r=".8"/><circle cx="27" cy="27" r=".8"/><circle cx="22" cy="30" r=".8"/><circle cx="28" cy="21.6" r=".7"/></g>
  <path d="M18.6 21 Q20 18.6 22.6 18" fill="none" stroke="#fff3bf" stroke-width="1.4" stroke-linecap="round"/></g></svg>`;


// Le traîneau du Père Noël (refait le 2026-11-22 : « un vrai traîneau tiré par des vraies rennes ») : un traîneau rouge
// et or (dossier et proue en volutes, patins recourbés), le Père Noël et sa hotte de cadeaux, quatre rennes en file au
// galop (Rudolph devant, le nez rouge qui luit). Dessiné par traineau.py (scratchpad de la session) ; les pattes
// battent en CSS (.nz-av, .nz-ar), chaque renne avec son décalage (--r).
const TRAINEAU = `<svg viewBox="0 -20 500 136" aria-hidden="true"><defs><radialGradient id="nz-lueur"><stop offset="0" stop-color="#ff6a52" stop-opacity=".9"/><stop offset="1" stop-color="#ff6a52" stop-opacity="0"/></radialGradient></defs><circle class="nz-etincelle" style="--r:0.00s" cx="16" cy="86" r="1.6" fill="#ffe7a6"/><circle class="nz-etincelle" style="--r:0.23s" cx="26" cy="96" r="1.2" fill="#ffe7a6"/><circle class="nz-etincelle" style="--r:0.46s" cx="10" cy="100" r="1" fill="#ffe7a6"/><circle class="nz-etincelle" style="--r:0.69s" cx="22" cy="76" r="1" fill="#ffe7a6"/><circle class="nz-etincelle" style="--r:0.92s" cx="34" cy="106" r="1.3" fill="#ffe7a6"/><circle class="nz-etincelle" style="--r:1.15s" cx="6" cy="90" r="0.9" fill="#ffe7a6"/><path d="M144 66 C170 64 196 60 222 58 M144 70 C172 68 200 62 226 60 M232 58 L302 52 M236 60 L306 54 M312 52 L382 46 M316 54 L386 48 M392 46 L462 40" fill="none" stroke="#d9a441" stroke-width="1.4" stroke-linecap="round"/><g transform="translate(206 64) scale(1.0)"><g class="nz-renne" style="--r:0.00s"><g class="nz-av" style="--r:0.00s"><path d="M8 5 L18 11" stroke="#35251a" stroke-width="6.0" stroke-linecap="round"/><path d="M18 11 L24 17" stroke="#35251a" stroke-width="4.0" stroke-linecap="round"/><path d="M8 5 L18 11" stroke="#6a4528" stroke-width="4.2" stroke-linecap="round"/><path d="M18 11 L24 17" stroke="#6a4528" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="17" r="1.87" fill="#2d2119"/></g><g class="nz-ar" style="--r:0.00s"><path d="M-12 4 L-21 12" stroke="#35251a" stroke-width="6.6" stroke-linecap="round"/><path d="M-21 12 L-31 17" stroke="#35251a" stroke-width="4.0" stroke-linecap="round"/><path d="M-12 4 L-21 12" stroke="#6a4528" stroke-width="4.8" stroke-linecap="round"/><path d="M-21 12 L-31 17" stroke="#6a4528" stroke-width="2.4" stroke-linecap="round"/><circle cx="-31" cy="17" r="1.87" fill="#2d2119"/></g><path d="M-20 -5 C-26 -8 -28 -3 -24 0 C-23 -1 -21 -2 -19.6 -2Z" fill="#f1e8d8" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><path d="M-21 0 C-22 -7 -16 -10 -6 -10 C2 -10.5 10 -12.5 16 -9.5 C21 -6.5 22 0 19 5 C15 10 4 10.4 -4 9.8 C-12 9.2 -20 7 -21 0Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M-16 6.6 C-8 9.4 4 9.8 14 7.6 C10 5 -4 5 -14 4.6Z" fill="#c39567"/><path d="M11 -9.5 C14 -17 19 -23 25 -25.5 L31.5 -19.5 C27.5 -15 24.5 -9 22 -1Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M21 -2 C22 -9 25 -15 30 -18.6 L29.4 -14.4 L31.6 -13.2 L28.4 -9.6 L30.2 -8 L26.6 -4.6 L27.6 -2.6 L23 -.6 L23.4 1.6Z" fill="#f1e8d8" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><path d="M29.2 -31.2 C25.2 -39.2 19.2 -45.2 17.2 -53.2 C16.2 -57.2 18.2 -60.2 22.2 -61.2 M23.7 -41.2 L29.2 -47.2 M19.599999999999998 -48.2 L24.7 -55.2 M18.2 -51.2 L12.2 -55.2 M28.2 -33.2 L33.2 -37.2 L36.2 -35.2" fill="none" stroke="#35251a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M29.2 -31.2 C25.2 -39.2 19.2 -45.2 17.2 -53.2 C16.2 -57.2 18.2 -60.2 22.2 -61.2 M23.7 -41.2 L29.2 -47.2 M19.599999999999998 -48.2 L24.7 -55.2 M18.2 -51.2 L12.2 -55.2 M28.2 -33.2 L33.2 -37.2 L36.2 -35.2" fill="none" stroke="#b89d77" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 -30 C22 -38 16 -44 14 -52 C13 -56 15 -59 19 -60 M20.5 -40 L26 -46 M16.4 -47 L21.5 -54 M15 -50 L9 -54 M25 -32 L30 -36 L33 -34" fill="none" stroke="#35251a" stroke-width="3.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 -30 C22 -38 16 -44 14 -52 C13 -56 15 -59 19 -60 M20.5 -40 L26 -46 M16.4 -47 L21.5 -54 M15 -50 L9 -54 M25 -32 L30 -36 L33 -34" fill="none" stroke="#d6bd96" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 -26 C23 -32 31 -33 35 -29 L42 -23 C44 -20.5 42 -17.5 39 -18 L32 -18.5 C27 -19 22 -21 22 -26Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M34 -19 C37 -19.4 40 -19 42 -21 C42 -18.5 40 -17.6 38 -17.8Z" fill="#c39567"/><path d="M23 -29 C19 -32 15 -32 13 -30 C16 -27.5 20 -27 23 -27Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><circle cx="31" cy="-26.6" r="1.3" fill="#35251a"/><circle cx="31.4" cy="-27" r=".42" fill="#fff"/><ellipse cx="42.2" cy="-21.4" rx="1.7" ry="1.35" fill="#35251a"/><path d="M12 -9 C15 -4.5 16 1.6 14.6 8.4" fill="none" stroke="#35251a" stroke-width="4.6"/><path d="M12 -9 C15 -4.5 16 1.6 14.6 8.4" fill="none" stroke="#b8402c" stroke-width="3"/><circle cx="16" cy="-1.4" r="1.8" fill="#e3b84f" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width=".8"/><circle cx="15.8" cy="4" r="1.8" fill="#e3b84f" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width=".8"/><g class="nz-av" style="--r:0.00s"><path d="M10 4 L19 9" stroke="#35251a" stroke-width="6.6" stroke-linecap="round"/><path d="M19 9 L14 15.5" stroke="#35251a" stroke-width="4.2" stroke-linecap="round"/><path d="M10 4 L19 9" stroke="#8d5d36" stroke-width="4.8" stroke-linecap="round"/><path d="M19 9 L14 15.5" stroke="#8d5d36" stroke-width="2.6" stroke-linecap="round"/><circle cx="14" cy="15.5" r="2.03" fill="#2d2119"/></g><g class="nz-ar" style="--r:0.00s"><path d="M-14 2 L-25 8" stroke="#35251a" stroke-width="7.3999999999999995" stroke-linecap="round"/><path d="M-25 8 L-36 9.5" stroke="#35251a" stroke-width="4.2" stroke-linecap="round"/><path d="M-14 2 L-25 8" stroke="#8d5d36" stroke-width="5.6" stroke-linecap="round"/><path d="M-25 8 L-36 9.5" stroke="#8d5d36" stroke-width="2.6" stroke-linecap="round"/><circle cx="-36" cy="9.5" r="2.03" fill="#2d2119"/></g></g></g><g transform="translate(286 58) scale(1.0)"><g class="nz-renne" style="--r:0.14s"><g class="nz-av" style="--r:0.14s"><path d="M8 5 L18 11" stroke="#35251a" stroke-width="6.0" stroke-linecap="round"/><path d="M18 11 L24 17" stroke="#35251a" stroke-width="4.0" stroke-linecap="round"/><path d="M8 5 L18 11" stroke="#6a4528" stroke-width="4.2" stroke-linecap="round"/><path d="M18 11 L24 17" stroke="#6a4528" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="17" r="1.87" fill="#2d2119"/></g><g class="nz-ar" style="--r:0.14s"><path d="M-12 4 L-21 12" stroke="#35251a" stroke-width="6.6" stroke-linecap="round"/><path d="M-21 12 L-31 17" stroke="#35251a" stroke-width="4.0" stroke-linecap="round"/><path d="M-12 4 L-21 12" stroke="#6a4528" stroke-width="4.8" stroke-linecap="round"/><path d="M-21 12 L-31 17" stroke="#6a4528" stroke-width="2.4" stroke-linecap="round"/><circle cx="-31" cy="17" r="1.87" fill="#2d2119"/></g><path d="M-20 -5 C-26 -8 -28 -3 -24 0 C-23 -1 -21 -2 -19.6 -2Z" fill="#f1e8d8" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><path d="M-21 0 C-22 -7 -16 -10 -6 -10 C2 -10.5 10 -12.5 16 -9.5 C21 -6.5 22 0 19 5 C15 10 4 10.4 -4 9.8 C-12 9.2 -20 7 -21 0Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M-16 6.6 C-8 9.4 4 9.8 14 7.6 C10 5 -4 5 -14 4.6Z" fill="#c39567"/><path d="M11 -9.5 C14 -17 19 -23 25 -25.5 L31.5 -19.5 C27.5 -15 24.5 -9 22 -1Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M21 -2 C22 -9 25 -15 30 -18.6 L29.4 -14.4 L31.6 -13.2 L28.4 -9.6 L30.2 -8 L26.6 -4.6 L27.6 -2.6 L23 -.6 L23.4 1.6Z" fill="#f1e8d8" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><path d="M29.2 -31.2 C25.2 -39.2 19.2 -45.2 17.2 -53.2 C16.2 -57.2 18.2 -60.2 22.2 -61.2 M23.7 -41.2 L29.2 -47.2 M19.599999999999998 -48.2 L24.7 -55.2 M18.2 -51.2 L12.2 -55.2 M28.2 -33.2 L33.2 -37.2 L36.2 -35.2" fill="none" stroke="#35251a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M29.2 -31.2 C25.2 -39.2 19.2 -45.2 17.2 -53.2 C16.2 -57.2 18.2 -60.2 22.2 -61.2 M23.7 -41.2 L29.2 -47.2 M19.599999999999998 -48.2 L24.7 -55.2 M18.2 -51.2 L12.2 -55.2 M28.2 -33.2 L33.2 -37.2 L36.2 -35.2" fill="none" stroke="#b89d77" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 -30 C22 -38 16 -44 14 -52 C13 -56 15 -59 19 -60 M20.5 -40 L26 -46 M16.4 -47 L21.5 -54 M15 -50 L9 -54 M25 -32 L30 -36 L33 -34" fill="none" stroke="#35251a" stroke-width="3.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 -30 C22 -38 16 -44 14 -52 C13 -56 15 -59 19 -60 M20.5 -40 L26 -46 M16.4 -47 L21.5 -54 M15 -50 L9 -54 M25 -32 L30 -36 L33 -34" fill="none" stroke="#d6bd96" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 -26 C23 -32 31 -33 35 -29 L42 -23 C44 -20.5 42 -17.5 39 -18 L32 -18.5 C27 -19 22 -21 22 -26Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M34 -19 C37 -19.4 40 -19 42 -21 C42 -18.5 40 -17.6 38 -17.8Z" fill="#c39567"/><path d="M23 -29 C19 -32 15 -32 13 -30 C16 -27.5 20 -27 23 -27Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><circle cx="31" cy="-26.6" r="1.3" fill="#35251a"/><circle cx="31.4" cy="-27" r=".42" fill="#fff"/><ellipse cx="42.2" cy="-21.4" rx="1.7" ry="1.35" fill="#35251a"/><path d="M12 -9 C15 -4.5 16 1.6 14.6 8.4" fill="none" stroke="#35251a" stroke-width="4.6"/><path d="M12 -9 C15 -4.5 16 1.6 14.6 8.4" fill="none" stroke="#b8402c" stroke-width="3"/><circle cx="16" cy="-1.4" r="1.8" fill="#e3b84f" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width=".8"/><circle cx="15.8" cy="4" r="1.8" fill="#e3b84f" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width=".8"/><g class="nz-av" style="--r:0.14s"><path d="M10 4 L19 9" stroke="#35251a" stroke-width="6.6" stroke-linecap="round"/><path d="M19 9 L14 15.5" stroke="#35251a" stroke-width="4.2" stroke-linecap="round"/><path d="M10 4 L19 9" stroke="#8d5d36" stroke-width="4.8" stroke-linecap="round"/><path d="M19 9 L14 15.5" stroke="#8d5d36" stroke-width="2.6" stroke-linecap="round"/><circle cx="14" cy="15.5" r="2.03" fill="#2d2119"/></g><g class="nz-ar" style="--r:0.14s"><path d="M-14 2 L-25 8" stroke="#35251a" stroke-width="7.3999999999999995" stroke-linecap="round"/><path d="M-25 8 L-36 9.5" stroke="#35251a" stroke-width="4.2" stroke-linecap="round"/><path d="M-14 2 L-25 8" stroke="#8d5d36" stroke-width="5.6" stroke-linecap="round"/><path d="M-25 8 L-36 9.5" stroke="#8d5d36" stroke-width="2.6" stroke-linecap="round"/><circle cx="-36" cy="9.5" r="2.03" fill="#2d2119"/></g></g></g><g transform="translate(366 52) scale(1.0)"><g class="nz-renne" style="--r:0.28s"><g class="nz-av" style="--r:0.28s"><path d="M8 5 L18 11" stroke="#35251a" stroke-width="6.0" stroke-linecap="round"/><path d="M18 11 L24 17" stroke="#35251a" stroke-width="4.0" stroke-linecap="round"/><path d="M8 5 L18 11" stroke="#6a4528" stroke-width="4.2" stroke-linecap="round"/><path d="M18 11 L24 17" stroke="#6a4528" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="17" r="1.87" fill="#2d2119"/></g><g class="nz-ar" style="--r:0.28s"><path d="M-12 4 L-21 12" stroke="#35251a" stroke-width="6.6" stroke-linecap="round"/><path d="M-21 12 L-31 17" stroke="#35251a" stroke-width="4.0" stroke-linecap="round"/><path d="M-12 4 L-21 12" stroke="#6a4528" stroke-width="4.8" stroke-linecap="round"/><path d="M-21 12 L-31 17" stroke="#6a4528" stroke-width="2.4" stroke-linecap="round"/><circle cx="-31" cy="17" r="1.87" fill="#2d2119"/></g><path d="M-20 -5 C-26 -8 -28 -3 -24 0 C-23 -1 -21 -2 -19.6 -2Z" fill="#f1e8d8" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><path d="M-21 0 C-22 -7 -16 -10 -6 -10 C2 -10.5 10 -12.5 16 -9.5 C21 -6.5 22 0 19 5 C15 10 4 10.4 -4 9.8 C-12 9.2 -20 7 -21 0Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M-16 6.6 C-8 9.4 4 9.8 14 7.6 C10 5 -4 5 -14 4.6Z" fill="#c39567"/><path d="M11 -9.5 C14 -17 19 -23 25 -25.5 L31.5 -19.5 C27.5 -15 24.5 -9 22 -1Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M21 -2 C22 -9 25 -15 30 -18.6 L29.4 -14.4 L31.6 -13.2 L28.4 -9.6 L30.2 -8 L26.6 -4.6 L27.6 -2.6 L23 -.6 L23.4 1.6Z" fill="#f1e8d8" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><path d="M29.2 -31.2 C25.2 -39.2 19.2 -45.2 17.2 -53.2 C16.2 -57.2 18.2 -60.2 22.2 -61.2 M23.7 -41.2 L29.2 -47.2 M19.599999999999998 -48.2 L24.7 -55.2 M18.2 -51.2 L12.2 -55.2 M28.2 -33.2 L33.2 -37.2 L36.2 -35.2" fill="none" stroke="#35251a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M29.2 -31.2 C25.2 -39.2 19.2 -45.2 17.2 -53.2 C16.2 -57.2 18.2 -60.2 22.2 -61.2 M23.7 -41.2 L29.2 -47.2 M19.599999999999998 -48.2 L24.7 -55.2 M18.2 -51.2 L12.2 -55.2 M28.2 -33.2 L33.2 -37.2 L36.2 -35.2" fill="none" stroke="#b89d77" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 -30 C22 -38 16 -44 14 -52 C13 -56 15 -59 19 -60 M20.5 -40 L26 -46 M16.4 -47 L21.5 -54 M15 -50 L9 -54 M25 -32 L30 -36 L33 -34" fill="none" stroke="#35251a" stroke-width="3.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 -30 C22 -38 16 -44 14 -52 C13 -56 15 -59 19 -60 M20.5 -40 L26 -46 M16.4 -47 L21.5 -54 M15 -50 L9 -54 M25 -32 L30 -36 L33 -34" fill="none" stroke="#d6bd96" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 -26 C23 -32 31 -33 35 -29 L42 -23 C44 -20.5 42 -17.5 39 -18 L32 -18.5 C27 -19 22 -21 22 -26Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M34 -19 C37 -19.4 40 -19 42 -21 C42 -18.5 40 -17.6 38 -17.8Z" fill="#c39567"/><path d="M23 -29 C19 -32 15 -32 13 -30 C16 -27.5 20 -27 23 -27Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><circle cx="31" cy="-26.6" r="1.3" fill="#35251a"/><circle cx="31.4" cy="-27" r=".42" fill="#fff"/><ellipse cx="42.2" cy="-21.4" rx="1.7" ry="1.35" fill="#35251a"/><path d="M12 -9 C15 -4.5 16 1.6 14.6 8.4" fill="none" stroke="#35251a" stroke-width="4.6"/><path d="M12 -9 C15 -4.5 16 1.6 14.6 8.4" fill="none" stroke="#b8402c" stroke-width="3"/><circle cx="16" cy="-1.4" r="1.8" fill="#e3b84f" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width=".8"/><circle cx="15.8" cy="4" r="1.8" fill="#e3b84f" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width=".8"/><g class="nz-av" style="--r:0.28s"><path d="M10 4 L19 9" stroke="#35251a" stroke-width="6.6" stroke-linecap="round"/><path d="M19 9 L14 15.5" stroke="#35251a" stroke-width="4.2" stroke-linecap="round"/><path d="M10 4 L19 9" stroke="#8d5d36" stroke-width="4.8" stroke-linecap="round"/><path d="M19 9 L14 15.5" stroke="#8d5d36" stroke-width="2.6" stroke-linecap="round"/><circle cx="14" cy="15.5" r="2.03" fill="#2d2119"/></g><g class="nz-ar" style="--r:0.28s"><path d="M-14 2 L-25 8" stroke="#35251a" stroke-width="7.3999999999999995" stroke-linecap="round"/><path d="M-25 8 L-36 9.5" stroke="#35251a" stroke-width="4.2" stroke-linecap="round"/><path d="M-14 2 L-25 8" stroke="#8d5d36" stroke-width="5.6" stroke-linecap="round"/><path d="M-25 8 L-36 9.5" stroke="#8d5d36" stroke-width="2.6" stroke-linecap="round"/><circle cx="-36" cy="9.5" r="2.03" fill="#2d2119"/></g></g></g><g transform="translate(446 46) scale(1.0)"><g class="nz-renne" style="--r:.42s"><g class="nz-av" style="--r:.42s"><path d="M8 5 L18 11" stroke="#35251a" stroke-width="6.0" stroke-linecap="round"/><path d="M18 11 L24 17" stroke="#35251a" stroke-width="4.0" stroke-linecap="round"/><path d="M8 5 L18 11" stroke="#6a4528" stroke-width="4.2" stroke-linecap="round"/><path d="M18 11 L24 17" stroke="#6a4528" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="17" r="1.87" fill="#2d2119"/></g><g class="nz-ar" style="--r:.42s"><path d="M-12 4 L-21 12" stroke="#35251a" stroke-width="6.6" stroke-linecap="round"/><path d="M-21 12 L-31 17" stroke="#35251a" stroke-width="4.0" stroke-linecap="round"/><path d="M-12 4 L-21 12" stroke="#6a4528" stroke-width="4.8" stroke-linecap="round"/><path d="M-21 12 L-31 17" stroke="#6a4528" stroke-width="2.4" stroke-linecap="round"/><circle cx="-31" cy="17" r="1.87" fill="#2d2119"/></g><path d="M-20 -5 C-26 -8 -28 -3 -24 0 C-23 -1 -21 -2 -19.6 -2Z" fill="#f1e8d8" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><path d="M-21 0 C-22 -7 -16 -10 -6 -10 C2 -10.5 10 -12.5 16 -9.5 C21 -6.5 22 0 19 5 C15 10 4 10.4 -4 9.8 C-12 9.2 -20 7 -21 0Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M-16 6.6 C-8 9.4 4 9.8 14 7.6 C10 5 -4 5 -14 4.6Z" fill="#c39567"/><path d="M11 -9.5 C14 -17 19 -23 25 -25.5 L31.5 -19.5 C27.5 -15 24.5 -9 22 -1Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M21 -2 C22 -9 25 -15 30 -18.6 L29.4 -14.4 L31.6 -13.2 L28.4 -9.6 L30.2 -8 L26.6 -4.6 L27.6 -2.6 L23 -.6 L23.4 1.6Z" fill="#f1e8d8" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><path d="M29.2 -31.2 C25.2 -39.2 19.2 -45.2 17.2 -53.2 C16.2 -57.2 18.2 -60.2 22.2 -61.2 M23.7 -41.2 L29.2 -47.2 M19.599999999999998 -48.2 L24.7 -55.2 M18.2 -51.2 L12.2 -55.2 M28.2 -33.2 L33.2 -37.2 L36.2 -35.2" fill="none" stroke="#35251a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M29.2 -31.2 C25.2 -39.2 19.2 -45.2 17.2 -53.2 C16.2 -57.2 18.2 -60.2 22.2 -61.2 M23.7 -41.2 L29.2 -47.2 M19.599999999999998 -48.2 L24.7 -55.2 M18.2 -51.2 L12.2 -55.2 M28.2 -33.2 L33.2 -37.2 L36.2 -35.2" fill="none" stroke="#b89d77" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 -30 C22 -38 16 -44 14 -52 C13 -56 15 -59 19 -60 M20.5 -40 L26 -46 M16.4 -47 L21.5 -54 M15 -50 L9 -54 M25 -32 L30 -36 L33 -34" fill="none" stroke="#35251a" stroke-width="3.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 -30 C22 -38 16 -44 14 -52 C13 -56 15 -59 19 -60 M20.5 -40 L26 -46 M16.4 -47 L21.5 -54 M15 -50 L9 -54 M25 -32 L30 -36 L33 -34" fill="none" stroke="#d6bd96" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 -26 C23 -32 31 -33 35 -29 L42 -23 C44 -20.5 42 -17.5 39 -18 L32 -18.5 C27 -19 22 -21 22 -26Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M34 -19 C37 -19.4 40 -19 42 -21 C42 -18.5 40 -17.6 38 -17.8Z" fill="#c39567"/><path d="M23 -29 C19 -32 15 -32 13 -30 C16 -27.5 20 -27 23 -27Z" fill="#8d5d36" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><circle cx="31" cy="-26.6" r="1.3" fill="#35251a"/><circle cx="31.4" cy="-27" r=".42" fill="#fff"/><circle class="nz-nez-lueur" cx="42.6" cy="-21.6" r="8" fill="url(#nz-lueur)"/><circle cx="42.4" cy="-21.6" r="2.7" fill="#e0312a" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width=".9"/><circle cx="41.6" cy="-22.4" r=".8" fill="#ffd3c4"/><path d="M12 -9 C15 -4.5 16 1.6 14.6 8.4" fill="none" stroke="#35251a" stroke-width="4.6"/><path d="M12 -9 C15 -4.5 16 1.6 14.6 8.4" fill="none" stroke="#b8402c" stroke-width="3"/><circle cx="16" cy="-1.4" r="1.8" fill="#e3b84f" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width=".8"/><circle cx="15.8" cy="4" r="1.8" fill="#e3b84f" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width=".8"/><g class="nz-av" style="--r:.42s"><path d="M10 4 L19 9" stroke="#35251a" stroke-width="6.6" stroke-linecap="round"/><path d="M19 9 L14 15.5" stroke="#35251a" stroke-width="4.2" stroke-linecap="round"/><path d="M10 4 L19 9" stroke="#8d5d36" stroke-width="4.8" stroke-linecap="round"/><path d="M19 9 L14 15.5" stroke="#8d5d36" stroke-width="2.6" stroke-linecap="round"/><circle cx="14" cy="15.5" r="2.03" fill="#2d2119"/></g><g class="nz-ar" style="--r:.42s"><path d="M-14 2 L-25 8" stroke="#35251a" stroke-width="7.3999999999999995" stroke-linecap="round"/><path d="M-25 8 L-36 9.5" stroke="#35251a" stroke-width="4.2" stroke-linecap="round"/><path d="M-14 2 L-25 8" stroke="#8d5d36" stroke-width="5.6" stroke-linecap="round"/><path d="M-25 8 L-36 9.5" stroke="#8d5d36" stroke-width="2.6" stroke-linecap="round"/><circle cx="-36" cy="9.5" r="2.03" fill="#2d2119"/></g></g></g><path d="M104 52 C140 50 180 52 220 56" fill="none" stroke="#6e4a2b" stroke-width="1.1"/><path d="M38 92 L36 104 M74 92 L74 104 M108 90 L112 104" stroke="#35251a" stroke-width="4.4" stroke-linecap="round"/><path d="M38 92 L36 104 M74 92 L74 104 M108 90 L112 104" stroke="#d9a441" stroke-width="2.4" stroke-linecap="round"/><path d="M16 104 L118 104 C134 104 146 98 146 88 C146 80 138 78 134 82 C131 86 134 90 138 89" fill="none" stroke="#35251a" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 104 L118 104 C134 104 146 98 146 88 C146 80 138 78 134 82 C131 86 134 90 138 89" fill="none" stroke="#e3b84f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 102.6 L116 102.6" stroke="#fff3c4" stroke-width=".9" opacity=".8"/><path d="M22 50 C18 36 24 24 34 22 C44 20 52 28 52 40 L52 58 L24 58Z" fill="#8a6b45" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.4"/><rect x="25" y="13" width="12" height="11" rx="1" fill="#3f7a52" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.1" transform="rotate(-12 31 18)"/><path d="M31 13 L31 24 M25 18.5 L37 18.5" stroke="#e8c45a" stroke-width="1.8" transform="rotate(-12 31 18)"/><rect x="37" y="15" width="11" height="10" rx="1" fill="#4f7fb0" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.1" transform="rotate(10 42 20)"/><path d="M42.5 15 L42.5 25 M37 20 L48 20" stroke="#f4ead8" stroke-width="1.6" transform="rotate(10 42 20)"/><path d="M28 24 C33 21 43 21 48 25" fill="none" stroke="#5e4630" stroke-width="2.2" stroke-linecap="round"/><path d="M52 62 C50 46 56 36 66 34 C76 33 84 40 86 52 L88 62Z" fill="#c33a2b" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.4"/><path d="M76 46 C84 46 94 48 102 50 C104 52 104 55 101 56 C93 56 84 55 76 54Z" fill="#c33a2b" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M96 48.6 C99 48.6 101 49.4 101.6 50.6 L100.8 56 C98 56.2 96 55.6 95.4 54.6Z" fill="#f4ead8" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><ellipse cx="104.2" cy="52.4" rx="3.6" ry="3.2" fill="#2f2a26" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><circle cx="70" cy="24" r="8.4" fill="#f2cfa5" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><path d="M60 25 C60 36 66 44 72 46 C78 44 82 36 80 26 C77 30 73 31 70 30 C66 31 63 29 60 25Z" fill="#fbf7ee" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.2"/><path d="M64 28.4 C67 27 69.5 27.6 70.4 28.8 C71.5 27.6 74 27 77 28.4 C74 30.2 71.6 30 70.4 29.4 C69 30 66.6 30.2 64 28.4Z" fill="#fbf7ee" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1"/><circle cx="74.6" cy="23.2" r="1.1" fill="#35251a"/><circle cx="78.4" cy="26.6" r="1.9" fill="#e79a83"/><path d="M61 19 C62 10 70 6 76 8 C70 9 66 12 64 18Z" fill="#c33a2b" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.2"/><path d="M62 18 C63 8 74 2 82 6 C86 8 88 12 87 16 C84 12 80 10 76 11 C70 12 66 15 64 19Z" fill="#c33a2b" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.3"/><circle cx="88" cy="17.4" r="3.2" fill="#fbf7ee" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.1"/><rect x="59" y="16.4" width="21" height="5.2" rx="2.6" fill="#fbf7ee" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.1" transform="rotate(-8 69.5 19)"/><path d="M20 96 C12 96 8 86 9 72 C10 58 12 46 18 40 C23 35 30 38 28 44 C26 48 22 48 22 52 C22 56 26 58 30 58 L92 58 C104 58 114 62 120 68 C126 74 132 74 134 68 C136 62 130 56 126 60 C124 62 125 65 127 65 C128 74 122 86 112 92 C106 95 100 96 94 96Z" fill="#b8402c" stroke="#35251a" stroke-linejoin="round" stroke-linecap="round" stroke-width="1.7"/><path d="M16 88 C14 76 15 62 20 52 M26 90 L104 90 C112 88 118 82 122 74" fill="none" stroke="#e3b84f" stroke-width="1.8" stroke-linecap="round"/><path d="M40 66 C46 60 54 60 56 66 C58 72 50 76 46 72 C43 69 47 66 49 68 M62 74 C70 66 84 66 92 70" fill="none" stroke="#e3b84f" stroke-width="1.5" stroke-linecap="round"/><path d="M30 58 L92 58" stroke="#e3b84f" stroke-width="2.4" stroke-linecap="round"/><path d="M30 58 L92 58" stroke="#35251a" stroke-width=".8" opacity=".5" transform="translate(0 1.6)"/></svg>`;
// un cadeau qui tombe de la hotte (couleurs --c, ruban --n)
const CADEAU = `<svg viewBox="0 0 16 16"><rect x="1.5" y="5" width="13" height="10" rx="1" fill="var(--c)" stroke="#35251a" stroke-width="1"/><rect x="1" y="3.4" width="14" height="3.4" rx="1" fill="var(--c)" stroke="#35251a" stroke-width="1"/><path d="M8 3.4V15M1.5 9.6H14.5" stroke="var(--n)" stroke-width="1.8"/><path d="M8 3.6C6 .6 3.4 1 4.2 2.8 4.8 3.8 6.6 3.8 8 3.6 9.4 3.8 11.2 3.8 11.8 2.8 12.6 1 10 .6 8 3.6Z" fill="var(--n)" stroke="#35251a" stroke-width=".8"/></svg>`;

/**
 * outils : { reperes, tx(cle, …), enL(objet en/fr/ja), langue(), afficherMessage, lieux(), estSimule() }.
 * Renvoie { maj(jour), eteindre(), allerYukionna(), allerKanji(), etat() }.
 */
export function brancherNoelCarte(map, maplibregl, outils) {
  const { reperes, tx, enL, afficherMessage, lieux, estSimule, modeles3d } = outils;
  const sansMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conteneur = map.getCanvasContainer();
  const papier = document.getElementById('papier');
  const placer = (moi) => conteneur.insertBefore(moi, papier?.parentNode === conteneur ? papier.nextSibling : conteneur.firstChild);
  // en mode développeur, un jour simulé : les trouvailles sont gardées à part, et le koban n'est pas donné pour de vrai
  const cle = (c) => (estSimule() ? `${c}Essai` : c);
  let jour = 0;
  let kanji = null, yuzus = null, jizo = null, traineau = null;
  let bulle = null;

  // ---- Les bulles (comme celles des légendes, avec « Spécial Noël » en tête)
  function ouvrirBulle(lngLat, contenu, hauteur) {
    bulle?.remove();
    const popup = new maplibregl.Popup({ className: 'bulle-legende bulle-noel', offset: decalages(hauteur), maxWidth: '300px' })
      .setLngLat(lngLat).setDOMContent(contenu).addTo(map);
    popup.getElement().querySelector('.maplibregl-popup-close-button')?.setAttribute('aria-label', tx('fermer'));
    bulle = popup;
    popup.on('close', () => { if (bulle === popup) bulle = null; });
    requestAnimationFrame(() => {
      const r = popup.getElement()?.getBoundingClientRect();
      if (!r) return;
      const haut = (document.querySelector('.filtres-boutons')?.getBoundingClientRect().bottom || 0) + 10;
      const dy = r.top < haut ? r.top - haut : r.bottom > innerHeight - 10 ? Math.min(r.bottom - innerHeight + 10, r.top - haut) : 0;
      if (Math.abs(dy) > 2) map.panBy([0, dy], { duration: sansMouvement ? 0 : 450 });
    });
  }
  function contenu(titre, second, texte, compte) {
    const div = creer('div');
    const b = creer('p', 'bulle-evenement bulle-evenement-noel');
    b.innerHTML = `${ICONE_HOUX}<span>${echapper(tx('evenementNoel'))}</span>`;
    if (compte) b.append(creer('b', 'bulle-compte', compte));
    const s = creer('p', 'bulle-second', second);
    div.append(b, creer('h3', 'bulle-titre', titre), s, creer('p', 'bulle-texte', texte));
    return div;
  }

  // ---- Un repère du calendrier : un bouton « légende », caché de loin (zoom), animé seulement à l'écran
  function poser(lngLat, html, classe, aria, appui, zoomMin) {
    const el = creer('button', `legende lg ${classe}`);
    el.type = 'button';
    el.innerHTML = html;
    el.setAttribute('aria-label', aria);
    el.addEventListener('click', (e) => { e.stopPropagation(); appui(el, e); });
    const marqueur = new maplibregl.Marker({ element: el, anchor: 'bottom', opacityWhenCovered: '0.25' }).setLngLat(lngLat);
    reperes.suivre(marqueur, { voulu: false, placer });
    return { el, marqueur, lngLat, zoomMin, montre: null };
  }
  const tous = () => [...(yuzus || []), ...(decors?.reperes() || [])];
  function majZoom() {
    const z = map.getZoom();
    const vue = map.getBounds();
    for (const r of tous()) {
      const voulu = z >= r.zoomMin - 0.35;
      if (voulu !== r.montre) { r.montre = voulu; reperes.montrer(r.marqueur, voulu, 450); }
      if (!sansMouvement) r.el.classList.toggle('anime', z >= r.zoomMin && vue.contains(r.lngLat));
    }
  }
  map.on('zoom', majZoom);
  map.on('moveend', majZoom);
  function retirer(r) { if (r) reperes.oublier(r.marqueur); }

  // ---- Les décorations de chaque jour (noel-decors.js : neige, illuminations, cygnes, grues en papier…)
  const decors = brancherDecors(map, { poser, ouvrirBulle, contenu, retirer, enL, tx, lieux, ambiance: outils.ambiance,
    choisirOiseaux: outils.choisirOiseaux, modeles3d, sansMouvement, basDesBandeaux });

  // ---- Le 12 : la tempête autour de Yuki-onna (noel.css : body.noel-tempete .legende[data-legende="yukionna"])
  function allerYukionna() {
    const l = LEGENDES.find((x) => x.id === 'yukionna');
    if (!l) return;
    map.flyTo({ center: l.ou, zoom: Math.max(map.getZoom(), 8.2), pitch: 40, duration: sansMouvement ? 0 : 2600, essential: true });
    map.once('moveend', () => setTimeout(() => ouvrirLegende('yukionna'), 350));
  }

  // ---- Le 14 : le kanji de l'année au-dessus de Kyoto. Celui écrit à la main dans CONFIG.noel.kanji passe avant ;
  //      sinon celui que le robot a lu (site/data/kanji-annee.json), s'il est de l'année de l'événement ; sinon 熊 (2025).
  const anneeNoel = Number(String(outils.config?.debut || '').slice(0, 4)) || new Date().getFullYear();
  let kanjiLu = null;
  const kanjiAnnee = () => {
    const k = String(outils.config?.kanji || '').trim();
    if (k) return { k, annee: anneeNoel };
    if (kanjiLu?.annee === anneeNoel && kanjiLu.kanji) return { k: kanjiLu.kanji, annee: anneeNoel };
    return { k: KANJI_2025, annee: 2025 };
  };
  fetch(KANJI_LU, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((lu) => {
    if (!lu?.kanji) return;
    const avant = kanjiAnnee().k;
    kanjiLu = lu;
    if (kanjiAnnee().k !== avant && kanji) { retirerKanji(); if (jour >= JOUR_KANJI) maj(jour); } // la feuille se refait
  }).catch(() => { /* hors ligne : le kanji d'avant */ });
  let policeKanji = null;
  /** Un pinceau japonais (Yuji Boku, Google Fonts), seulement pour ce kanji et le titre de la feuille ; la promesse se
   *  tient quand la feuille de style est lue (avant, document.fonts.load ne trouve pas la police et rend la main aussitôt). */
  function chargerPinceau(k) {
    if (policeKanji?.k === k) return policeKanji.pret;
    document.getElementById('police-kanji-noel')?.remove();
    const l = document.createElement('link');
    l.id = 'police-kanji-noel';
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=Yuji+Boku&text=${encodeURIComponent(`${k}今年の漢字`)}&display=swap`;
    const pret = new Promise((ok) => { l.onload = l.onerror = ok; });
    document.head.append(l);
    policeKanji = { k, pret };
    return pret;
  }
  async function poserKanji() {
    const { k, annee } = kanjiAnnee();
    kanji = { pose: false };
    const moi = kanji;
    const delai = new Promise((ok) => setTimeout(ok, 6000)); // sans réseau vers Google Fonts : la police de la carte
    await Promise.race([chargerPinceau(k).then(() => document.fonts.load('290px "Yuji Boku"', `${k}今年の漢字`)), delai]).catch(() => {});
    if (kanji !== moi) return; // retiré entre-temps
    const c = document.createElement('canvas');
    c.width = 400; c.height = 480;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(251, 247, 236, .93)';
    g.fillRect(14, 14, 372, 452);
    g.strokeStyle = 'rgba(138, 107, 69, .85)';
    g.lineWidth = 5;
    g.strokeRect(14, 14, 372, 452);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#6b5440';
    g.font = '38px "Yuji Boku", "Zen Antique", serif';
    g.fillText('今年の漢字', 200, 70);
    g.fillStyle = '#1c140d';
    g.font = '290px "Yuji Boku", "Zen Antique", serif';
    g.fillText(k, 200, 268);
    g.fillStyle = '#b8402c';
    g.fillRect(286, 404, 82, 42);
    g.fillStyle = '#fbf7ec';
    g.font = '600 26px "Noto Sans", sans-serif';
    g.fillText(String(annee), 327, 426);
    const [x, y] = KYOTO;
    const { l, h } = FEUILLE;
    // les coins : haut-gauche, haut-droite, bas-droite, bas-gauche (attention en vérifiant : au départ, la carte tourne
    // doucement sur elle-même, et la feuille avec elle ; elle a semblé à l'envers dans un essai, 2026-11-21)
    map.addSource('noel-kanji', { type: 'image', url: c.toDataURL(),
      coordinates: [[x - l / 2, y + h / 2], [x + l / 2, y + h / 2], [x + l / 2, y - h / 2], [x - l / 2, y - h / 2]] });
    // sur le relief, ses ombres et les lacs (le lac Biwa l'entamait), sous le trait des côtes et tout le reste
    const ids = map.getStyle().layers.map((c2) => c2.id);
    const avant = ['cote-encre', 'frontieres-prefectures-fond'].find((id) => ids.includes(id));
    map.addLayer({ id: 'noel-kanji', type: 'raster', source: 'noel-kanji', paint: { 'raster-fade-duration': 0 } }, avant);
    moi.pose = true;
  }
  function retirerKanji() {
    if (kanji?.pose) {
      if (map.getLayer('noel-kanji')) map.removeLayer('noel-kanji');
      if (map.getSource('noel-kanji')) map.removeSource('noel-kanji');
    }
    kanji = null;
  }
  function allerKanji() {
    map.flyTo({ center: KYOTO, zoom: 9.3, pitch: 35, bearing: 0, duration: sansMouvement ? 0 : 2600, essential: true });
  }

  // ---- Le 22 : les yuzus des onsens
  const onsens = () => lieux().filter((l) => String(l.categorie || '').toLowerCase() === 'onsen');
  const yuzusTrouves = () => new Set(lire(cle(MEMO_YUZU), []));
  function poserYuzus() {
    yuzus = onsens().map((l) => {
      const ou = [l.lng + 0.04, l.lat - 0.012]; // à 4 km à l'est du lieu, pour que son épingle et son modèle 3D ne le cachent pas
      const r = poser(ou, YUZU, 'noel-yuzu', tx('yuzuAria'), () => trouverYuzu(l, r), ZOOM_YUZU);
      r.id = l.id;
      r.el.classList.toggle('trouve', yuzusTrouves().has(l.id));
      return r;
    });
  }
  function trouverYuzu(l, r) {
    const t = yuzusTrouves();
    const total = yuzus.length;
    const nouveau = !t.has(l.id);
    if (nouveau) { t.add(l.id); garder(cle(MEMO_YUZU), [...t]); r.el.classList.add('trouve'); }
    const tous = yuzus.every((y) => t.has(y.id));
    ouvrirBulle(r.lngLat, contenu(tx('yuzuTitre'), enL(l.nom), tx('yuzuTexte'), `${t.size}/${total}`), 46);
    if (!nouveau) return;
    if (tous) {
      // le koban, compté par la balade comme un secret trouvé (balade/tresors.js : baladeSecrets.trouves)
      if (!estSimule()) {
        const s = lire('baladeSecrets', {});
        s.trouves = s.trouves || [];
        if (!s.trouves.includes(SECRET_YUZU)) s.trouves.push(SECRET_YUZU);
        garder('baladeSecrets', s);
      }
      setTimeout(() => afficherMessage(tx(estSimule() ? 'yuzuKobanEssai' : 'yuzuKoban')), 900);
    } else afficherMessage(tx('yuzuTrouve', t.size, total));
  }

  // ---- Le 24 : les six Jizō et le traîneau
  const chapeaux = () => new Set(lire(cle(MEMO_JIZO), []));
  /** Les formes, faites avec l'atelier des modèles 3D (modeles3d.js, à l'encre et à l'aquarelle comme le temple) : un
   *  Jizō de pierre (socle enfoncé dans le sol, corps, tête, mains jointes, bavoir rouge), haut de 0,22 (le temple :
   *  0,8 ; à 0,15, ils étaient trop petits pour le doigt), et son chapeau de paille (kasa), conique, un peu plus large
   *  que ses épaules. */
  function fabriquerJizo(THREE, atelier) {
    const h = 0.22, PIERRE = '#a29f95', PIERRE2 = '#8c897f', ROUGE = '#c8302c';
    const jizo = atelier()
      .cylindre(0.22 * h, 0.27 * h, 0.4 * h, 10, PIERRE2, { y: -0.12 * h })
      .ovale(0.2 * h, PIERRE, { y: 0.36 * h, sy: 1.3, sz: 0.85 }, 10)
      .ovale(0.155 * h, PIERRE, { y: 0.76 * h, sy: 1.08 }, 10)
      .piece(new THREE.ConeGeometry(0.215 * h, 0.24 * h, 12, 1, true), ROUGE, { y: 0.56 * h, z: 0.012 * h, sz: 0.86 })
      .ovale(0.045 * h, PIERRE2, { y: 0.4 * h, z: 0.17 * h, sx: 1.3 }, 6)
      .fin();
    const kasa = atelier()
      .cone(0.31 * h, 0.21 * h, 14, '#c9a35a', { y: 0.99 * h })
      .cylindre(0.315 * h, 0.315 * h, 0.012 * h, 14, '#a98445', { y: 0.885 * h, trait: false })
      .fin();
    return { jizo, kasa };
  }
  /** Les statues sur la carte : les six Jizō, et un chapeau sur ceux qui en ont reçu un. */
  function majJizo() {
    if (!modeles3d?.decors) return;
    const c = chapeaux();
    const liste = PLACES_JIZO.map(([x, z, ry], n) => ({ forme: 'jizo', lieu: MUROJI, x, z, ry, neige: 0.7, n }));
    for (const n of c) if (PLACES_JIZO[n]) {
      const [x, z, ry] = PLACES_JIZO[n];
      liste.push({ forme: 'kasa', lieu: MUROJI, x, z, ry, neige: 0.7, n });
    }
    jizo = { liste };
    modeles3d.decors(liste, fabriquerJizo, (rang) => toucherJizo(liste[rang]?.n));
  }
  function poserJizo() { majJizo(); }
  function retirerJizo() {
    if (jizo) modeles3d?.decors([]);
    jizo = null;
  }
  function toucherJizo(n) {
    if (n === undefined || !jizo) return;
    const c = chapeaux();
    if (!c.has(n)) {
      c.add(n);
      garder(cle(MEMO_JIZO), [...c]);
      majJizo();
      if (c.size === 6) donnerBonnet();
      else afficherMessage(tx('jizoChapeau', c.size));
    }
    // la bulle au-dessus du temple (et de son épingle) : posée sur un Jizō, elle cachait ses voisins
    const l = lieux().find((x) => x.id === MUROJI);
    if (!l) return;
    const modele = Math.min(170, 62 * 2 ** ((map.getZoom() - 10.5) / 2)) * Math.sin((map.getPitch() * Math.PI) / 180);
    ouvrirBulle([l.lng, l.lat], contenu(tx('jizoTitre'), '笠地蔵', tx(c.size === 6 ? 'jizoMerci' : 'jizoTexte'), `${c.size}/6`),
      modele * (l.hauteur3d || 0.8) + 46);
  }
  /** « Voir les six Jizō » (la case du 24) : la carte va au Murō-ji, d'assez près et de face pour les voir. */
  function allerJizo() {
    const l = lieux().find((x) => x.id === MUROJI);
    if (!l) return;
    map.flyTo({ center: [l.lng, l.lat + 0.004], zoom: ZOOM_VOIR_JIZO, pitch: 52, bearing: 0, duration: sansMouvement ? 0 : 3200, essential: true });
  }
  function donnerBonnet() {
    // le bonnet de Père Noël, pour la garde-robe de la balade 3D (noelTenue : les pièces d'hiver du calendrier)
    if (!estSimule()) {
      const t = new Set(lire(MEMO_TENUE, []));
      t.add('bonnet');
      garder(MEMO_TENUE, [...t]);
    }
    setTimeout(() => afficherMessage(tx('jizoBonnet')), 900);
  }

  // le traîneau : un vol de temps en temps, la nuit, en travers de l'écran (une animation CSS, rien par script). Il passe
  // au-dessus de la carte et de ses boutons (z-index 7), mais sous la rangée du haut : sa hauteur est mesurée à chaque
  // vol (une fois par vol, jamais pendant), juste sous le plus bas des boutons du haut. Il lâche trois cadeaux en route.
  let minuterieTraineau = null;
  const HAUT_DE_LECRAN = '.entete, .filtres, .filtres-boutons > *, .langues, .musique, .boutique, .controles > *';
  function basDesBandeaux() {
    let bas = 0;
    for (const e of document.querySelectorAll(HAUT_DE_LECRAN)) {
      const r = e.getBoundingClientRect();
      if (r.height > 0 && r.width > 0 && r.top < innerHeight * 0.4) bas = Math.max(bas, r.bottom);
    }
    return bas;
  }
  function voler(premier) {
    if (!traineau) return;
    const bas = basDesBandeaux() + 14;
    traineau.style.setProperty('--haut', `${Math.round(premier ? bas + 20 : hasard(bas, bas + Math.max(30, innerHeight * 0.18)))}px`);
    traineau.classList.remove('vole');
    void traineau.offsetWidth; // relance l'animation
    traineau.classList.add('vole');
  }
  function lancerTraineau() {
    clearTimeout(minuterieTraineau);
    minuterieTraineau = setTimeout(() => {
      if (traineau && document.body.classList.contains('nuit') && !document.hidden
        && !document.body.classList.contains('en-jeu') && !document.body.classList.contains('en-visite')) voler(false);
      lancerTraineau();
    }, hasard(60, 120) * 1000);
  }
  function poserTraineau() {
    if (sansMouvement) return;
    traineau = creer('div', 'noel-traineau');
    traineau.setAttribute('aria-hidden', 'true');
    const cadeaux = [['#3f7a52', '#e8c45a', '4.2s'], ['#b8402c', '#f4ead8', '7.8s'], ['#4f7fb0', '#e8c45a', '11.4s']]
      .map(([c, n, d]) => `<span class="nz-cadeau" style="--c:${c};--n:${n};--d:${d}">${CADEAU}</span>`).join('');
    traineau.innerHTML = `<div class="nz-vol">${cadeaux}${TRAINEAU}</div>`; // les cadeaux derrière le traîneau : ils sortent de la hotte
    traineau.addEventListener('animationend', (ev) => { if (ev.target.classList?.contains('nz-vol')) traineau?.classList.remove('vole'); });
    document.body.append(traineau);
    minuterieTraineau = setTimeout(lancerTraineau, 0);
    // le premier passe vite (8 s), pour qu'on le voie
    setTimeout(() => {
      if (traineau && document.body.classList.contains('nuit')) voler(true);
    }, 8000);
  }

  // ---- Ce qui se montre, selon le jour du calendrier
  function maj(j) {
    jour = j;
    document.body.classList.toggle('noel-tempete', j >= JOUR_TEMPETE);
    if (j >= JOUR_KANJI && !kanji) poserKanji().catch((e) => console.warn('Kanji de l’année indisponible', e));
    if (j < JOUR_KANJI && kanji) retirerKanji();
    if (j >= JOUR_YUZU && !yuzus) poserYuzus();
    if (j < JOUR_YUZU && yuzus) { yuzus.forEach(retirer); yuzus = null; }
    if (j >= JOUR_JIZO && !jizo) { poserJizo(); poserTraineau(); }
    if (j < JOUR_JIZO && jizo) { retirerJizo(); retirerTraineau(); }
    decors.maj(j);
    majZoom();
  }
  function retirerTraineau() {
    clearTimeout(minuterieTraineau);
    traineau?.remove();
    traineau = null;
  }
  function eteindre() {
    bulle?.remove();
    decors.eteindre();
    document.body.classList.remove('noel-tempete');
    retirerKanji();
    yuzus?.forEach(retirer); yuzus = null;
    retirerJizo();
    retirerTraineau();
    document.getElementById('police-kanji-noel')?.remove();
    policeKanji = null;
  }
  /** Où en est-on : pour les cases du calendrier. */
  function etat() {
    const o = onsens();
    return { yuzus: [...yuzusTrouves()].filter((id) => o.some((l) => l.id === id)).length, onsens: o.length,
      chapeaux: chapeaux().size, kanji: kanjiAnnee(), jour };
  }

  return { maj, eteindre, allerYukionna, allerKanji, allerJizo, etat };
}
