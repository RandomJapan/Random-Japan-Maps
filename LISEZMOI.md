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

- `site/` contient le site : la page (`index.html`), l'apparence (`style.css`), les **réglages** (`config.js`), le programme de la carte (`app.js`), les icônes (`icons.js`) et les modèles 3D (`modeles3d.js`, posés sur la carte par `couche3d.js`).
- La carte lit le tableau Google Sheets à chaque visite. Si Google ne répond pas, elle utilise la copie de secours `site/data/secours-*.csv`. Cette copie est mise à jour automatiquement chaque nuit par GitHub.
- `outils/` contient les petits programmes qui ont servi à tout préparer : import depuis Google My Maps, traductions, photos, masque des pays voisins.
- `outils/robot-tableau.gs` est une copie du programme du robot (celui qui tourne vraiment est dans le projet « Robot carte » sur script.google.com). Le robot lit la légende de la vidéo TikTok et demande à Gemini de quel lieu il s'agit. Il cherche ensuite ce lieu dans Wikipédia et Google Maps, puis Gemini rédige la fiche à partir de ce qu'il a trouvé.
- Le relief vient de **Mapterhorn** (gratuit) et le contour des pays de **Natural Earth** (domaine public). Les modèles 3D sont dessinés avec **three.js** (gratuit), chargé seulement quand on zoome.
