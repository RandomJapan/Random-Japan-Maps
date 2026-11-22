# Les vidéos 3 et 4 du « générique d'animé » de la carte : le plan (brag-plan, skill brag-slim)

Demande du propriétaire (2026-11-22), après les vidéos 1 et 2 : « On continue avec les deux derniers opening. » Les chansons n° 3 et 4 sont les deux longues faites par Lyria 3.5 sur Flora avec les mêmes paroles (`paroles.txt`) : la n° 3 chantée par un jeune homme (2 min 04, deux couplets, deux refrains, un pont), la n° 4 par une jeune femme (1 min 05, un couplet, un refrain). Le même moteur que les vidéos 1 et 2 (`montage/src/Commun.tsx`, `Personnage`, `Titre`, `Fin`), le montage dans `montage/src/h3/` et `montage/src/f4/`, leurs pièces communes dans `montage/src/suite/`.

## L'angle

« Si ma carte du Japon avait un générique d'animé… 3 » et « … 4 ». Une série : le héros de la vidéo 1 revient sur la chanson du jeune homme, l'héroïne de la vidéo 2 sur celle de la jeune femme, chacun dans de nouveaux gestes filmés par le propriétaire. Les deux chansons longues n'ont pas la place de tout chanter en 30 s : chaque vidéo prend la fin du pré-refrain (« まだ知らない 日本へ ») et le refrain anglais entier, jusqu'à la vraie fin de la chanson. Le hook est donc plus court que dans les vidéos 1 et 2 (2,1 et 2,5 s) : la carte arrive sur l'explosion du refrain, « Open the map, let's go! ».

- **Pour qui** : les gens qui aiment le Japon et les animés.
- **Ce que c'est** : la carte du Japon en 3D, gratuite, avec plus de 150 lieux, chacun avec sa vraie vidéo.
- **Les légendes** : `videos/carte/generique/partage-3.txt`, `partage-4.txt`.

## Le ton et l'identité

