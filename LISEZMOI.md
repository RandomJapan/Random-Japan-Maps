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
- **Pour filmer :** lance l'enregistreur d'écran du téléphone, puis appuie sur Plonger. Au montage, garde le passage qui va de l'image de tout le Japon à l'arrivée sur le lieu, puis enchaîne sur tes images.
- Les boutons disparaissent tout de suite. Touche l'écran pour faire revenir la barre : **Rejouer** (rouge, pour refaire une prise) et **Arrêter**. Sur ordinateur : Espace = rejouer, Échap = arrêter.
- Sur téléphone, le nom du lieu est placé plus haut que pendant la visite, pour ne pas être caché par la légende de ta vidéo TikTok.

### Point à point

C'est le troisième onglet du panneau Visite (mode développeur aussi), comme « Point à point » dans Google Earth Studio : au lieu de plonger depuis tout le Japon, la caméra **part d'un autre endroit, vu de près**, et vole jusqu'au lieu. Pratique pour enchaîner deux lieux proches dans une vidéo.
- **Départ :** la position (coordonnées GPS ou lien Google Maps) du lieu d'où part la caméra, avec son **nom**, son **nom japonais** (facultatifs) et son **type** : il a sa propre épingle et son modèle 3D, comme l'arrivée.
- **Arrivée :** position, nom, nom japonais et type, comme pour le plongeon. Puis la caméra et l'orbite.
- Appuie sur **Voler** : la carte montre le départ, avec son nom en bas, la caméra déjà tournée vers l'arrivée. Puis le nom du départ s'en va et la caméra vole jusqu'à l'arrivée (en prenant de la hauteur si c'est loin), en 2,5 à 5,5 secondes selon la distance. À l'arrivée, le nom s'affiche et la caméra tourne autour, comme pour le plongeon. Seuls ces deux lieux sont sur la carte.
- **Rejouer** et **Arrêter** marchent comme pour le plongeon.

## Le mode développeur (rien que pour toi)

Tes outils qui ne sont pas pour les visiteurs (pas encore, ou jamais) : le **plongeon**, le **point à point** et l'**affiche à incruster** (onglets Plongeon et Point à point de la visite), et le **jeu** pas encore sorti.
- **La première fois :** ouvre ton **lien secret** (celui que Claude t'a donné dans la conversation, qui finit par `?dev=…`) dans chaque navigateur où tu veux le mode : sur ton téléphone (Safari ou Chrome, pas le navigateur intégré de TikTok) et sur ton ordinateur. Le navigateur s'en souvient ensuite. Garde ce lien pour toi : il n'est écrit nulle part ailleurs.
- **Ensuite :** un bouton `</>` apparaît en bas à droite, au-dessus de la rose des vents. **Rouge** = carte développeur (tes outils sont là). **Clair** = carte normale, exactement comme la voient les visiteurs. Un clic pour passer de l'une à l'autre ; la carte retient ton choix.
- Ce bouton n'existe que dans tes navigateurs : les visiteurs ne le voient jamais.
- Si tu perds le lien, demande à Claude d'en faire un nouveau.

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

**Tu n'as rien à faire :** les pages sont refaites à chaque mise en ligne, à partir du tableau. Un nouveau lieu a sa page le lendemain (la nuit, le robot recopie le tableau et télécharge la couverture de la vidéo).

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

## Changer le logo

1. Remplace les deux images du dossier `outils/logo-source/` par les nouvelles, en gardant les mêmes noms : `logo-carre.jpg` (image carrée) et `logo-large.jpg` (image en largeur).
2. Demande à Claude de lancer `python outils/preparer_logo.py` puis de republier le site.

Le programme fabrique :
- le logo rond de l'en-tête et de l'écran de chargement ;
- l'icône de l'onglet ;
- l'icône pour l'écran d'accueil du téléphone ;
- l'image d'aperçu qui s'affiche quand on partage le lien.

## Comment ça marche (pour les curieux)

- `site/` contient le site : la page (`index.html`), l'apparence (`style.css`), les **réglages** (`config.js`), le programme de la carte (`app.js`), les icônes (`icons.js`), les modèles 3D (`modeles3d.js`, posés sur la carte par `couche3d.js`) la mer vivante (`mer.js`), les légendes cachées (`legendes.js`) et les noms des régions et des préfectures (`noms-regions.js`) le compteur de visites (`compteur.js`), les favoris (`favoris.js`), la visite guidée (`visite.js`) et `reperes.js`, qui ne garde sur la carte que les épingles et les noms proches de l'écran (c'est ce qui rend le zoom fluide sur téléphone).
- La carte lit le tableau Google Sheets à chaque visite. Si Google ne répond pas, elle utilise la copie de secours `site/data/secours-*.csv`. Cette copie est mise à jour automatiquement chaque nuit par GitHub.
- `outils/` contient les petits programmes qui ont servi à tout préparer : import depuis Google My Maps, traductions, photos, masque des pays voisins.
- `outils/robot-tableau.gs` est une copie du programme du robot (celui qui tourne vraiment est dans le projet « Robot carte » sur script.google.com). Le robot lit la légende de la vidéo TikTok et demande à Gemini de quel lieu il s'agit. Il cherche ensuite ce lieu dans Wikipédia et Google Maps, puis Gemini rédige la fiche à partir de ce qu'il a trouvé.
- Le relief vient de **Mapterhorn** (gratuit) et le contour des pays de **Natural Earth** (domaine public). Les lacs, les grandes rivières et les frontières des préfectures viennent d'**OpenStreetMap** (gratuit, il faut juste le citer : c'est fait en bas de la carte) ; les programmes `outils/fabriquer_eaux.py` et `outils/fabriquer_frontieres.py` les préparent. Les modèles 3D sont dessinés avec **three.js** (gratuit), chargé seulement quand on zoome.
