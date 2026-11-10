# La quatrième vidéo du jeu : « noob vs pro » (brag-plan, skill brag-slim)

Demande du propriétaire (2026-11-10), après « le créateur » : « C'est bon fait une autre vidéo dans un style encore différent ».

Refaite deux fois le même jour :
1. **Sur une borne d'arcade.** Le propriétaire : « J'aime beaucoup le style. Un petit peu rétro comme ça. Mais je trouve que mettre
   deux téléphones côte à côte […] c'est trop petit pour regarder. Surtout si on regarde sur téléphone […] Peut-être mettre ça sur la
   borne d'un jeu arcade ou un truc comme ça. »
2. **Plus lente, avec deux personnages.** Le propriétaire : « ça va un peu trop vite et on ne se rend pas bien compte que c'est un
   noob vs un pro qui joue ».

## Le style

Un **duel comique façon borne d'arcade 8-bit**. Vue de face, une borne : en haut le fronton lumineux (« GUESS THE PLACE », les
ampoules qui clignotent à la croche, le tableau des scores avec la tête de chaque joueur) ; au milieu un seul grand écran à tube
(840 px de large), où le vrai jeu tourne ; en bas le pupitre (manche et boutons rouges du 1P à gauche, bleus du 2P à droite).

**Deux personnages en pixel art** (24 × 24, `personnages.py`), qu'on reconnaît d'un coup d'œil :
- **le NOOB** (PLAYER 1, rouge) : un bob rouge avec la marque des débutants japonais (初心者マーク, le chevron jaune et vert), un
  t-shirt blanc à cœur, un grand sourire sûr de lui ; il pleure quand il rate, il est choqué à la manche 4, fier à la fin ;
- **le PRO** (PLAYER 2, bleu) : une casquette bleue, des lunettes noires, une veste et une médaille, un sourire en coin ; à la
  manche 4, ses lunettes remontent sur son front.

Ils **parlent** dans des boîtes de dialogue de jeu vidéo (leur nom, leur tête, le texte qui s'écrit lettre par lettre avec un petit
bip, la bouche qui bouge) : le noob « EASY! IT'S TOKYO 🗼 », puis « 1,556 KM?! NOOO 😭 » ; le pro « SHURI CASTLE, OKINAWA. 🎯 ».
Comme sur une vraie borne, ils jouent **chacun leur tour** (l'écran grésille au changement, son cadre s'allume à la couleur du
joueur), et chaque tour dure environ 2 secondes (le double d'avant). Police pixel (Press Start 2P), musique chiptune composée en
demi-temps (plus calme), aucune voix.

- **L'accroche** : dès la première image, l'écran « VS » des jeux de combat : les deux personnages face à face, « NOOB · LV 1 »
  contre « PRO · LV 99 », « WHO KNOWS JAPAN BEST? ».
- **La chute** : à la manche 4 (les chutes de Nomizo, à 61 km de Tokyo), le noob pose encore à Tokyo… et gagne la manche ; le pro,
  « KYUSHU, FOR SURE », fait +33 ; la borne tressaute ; « THE NOOB WON THIS ROUND! 🤯 », le noob : « TOLD YOU. TOKYO! 😎 ».
- **La manche 3** (la même blague) passe en avance rapide : « ROUND 3 ⏩ SAME STORY... 😭 », les deux scores d'un coup.
- **La fin** : l'écran « VS » revient avec les scores des cinq manches (1,286 « Curious tourist », 4,027 « Seasoned traveler »,
  une couronne pour le pro), « WHICH ONE ARE YOU? 👇 », puis l'écran s'éteint et se rallume sur « PRESS START » et le lien.
- **Les chiffres** sont ceux du jeu (les prises sont jouées par le film) : le noob +2, +38, +225, +783 ; le pro 999, 998, 998, puis
  +33. Les deux joueurs sont des personnages, pas de vraies personnes.
- **La légende à copier** : `partage-versus.txt`. Jamais « I filmed » (le propriétaire, le même jour).

## Le son

150 battements par minute (un temps = 24 images, une mesure = 4 temps), la batterie en demi-temps (la grosse caisse sur le 1, la
caisse claire sur le 3), une mélodie lente à la noire en gamme yo. L'écran « VS » : un accord frappé et un roulement ; l'avance
rapide : le double-temps ; le dernier tour du pro : le suspense (sans mélodie). Bruitages dans la même voix : appui, validation, la
plainte du noob qui rate, l'arpège du pro qui réussit, la chance, le « bonk », les points qui défilent, la pièce, le grésillement de
l'écran, le bip du texte (aigu pour le noob, grave pour le pro) ; le joueur 1 à gauche, le joueur 2 à droite, comme leurs manettes.

## Le découpage : 26 s (65 temps)

Les prises sont refilmées plus lentes : des manches de 12 temps, chacun appuie 5 temps après « Next place ».

| Temps | L'écran | Texte |
|---|---|---|
| 0 → 4 | L'écran « VS » : les deux personnages | « NOOB · LV 1 » contre « PRO · LV 99 », « WHO KNOWS JAPAN BEST? » |
| 4 → 12,5 | Manche 1, Shuri : le noob pose à Tokyo (9) : +2 | « ROUND 1 / WHERE IS THIS? 📍 », noob : « EASY! IT'S TOKYO 🗼 », « 1,556 KM?! NOOO 😭 » |
| 12,5 → 20 | Le pro pose à Okinawa (15) : +999 | pro : « SHURI CASTLE, OKINAWA. 🎯 », « TOO EASY. 😎 » |
| 20 → 32 | Manche 2, la Colline du Bouddha : +38, puis +998 | « ROUND 2 », noob : « TOKYO AGAIN! 🗼 », « WHY?! 😭 » ; pro : « SAPPORO. 🎯 », « NEXT! 😎 » |
| 32 → 36 | Manche 3 en avance rapide : +225 et +998 | « ROUND 3 ⏩ / SAME STORY... 😭 » |
| 36 → 43 | Manche 4, les chutes de Nomizo : le noob +783 (40) | « ROUND 4 », noob : « TOKYO. ALWAYS. 🗼 », « +783?! WAIT... 😳 » |
| 43 → 48,5 | Le pro : +33 (46,5), la borne tressaute | pro : « KYUSHU, FOR SURE. 🎯 », « WHAT?! 😱 » |
| 48,5 → 52 | Retour au noob | « THE NOOB WON / THIS ROUND! 🤯 », noob : « TOLD YOU. TOKYO! 😎 » |
| 52 → 57 | L'écran « VS » des scores | 1,286 « Curious tourist » contre 4,027 « Seasoned traveler », 👑, « WHICH ONE / ARE YOU? 👇 » |
| 57 → 65 | L'écran s'éteint, se rallume : « PRESS START », le logo, le lien | « GUESS THE PLACE », « FREE · LINK IN BIO », l'adresse |
