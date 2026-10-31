// Les moments de la vidéo (en images, 60 par seconde), sur les temps de la musique (120 battements par minute : le
// temps n tombe à l'image 30 n) : l'accroche 0 → 3 s (l'horloge, le plongeon dans son centre), les chapeaux 3 → 5 s,
// le panneau et le défilé 5 → 9 s, trois gros plans 9 → 12 s, la chasse 12 → 15 s, minuit 15 → 18 s (la cloche au
// temps 33, 16,5 s), la fin 18 → 22,5 s. Les prises de la carte (rushes.py, plans.js) sont calées sur ces moments.
import { b, FPS, ressort, s } from "./theme";

export const T = {
  // l'accroche
  titre: 0, // « THIS MAP IS HAUNTED », mot à mot dans les 6 premières images (la voix dit « haunted » vers 1 s : le mot bat
  // à ce moment)
  haunted: s(1.0),
  horloge: s(1.62), // l'horloge surgit
  jusqua: s(1.76), // « …until midnight »
  depart: s(2.42), // le titre s'envole
  elan: [s(2.5), s(2.64)], // l'horloge recule (l'élan)
  plonge: [s(2.64), b(6)], // le plongeon dans le centre de l'horloge : ×1 → ×80
  // les chapeaux (prise mn-chapeaux, de 2,55 s ; les chapeaux tombent à t = 0,5)
  chapeaux: s(2.55),
  chute: s(3.05),
  fouet1: [s(4.86), s(5.14)],
  // le panneau (prise mn-defile, de 4,85 s, floue derrière) puis le défilé
  defile: s(4.85),
  bouton: s(5.02), // le bouton d'Halloween surgit
  tapBouton: s(5.34),
  panneau: [s(5.44), s(6.5)], // le panneau se déplie, puis repart
  tapDefile: s(6.3),
  net: [s(6.5), b(14)], // la mise au point : le défilé apparaît
  sceau: s(7.05),
  // trois gros plans (prise mn-proche : t = 1, 3,6 et 6,2 s)
  proches: [b(18), b(20), b(22)],
  // la chasse (prise mn-chasse, de 11,85 s ; Enma touché à t = 1,15 : 13 s)
  fouet2: [s(11.86), s(12.14)],
  chasse: s(11.85),
  // minuit (prise mn-minuit, de 15 s ; tout disparaît à t = 1,5 : 16,5 s)
  fouet3: [s(14.86), s(15.14)],
  minuit: s(15.0),
  horloge2: s(15.02),
  cloche: b(33),
  // la fin (prise mn-fin, de 17,9 s)
  finPrise: s(17.9),
  fin: b(36),
  logo: s(18.06),
  derniere: s(18.38), // « TONIGHT IS THE »
  lastNight: s(19.08), // « LAST NIGHT »
  adresse: b(40),
  bio: s(20.62),
};

/** Les secondes de l'horloge (23:59 et des secondes) : 27 au début de la vidéo, une de plus à chaque temps (le tic
 *  saute avec le ressort), 60 (minuit pile) au temps 33 ; elle s'arrête là. */
export const secondesHorloge = (f: number) => {
  const k = Math.min(33, Math.floor(f / 30));
  return 26 + k + ressort((Math.min(f, b(33) + s(1)) - 30 * k) / FPS, 700, 22);
};
