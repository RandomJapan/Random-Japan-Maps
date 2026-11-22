# La vidéo 2 du « générique d'animé » de la carte : le plan (brag-plan, skill brag-slim)

Demande du propriétaire (2026-11-22), après la vidéo 1 : « Fais la vidéo avec la chanson 2 maintenant, il faudra que ce soit une belle fille pour le hook quand la musique est chantée par une fille. » La chanson n° 2 est la deuxième des quatre faites sur Flora (ElevenLabs Music v2.5, une jeune femme, les mêmes paroles : `paroles.txt`). Le même moteur que la vidéo 1 (`montage/src/Commun.tsx`, `Personnage`, `Titre`, `Fin`), le montage dans `montage/src/fille/`.

## L'angle

« Si ma carte du Japon avait un générique d'animé… 2. » Une héroïne d'animé (une jeune femme d'environ 20 ans, longs cheveux bruns, yeux ambrés, chapeau de paille à ruban rose pâle, veste bleu marine : un personnage original) fixe l'objectif dès l'image 0, des pétales de cerisier passent ; elle tranche vers l'objectif, l'image se fend sur la lame, de l'autre côté elle est de dos, se retourne en souriant et tend son téléphone : la vraie carte est dedans ; la caméra plonge dans l'écran et atterrit sur la carte quand la voix entre. Puis le générique, une image par parole, d'autres lieux du propriétaire que dans la vidéo 1.

- **Pour qui** : les gens qui aiment le Japon et les animés.
- **Ce que c'est** : la carte du Japon en 3D, gratuite, avec plus de 150 lieux, chacun avec sa vraie vidéo.
- **La légende** : `videos/carte/generique/partage-2.txt`.

## Le ton et l'identité

Comme la vidéo 1 (coupes sur les temps, éclairs, traits de vitesse, trames, titres verticaux, crédits en petit), avec le rose des cerisiers à la place du rouge pour les éclairs, la lumière de la lame et les ombres du titre (`ROSE` #ff4f8b) ; les pastilles des mots restent rouges (celles des vidéos de la carte). Des pétales de cerisier sur l'héroïne.

## La musique

La chanson n° 2 : 165 battements par minute (moindres carrés sur ses attaques fortes), son premier temps à 0,0173 s. Silence jusqu'à 1,05 s, intro instrumentale jusqu'à 5,9 s, une coupure 5,9 → 6,45 s, la voix à 6,5 s ; la voix reprend après un blanc à 6,5, 8,4, 9,1, 11,5, 12,4, 13,5, 14,2 s (les huit demi-lignes japonaises), le refrain anglais au temps 42 (15,3 s) comme la n° 1. Pas de reconnaissance vocale sur ce PC : le propriétaire vérifie à l'oreille.

La vidéo commence sur son temps 6 (2,2 s) : l'intro joue dès l'image 0, sans les 2 s de chambre de la vidéo 1.

## Le découpage (temps de la chanson ; image de la vidéo = b(n))

| Temps | Image | Texte |
|---|---|---|
| 6 → 10 | Elle fixe l'objectif (fille-coupe, de sa seconde 0,6), la caméra s'approche à peine, des pétales ; elle arme son coup | « If my Japan map had an anime opening 2 🌸 » dès l'image 0 |
| 10 | Sa lame traverse l'objectif (sa seconde 2,04) : la ligne blanche et rose, l'image se fend | |
| 10 → 18 | De dos, elle se retourne, sourit, tend son téléphone avec la vraie carte ; la caméra plonge dedans (fille-flux, ecran.py) | |
| 18 → 25 | La carte (tn-japon), le titre ランダム・ジャパン | 地図を広げて 走り出せ |
| 25 → 31,5 | Le Daisen dans les nuages, puis le Fuji au couchant derrière le torii rouge du lac d'Hakone | 雲を越えて 富士の向こうへ |
| 31,5 → 37 | Les torii : Inariyama (le tunnel), Kabushima (les mouettes), Futamigaura (le torii blanc dans la mer) | 千の鳥居を くぐり抜けて |
| 37 → 41 | Deux lieux en personnages : 蔵王御釜 Okama Crater (Miyagi · Yamagata), 芥屋の大門 Keya no Oto (Fukuoka) | まだ知らない 日本へ |
| 41 → 42 | Son sourire, figé, des pétales, des traits de vitesse | |
| 42 → 50 | La plongée sur la carte, puis la route sous les cerisiers d'Akagi | « OPEN THE MAP, LET'S GO! » |
| 50 → 58 | La carte en hiver, puis le typhon sur la mer | « FROM THE SNOW TO THE SEA » |
| 58 → 66 | Seuls les sanctuaires, puis la route tracée | « EVERY SHRINE, EVERY ROAD » |
| 66 → 70 | Elle dégaine, pose la lame sur son bras, clin d'œil (fille-tire) | « JAPAN, WAIT FOR ME! » |
| 70 → 74 | Le feu d'artifice d'Itsukushima dans la balade | |
| 74 → fin | Le carton de fin ; « FREE · LINK IN BIO » à 27,6 s | |

## L'IA

Les trois passages des rushes du propriétaire déjà envoyés pour la vidéo 1 (rush 4 : le regard et la coupe, le sabre dégainé ; rush 2 : le téléphone), redessinés par FLUX 3 Video Edit avec la même description de l'héroïne (0,08 à 0,11 $ chacun, 0,29 $ en tout) : le même visage dans les trois. Sur le plan du téléphone, FLUX a dessiné au mur deux affiches « WANTED » (celles de la chambre, de One Piece) : `ecran.py` les efface. Il faudra activer l'étiquette « contenu généré par IA » de TikTok.
