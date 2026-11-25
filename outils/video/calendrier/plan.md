# Les vidéos du calendrier de l'Avent (brag-plan, skill brag-slim)

Demande du propriétaire (2026-11-23), avec ses rushs dans `videos/tournage/Promo calendrier avent` : « des rushs que j'ai fait avec
les différents éléments qu'on peut télécharger depuis le calendrier de l'Avent […] le calendrier, les papiers d'origami, et je fais
aussi un origami […] La lettre pour souhaiter la bonne année. Et du coup, tu peux te servir de ça pour faire des vidéos pour le
calendrier de l'Avent et toutes les fonctionnalités. Et tu feras aussi une vidéo tutoriel comment faire une grue avec justement le
papier qu'on fournit […] on pourra mettre le lien du tutoriel directement dans la case. »

## Les rushs (DJI Osmo Pocket 4, 1728 × 3072 HEVC 10 bits, D-Log M, 29,97 i/s)

| Rush | Ce qu'il montre | Ce qu'on en prend |
|---|---|---|
| 0001 (13 min 46) | le papier de la case 9 imprimé, découpé, puis la grue pliée, caméra fixe de côté, pièce sombre | le tuto, étape par étape ; la promo (le papier, six instants du pliage, la grue) |
| 0002 (12 s) | la grue finie dans la main | le début du tuto |
| 0003 (17 s) | la grue au-dessus de la page des 12 étapes | l'accroche de la promo, la fin du tuto |
| 0007 (62 s) | le calendrier 2027 montré, accroché au mur, le pouce levé | la promo (le calendrier ; la fin : le pouce levé). **La boîte LEGO One Piece en bas à gauche n'est jamais dans le cadre.** |
| 0008 (12 s) | une date entourée au crayon rouge | la promo |
| 0009 (99 s) | la carte de vœux écrite, mise dans l'enveloppe, glissée sous une porte | la promo. **Filmé en miroir** (la carte s'y lit à l'envers) : retourné |
| 0010 (8 s) | l'enveloppe postée dans une boîte aux lettres | **pas utilisé : le nom de famille du propriétaire est écrit sur la boîte** |

## Vidéo 1 : « les cadeaux sont vrais » (`Cadeaux`, 21,4 s)

- **L'angle** : un calendrier de l'Avent sur une carte, et ce qu'il donne se tient dans la main. Chaque case ouverte à l'écran
  devient, à la coupe, le vrai cadeau imprimé.
- **Le style** : celui de la vidéo « le créateur » du jeu (2026-11-10) : la première personne dans les bulles natives de TikTok,
  un enregistrement d'écran du vrai calendrier (le doigt gris), de vrais plans, coupes franches.
- **Le son** : le second refrain de « Yuki akari », la musique de Noël de la carte (composée par `outils/composer_noel.mjs`, sans
  droits) : temps 112 à 144 (70 → 90 s), qui finit sur l'accord de ré ; 96 à la noire, le temps n à l'image 37,5 n. Les appuis
  (`cr-appui.wav`, en ré) et une petite réponse quand une case s'ouvre.
- **La prise** : `cv-cases` (rushes.py, plans.js) : la carte le 15 décembre 2026 (l'horloge de la page avancée), les cases jusqu'au
  14 déjà ouvertes sauf la 3 et la 9 ; le bouton du cadeau, puis la 9, la 3 et la 15, chaque fois un doigt sur « Download ».

| Temps | Plan | Bulle |
|---|---|---|
| 0 → 4 | la grue au-dessus de la page des étapes (0003) | « I put an Advent calendar / on my Japan map 🎄 » |
| 4 → 8,5 | l'écran : la case 9 s'ouvre, le papier origami, « Download » | « day 9: origami paper / to fold a crane ✨ » |
| 8,5 → 12,5 | le vrai papier, six coupes du pliage (un tiers de temps chacune), la grue finie | (la même) |
| 12,5 → 16,75 | l'écran : la case 3, le calendrier 2027 | « day 3: a 2027 calendar / of Japan to print 📅 » |
| 16,75 → 19,25 | le vrai calendrier montré, une date entourée | (la même) |
| 19,25 → 23,5 | l'écran : la case 15, la carte de vœux | « day 15: a Japanese / New Year card 🎍 » |
| 23,5 → 28 | la vraie carte, écrite (« Happy New Year!! »), glissée sous une porte | (la même), puis « 24 free gifts / from December 1st 🎁 » |
| 28 → 29,5 | l'écran : les 24 cases | (la même) |
| 29,5 → fin | le propriétaire, pouce levé (ralenti, images calculées) | « on my Japan map 🗺️ / link in bio » |

## Vidéo 2 : le tutoriel de la grue (`Grue`, 2 min 19 s)

- Sur « Yuki akari » sans deux de ses parties (`yuki-akari-court.wav` : sans A1, temps 16 → 48, ni le second refrain B2,
  112 → 144), jusqu'à son accord final. La première version (2 min 59, le morceau entier) était trop longue : le 2026-11-25,
  le propriétaire voulait « entre 2 minutes et 2 minutes 30 », et sans le moment de l'étape 9 où il cherche comment faire.
- En haut (1080 × 1010) : les mains du propriétaire, accélérées pour remplir l'étape (la vitesse est écrite : « ⏩ ×4 ») ; le
  numéro de l'étape dans un disque rouge. En bas, sur le papier de la carte : le dessin de l'étape, le même que dans le PDF
  (`diagrammes.py` le photographie dans `origami/origami.html`, la page qui a fait le PDF), et sa consigne (celle du PDF ; 9a–9f
  raccourcies). Sous la légende de TikTok (vu sur YouTube) : les signes des plis et d'où vient le papier.
- Chaque étape commence sur un temps (de la musique courte) : le titre (0 → 8), le papier à imprimer et découper (8 → 18), les
  étapes 1 à 8 (18 → 112, 12 temps chacune, 10 pour la 7), 9a à 9f (112 → 162), 10 à 12 (162 → 192), puis la fin en plein écran pendant le ralenti final de la musique : « Your crane is
  ready! », « In Japan, people fold 1,000 cranes to make a wish » (senbazuru), « Free paper + all the steps: day 9 of my Japan
  map's Advent calendar · link in bio ».

## Les miniatures

À part : la grue, le calendrier et la carte de vœux sous « I put an Advent calendar on my Japan map 🎄 / …and the gifts are real 🎁 » ;
pour le tuto, la grue dans la main sous le titre. La première image de chaque vidéo est déjà posée (son texte compris).
