// ================================================================
//  Le petit décor que les lieux de la balade partagent : le panneau de bois à lire, le trépied du vidéaste.
//  a : un atelier (modeles3d.js) ; P : la palette du style. Chaque objet se bâtit à l'origine, posé au sol.
// ================================================================

/** Un panneau de bois sous son petit toit, le papier tourné vers −z ; environ 1,8 m. */
export function panneau(a, P) {
  a.boite(0.14, 1.6, 0.14, P.boisFonce, { x: -0.6, y: 0.8 })
    .boite(0.14, 1.6, 0.14, P.boisFonce, { x: 0.6, y: 0.8 })
    .boite(1.5, 0.9, 0.08, P.bois, { y: 1.2 })
    .boite(1.2, 0.6, 0.02, P.papier, { y: 1.2, z: -0.05, trait: false })
    .pignon(1.8, 0.28, 0.42, P.toit, { y: 1.67 });
  for (let i = 0; i < 3; i++) a.boite(0.8 - i * 0.15, 0.05, 0.01, P.noir, { x: -0.1, y: 1.38 - i * 0.14, z: -0.065, trait: false });
  return a;
}

/** Le trépied et la caméra du vidéaste, l'objectif vers +z ; à poser 1,3 m au-dessus du sol (la tête du trépied). */
export function trepied(a) {
  for (const r of [0, 2.1, 4.2]) a.baton([0, 0, 0], [Math.sin(r) * 0.35, -1.25, Math.cos(r) * 0.35], 0.022, '#2a2a30', 5);
  return a.boite(0.3, 0.22, 0.42, '#2a2a30', { y: 0.12 })
    .cylindre(0.08, 0.08, 0.16, 10, '#3a3a44', { y: 0.12, z: 0.27, rx: Math.PI / 2 })
    .ovale(0.05, '#9fd0e8', { y: 0.12, z: 0.36, trait: false }, 6)
    .ovale(0.03, '#e8452e', { x: 0.1, y: 0.25, z: -0.1, trait: false }, 6);
}
