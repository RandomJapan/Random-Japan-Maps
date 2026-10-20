# Carte 3D « Random Japan Place » : mode d'emploi

## Ajouter un lieu (à chaque nouveau TikTok)

Tout se passe dans le tableau **Google Sheets « Random Japan Place - Lieux de la carte »** (dans ton Google Drive).

### La méthode rapide : le robot 🤖

1. Sur TikTok, fais **Partager → Copier le lien** de ta nouvelle vidéo.
2. Dans l'onglet **Lieux**, sur la première ligne vide : écris d'abord le nom du lieu dans **Nom (EN)**, comme dans ta légende (par exemple `Koboyama Tumulus | Nagano`), puis colle le lien dans **Lien TikTok**.
   - Depuis le 20 octobre 2026, TikTok ne donne plus toujours la légende de la vidéo au robot. Avant, il suffisait de coller le lien seul : le robot lisait le nom dans ta légende. Ça marche encore parfois, mais avec le nom écrit, c'est sûr.
3. Attends environ une minute. Le robot remplit toute la ligne : noms en 3 langues, catégorie, GPS, descriptions en 3 langues. Il la colore ensuite en **jaune** (« À vérifier »).
4. Relis la ligne jaune. Corrige si besoin, puis efface le « Oui » de **À vérifier** et remets le fond en blanc.

Le lieu apparaît sur la carte dès que le robot a fini, en environ 5 minutes.

**La colonne « Robot »** (tout à droite) dit ce que fait le robot :
| Message | Ça veut dire… |
|---|---|
| ⏳ Le robot travaille… | Il est en train de remplir la ligne. |
| ⏳ Petit souci… | Google ou TikTok n'a pas répondu. Le robot réessaie tout seul 10 minutes plus tard. |
| ❌ TikTok ne donne pas la légende… | Écris le nom du lieu dans **Nom (EN)** (comme dans ta légende), puis efface ce message : le robot recommence dans les 10 minutes. |
| 🤖 Rempli par le robot… | C'est fini. Lis la suite du message : il y note ses doutes (par exemple « position approximative »). |
| ❌ … | Il n'y arrive pas. Lis le message. **Efface-le** pour qu'il réessaie, ou remplis la ligne à la main. |

