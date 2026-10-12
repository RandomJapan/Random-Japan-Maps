// ================================================================
//  Petits outils partagés par les modules de la carte : écrire du texte
//  dans du HTML, partager une image ou un lien, nettoyer l'adresse.
// ================================================================

/** Un texte qu'on peut glisser sans risque dans du HTML. */
export const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

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
