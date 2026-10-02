# Carte 3D « Random Japan Place » : mode d'emploi

## Ajouter un lieu (à chaque nouveau TikTok)

Tout se passe dans le tableau **Google Sheets « Random Japan Place - Lieux de la carte »** (dans ton Google Drive).

### La méthode rapide : le robot 🤖

1. Sur TikTok, fais **Partager → Copier le lien** de ta nouvelle vidéo.
2. Dans l'onglet **Lieux**, colle ce lien dans la case **Nom (EN)** de la première ligne vide.
3. Attends environ une minute. Le robot remplit toute la ligne : noms en 3 langues, catégorie, GPS, descriptions en 3 langues. Il la colore ensuite en **jaune** (« À vérifier »).
4. Relis la ligne jaune. Corrige si besoin, puis efface le « Oui » de **À vérifier** et remets le fond en blanc.

Le lieu apparaît sur la carte dès que le robot a fini, en environ 5 minutes.

**La colonne « Robot »** (tout à droite) dit ce que fait le robot :
| Message | Ça veut dire… |
|---|---|
| ⏳ Le robot travaille… | Il est en train de remplir la ligne. |
| ⏳ Petit souci… | Google ou TikTok n'a pas répondu. Le robot réessaie tout seul 10 minutes plus tard. |
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

### La méthode à la main

1. Onglet **Lieux** : descends jusqu'à la première ligne vide.
2. **Nom (EN)** : le nom du lieu en anglais. Le français et le japonais se remplissent tout seuls.
3. **Catégorie** : choisis-la dans le menu déroulant.
4. **Coordonnées GPS** : dans Google Maps, fais un clic droit sur le lieu, puis clique sur les chiffres qui apparaissent en haut du menu (par exemple `34.4197, 131.0626`). Ils sont copiés : colle-les dans la case.
5. **Lien TikTok** : colle le lien de ta vidéo.
6. **Description (EN)** : 2 ou 3 phrases en anglais. Les traductions se font toutes seules.
7. C'est fini ! Le lieu apparaît sur la carte **en environ 5 minutes**. Il n'y a rien d'autre à faire.

> **Photo** : laisse la case vide, la carte prendra la miniature de ta vidéo TikTok.
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

⚠️ Ne change pas les titres des colonnes (ligne 1), ni le nom des onglets **Lieux** et **Catégories**.

## Les modèles 3D

Quand on zoome sur la carte, chaque lieu montre un petit modèle 3D posé sur le relief, avec son repère juste au-dessus :
- un torii pour les sanctuaires, un temple, un château, une montagne, une cascade, etc. ;
- sur un socle rond de la couleur de sa catégorie.

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
- **un serpent de mer**, plus rare (toutes les 1 min 30 à 2 min environ), comme sur les cartes anciennes.

Tout disparaît quand on zoome sur un lieu. Si le téléphone est réglé pour réduire les animations, la mer reste immobile.

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
- quand on les a toutes trouvées, un « Bravo ! » s'affiche avec un sceau rouge ;
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

## Les favoris

Les visiteurs peuvent toucher le **cœur** sur la fiche d'un lieu pour le mettre en favori.
- Dès le premier, un bouton **❤ Favoris** apparaît sous « Catégories ».
- Il ouvre la liste, rangée dans l'ordre d'un voyage, avec un bouton **« Itinéraire dans Google Maps »** qui ouvre tout le trajet.
- Au-delà de 10 lieux (5 sur téléphone), Google Maps n'accepte pas tout d'un coup : le voyage est alors coupé en plusieurs itinéraires.
- Les favoris restent sur l'appareil du visiteur.

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

## Changer le logo

1. Remplace les deux images du dossier `outils/logo-source/` par les nouvelles, en gardant les mêmes noms : `logo-carre.jpg` (image carrée) et `logo-large.jpg` (image en largeur).
2. Demande à Claude de lancer `python outils/preparer_logo.py` puis de republier le site.

Le programme fabrique :
- le logo rond de l'en-tête et de l'écran de chargement ;
- l'icône de l'onglet ;
- l'icône pour l'écran d'accueil du téléphone ;
- l'image d'aperçu qui s'affiche quand on partage le lien.

## Comment ça marche (pour les curieux)

- `site/` contient le site : la page (`index.html`), l'apparence (`style.css`), les **réglages** (`config.js`), le programme de la carte (`app.js`), les icônes (`icons.js`), les modèles 3D (`modeles3d.js`, posés sur la carte par `couche3d.js`) la mer vivante (`mer.js`), les légendes cachées (`legendes.js`) et les noms des régions et des préfectures (`noms-regions.js`) le compteur de visites (`compteur.js`), les favoris (`favoris.js`) et la visite guidée (`visite.js`).
- La carte lit le tableau Google Sheets à chaque visite. Si Google ne répond pas, elle utilise la copie de secours `site/data/secours-*.csv`. Cette copie est mise à jour automatiquement chaque nuit par GitHub.
- `outils/` contient les petits programmes qui ont servi à tout préparer : import depuis Google My Maps, traductions, photos, masque des pays voisins.
- `outils/robot-tableau.gs` est une copie du programme du robot (celui qui tourne vraiment est dans le projet « Robot carte » sur script.google.com). Le robot lit la légende de la vidéo TikTok et demande à Gemini de quel lieu il s'agit. Il cherche ensuite ce lieu dans Wikipédia et Google Maps, puis Gemini rédige la fiche à partir de ce qu'il a trouvé.
- Le relief vient de **Mapterhorn** (gratuit) et le contour des pays de **Natural Earth** (domaine public). Les lacs, les grandes rivières et les frontières des préfectures viennent d'**OpenStreetMap** (gratuit, il faut juste le citer : c'est fait en bas de la carte) ; les programmes `outils/fabriquer_eaux.py` et `outils/fabriquer_frontieres.py` les préparent. Les modèles 3D sont dessinés avec **three.js** (gratuit), chargé seulement quand on zoome.