- **Position pas sûre** : le robot met `Non` dans **Afficher ?**, pour ne pas planter une épingle au mauvais endroit. Vérifie la position sur Google Maps, corrige-la si besoin, puis mets `Oui`.
- **Lieu peu connu** : la description reste simple. Le robot ne sait que ce qu'il trouve sur Wikipédia et Google Maps, alors ajoute les détails toi-même.
- **Écris le nom exact de Google Maps** dans ta légende (par exemple `Ibuki Tree Art Sculpture | Kagawa 📍`). Le robot le cherche tel quel dans Google Maps : c'est comme ça qu'il trouve la position exacte.
- **Vidéo avec plusieurs lieux** (un top 5, « Winter in Japan »…) : le robot l'enlève de **Lieux** et la range dans l'onglet **À trier**.
- **Vidéo déjà sur la carte** : le robot te le dit dans la colonne Robot. Tu peux supprimer la ligne.
- **Gratuit** : le robot utilise l'IA Gemini de Google en version gratuite. Elle a une limite par jour, bien au-delà de quelques vidéos. Si elle est atteinte, le robot le dit et réessaie plus tard.
- **Où est le robot ?** Dans le projet **« Robot carte »** sur [script.google.com](https://script.google.com). La clé de l'IA y est rangée dans ⚙️ **Paramètres du projet → Propriétés du script → `CLE_GEMINI`**. Ne la donne à personne.
- Le robot passe aussi tout seul **toutes les 10 minutes**, au cas où il aurait raté un lien.

### La vignette du lieu (l'image en haut de la fiche)

Depuis le 20 octobre 2026, TikTok ne donne plus l'image de couverture de tes vidéos. Les anciens lieux gardent la leur : elle avait été copiée dans la carte avant. Pour les nouveaux, la vignette est fabriquée **toute seule** à partir de ton fichier vidéo, comme le fait TikTok : une belle image de ta vidéo, avec ton cartouche du titre, recadrée pareil.

- **Ce qu'il faut :** ta vidéo finale dans `D:\Montage\Vidéo lieux random japon`, avec **le même nom que dans Nom (EN)** (par exemple `Lake Kagami.mp4`). C'est déjà ce que tu fais.
- **Quand :** ton PC vérifie toutes les 30 minutes, tant qu'il est allumé (et à chaque démarrage). Dès qu'un lieu du tableau n'a pas de vignette et que sa vidéo est là, il la fabrique et la met en ligne. Une notification Windows te le dit (« Carte du Japon : vignette ajoutée »).
- **Si le nom ne correspond pas :** une notification te prévient (« vignette en attente »). Renomme la vidéo comme dans Nom (EN), ou écris le nom du fichier dans `Vignettes.txt` (voir juste en dessous).
- **Changer l'image choisie :** ouvre `Vignettes.txt` dans le même dossier, ajoute une ligne avec le nom du lieu et la seconde de la vidéo que tu veux, par exemple `Lake Kagami = 12`, et enregistre. La vignette change dans la demi-heure. Tu peux aussi simplement me le dire.
- L'ordinateur choisit une belle image (nette, colorée), pas forcément celle que tu aurais prise. Par exemple, pour Ena Gorge tu avais choisi le pont rouge, lui aurait pu prendre les fleurs.
- Si un jour TikTok redonne les couvertures, le robot de nuit remettra tout seul celle que tu as choisie dans l'appli TikTok (sauf si tu en as choisi une dans `Vignettes.txt`).
- **Arrêter :** dans le Planificateur de tâches de Windows, la tâche s'appelle « Vignettes carte Japon ». Tu peux la désactiver ou me demander de l'enlever.

### La méthode à la main

1. Onglet **Lieux** : descends jusqu'à la première ligne vide.
2. **Nom (EN)** : le nom du lieu en anglais. Le français et le japonais se remplissent tout seuls.
3. **Catégorie** : choisis-la dans le menu déroulant.
4. **Coordonnées GPS** : dans Google Maps, fais un clic droit sur le lieu, puis clique sur les chiffres qui apparaissent en haut du menu (par exemple `34.4197, 131.0626`). Ils sont copiés : colle-les dans la case.
5. **Lien TikTok** : colle le lien de ta vidéo.
6. **Description (EN)** : 2 ou 3 phrases en anglais. Les traductions se font toutes seules.
7. C'est fini ! Le lieu apparaît sur la carte **en environ 5 minutes**. Il n'y a rien d'autre à faire.

> **Photo** : laisse la case vide, la carte prendra la vignette de ta vidéo (voir « La vignette du lieu » plus haut).
> **Traductions** : tu peux écrire par-dessus une traduction automatique si elle ne te plaît pas.

## Autres réglages dans le tableau

| Je veux… | Je fais… |
|---|---|
| Cacher un lieu sans l'effacer | Colonne **Afficher ?** : mets `Non` |
| Créer une catégorie | Onglet **Catégories** : ajoute une ligne (nom, icône, couleur, noms EN/FR/JA, ordre) |
| Changer une icône | Onglet **Catégories**, colonne **Icône** : un nom de l'onglet **Icônes**, ou un emoji 🍜 |
| Voir toutes les icônes | Ouvre la page `…/icones.html` de ton site |
| Voir tous les modèles 3D | Ouvre la page `…/modeles.html` de ton site |
| Relire ce que Claude a ajouté | Les lignes jaunes ont « À vérifier = Oui ». Corrige si besoin, puis efface le « Oui » |
| Dire quand aller voir un lieu | Colonne **Saisons** (voir « Quand partir ? » plus bas) |

⚠️ Ne change pas les titres des colonnes (ligne 1), ni le nom des onglets **Lieux** et **Catégories**.

## Les modèles 3D

Quand on zoome sur la carte, chaque lieu montre un petit modèle 3D posé sur le relief, avec son repère juste au-dessus :
- un torii pour les sanctuaires, un temple, un château, une montagne, une cascade, etc. ;
- peint comme une aquarelle et entouré d'un trait d'encre, comme les dessins des légendes ;
- sans socle : il est posé directement sur le relief, sur son petit bout de terrain (herbe, sable, eau…).

Un appui sur le modèle ouvre la fiche du lieu, comme un appui sur le repère.

**Le modèle dépend de l'icône de la catégorie**, pas du lieu lui-même : tous les temples ont le même petit temple.
- Pour changer le modèle d'une catégorie, change son icône dans l'onglet **Catégories**.
- Une catégorie avec un emoji montre une stèle de pierre.
- La page `…/modeles.html` de ton site montre tous les modèles.

## La mer vivante

Quand on voit tout le Japon, la mer bouge un peu, comme une vieille carte qui prendrait vie :
- **la houle** : les lignes d'eau autour des îles avancent doucement vers les plages ;
- **des bateaux de l'époque Edo** (des kitamae-bune, petits modèles 3D avec leur grande voile à bandes). De temps en temps, un bateau apparaît au large, file vers un port de l'époque (Edo, Osaka, Nagasaki, Hakodate…) ou en repart, puis s'efface avant la côte. Il n'y en a jamais plus de 2 à la fois ;
- **une baleine** qui sort de l'eau et souffle, toutes les 30 à 55 secondes environ, à des endroits connus pour les baleines (Kōchi, Muroto, Okinawa, Ogasawara…) ;
- **un serpent de mer**, plus rare (toutes les 1 min 30 à 2 min environ), comme sur les cartes anciennes ;
- **un typhon**, une minute après l'arrivée puis toutes les 15 minutes. Il naît au large, au sud, monte vers le nord en tournant, avec la pluie, des éclairs et le vent, puis se défait en mer. Si le visiteur regarde un lieu de près à ce moment-là, le typhon attend qu'il dézoome.

Tout disparaît quand on zoome sur un lieu. Si le téléphone est réglé pour réduire les animations, la mer reste immobile.

## Halloween (du 20 au 31 octobre)

Pendant l'événement, la carte se déguise :
- un bouton **Halloween** (une citrouille) ouvre le panneau « Halloween au Japon » : comment se fête Halloween au Japon, le défilé des cent démons (avec un bouton pour le faire passer tout de suite) et la chasse aux yōkai ;
- les épingles portent un **chapeau de sorcière** ;
- des **chauves-souris** volent à la place des grues ;
- un **chat noir** est assis sur le cartouche « Japan 日本 Japon », et une **toile d'araignée** est tendue dans le coin en haut à droite, avec sa jorō-gumo (l'araignée jaune et noire des jardins japonais) qui descend au bout de son fil et remonte ;
- la nuit, quand on zoome, des **hitodama** (feux follets japonais, bleu pâle) flottent autour des temples, à la place des feuilles qui tombent ;
- la nuit, de près, le **défilé des cent démons** (Hyakki Yagyō) traverse parfois la carte : lanterne et ombrelle hantées, renard, tanuki, kappa, oni, tengu, femme au long cou… On les touche pour lire leur histoire ;
- la **chasse aux yōkai** : 7 yōkai sont cachés dans des lieux hantés (Osorezan, Yotsuya, Kyoto, Himeji, Sakaiminato, Ōboke, Kimotsuki). On zoome sur une région pour les trouver. Pour ne pas les confondre avec les légendes de toute l'année, ils ont une lueur orange (violette la nuit) et une citrouille allumée à leurs pieds, et leur bulle commence par « Spécial Halloween ». Le panneau compte ceux qu'on a trouvés, et quand on a les 7, une image « Chasse terminée ! » est à partager.