La grammaire des vidéos 1 et 2 (coupes sur les temps, éclairs, traits de vitesse, trames, lieux présentés comme des personnages, mots anglais claqués). La vidéo 3 prend un bleu électrique (`BLEU` #2ec4ff, la lumière de la lame du héros) pour les éclairs et les ombres du titre ; la vidéo 4 le rose des cerisiers de la vidéo 2, et des pétales. Les pastilles des mots restent rouges (celles de la carte).

## Les chansons

Mesurées sans reconnaissance vocale sur ce PC, puis avec une transcription minutée (Gemini 4 Argon sur Flora, 0,06 $ ; ses temps arrivent 0,6 à 0,9 s après les vrais : recalés sur la reprise du refrain et la fin, mesurées au volume et aux attaques).

- **N° 3** : 167,073 battements par minute (les moindres carrés sur ses attaques fortes, 92 % à 20 ms près), ses temps comptés depuis 0,2151 s. Second pré-refrain jusqu'à 90,7 s, une coupure de 0,3 s, la reprise du refrain au temps 253 (91,07 s), un vers tous les 16 temps, le pont instrumental temps 297 → 317, « Japan, wait for me! » au temps 317, « Let's go! » et la coupure nette à 120,0 s. La vidéo commence au temps 247 (88,92 s).
- **N° 4** : 165,004 battements par minute, depuis 0,2610 s. Le pré-refrain, un roulement de caisse claire, une coupure (36,36 → 36,58 s), le refrain au temps 100 (36,62 s), « Japan, wait for me! » vers le temps 147, un arrêt (temps 162 → 164), « Let's go! » et la fin à 62,1 s. La vidéo commence au temps 93 (34,08 s).

Le propriétaire vérifie à l'oreille que les mots tombent bien.

## Vidéo 3 (temps de la chanson n° 3 ; image = b(n))

| Temps | Image | Texte |
|---|---|---|
| 247 → 253 | Le héros surgit dans le cadre en souriant et tend son téléphone, la vraie carte dedans ; la caméra plonge dans l'écran (heros-pop, ecran.py) | « If my Japan map had an anime opening 3 ⚔️ » dès l'image 0 |
| 253 → 261 | La carte (tn-japon), le titre ランダム・ジャパン | « OPEN THE MAP, LET'S GO! » |
| 261 → 269 | Le petit train rouge d'Okuoi sur son pont | |
| 269 → 285 | Deux lieux en personnages : 羊蹄山 Mount Yotei (Hokkaido), 大鳴門橋 Onaruto Bridge (Hyogo · Tokushima) | « FROM THE SNOW TO THE SEA » |
| 285 → 297 | Kumano Nachi, Izumo, Nikkō ; le tunnel d'Utsunoya, le pont de lianes d'Iya, la route d'Yushun la nuit (un tous les 2 temps) | « EVERY SHRINE, EVERY ROAD » |
| 297 → 317 | Le pont : le héros dégaine et fait tournoyer sa lame lumineuse (heros-sabre), le Sakurajima qui fume, il pique, la cascade de Nachi, la vallée de l'Enfer, la plongée sur la carte ; crédits 原作 et 舞台 | |
| 317 → 329 | Himeji, Kiyomizu, le soleil couchant de Takaya | « JAPAN, WAIT FOR ME! » |
| 329 → fin | Le carton de fin ; « FREE · LINK IN BIO » sur « Let's go! » | |

## Vidéo 4 (temps de la chanson n° 4)

| Temps | Image | Texte |
|---|---|---|
| 93 → 100 | L'héroïne de dos, cheveux longs et chapeau à ruban rose, se retourne en souriant et tend son téléphone, la vraie carte dedans ; la caméra plonge (fille-tourne, ecran.py) ; des pétales | « If my Japan map had an anime opening 4 🌸 » dès l'image 0 |
| 100 → 108 | La carte, le titre | « OPEN THE MAP, LET'S GO! » |
| 108 → 116 | En voiture sous les cerisiers d'Yushun, le château d'Hirosaki dans les cerisiers | |
| 116 → 132 | Deux lieux en personnages : 雪まつり Iiyama Snow Festival (Nagano), 浦富海岸 Uradome Coast (Tottori) | « FROM THE SNOW TO THE SEA » |
| 132 → 148 | Yūtoku Inari, Kotohira, Togakushi, Ōyamazumi ; Tsumago, le pont rouge de Fukuurajima | « EVERY SHRINE, EVERY ROAD » |
| 148 → 164 | Le pont de Tsuru no Maihashi au couchant ; elle dégaine, sa lame rose tournoie, des pétales (fille-sabre) ; figée face à nous sur l'arrêt de la chanson | « JAPAN, WAIT FOR ME! » |
| 164 → fin | Le carton de fin ; « FREE · LINK IN BIO » sur « Let's go! » | |

## L'IA

Trois passages des rushes du propriétaire (`videos/tournage/Oppening animé carte`) redessinés par FLUX 3 Video Edit avec les descriptions des vidéos 1 et 2 (plus : « des murs nus, sans affiches, drapeaux, bannières, cadres ni figurines ») : rush 3 9,1 → 11,5 s (il surgit et tend le téléphone : `heros-pop`, 0,09 $), rush 3 1,4 → 5,6 s (il dégaine et fait tournoyer le sabre : `heros-sabre` et `fille-sabre`, 0,15 $ chacun), rush 1 5,3 → 8,0 s (de dos, elle se retourne et tend le téléphone : `fille-tourne`, 0,10 $). 0,49 $ en tout, plus 0,07 $ de transcriptions. Aucune affiche ni drapeau dans les quatre (vérifié). Le rush 1 de 9,6 à 11,8 s (un gros plan de son visage) n'est pas utilisé : le visage entre coupé par le bord, et le drapeau de One Piece est juste derrière. Il faudra activer l'étiquette « contenu généré par IA » de TikTok.
