/**
 * La taille d'une phrase pour qu'elle tienne en largeur, sur une ligne si elle reste assez grande, sinon sur deux lignes
 * équilibrées. La largeur d'un caractère est estimée (en fraction de la taille) : 0,56 pour du gras.
 */
export function ajuster(texte: string, largeur: number, max: number, min: number, facteur = 0.56) {
  const t = texte.trim();
  const une = Math.min(max, largeur / (facteur * Math.max(1, t.length)));
  if (une >= min * 1.15 || !t.includes(" ")) return { lignes: [t], taille: Math.max(une, min * 0.8) };
  // deux lignes : la coupure (entre deux mots) qui rend la plus longue ligne la plus courte
  const mots = t.split(/\s+/);
  let mieux: [string, string] = [t, ""], plus = Infinity;
  for (let k = 1; k < mots.length; k++) {
    const a = mots.slice(0, k).join(" "), b = mots.slice(k).join(" ");
    const l = Math.max(a.length, b.length);
    if (l < plus) { plus = l; mieux = [a, b]; }
  }
  return { lignes: mieux, taille: Math.min(max, largeur / (facteur * plus)) };
}
