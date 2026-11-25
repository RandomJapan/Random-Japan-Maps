# La vidéo « générique d'animé » de la carte : le plan (brag-plan, skill brag-slim)

Demande du propriétaire (2026-11-22) : « Pour une vidéo de la carte, […] dans un style un peu d'animé japonais […] comme un opening d'animé avec une musique […] un peu entraînante. » Ses références : l'opening 16 de One Piece (« avec un refrain en anglais, du coup tout le monde peut comprendre »), le premier opening de Dandadan, ceux de Jujutsu Kaisen, « un style dans le style des shōnen actuels ». Il a choisi : une chanson chantée en japonais, la carte avec ses rushes. Puis : « un personnage en mode animé […] qui tient un téléphone et ensuite qui le montre à la caméra avec la carte dessus, et ensuite la caméra elle rentre dans le téléphone et ensuite on voit la carte qui s'étend », avec ses propres vidéos du geste (`videos/tournage/Oppening animé carte`, DJI en D-Log M) pour le hook, « mais aussi créer des vidéos en style animé. Et le personnage n'est pas obligé de me ressembler ».

## L'angle

« Si ma carte du Japon avait un générique d'animé. » Un vrai garçon au chapeau de paille dégaine un katana, tranche vers l'objectif : de l'autre côté de la coupe, il est devenu un héros d'animé, qui se retourne, sourit et tend son téléphone ; la caméra entre dans l'écran, et la carte du Japon s'ouvre sur « 地図を広げて » (« ouvre la carte »). Puis le générique : chaque parole a son image, les lieux du compte sont les personnages, le refrain en anglais montre ce qu'on fait sur la carte.

- **Pour qui** : les gens qui aiment le Japon et les animés (le public de @random_japan_place).
- **Ce que c'est** : la carte du Japon en 3D, gratuite, avec plus de 150 lieux, chacun avec sa vraie vidéo.
- **Ce qui la distingue** : chaque épingle est une vraie vidéo ; un jeu, des saisons, la mer vivante, les routes.
- **La légende** : `videos/carte/generique/partage.txt`.

## Le ton et l'identité

Un opening de shōnen d'aujourd'hui (pas une copie d'un opening en particulier, aucun personnage ni logo d'une œuvre existante) : coupes sur chaque temps, éclairs rouges, noirs et blancs, traits de vitesse (集中線), trames, décalage des couleurs sur les coups, gros titres japonais verticaux (Dela Gothic One, Shippori Mincho B1), crédits en petit comme dans un vrai générique. Les couleurs de la carte (papier, encre, rouge du sceau) et son turquoise de mer. Les mots anglais du refrain en grand, en TikTok Sans 900, blancs cernés d'encre, un mot sur la pastille rouge (les vidéos de la carte).

## La musique

La chanson 1 (ElevenLabs Music v2.5 sur Flora, 0,10 $, choisie à l'oreille par le propriétaire parmi quatre) : J-rock à 164,4 battements par minute (un temps = 0,365 s = 21,9 images à 60 images/s), refrain en anglais. Ses paroles (écrites pour elle, originales) : `paroles.txt`. Repères mesurés (`analyse.py`, le centre de la stéréo contre les côtés) : intro 0 → 2,95 s ; couplet 2,95 → 9,0 ; pré-refrain 9,3 → 14,5 (une note tenue 13,8 → 14,4) ; refrain 15,3 → 26,2 (quatre lignes de 8 temps) ; « Let's go! » 28,0 ; fin 29,0.

Avant elle, 2 s sans musique : le vrai son de la chambre et du sabre.

## Le découpage (secondes de la vidéo ; la chanson part à V0 ≈ 2,0 s, sur la coupe du sabre)

| Vidéo | Chanson | Image | Texte |
|---|---|---|---|
| 0 → 0,7 | — | Le propriétaire dégaine le katana et le pose le long du bras (rush 4) | « If my Japan map had an anime opening ⚔️ » dès l'image 0 |
| 0,7 → 2,0 | — | Il fixe l'objectif, arme son coup, tranche vers la caméra (rush 4) | (le même) |
| 2,0 | 0,0 | Le sabre traverse l'objectif : une ligne de coupe blanche, l'image se fend, éclair ; la chanson démarre | |
| 2,0 → 4,9 | 0 → 2,9 | Le héros d'animé (son rush 2 redessiné par FLUX 3 Video Edit) : de dos, il se retourne, sourit, tend le téléphone ; la caméra entre dans l'écran | |
| 4,9 → 7,9 | 2,95 → 5,85 | La vraie carte s'étend depuis l'écran : tout le Japon, les épingles jaillissent du centre ; le titre du « générique » tombe | 地図を広げて 走り出せ · *Open the map and start running* |
| 7,9 → 11,0 | 5,95 → 9,0 | Le château de Takeda au-dessus de la mer de nuages, puis le Fuji au-dessus des fleurs | 雲を越えて 富士の向こうへ · *Over the clouds, beyond Mount Fuji* |
| 11,3 → 14,0 | 9,3 → 12,05 | Les torii, un par temps : Takayama Inari, Motonosumi, Itsukushima, Shirahige… | 千の鳥居を くぐり抜けて · *Through a thousand torii gates* |
| 14,3 → 16,5 | 12,35 → 14,5 | Trois lieux présentés comme des personnages (arrêt sur image, aplat en biais, nom vertical en grand) : Aogashima, Nagoro, l'étang bleu de Shirogane | まだ知らない 日本へ · *To a Japan you don't know yet* |
| 16,5 → 17,3 | 14,5 → 15,3 | La pause avant le refrain : le sourire du héros en gros plan, figé, traits de vitesse | |
| 17,3 → 19,5 | 15,3 → 17,45 | Refrain 1 : la plongée de tout le Japon vers un lieu | « OPEN THE MAP, LET'S GO! » |
| 20,2 → 22,6 | 18,2 → 20,6 | Refrain 2 : la neige (l'hiver), puis la mer (le typhon) | « FROM THE SNOW TO THE SEA » |
| 23,1 → 25,3 | 21,1 → 23,3 | Refrain 3 : seuls les sanctuaires jaillissent (le filtre), puis la route se trace sur les vraies routes | « EVERY SHRINE, EVERY ROAD » |
| 26,1 → 28,2 | 24,1 → 26,2 | Refrain 4 : jour → nuit, la balade en 3D | « JAPAN, WAIT FOR ME! » |
| 28,2 → 31 | 26,2 → 29 | Le final : tout le Japon allumé, le logo, « FREE · LINK IN BIO », l'adresse ; « Let's go! » | |

## Les vrais plans du propriétaire (`D:\Vidéos\Tik Tok\Vidéo lieux random japon`)

Takeda Castle (son titre incrusté en haut à gauche après 4 s : recadré), Fuji Shibazakura, Takayama Inari (le tunnel de torii, 9 à 14 s), Motonosumi, Itsukushima, Shirahige, Aogashima, Nagoro (le champ d'épouvantails, 13 s ; jamais le personnage de mascotte vers 32 s), Shirogane Blue Pond. Aucun drapeau, logo ni personnage d'une œuvre existante (le drapeau pirate de sa chambre, à la fin du rush 1, n'est pas utilisé).

## L'IA

Le plan animé est le rush 2 du propriétaire (3,5 → 6,6 s) redessiné en animé par FLUX 3 Video Edit (0,11 $), un personnage original (cheveux bouclés, chapeau de paille à ruban bleu nuit). Il faudra activer l'étiquette « contenu généré par IA » de TikTok.
