// ================================================================
//  Petits outils partagés par les modules de la carte : écrire du texte
//  dans du HTML, partager une image ou un lien, nettoyer l'adresse,
//  mesurer une distance.
// ================================================================

/** Un texte qu'on peut glisser sans risque dans du HTML. */
export const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Typographie française : l'espace avant ! ? : ; et à l'intérieur des « » devient insécable, pour qu'aucun signe ne
 * parte seul au début de la ligne suivante. Les textes s'écrivent avec une espace normale ; seul le français passe ici.
 */
export const typoFr = (s) => (typeof s === 'string' ? s.replace(/ ([!?:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0') : s);

/** Distance en km entre deux points { lng, lat } (à vol d'oiseau, sur le globe). */
export function kmEntre(a, b) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

/** Le cap (0 = nord, 90 = est) pour aller de a vers b { lng, lat }, au départ. */
export function cap(a, b) {
  const r = Math.PI / 180;
  const y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r);
  const x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r);
  return (Math.atan2(y, x) / r + 360) % 360;
}

// Le défi du jour (defi.js) change à minuit, heure du Japon (UTC+9, sans heure d'été)
const JOUR = 864e5, DECALAGE_JAPON = 9 * 3600e3;
/** Le numéro du jour du défi (0 = le jour debut, « 2026-10-13 ») à l'instant donné, compté à l'heure du Japon. */
export const jourDuDefi = (debut, maintenant = Date.now()) => Math.floor((maintenant + DECALAGE_JAPON - Date.parse(debut)) / JOUR);
/** L'instant (ms) où commence ce jour du défi : minuit à Tokyo. */
export const debutDuJour = (debut, jour) => Date.parse(debut) + jour * JOUR - DECALAGE_JAPON;

/** La croix en haut à droite d'un panneau (style.css, .panneau-fermer) ; titre : « Fermer » dans la langue de la page. */
export const croixPanneau = (titre) => `<button type="button" class="panneau-fermer" data-fermer data-t-titre="fermer" data-t-aria="fermer" title="${echapper(titre)}" aria-label="${echapper(titre)}">`
  + '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M7 7l10 10M17 7 7 17"/></svg></button>';

/** Un écran tactile (téléphone, tablette) : on y partage par le menu du système plutôt que de télécharger ou copier. */
export const tactile = () => matchMedia('(pointer: coarse)').matches;

/** Enregistre un fichier fabriqué dans la page (une image…) dans les téléchargements. */
export function telecharger(fichier) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(fichier);
  a.download = fichier.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

/**
 * Sur un écran tactile, le menu de partage du système avec ce fichier (« Enregistrer l'image », Instagram…).
 * Vrai si c'est réglé (partagé, ou menu fermé sans choisir) ; faux s'il faut le télécharger à la place.
 */
export async function partagerFichier(fichier, texte) {
  if (!tactile() || !navigator.canShare?.({ files: [fichier] })) return false;
  try {
    await navigator.share(texte ? { files: [fichier], text: texte } : { files: [fichier] });
    return true;
  } catch (e) {
    return e?.name === 'AbortError';
  }
}

/**
 * Un lien ou un texte à envoyer : le menu de partage sur écran tactile, sinon copié dans le presse-papiers
 * (message : copie) ; si la copie est refusée, il s'affiche pour qu'on puisse le recopier.
 */
export async function envoyer({ titre, texte, url }, { message, copie }) {
  if (tactile() && navigator.share) {
    try {
      await navigator.share({ title: titre, text: texte, url });
      return;
    } catch (e) {
      if (e?.name === 'AbortError') return; // menu fermé sans choisir
    }
  }
  const aCopier = url || texte;
  try {
    await navigator.clipboard.writeText(aCopier);
    message(copie);
  } catch {
    message(aCopier);
  }
}

/** Lit des paramètres de l'adresse (…?voyage=…) et les en efface, sans recharger la page. */
export function retirerParametres(...noms) {
  const params = new URLSearchParams(location.search);
  const valeurs = Object.fromEntries(noms.map((n) => [n, params.get(n)]));
  if (noms.some((n) => params.has(n))) {
    for (const n of noms) params.delete(n);
    const reste = params.toString();
    history.replaceState(null, '', location.pathname + (reste ? `?${reste}` : '') + location.hash);
  }
  return valeurs;
}
