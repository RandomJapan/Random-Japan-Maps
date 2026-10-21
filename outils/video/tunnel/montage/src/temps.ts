// Les moments de la vidéo (en images, 60 par seconde), d'après la structure demandée :
// l'écran TikTok 0–3 s, le profil 3–7,5 s, le plongeon 7,5–8,9 s (un peu plus rapide que prévu, à la demande du
// propriétaire), la carte et ses trois fonctions 8,9–25 s (arrêts vers 13, 18 et 22 s), la fin 25–30 s.
// Les prises de la carte (rushes.py) sont calées sur ces moments : leurs actions tombent aux bonnes images.
import { s } from "./theme";

export const T = {
  // le TikTok
  tapNom: s(3.0), // l'appui sur le nom du compte
  glisse: [s(3.04), s(3.62)], // la vidéo part à gauche, le profil arrive de droite
  profil: s(3.15), // les éléments du profil arrivent l'un après l'autre, pendant que la page arrive
  versLien: [s(6.15), s(7.3)], // la caméra va vers le lien
  surbrillance: s(6.55), // le lien s'allume
  tapLien: s(7.5),
  elan: [s(7.5), s(7.8)], // la caméra recule de 4 % (l'élan)
  plonge: [s(7.8), s(8.65)], // le plongeon : ×1 → ×48
  portail: [s(8.6), s(8.92)], // le blanc s'ouvre sur la carte
  // la carte
  carte: s(8.6), // début de la prise tn-japon (ses épingles surgissent à t = 4,2 : 12,8 s)
  ui: s(8.85), // les boutons de la carte arrivent
  epingles: s(12.8),
  fouet1: [s(16.95), s(17.3)], // panoramique éclair vers Aogashima
  aoga: s(17.05), // début de la prise tn-aogashima
  fiche: [s(18.0), s(21.15)], // la fiche se déplie, puis repart
  fouet2: [s(21.5), s(21.85)],
  filtres: s(21.65), // début de la prise tn-filtres (tout masquer à t = 0,95 : 22,6 s ; sanctuaires à 1,45 : 23,1 s)
  menu: [s(21.95), s(23.65)], // le menu des catégories descend, puis remonte
  tapRien: s(22.58),
  tapSanctuaires: s(23.08),
  // la fin
  fin: s(25.0), // la carte recule et s'assombrit
  logo: s(25.45),
  phrase: s(26.05),
  italique: s(27.5),
  adresse: s(28.25),
};