**Visible par tous les visiteurs depuis le 20 octobre au soir** (le réglage `halloween` de `config.js` : `public: true` ; avec `false`, seulement en mode développeur). Le **1er novembre à minuit**, tout disparaît tout seul et la carte redevient normale (grues, feuilles d'automne).

Pour voir le défilé ou les feux follets de jour, passe la carte en nuit avec le bouton soleil/lune à côté de l'heure.

## Les grues

Quand on zoome sur la carte, **trois grues du Japon** (blanches, à tête rouge) passent de temps en temps au-dessus d'un coin de la carte, dans une direction au hasard. Elles volent à hauteur fixe, un peu au-dessus des sommets ; leur ombre, elle, suit le relief en dessous. Si on déplace, tourne ou zoome la carte pendant leur vol, elles suivent la carte. Le premier vol arrive quelques secondes après avoir zoomé, puis un autre toutes les 25 à 60 secondes environ. Il n'y en a pas pendant un plongeon ni pendant le jeu.

**Tu n'as rien à faire pour ça.** C'est dans le fichier `site/mer.js`. Le bateau est aussi dans la page `…/modeles.html`.

## Les légendes cachées

Quand on zoome sur une région, de petits dessins de légendes japonaises apparaissent là où elles se passent : le renard à neuf queues à Nasu, le kappa de Tōno, le tengu du mont Kurama, le serpent à huit têtes d'Izumo… Il y en a 22, cachées dans tout le Japon, comme des œufs de Pâques à chercher :
- **yokai et créatures** : renard à neuf queues, kappa, tengu, namahage, femme des neiges, korpokkur, kijimunā… ;
- **héros et guerriers** : Momotarō, Kintarō, l'ogre Shuten-dōji, les crabes samouraïs de Dan-no-ura, la guerre des tanuki… ;
- **dieux et mythes** : le serpent à huit têtes, la grotte de la déesse du soleil, le géant du lac Biwa, le poisson-chat des séismes, la princesse Kaguya ;
- **légendes de la mer** : Urashima Tarō, le lapin blanc d'Inaba, Amabie, le vent divin contre les Mongols, la sirène d'Obama.

Pour les visiteurs :
- un appui sur un dessin ouvre une bulle qui raconte la légende (en anglais, en français ou en japonais) ;
- dès qu'on en trouve une, un bouton **Légendes** apparaît sous « Catégories », avec le compteur (par exemple 3/22). Il ouvre la liste : les légendes trouvées (un appui y emmène) et, pour les autres, seulement leur région, comme indice ;
- quand on les a toutes trouvées, un « Bravo ! » s'affiche avec un sceau rouge, et **Partage ta victoire** :
  - **X** et **Facebook** ouvrent une publication avec le lien de la carte. L'aperçu montre l'image « Bravo » (le sceau, les 22 dessins, l'adresse) ;
  - **Instagram** et **TikTok** : sur téléphone, le partage du téléphone s'ouvre avec l'image verticale, et on choisit l'appli. Sur ordinateur, l'image est enregistrée et le site du réseau s'ouvre pour la publier (ces deux réseaux n'acceptent pas de lien de partage depuis un site) ;
  - **Enregistrer l'image** garde l'image verticale ;
  - ensuite, « Partager ma victoire » en haut de la liste des légendes rouvre ce « Bravo ! » ;
- le téléphone (ou l'ordinateur) se souvient des légendes déjà trouvées.

**Tu n'as rien à faire pour ça.** Les textes sont dans `site/legendes.js` et les dessins dans `site/legendes-dessins.js`. Pour ajouter une légende ou changer un texte, demande à Claude.

## Les régions et les préfectures

Quand on zoome, la carte montre le découpage du Japon, comme un vieil atlas colorié à la main :
- de loin, les **frontières entre les 8 grandes régions** : un trait de tirets et de points, bordé de chaque côté d'un liseré d'aquarelle à la couleur de la région ;
- en zoomant un peu, les **noms des régions** apparaissent (TŌHOKU, KANTŌ, CHŪBU…), puis les **frontières des 47 préfectures** en petits tirets ;
- en zoomant encore, les noms des régions laissent la place aux **noms des préfectures**.

**Tu n'as rien à faire pour ça.** Les frontières viennent d'OpenStreetMap (le programme `outils/fabriquer_frontieres.py` les prépare) et la place des noms est dans `site/noms-regions.js`. Pour déplacer un nom, demande à Claude.

## Les nouveaux lieux

Les lieux de tes vidéos des 7 derniers jours portent une étiquette **« Nouveau »** sur la carte. De loin, ils sont entourés d'un petit anneau qui bat doucement. Ils sont aussi listés en haut du menu « Catégories », du plus récent au plus ancien.
- **Tu n'as rien à faire :** la date est cachée dans le lien de chaque vidéo TikTok.
- Pour changer la durée (par exemple 14 jours), change `joursNouveau` dans `site/config.js`.

## La musique

Un bouton **♫** juste sous le choix de la langue ouvre un petit lecteur de musique japonaise. **Le son est coupé à l'arrivée** : rien ne joue (et rien ne se télécharge) tant que le visiteur n'appuie pas sur lecture.
- **Style :** Traditionnelle (koto, shamisen, shakuhachi, taiko, musique de fête), Pop japonaise (des chansons chantées en japonais) ou Café (guitare et piano acoustiques).
- **Ambiance :** Calme, Enjouée ou Énergique (le Café n'a pas d'ambiance énergique : elle est grisée).
- Lecture/pause, morceau suivant, volume (le haut-parleur coupe le son). Choisir un style ou une ambiance lance la musique.
- Quand une vidéo TikTok joue avec le son (fiche d'un lieu, visite guidée avec le son), la musique se tait puis reprend.
- Le site retient le style, l'ambiance et le volume de chaque visiteur.

**D'où vient la musique ?** De deux compositeurs japonais qui offrent leur musique sous licence libre **CC BY 4.0** (on peut l'utiliser, même sur un site commercial, à condition de les nommer) : **魔王魂** (maou.audio) et **PeriTune** (peritune.com). Le lecteur affiche toujours le titre, le compositeur et la licence : c'est obligatoire, ne l'enlève pas. Les musiques trouvées sur YouTube, même faites par une IA, ne sont pas libres de droits : il ne faut pas les mettre sur le site.

**Changer les morceaux :** demande-moi, ou modifie la liste `CHOIX` dans `outils/preparer_musique.py`, puis lance `python outils/preparer_musique.py`. Si un jour tu crées tes propres chansons (par exemple avec une IA de musique, sur un abonnement payant qui donne le droit de les utiliser), envoie-moi les fichiers : je les ajouterai.

## Les favoris

Les visiteurs peuvent toucher le **cœur** sur la fiche d'un lieu pour le mettre en favori.
- Dès le premier, un bouton **❤ Favoris** apparaît sous « Catégories ».
- Il ouvre la liste, rangée dans l'ordre d'un voyage. On peut **inverser le sens** (partir du nord au lieu du sud).
- **Itinéraire sur la carte** (à partir de 2 favoris) : on choisit voiture, vélo ou à pied, puis **« Tracer l'itinéraire »**.
  - Un trait rouge suit les routes à prendre, et le temps de chaque trajet est écrit sur la carte. Les bateaux sont en pointillés.
  - Les épingles des étapes portent leur numéro, et les autres lieux pâlissent.
  - La liste donne le temps total et la distance, puis, entre deux lieux, le temps, les kilomètres et les grandes routes (par exemple « E2 », l'autoroute du Sanyō), et le temps de bateau s'il y en a.
  - Les temps sont des estimations, sans pauses ni bouchons. Les routes viennent d'OpenStreetMap, par un service gratuit (OSRM).
- Le bouton **« Itinéraire dans Google Maps »** ouvre tout le trajet dans Google Maps, pour s'y guider en voiture. Au-delà de 10 lieux (5 sur téléphone), Google Maps n'accepte pas tout d'un coup : le voyage est alors coupé en plusieurs itinéraires.
- Les favoris restent sur l'appareil du visiteur.

### Partager son voyage

Quand l'itinéraire est sur la carte, le bouton rouge **« Partager mon voyage »** (dans les favoris, ou **Partager** à côté du temps total) ouvre une petite fenêtre :
- deux images verticales au choix, prêtes pour TikTok ou Instagram : **la carte en 3D** (la vraie carte avec la route rouge) ou **le carnet de voyage** (une petite carte dessinée, puis chaque étape avec sa photo). Ton adresse est en bas de chaque image ;
- **Envoyer le lien** (ou **Copier le lien** sur ordinateur) : l'ami qui l'ouvre voit le même voyage et la même route, avec un bandeau pour **le garder dans ses favoris** ou lancer **la visite guidée**.

L'image est toujours prise de jour, même s'il fait nuit au Japon.

## Quand partir ? (les saisons)

Le bouton **« Quand partir ? »** (un petit calendrier, à côté de Visite) ouvre les 12 mois. On choisit un mois : la liste montre les lieux à leur plus beau ce mois-là (cerisiers, couleurs d'automne…). **« Voir les lieux sur la carte »** efface presque les autres lieux (ceux qui sont beaux toute l'année restent à moitié visibles) ; le **×** à côté du mois remet tout. La fiche de chaque lieu montre aussi sa **meilleure période**, mois par mois.

Tout vient de la colonne **Saisons** du tableau, que tu peux corriger :
- écris une saison suivie des mois (de 1 à 12), et sépare-les par `;` : par exemple `cerisiers 4; automne 11-12`, ou `hiver 12-2` (de décembre à février) ;
- les mots : `cerisiers`, `fleurs` (glycines, prunier, azalées…), `verdure`, `été`, `automne` (couleurs d'automne), `hiver` (neige, glace), `fête` (un festival) ;
- `toute l'année` pour un lieu sans saison particulière ; une case vide n'affiche rien.

Le robot remplit cette colonne pour chaque nouveau lieu. Les lieux déjà là ont été remplis par Claude le 12 octobre 2026.

## Le jour, la nuit et les saisons sur la carte

La carte suit le moment réel au Japon, toute seule :
- **le jour**, puis **le coucher du soleil** (relief doré), puis **la nuit** (mer et relief bleu nuit, les lieux s'allument comme des lanternes ; de près, une lumière chaude entoure chaque lieu et ses lanternes s'allument ; les bateaux allument aussi leurs lanternes). Au-dessus de la boussole, une petite étiquette donne **l'heure au Japon**, avec un **interrupteur jour/nuit** : un appui montre l'autre moment, un second appui revient à l'heure du Japon ;
- **la saison** : le relief verdit au printemps et en été, roussit en automne, la neige descend sur les montagnes l'hiver (le Fuji garde sa neige jusqu'en juin) ;
- **les détails de saison** peints sur la carte, en touches d'aquarelle aux bords fondus : les cerisiers en fleurs aux lieux célèbres (le « front des cerisiers » monte de Kyūshū fin mars à Hokkaidō en mai), les couleurs d'automne des vallées et des montagnes, les champs de fleurs (lavande, tournesols, glycines, némophiles…), et l'hiver la neige au sol dans le nord, les lacs gelés et la banquise d'Okhotsk. Les lieux du tableau à leur plus beau ce mois-ci (colonne Saisons) en ont aussi. De près, le sol est jonché de vraies feuilles d'érable et de ginkgo, ou de pétales de cerisier (déjà là quand un plongeon arrive) ;
- **les modèles 3D** suivent la saison de leur lieu : neige sur les toits l'hiver, érables rouges en automne, cerisiers roses au printemps, arbres nus l'hiver ;
- **de près seulement**, des pétales de cerisier, des lucioles et des feux d'artifice (les nuits d'été : un vrai spectacle de hanabi, avec des pivoines, des chrysanthèmes, des saules dorés, des anneaux, des palmiers…), des feuilles d'érable et de ginkgo ou des flocons tombent ; ils s'effacent pendant qu'on bouge la carte.

**En mode développeur**, un petit bouton rouge à côté de l'heure ouvre un réglage : des raccourcis (🌸 printemps, 🌿, 🌻 été, 🍁 automne, ❄️ hiver, 🧊 banquise), la date et l'heure au Japon, et « Revenir au vrai moment ». Pratique pour voir chaque saison ou filmer.

Pour filmer de jour alors qu'il fait nuit au Japon, ajoute `?heure=12:00` à l'adresse (par exemple `map.randomjapanplace.com/?heure=12:00`). Tu peux aussi essayer un autre mois : `?heure=20:00&mois=8` (une nuit d'été, avec les feux d'artifice). `?ambiance=non` remet la carte de toujours.

## La visite guidée (pour filmer la carte)

Le bouton **Visite** (la petite caméra) fait voler la caméra toute seule d'un lieu à l'autre, comme un film : d'abord une vue d'ensemble, puis chaque lieu de près avec son nom en bas de l'écran.
- **Choisir les lieux :** une région ou une préfecture, un type de lieu (par exemple « tous les châteaux » ou « tout le Kyūshū »), ou seulement tes favoris.
- **Temps sur chaque lieu :** court (4 s), normal (7 s) ou long (11 s).
- **La vidéo de chaque lieu** (cochée au départ) : en arrivant sur un lieu, ta vidéo TikTok de ce lieu passe dans un cadre (à droite sur ordinateur, en haut sur téléphone), pendant le temps choisi. Puis on coupe et la caméra vole au lieu suivant. La vidéo du lieu suivant se prépare pendant ce temps, donc elle démarre tout de suite.
- **Le plongeon du début est sauté :** chaque vidéo démarre à 4 secondes, directement sur le lieu. Si une vidéo commence autrement (sans plongeon, ou avec un plongeon plus long), ajoute une colonne **« Début vidéo »** tout à droite de l'onglet « Lieux » et écris sur sa ligne la seconde de départ (par exemple `0` ou `6`). Les cases vides gardent 4 secondes. Pour changer ces 4 secondes partout, change `debutVideo` dans `site/config.js`.
- **Avec le son :** décoché au départ (pratique si tu ajoutes ta musique dans TikTok). Coché, on entend le son de tes vidéos.
- La toute première fois, TikTok peut afficher dans le cadre un bandeau de cookies : réponds une fois, c'est retenu.
- **Mode film** (coché au départ) : tous les boutons disparaissent, il ne reste que la carte et le nom du lieu. Bouge la souris ou touche l'écran pour faire revenir la petite barre (pause, lieu précédent ou suivant, arrêter).
- **Sur ordinateur :** Espace = pause, flèches = lieu précédent ou suivant, Échap = arrêter.
- **Pour une vidéo TikTok :** lance la visite sur ton téléphone et filme l'écran avec l'enregistreur du téléphone. L'image est déjà au bon format vertical. L'écran ne s'éteint pas pendant la visite.
- **L'adresse à l'écran :** en mode film, l'adresse de la carte (avec ton logo) reste écrite en haut de l'écran, sous les onglets de TikTok, pour que chaque extrait filmé fasse la pub de la carte. Pendant une visite avec vidéos sur téléphone, elle passe juste sous le cadre de la vidéo. Pour changer le texte, modifie `adresse` dans `site/config.js`.

### Le plongeon (pour remplacer le hook Google Earth)

Il fait partie du **mode développeur** (voir plus bas) : les visiteurs ne le voient pas.

Il sert pour un **nouveau lieu, pas encore sur la carte** : tu filmes le début de ta vidéo avant de l'ajouter au tableau. Passe en mode développeur, ouvre le bouton **Visite** (la petite caméra), puis l'onglet **Plongeon** :
- **Position :** colle les coordonnées GPS du lieu. Dans Google Maps, fais un appui long sur le lieu (clic droit sur ordinateur), puis copie les coordonnées qui s'affichent, par exemple `33.8394, 130.8156`. Un lien Google Maps complet marche aussi, mais pas un lien court en `maps.app.goo.gl`.
- **Nom** et **Nom japonais** (facultatifs) : ils s'affichent à l'arrivée, comme pour les autres lieux, avec la préfecture trouvée toute seule.
- **Type de lieu :** il choisit la couleur de l'épingle et le modèle 3D posé sur le lieu (un torii pour un sanctuaire…).
- **Caméra à l'arrivée :** **Près** (le réglage normal), **Très près** (la caméra arrive tout contre le lieu ; le relief devient un peu flou de si près) ou **Plus large** (comme avant, on voit mieux les alentours, pratique pour une île ou une montagne).
- **Orbite à l'arrivée :** à quelle vitesse la caméra tourne autour du lieu une fois arrivée, comme « Accès direct et orbite » dans Google Earth Studio : **Normale** (un tour en 36 secondes), **Lente**, **Rapide** ou **Aucune** (la caméra reste immobile).
- Appuie sur **Plonger** : la carte montre tout le Japon pendant au moins une seconde (le temps de charger d'avance le relief du trajet, pour une descente fluide), puis plonge sur le lieu en 2,5 à 3 secondes, jusqu'à son modèle 3D. La caméra commence à tourner pendant la fin de la descente : elle arrive en tournant déjà, sans pause, puis tourne autour du lieu jusqu'à ce que tu arrêtes (si tu attrapes la carte avec le doigt ou la souris, elle s'arrête de tourner).
- **Pendant le plongeon, seul ce lieu est sur la carte :** les épingles et les modèles 3D des autres lieux (et les légendes cachées) disparaissent, et reviennent quand tu arrêtes. L'épingle du plongeon disparaît aussi à l'arrêt : le vrai lieu arrivera par le tableau, comme d'habitude.
- La carte se souvient des derniers champs remplis, pour refaire une prise plus tard.
- **Affiche à incruster :** sous « Plonger », ce bouton fabrique le carton du nom qui s'affiche à l'arrivée (nom japonais, nom anglais, type · préfecture), en image PNG **à fond transparent**, à poser sur ta vidéo au montage (CapCut…).
  - Elle est toujours **en anglais**, comme tes vidéos. Il faut au moins le nom ; la préfecture vient de la position.
  - Sur iPhone, le menu de partage s'ouvre : choisis **Enregistrer l'image**, elle va dans tes photos. Sur Android, choisis l'appli de montage ou l'enregistrement. Sur ordinateur, l'image se télécharge.
  - Elle est grande (4 fois la taille du bandeau sur un téléphone) : réduis-la dans le montage, elle reste nette.
- **Pour filmer : coche « Enregistrer le plongeon en vidéo (MP4) »** (juste au-dessus de Plonger ; la carte s'en souvient), choisis le **format**, puis appuie sur Plonger.
  - **Format :** **Horizontal 16:9** (1920 × 1080, le choix normal) ou **Vertical 9:16** (1080 × 1920, TikTok plein écran). Le même réglage marche sur téléphone et sur ordinateur.
  - La carte passe **en anglais** (comme tes vidéos) le temps de l'enregistrement, et l'écran montre la vidéo telle qu'elle s'enregistre : **juste le plongeon, sans aucun bouton**, avec l'adresse de la carte en haut et le bandeau du nom à l'arrivée.
  - Elle se fabrique **image par image**, 30 images par seconde : chaque image attend que le relief soit net, donc la vidéo est fluide même si le téléphone rame. C'est parfois un peu plus lent que le vrai plongeon.
  - Une fois la caméra arrivée, le bouton **Arrêter l'enregistrement** apparaît : appuie quand l'orbite te suffit (Échap fait pareil sur ordinateur). Une minute au plus.
  - La vidéo s'affiche : **Enregistrer la vidéo**. Sur iPhone, choisis « Enregistrer la vidéo » dans le menu : elle va dans tes photos, prête pour CapCut. Sur ordinateur, elle se télécharge (plongeon-nom-du-lieu.mp4).
  - Elle reprend l'heure et la saison de la carte : de nuit au Japon, la vidéo est de nuit. Pour une vidéo de jour, règle l'heure avec le petit bouton rouge à côté de l'horloge (mode développeur).
  - Il faut Chrome, Edge ou Safari à jour (pas Firefox). Ça marche aussi pour le **Point à point**.
- **Sans la case cochée**, tu peux toujours filmer avec l'enregistreur d'écran du téléphone, comme avant.
- Les boutons disparaissent tout de suite. Touche l'écran pour faire revenir la barre : **Rejouer** (rouge, pour refaire une prise) et **Arrêter**. Sur ordinateur : Espace = rejouer, Échap = arrêter.
- Sur téléphone, le nom du lieu est placé plus haut que pendant la visite, pour ne pas être caché par la légende de ta vidéo TikTok.

### Point à point

C'est le troisième onglet du panneau Visite (mode développeur aussi), comme « Point à point » dans Google Earth Studio : au lieu de plonger depuis tout le Japon, la caméra **part d'un autre endroit, vu de près**, et vole jusqu'au lieu. Pratique pour enchaîner deux lieux proches dans une vidéo.
- **Départ :** la position (coordonnées GPS ou lien Google Maps) du lieu d'où part la caméra, avec son **nom**, son **nom japonais** (facultatifs) et son **type** : il a sa propre épingle et son modèle 3D, comme l'arrivée.
- **Arrivée :** position, nom, nom japonais et type, comme pour le plongeon. Puis la caméra et l'orbite.
- Appuie sur **Voler** : la carte montre le départ, avec son nom en bas, la caméra déjà tournée vers l'arrivée. Puis le nom du départ s'en va et la caméra vole jusqu'à l'arrivée (en prenant de la hauteur si c'est loin), en 2,5 à 5,5 secondes selon la distance. À l'arrivée, le nom s'affiche et la caméra tourne autour, comme pour le plongeon. Seuls ces deux lieux sont sur la carte.
- **Rejouer** et **Arrêter** marchent comme pour le plongeon.

## Le mode développeur (rien que pour toi)

Tes outils qui ne sont pas pour les visiteurs (pas encore, ou jamais) : le **plongeon**, le **point à point** et l'**affiche à incruster** (onglets Plongeon et Point à point de la visite), et le **jeu** et le **défi du jour**, pas encore sortis.
- **La première fois :** ouvre ton **lien secret** (celui que Claude t'a donné dans la conversation, qui finit par `?dev=…`) dans chaque navigateur où tu veux le mode : sur ton téléphone (Safari ou Chrome, pas le navigateur intégré de TikTok) et sur ton ordinateur. Le navigateur s'en souvient ensuite. Garde ce lien pour toi : il n'est écrit nulle part ailleurs.
- **Ensuite :** un bouton `</>` apparaît en bas à droite, au-dessus de la rose des vents. **Rouge** = carte développeur (tes outils sont là). **Clair** = carte normale, exactement comme la voient les visiteurs. Un clic pour passer de l'une à l'autre ; la carte retient ton choix.
- Ce bouton n'existe que dans tes navigateurs : les visiteurs ne le voient jamais.
- Si tu perds le lien, demande à Claude d'en faire un nouveau.

## La fluidité sur les ordinateurs moins puissants

Un PC portable ordinaire (vers 500 €) dessine avec une petite puce graphique, 20 à 50 fois moins puissante que la carte graphique de ton PC : la carte y saccadait en zoomant. Elle s'adapte maintenant toute seule :
- Elle **mesure sa fluidité** pendant qu'on la bouge. Si l'appareil peine, elle dessine **un peu moins fin** : un niveau « légère », puis « très légère » si ça ne suffit pas (sans ressac, bateaux, grues ni flocons). Elle s'en souvient pour la visite suivante. Le visiteur ne voit rien d'autre qu'une carte plus fluide.
- Sur un ordinateur à puce graphique intégrée, elle part directement en « légère ». À l'œil, c'est presque pareil.
- **Nette à l'arrêt** : « légère » et « très légère » n'allègent que les images du mouvement. Dès que la carte s'arrête (un tiers de seconde), elle se redessine aussi fine qu'en « fine », avec les bords lissés et le relief proche en détail, d'un seul coup (le relief est préparé en cachette, puis montré en entier : plus de carrés qui s'affinent l'un après l'autre). Quand on bouge, c'est fluide ; quand on regarde, c'est net.
- Au repos, vue de loin, la carte ne se redessine plus sans arrêt (avant, la puce graphique travaillait à fond même quand personne ne touchait la carte).
- **Plus de trous quand on lance la carte vite** : avant, un endroit neuf restait un moment couleur mer, le temps que son relief arrive. Maintenant la carte garde toujours chargé un relief grossier autour de la vue : un endroit neuf apparaît tout de suite, un peu flou, puis il se précise. Sur un ordinateur puissant, elle télécharge aussi deux fois plus de morceaux de relief à la fois pendant qu'elle bouge : en zoomant, le relief net arrive bien plus vite.
- **En mode développeur**, un bouton en forme de compteur (au-dessus de `</>`) ouvre « Fluidité » : le nom de la puce graphique, le nombre d'images par seconde quand la carte bouge, et les boutons **Auto / Fine / Légère / Très légère** pour imposer un niveau et comparer. Laisse-le sur **Auto** pour retrouver le choix de la carte.
- Le plongeon filmé et l'image « Partager mon voyage » sont toujours faits en qualité « fine ».

## Le jeu « Devine le lieu » (pas encore public)

Il est prêt mais **caché** : il sortira le mois prochain, avec un TikTok. Pour l'essayer, passe en **mode développeur** : un bouton « Devine le lieu » apparaît à côté des autres. Les visiteurs ne le voient pas.
- Une partie = 5 lieux tirés au hasard, éloignés les uns des autres. Pour chacun : une **photo nette** du lieu et **30 secondes**. Le joueur touche la carte là où il pense que c'est, puis valide. Le chrono devient rouge dans les 10 dernières secondes. À zéro, l'épingle posée compte ; sans épingle, c'est 0 point.
- **Les photos :** celle de la colonne Photo du tableau si elle existe ; sinon une photo libre de droits de **Wikimedia Commons** (la photothèque de Wikipédia), choisie une par une par Claude. La licence s'affiche sur la photo, et le nom du photographe une fois le lieu révélé, comme la licence le demande. Les photos de Google Images, elles, appartiennent à leurs auteurs : on ne peut pas les mettre sur le site sans leur accord.
  - 10 lieux n'ont pas de photo libre qui convienne (par exemple la statue de Luffy ou le village des épouvantails de Nagoro) : ils ne sont pas dans le jeu. **Pour en ajouter un, mets une photo dans la colonne Photo du tableau.**
  - Pour un nouveau lieu, une photo est cherchée toute seule la nuit. Si une photo te semble mauvaise, dis-le à Claude.
- **Le bouton Indice :** le 1er indice montre la **région** (colorée en rouge sur la carte), le 2e la **préfecture**. Chaque indice coûte des points : la manche ne rapporte plus que 75 % des points après un indice, 50 % après deux.
- Le vrai lieu apparaît avec son nom, relié à l'épingle du joueur, avec la distance et les points (1 000 au plus par lieu : 670 à 100 km, 370 à 250 km). À la fin : le score sur 5 000, un titre (de « Touriste curieux » à « Expert du Japon ») et « Partager mon score ».
- **Les records :** l'accueil et la fin du jeu montrent les 5 meilleurs scores, avec leur date, et le nombre de parties. « Nouveau record ! » s'affiche quand on bat son meilleur score. Ils restent dans le navigateur du joueur (chacun a les siens). Un classement commun à tous les joueurs demanderait des comptes ou un serveur : pas fait pour l'instant.
- Pendant la partie, les épingles et les modèles 3D des lieux sont cachés, sinon ce serait trop facile.
- Le jour de la sortie, demande à Claude de rendre le bouton visible pour tout le monde.

## Le défi du jour (pas encore public)

Un **lieu mystère par jour, le même pour tout le monde**, comme le jeu Wordle. Comme le jeu, il est caché : en **mode développeur**, un bouton « Défi » apparaît (avec un point rouge tant que tu n'as pas joué aujourd'hui).
- On voit la photo du lieu, **floue**. On touche la carte là où on pense que c'est, puis on valide : on apprend la **distance**, une **flèche** vers le lieu, et si c'est froid, tiède, chaud ou brûlant. La photo devient plus nette à chaque essai. **6 essais** ; trouvé si on tombe à moins de 20 km.
- À la fin : le lieu, les petits carrés à partager (🟦🟨🟧🟥🎯, sans dévoiler le lieu), **la comparaison avec les autres joueurs du jour** (« Aujourd'hui, 78 % des 9 joueurs l'ont trouvé, en 3,1 essais en moyenne. Tu fais mieux que 38 % des autres joueurs. »), les statistiques (parties, % trouvés, série de jours, record), le temps avant le prochain défi, et un bouton vers la vidéo du lieu.
- La comparaison passe par le petit serveur du jeu à plusieurs, chez Cloudflare (gratuit). Il ne garde que le résultat de chaque joueur (trouvé ou non, en combien d'essais), sans nom, pendant 60 jours.
- Le défi change **à minuit, heure du Japon** (16 h ou 17 h en France). Le défi n° 1 est celui du 13 octobre 2026 : le jour de la sortie, Claude peut faire repartir les numéros à 1.
- Les lieux du défi sont ceux qui ont une photo (comme le jeu). Un lieu tout juste ajouté attend 3 jours avant d'y entrer.
- Le lien partagé (…/?defi) ouvre le défi pour tout le monde, même avant la sortie : c'est toi qui le partages.

## Près de moi

Pour les visiteurs qui sont au Japon : le **bouton rond avec une cible**, au-dessus du bouton de recentrage, en bas à droite. Le téléphone demande d'abord la permission de les localiser.
- **Au Japon :** un point rouge **現在地 « Tu es ici »** (comme sur les plans des parcs japonais), des **cercles de distance** en pointillés, la distance écrite sous les lieux les plus proches, et en haut « 3 lieux à moins de 10 km » (la croix efface tout).
- Dans la fiche d'un lieu, le bouton **« Y aller »** trace alors la route depuis le visiteur sur la carte (à pied, à vélo ou en voiture), avec un bouton **« Ouvrir dans Google Maps »** pour s'y rendre (Google connaît aussi les trains).
- **Hors du Japon :** « Tu es à 9 032 km du Japon », un trait vers chez lui, et le lieu de la carte le plus proche de lui.
- La position reste sur le téléphone et n'est enregistrée nulle part. Seule la route « Y aller » l'envoie au service qui calcule les itinéraires (le même que pour les favoris).

## L'adresse de la carte

La carte est à l'adresse **https://map.randomjapanplace.com/**. C'est ce lien qu'il faut mettre dans ta bio TikTok. L'ancienne adresse (randomjapan.github.io/Random-Japan-Maps) renvoie toute seule vers la nouvelle.

- Le nom de domaine **randomjapanplace.com** a été acheté chez **OVH** le 2 octobre 2026. Il se renouvelle chaque année début octobre (environ 12 à 15 €). Quand OVH t'envoie le mail, **paie-le**, sinon la carte n'a plus d'adresse.
- Dans OVH, la **Zone DNS** contient deux lignes à ne pas effacer :
  - `map`, de type CNAME vers `randomjapan.github.io.` : elle fait marcher la carte ;
  - un TXT `google-site-verification=…` : il prouve à Google que le domaine est à toi.
- randomjapanplace.com, sans « map. », reste libre pour la future boutique.

## Les pages des lieux (pour Google)

Chaque lieu a aussi sa propre page, en anglais, en français et en japonais, pour que Google puisse le trouver. Par exemple :
- https://map.randomjapanplace.com/fr/udo-inari-shrine/
- la liste de tous les lieux, région par région : https://map.randomjapanplace.com/fr/ (remplace `fr` par `en` ou `ja` pour les autres langues).

Chaque page montre la couverture de ta vidéo (on clique pour la lire), la description, une petite carte du Japon avec le lieu, les 3 lieux les plus proches et un gros bouton vers la carte 3D. Sur la carte 3D, la fiche d'un lieu a un lien « La page de ce lieu », et le menu Catégories finit par « Tous les lieux, en liste ».

**Tu n'as rien à faire :** les pages sont refaites à chaque mise en ligne, à partir du tableau. Un nouveau lieu a sa page le lendemain (la nuit, le robot recopie le tableau ; la vignette vient de ta vidéo, voir « La vignette du lieu »).

**Google Search Console :** c'est fait depuis le 2 octobre 2026. Le domaine randomjapanplace.com est validé et le plan du site (`https://map.randomjapanplace.com/sitemap.xml`) est envoyé. Sur search.google.com/search-console, le menu « Pages » montre les pages que Google connaît, et « Performances » les recherches qui mènent à tes pages. Il n'y a rien à refaire : Google relit le plan du site tout seul.

## Le compteur de visites

Sur ordinateur, le nombre de visites de la carte s'affiche en haut, à droite du titre. À l'ouverture, il défile jusqu'au total, puis ajoute la visite en cours. Les visites sur téléphone sont comptées aussi, mais le compteur ne s'affiche que sur ordinateur.

Il fonctionne avec **GoatCounter**, un site de statistiques gratuit qui ne met pas de cookies.
- **Tes statistiques détaillées** (visites par jour, pays, d'où viennent les gens, par exemple TikTok) : connecte-toi sur ton adresse GoatCounter.
- **Le chiffre sur la carte** se met à jour toutes les quelques heures (c'est la règle de GoatCounter). Les chiffres à la minute près sont sur ton tableau de bord.
- Une visite = une personne qui ouvre la carte. Si elle recharge la page juste après, ça ne compte pas deux fois ; si elle revient plus tard, ça compte à nouveau.
- Le code de ton compte est écrit dans `site/config.js` (`goatcounter`). Si on le vide, il n'y a plus ni comptage ni compteur.

## Le dé « Au hasard »

Le bouton **Au hasard** tire un lieu au sort. On peut choisir une région ou une préfecture, un type de lieu, les deux, ou rien du tout.

**Tu n'as rien à remplir pour ça.** La carte trouve toute seule la préfecture de chaque lieu grâce à ses coordonnées GPS. Un nouveau lieu ajouté dans le tableau apparaît donc directement dans le bon choix de région.

## La vidéo de présentation (TikTok)

Une vidéo de 30 secondes, au format TikTok (vertical), présente la carte : la vraie carte filmée, avec des titres dans le style du site, et à la fin l'adresse de la carte et « Link in bio ». Elle est dans le dossier `videos/` :
- `promo-carte.mp4` : avec la musique « Michikusa » de PeriTune. Dans la légende du TikTok, ajoute le crédit : *Music: Michikusa by PeriTune (CC BY 4.0)*.
- `promo-carte-sans-musique.mp4` : sans musique, pour mettre un son TikTok à la place.

**La refaire** (par exemple quand la carte change) : demande-moi, ou lance le site en local puis `python outils/video/tourner.py` (une dizaine de minutes).

### Les vidéos d'Halloween (16:9, 20 secondes au plus)

Trois vidéos horizontales sur ce que la carte a de nouveau pour Halloween, dans `videos/halloween/` :
- `halloween-lieux-hantes.mp4` : les lieux les plus hantés du Japon (Nagoro, le mont Osore, la vallée de l'Enfer, le château de Himeji), avec tes vidéos et la carte de nuit. Un conteur à la voix grave (en anglais) raconte. Musique : *Kengeki · PeriTune (CC BY 4.0)*.
- `halloween-defile.mp4` : le défilé des cent démons qui traverse la carte, chaque yōkai en gros plan avec son nom. Avec le conteur. Musique : *民族09「揺れる提灯」· 魔王魂 (CC BY 4.0)*.
- `halloween-carte.mp4` : la carte de jour, puis la même de nuit déguisée pour Halloween (chauves-souris, chapeaux, araignée, chat, défilé, chasse aux yōkai). Sans conteur, sur la musique : *月と狼 · 魔王魂 (CC BY 4.0)*.

Chacune existe aussi en `-sans-musique.mp4` (le conteur et les bruitages restent), pour mettre un son TikTok à la place. Si tu gardes la musique, mets son crédit dans la légende (il est aussi écrit sur l'image de fin).

La voix du conteur a été faite avec ton compte **Flora** (environ 0,12 $ par phrase). **Les refaire** : demande-moi (le programme est dans `outils/video/halloween/`).

## Changer le logo

1. Remplace les deux images du dossier `outils/logo-source/` par les nouvelles, en gardant les mêmes noms : `logo-carre.jpg` (image carrée) et `logo-large.jpg` (image en largeur).
2. Demande à Claude de lancer `python outils/preparer_logo.py` puis de republier le site.

Le programme fabrique :
- le logo rond de l'en-tête et de l'écran de chargement ;
- l'icône de l'onglet ;
- l'icône pour l'écran d'accueil du téléphone ;
- l'image d'aperçu qui s'affiche quand on partage le lien.

## Comment ça marche (pour les curieux)

- `site/` contient le site : la page (`index.html`), l'apparence (`style.css`), les **réglages** (`config.js`), le programme de la carte (`app.js`), les icônes (`icons.js`), les modèles 3D (`modeles3d.js`, posés sur la carte par `couche3d.js`) la mer vivante (`mer.js`), les légendes cachées (`legendes.js`), les grues (`oiseaux.js`), le lecteur de musique (`musique.js`, les morceaux dans `musique/`) et les noms des régions et des préfectures (`noms-regions.js`) le compteur de visites (`compteur.js`), les favoris (`favoris.js`) et leur itinéraire sur la carte (`itineraire.js`), la visite guidée (`visite.js`) et `reperes.js`, qui ne garde sur la carte que les épingles et les noms proches de l'écran (c'est ce qui rend le zoom fluide sur téléphone).
- La carte lit le tableau Google Sheets à chaque visite. Si Google ne répond pas, elle utilise la copie de secours `site/data/secours-*.csv`. Cette copie est mise à jour automatiquement chaque nuit par GitHub.
- `outils/` contient les petits programmes qui ont servi à tout préparer : import depuis Google My Maps, traductions, photos, masque des pays voisins.
- `outils/robot-tableau.gs` est une copie du programme du robot (celui qui tourne vraiment est dans le projet « Robot carte » sur script.google.com). Le robot lit la légende de la vidéo TikTok et demande à Gemini de quel lieu il s'agit. Il cherche ensuite ce lieu dans Wikipédia et Google Maps, puis Gemini rédige la fiche à partir de ce qu'il a trouvé.
- Le relief vient de **Mapterhorn** (gratuit) et le contour des pays de **Natural Earth** (domaine public). Les lacs, les grandes rivières et les frontières des préfectures viennent d'**OpenStreetMap** (gratuit, il faut juste le citer : c'est fait en bas de la carte) ; les programmes `outils/fabriquer_eaux.py` et `outils/fabriquer_frontieres.py` les préparent. Les modèles 3D sont dessinés avec **three.js** (gratuit), chargé seulement quand on zoome.
