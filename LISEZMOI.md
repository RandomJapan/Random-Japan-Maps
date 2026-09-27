# Carte 3D « Random Japan Place » : mode d'emploi

## Ajouter un lieu (à chaque nouveau TikTok)

Tout se passe dans le tableau **Google Sheets « Random Japan Place - Lieux de la carte »** (dans ton Google Drive).

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
| Relire ce que Claude a ajouté | Les lignes jaunes ont « À vérifier = Oui ». Corrige si besoin, puis efface le « Oui » |

⚠️ Ne change pas les titres des colonnes (ligne 1), ni le nom des onglets **Lieux** et **Catégories**.

## Changer le logo

1. Remplace les deux images du dossier `outils/logo-source/` par les nouvelles, en gardant les mêmes noms : `logo-carre.jpg` (image carrée) et `logo-large.jpg` (image en largeur).
2. Demande à Claude de lancer `python outils/preparer_logo.py` puis de republier le site.

Le programme fabrique :
- le logo rond de l'en-tête et de l'écran de chargement ;
- l'icône de l'onglet ;
- l'icône pour l'écran d'accueil du téléphone ;
- l'image d'aperçu qui s'affiche quand on partage le lien.

## Comment ça marche (pour les curieux)

- `site/` contient le site : la page (`index.html`), l'apparence (`style.css`), les **réglages** (`config.js`), le programme de la carte (`app.js`) et les icônes (`icons.js`).
- La carte lit le tableau Google Sheets à chaque visite. Si Google ne répond pas, elle utilise la copie de secours `site/data/secours-*.csv`. Cette copie est mise à jour automatiquement chaque nuit par GitHub.
- `outils/` contient les petits programmes qui ont servi à tout préparer : import depuis Google My Maps, traductions, photos, masque des pays voisins.
- Le relief vient de **Mapterhorn** (gratuit) et le contour des pays de **Natural Earth** (domaine public).
