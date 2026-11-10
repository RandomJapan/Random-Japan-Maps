# La troisième vidéo du jeu : « le créateur » (brag-plan, skill brag-slim)

Demande du propriétaire (2026-11-10), après les deux vidéos du 2026-11-09 : « Ok tu peux refaire une nouvelle vidéo présentation dans un autre style ».

## L'autre style

Les deux premières sont du motion design : de gros mots blancs cernés d'encre, une voix (« Sarah »), un compte à rebours, une trame.
Celle-ci est l'inverse, le format le plus « humain » de TikTok : **l'histoire du créateur, à la première personne**, racontée par les
textes natifs de TikTok (les petites bulles blanches à texte noir de l'appli), sur un **enregistrement d'écran** du vrai jeu sur
téléphone (le rond gris des appuis, des coupes franches), et une **musique lo-fi** composée. Aucune voix, aucun effet 3D.

- **L'angle** : « J'ai regroupé 160 lieux du Japon sur ma carte… alors j'en ai fait un jeu. » (Le propriétaire, le même jour :
  « évite la formulation I filmed il vaut mieux que tu dises j'ai regroupé tant de lieux sur ma carte ».) C'est vrai (160 lieux sur la carte, et la photo de
  chaque lieu dans le jeu est une image de sa vidéo), et le jeu le dit lui-même (« 5 places from my videos »).
- **Pour qui** : les gens qui rêvent du Japon ou y sont allés.
- **Ce qui le distingue** : les lieux sont ceux des vidéos du compte ; la réponse tombe sur une vraie carte en relief.
- **L'accroche** : dès la première image, un défilé de plus en plus rapide des vrais plans du propriétaire (22 lieux en 2,7 s, des
  croches aux triples croches), le texte déjà posé (« I gathered 160 places in Japan on my map »). Il s'arrête net sur le Fuji Shibazakura :
  c'est la photo de la première manche, qu'on retrouve dans le jeu.
- **La légende à copier** : `partage-createur.txt`.

## Le son

90 battements par minute (un temps = 40 images ; mesure de 4 temps). Lo-fi hip-hop composé (`musique.py`, aucun droit) : un piano
électrique feutré sur la « progression royale » de la J-pop (IV – V – iii – vi en ré majeur : Sol7M, La7, Fa♯m7, Si m7), une basse
ronde, une batterie douce et balancée, un koto en pentatonique, le craquement d'un vinyle. L'accroche : les accords étouffés, des
charlestons qui suivent les coupes et accélèrent avec elles ; la batterie tombe au temps 4 (« so I turned them into a game »).
Les bruitages (appuis, épingle, réponse, températures) sont dans la tonalité.

## Le découpage : 22,7 s (34 temps)

| Temps | Plan | Texte (bulle native) |
|---|---|---|
| 0 → 4 | Le défilé : 2 plans d'une croche, 4 d'une double, 16 d'une triple | « I gathered 160 places in Japan on my map 🗺️ » |
| 4 → 5 | Le Fuji Shibazakura, tenu ; la batterie tombe | « so I turned them into a game 🎮 » |
| 5 → 8 | L'enregistrement d'écran : l'accueil, appui sur « Menu », la tuile « Guess the place » (NEW), « Play solo » | (le même) |
| 8 → 11 | La première manche : la photo du Fuji dans la carte du jeu, le chrono qui tourne | « guess where the photo was taken 📍 » |
| 11 → 15 | Appui près du Fuji, l'épingle, « Confirm », la carte vole jusqu'au lieu, « Bullseye! » et les points | « the closer you are, the more points » |
| 15 → 18 | Coupe : le score des 5 manches | « 5 places · 30 seconds each ⏱️ » |
| 18 → 22 | Coupe : le défi du jour, sa photo floue (les gorges de Takachiho) ; essai 1 à Tokyo, froid | « + a new mystery place every day » |
| 22 → 26 | Les essais suivants (tiède, brûlant), la photo plus nette à chaque fois ; trouvé, zoom sur la photo nette | « every miss makes the photo sharper » |
| 26 → 29 | Le salon à plusieurs (le vrai salon du serveur local, des prénoms inventés) | « or challenge your friends 👀 » |
| 29 → 34 | Un vrai plan du propriétaire (le torii de Shirahige au coucher du soleil) | « can you get 5,000? 👀 », puis « it's free · link in bio 🗾 » |

Chaque texte reste au moins 0,3 s par mot. Les bulles ne passent ni sous les onglets de TikTok en haut (170 px), ni sous sa légende
en bas (à partir de 1450 px), ni sous ses boutons à droite.

## Les prises

Le vrai site, sur une page de téléphone 432 × 768 à ×2,5, à 60 images/s (moteur des vidéos d'Halloween, `rushes.py`, `plans.js`) :
`cr-menu` (l'accueil → la manche 1 qui commence), `cr-manche` (la manche 1 jouée), `cr-score` (les 5 manches, le score),
`cr-defi` (le défi du jour à Takachiho : 4 essais). Le salon : les captures `ui/salon-*.jpg` du 2026-11-09. Les photos du jeu sont
désormais toutes des images des vidéos du propriétaire (commit edb0de7) : plus rien à remplacer.

## La miniature

À part : le défilé figé sur un plan, avec « I gathered 160 places in Japan on my map… so I turned them into a game 🎮 ».
