// Collection d'icônes de la carte (dessinées pour ce site, libres d'utilisation).
// Chaque icône = un petit dessin de 24 x 24. Le nom (à gauche) est celui
// qu'on choisit dans la colonne « Icône » de l'onglet « Catégories » du tableau.
// Dans ce tableau, on peut aussi mettre directement un emoji (ex : 🍜) à la place d'un nom.

const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const VAGUE = (y) => `M2 ${y}c2.5-1.6 5-1.6 7.5 0s5 1.6 7.5 0 3.5-1.2 5 0`;

export const ICONES = {
  torii: '<path d="M2 5.2C6 4.2 18 4.2 22 5.2V7.5C18 6.6 6 6.6 2 7.5Z M4 10h16v1.9H4Z M6 7h2.3v14H6Z M15.7 7H18v14h-2.3Z M11.2 7h1.6v3h-1.6Z"/>',
  temple: '<path d="M1 10.5C4 10 7 7.5 8.5 5h7C17 7.5 20 10 23 10.5V12H1Z M9 3.2h6V5H9Z M4 12h16v1.5H4Z M5 13h2v7H5Z M11 13h2v7h-2Z M17 13h2v7h-2Z M3 20h18v1.8H3Z"/>',
  pagoda: '<path d="M11.3 1h1.4v4.2h-1.4Z M6 7.6C8 7.3 9.5 6 10 5h4c.5 1 2 2.3 4 2.6v1H6Z M9 8.6h6v2H9Z M4.5 12.6c2.5-.3 4-1.6 4.5-2.1h6c.5.5 2 1.8 4.5 2.1v1h-15Z M8.5 13.6h7v2h-7Z M3 17.6c3-.3 4.5-1.6 5-2.1h8c.5.5 2 1.8 5 2.1v1H3Z M8 18.6h8V22H8Z"/>',
  castle: `<path fill-rule="evenodd" d="M3 22.5 5.2 16.5h13.6l2.2 6Z M6.5 12.6h11v3.9h-11Zm2 1v1.7h2.2v-1.7Zm4.8 0v1.7h2.2v-1.7Z M2.5 13c2.8-.4 4.6-1.6 5.3-3h8.4c.7 1.4 2.5 2.6 5.3 3v.7h-19Z M9 7.2h6V10H9Zm2 .8v1.3h2V8Z M6.3 7.8c1.9-.4 3.3-1.5 3.8-2.8h3.8c.5 1.3 1.9 2.4 3.8 2.8v.5H6.3Z M11 2.6h2V5h-2Z"/><path ${S} stroke-width="1.3" d="M10.4 3.4 9.3 2.2M13.6 3.4l1.1-1.2"/>`,
  mountain: '<path d="M1 20.5 8.5 7l3.6 6 3.4-5L23 20.5Z"/>',
  volcano: '<path d="M2 21.5 8 11h8l6 10.5Z"/><path d="M9 8.2A2 2 0 0 1 11.2 5a2.3 2.3 0 0 1 4.1.9A1.7 1.7 0 0 1 15 9.3H10A1.6 1.6 0 0 1 9 8.2Z"/>',
  bridge: `<path d="M1.5 17.5C4.5 11.5 8.5 9 12 9s7.5 2.5 10.5 8.5h-2.8C17.3 13.3 14.6 11.4 12 11.4s-5.3 1.9-7.7 6.1Z"/><path ${S} stroke-width="1.7" d="M3.3 13.2C6 8.8 9 6.6 12 6.6s6 2.2 8.7 6.6M6.2 10.2v2.4M9.1 8v2.5M12 6.9v2.3M14.9 8v2.5M17.8 10.2v2.4M2 21.3c2.5-1.4 5-1.4 7.5 0s5 1.4 7.5 0 3.5-1 5 0"/>`,
  waterfall: `<path d="M2 3h11v3.4H5.6V22H2Z"/><path ${S} d="M13 4.7c3.2 0 4.6 2.4 4.6 6V18M9.2 6.4V18M13.2 8.6V18"/><path ${S} stroke-width="1.8" d="M7.4 21.2c1.6-1.4 3.2-1.4 4.8 0s3.2 1.4 4.8 0 2.4-1 3.6 0"/>`,
  lake: `<path d="M3 11.5 8.5 4l3.2 4.2 2.3-2.4 6.5 5.7Z"/><path ${S} d="${VAGUE(15.5)}M2 20.5c2.5-1.6 5-1.6 7.5 0s5 1.6 7.5 0 3.5-1.2 5 0"/>`,
  coast: `<circle cx="17" cy="6.5" r="3.3"/><path ${S} d="${VAGUE(13.5)}M2 19c2.5-1.6 5-1.6 7.5 0s5 1.6 7.5 0 3.5-1.2 5 0"/>`,
  island: `<path d="M4 17c2-4.3 5-6 8-6s6 1.7 8 6Z"/><path ${S} stroke-width="1.7" d="M12 11V6.2M12 6.2C10.6 4.4 8.7 3.9 7 4.1M12 6.2c1.4-1.8 3.3-2.3 5-2.1M12 6.2c-2 .1-3.4 1-4 2.5M12 6.2c2 .1 3.4 1 4 2.5M2 21c2.5-1.6 5-1.6 7.5 0s5 1.6 7.5 0 3.5-1.2 5 0"/>`,
  lighthouse: `<path d="M9.6 9h4.8l1.6 12H8Z M9 6.2h6V9H9Z M10.4 3.2h3.2v3h-3.2Z"/><path ${S} stroke-width="1.7" d="M3.5 4.5 7 6M3.5 9.5 7 8.3M20.5 4.5 17 6M20.5 9.5 17 8.3M5 21.5h14"/>`,
  onsen: `<path d="M2.5 13.5h19c0 4.3-4.2 7.5-9.5 7.5s-9.5-3.2-9.5-7.5Z"/><path ${S} stroke-width="1.8" d="M8 10.5c-1.6-1.4 1.6-2.8 0-4.4S8 3 8 3M12 10.5c-1.6-1.4 1.6-2.8 0-4.4S12 3 12 3M16 10.5c-1.6-1.4 1.6-2.8 0-4.4S16 3 16 3"/>`,
  garden: `<ellipse cx="7.8" cy="10.6" rx="4.8" ry="2.3"/><ellipse cx="16" cy="8" rx="4.8" ry="2.3"/><ellipse cx="11.3" cy="4.6" rx="3.6" ry="2"/><path d="M6.5 18h11l-1.4 4H7.9Z"/><path ${S} stroke-width="1.9" d="M12 18c0-2.6-2.4-3.6-1.4-6.3.8-2.2 3.4-2.2 2.6-5.6"/>`,
  flower: '<g><ellipse cx="12" cy="6.3" rx="3.1" ry="4.3"/><ellipse cx="12" cy="6.3" rx="3.1" ry="4.3" transform="rotate(72 12 12)"/><ellipse cx="12" cy="6.3" rx="3.1" ry="4.3" transform="rotate(144 12 12)"/><ellipse cx="12" cy="6.3" rx="3.1" ry="4.3" transform="rotate(216 12 12)"/><ellipse cx="12" cy="6.3" rx="3.1" ry="4.3" transform="rotate(288 12 12)"/></g>',
  forest: `<path d="M8 2.5 13 10h-2.8l3.8 6H2l3.8-6H3Z M17 6l4 6h-2.5l3.5 5h-10l3.5-5H13Z"/><path ${S} d="M8 16v5M17 17v4"/>`,
  village: '<path fill-rule="evenodd" d="M12 2 2.5 17.5h19Zm-1.6 9.2h3.2v3.2h-3.2Z M5 17.5h14V22H5Zm5.3 1.4v3.1h3.4v-3.1Z"/>',
  city: '<path fill-rule="evenodd" d="M2 22V11h5v11Zm6 0V3.5h7V22Zm8 0V8h6v14ZM10 6v2h3V6Zm0 4v2h3v-2Zm0 4v2h3v-2ZM18 10.5v2h2v-2Zm0 4v2h2v-2ZM3.5 13v2h2v-2Zm0 4v2h2v-2Z"/>',
  statue: '<circle cx="12" cy="4.5" r="2.6"/><path d="M8.5 8h7l-1 7.3h-5Z M6 16.2h12v2H6Z M4.5 19h15v3h-15Z"/>',
  cave: '<path fill-rule="evenodd" d="M1 21.5C2 12.5 6 5 12 5s10 7.5 11 16.5Zm6-.1c0-4.2 2.2-8.3 5-8.3s5 4.1 5 8.3Z"/>',
  viewpoint: '<circle cx="6.5" cy="15.5" r="4.5"/><circle cx="17.5" cy="15.5" r="4.5"/><path d="M3.8 13 6 5h4v6.5Z M20.2 13 18 5h-4v6.5Z M10 10.5h4v3.2h-4Z"/>',
  festival: `<path fill-rule="evenodd" d="M9 2.5h6v2H9Z M9 19.5h6v2H9Z M12 4.5c3.9 0 7 3.4 7 7.5s-3.1 7.5-7 7.5-7-3.4-7-7.5 3.1-7.5 7-7.5Z M5.4 9.1h13.2v1.1H5.4Z M5.4 13.8h13.2v1.1H5.4Z"/>`,
  train: `<path fill-rule="evenodd" d="M7 2.5h10a3 3 0 0 1 3 3v10.2a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5.5a3 3 0 0 1 3-3Zm-.5 3.5v5.5h11V6Zm.8 7.6v2h2v-2Zm7.4 0v2h2v-2Z"/><path ${S} d="M7.5 19 5 22M16.5 19l2.5 3"/>`,
  snow: `<path ${S} d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.6l3 2.4 3-2.4M9 20.4l3-2.4 3 2.4M3.4 11.2l3.4-.2-1.7-3M20.6 12.8l-3.4.2 1.7 3M20.6 11.2l-3.4-.2 1.7-3M3.4 12.8l3.4.2-1.7 3"/>`,
  themepark: `<circle cx="12" cy="10" r="7" ${S} stroke-width="1.8"/><path ${S} stroke-width="1.4" d="M12 3v14M5 10h14M7 5l10 10M17 5 7 15"/><path ${S} d="m12 10-5 11.5M12 10l5 11.5M4.5 21.5h15"/>`,
  food: `<path d="M2.5 11.5h19c0 5-4.2 9-9.5 9s-9.5-4-9.5-9Z"/><path ${S} d="m14.5 2.5-4 7.5M19 3l-5.5 7"/>`,
  museum: '<path d="M12 2 2 7.2h20Z M3.5 8.2h17v1.6h-17Z M5 10.8h2.2v7.6H5Z M10.9 10.8h2.2v7.6h-2.2Z M16.8 10.8H19v7.6h-2.2Z M2.5 19.4h19V22h-19Z"/>',
  hotel: `<path ${S} d="M2 5v15M2 16h20v4M22 16v-3a3 3 0 0 0-3-3h-8v6"/><circle cx="6.5" cy="12" r="2.3"/>`,
  church: '<path fill-rule="evenodd" d="M11.1 1.5h1.8v2.2h2.1v1.8h-2.1v1.8l5.6 4.3V22h-5.6v-4.4a.8.8 0 0 0-1.6 0V22H5.7V11.6l5.4-4.3V5.5H9V3.7h2.1Zm.9 7.8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z M2 15.5l3-2.3V22H2Z M22 15.5l-3-2.3V22h3Z"/>',
  camera: '<path fill-rule="evenodd" d="M4 7h3l2-2.5h6L17 7h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm8 2.8a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Z"/>',
  star: '<path d="m12 2 3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8Z"/>',
  pin: '<path fill-rule="evenodd" d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/>',
};

/** Renvoie le HTML d'une icône : un nom de la liste, sinon le texte tel quel (emoji). */
export function iconeHTML(nom) {
  const cle = String(nom || '').trim();
  const dessin = ICONES[cle.toLowerCase()];
  if (dessin) {
    return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${dessin}</svg>`;
  }
  if (cle) return `<span class="emoji" aria-hidden="true">${cle.replace(/[<>&"]/g, '')}</span>`;
  return iconeHTML('pin');
}
