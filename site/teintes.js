// ================================================================
//  Les teintes du moment que lisent les couches dessinées par la carte
//  graphique (la houle, le ressac, les modèles 3D, les bateaux). ambiance.js
//  les change selon l'heure au Japon ; ces couches les relisent à chaque image.
// ================================================================

export const TEINTES = {
  eau: [61, 107, 100], // l'encre des lignes d'eau (#3d6b64)
  ecume: [246, 238, 219], // l'écume du ressac (#f6eedb, le papier neuf)
  lumiere: 1, // la lumière des modèles 3D et des bateaux (1 le jour, moins la nuit)
};
