# La quatrième vidéo du jeu : « noob vs pro » (brag-plan, skill brag-slim)

Demande du propriétaire (2026-11-10), après « le créateur » : « C'est bon fait une autre vidéo dans un style encore différent ».

Refaite le même jour sur une **borne d'arcade**. Le propriétaire : « J'aime beaucoup le style. Un petit peu rétro comme ça. Mais je trouve
que mettre deux téléphones côte à côte […] c'est trop petit pour regarder. Surtout si on regarde sur téléphone […] Peut-être mettre ça
sur la borne d'un jeu arcade ou un truc comme ça. »

## Le style

Ni motion design à voix (les deux du 2026-11-09), ni histoire du créateur en bulles natives (« le créateur ») : un **duel comique
façon borne d'arcade 8-bit**. Vue de face, une borne : en haut le fronton lumineux (« GUESS THE PLACE », les ampoules qui
clignotent à la croche, le tableau des scores `1P NOOB 🐣` / `😎 PRO 2P`) ; au milieu un seul grand écran à tube (840 px de large,
1,6 fois les téléphones d'avant), où le vrai jeu tourne ; en bas le pupitre (manche et boutons rouges du 1P à gauche, bleus du 2P à
droite). Comme sur une vraie borne, les deux joueurs jouent **chacun leur tour** : le débutant (PLAYER 1, NOOB), qui pose tout à
Tokyo, puis le pro (PLAYER 2, PRO), qui vise juste. L'écran grésille à chaque changement de joueur, son cadre s'allume à la couleur de
celui qui a la main. Police pixel (Press Start 2P), musique chiptune composée, aucune voix. Le format « noob vs pro » est un mème
connu ; l'humour vient du jeu lui-même : « tout est à Tokyo, non ? ».

- **L'accroche** : dès la première image, la borne, la photo de la manche 1 (le château de Shuri) et le grand « NOOB VS PRO » ; le
  spectateur a 1,6 s pour deviner (« ROUND 1 / WHERE IS THIS? 📍 »).
- **La chute** : à la manche 4 (les chutes de Nomizo, à 61 km de Tokyo), le débutant pose encore à Tokyo… et gagne la manche ; le
  pro, lui, la croit à Kyūshū. La borne tressaute deux fois.
- **La fin** : les vrais écrans de score des deux joueurs (« Curious tourist », « Seasoned traveler »), « WHICH ONE ARE YOU? 👇 »,
  puis l'écran s'éteint et se rallume sur l'écran d'attente : le logo, « GUESS THE PLACE », « PRESS START », le lien ; la bande
  au-dessus de l'écran clignote « FREE PLAY ».
- **Les chiffres** sont ceux des prises (le jeu les calcule) : le débutant +2, +38, +225, +783 ; le pro 999, 998, 998, puis +33.
  Les deux joueurs sont des personnages (les prises sont jouées par le film), pas de vraies personnes.
- **La légende à copier** : `partage-versus.txt`. Jamais « I filmed » (le propriétaire, le même jour).

## Le son

150 battements par minute (un temps = 24 images, une mesure = 4 temps, chaque manche commence sur une mesure). Chiptune composé
(`musique.py versus`) en do, mélodie en gamme yo : carrés à 25 % et 12,5 % (mélodie, arpège rapide), triangle à la basse, bruit pour
la batterie, un écho court. Bruitages dans la même voix : appui, validation, la plainte du débutant qui rate, l'arpège du pro qui
réussit, la chance, le « bonk », les points qui défilent, la pièce (au début et à la fin), le grésillement de l'écran ; le joueur 1 à
gauche, le joueur 2 à droite, comme leurs manettes.

## Le découpage : 22,8 s (57 temps)

Les prises restent celles du premier montage ; la vidéo montre la prise du débutant décalée de 4 temps, celle du pro décalée pour
que son appui tombe un temps après qu'il a la main.

| Temps | L'écran | Texte |
|---|---|---|
| 0 → 4 | Manche 1, Shuri : la photo (arrêtée) | « NOOB VS PRO », puis « ROUND 1 / WHERE IS THIS? 📍 » |
| 4 → 8,5 | Le débutant pose à Tokyo (5) : +2 (6) | « THE NOOB SAID / TOKYO 💀 » |
| 8,5 → 12 | Le pro pose à Okinawa (9,5) : +999 (10,5) | « PRO'S TURN 😎 » |
| 12 → 20 | Manche 2, la Colline du Bouddha : +38, puis +998 | « ROUND 2 », « TOKYO AGAIN?! 😭 » |
| 20 → 28 | Manche 3, le Pavillon d'or : +225, puis +998 | « ROUND 3 », « ONLY KNOWS / TOKYO 🗼 » |
| 28 → 40 | Manche 4, les chutes de Nomizo : le débutant +783 (30), le pro +33 (34,5), retour au débutant | « ROUND 4 », « WAIT... 😳 », « THE NOOB WON / THIS ROUND?! 🤯 » |
| 40 → 48 | Les deux écrans de score (5 manches) | « FINAL SCORE / CURIOUS TOURIST 🐣 », « SEASONED / TRAVELER 😎 », « WHICH ONE / ARE YOU? 👇 » |
| 48 → 57 | L'écran s'éteint, se rallume : « PRESS START », le logo, le lien | « GUESS THE PLACE », « FREE · LINK IN BIO », l'adresse |
