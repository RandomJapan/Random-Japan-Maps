# « Japan Daily » : le plan (brag-slim, 2026-11-25)

La demande (le marketing, collée par le propriétaire) : une série TikTok et YouTube Shorts, une énigme par jour, numérotée (DAY 1,
DAY 2…), de 12 à 20 s, en 1080 × 1920, en anglais ; un modèle réutilisable, puis les 5 premiers épisodes. Le format « Devine le
lieu » (la vidéo du jeu « You have 3 seconds ») est le seul qui fait **jouer** le spectateur dès la première seconde : la série le
décline chaque jour, sur un seul lieu.

- **C'est quoi** : une énigme géographique de 18 s sur un vrai lieu filmé du Japon, dont la réponse est sur la carte 3D.
- **Pour qui** : les curieux du Japon qui défilent sur TikTok ; ils jouent, commentent, et reviennent le lendemain.
- **Ce qui la distingue** : les images sont celles du propriétaire (pas d'IA), l'indice et la réponse sont la vraie carte.
- **L'accroche** : le plus beau plan à plein écran, « WHERE IN JAPAN IS THIS? » et un 3-2-1, dès l'image 0 (qui est la couverture).
- **La chute** : « Today's mystery place is on my map » : le défi du jour de la carte (6 essais), le lien.
- **Ton** : `default`, nerveux et joueur, les codes des vidéos du jeu (mots blancs cernés d'encre, pastille rouge, le ressort).
- **Identité** : la carte (le papier, l'encre, le rouge du sceau #a8321f), TikTok Sans 900 ; la marque de série en haut : le sceau
  rouge 日 (« jour »), JAPAN DAILY, DAY N. Les cases du défi aux couleurs de ses températures (defi.js).

## Le découpage (120 battements par minute, un temps = 30 images ; 36 temps = 18 s)

| Temps | Secondes | Image | Texte | Son |
|---|---|---|---|---|
| 0 → 6 | 0 → 3 | Le plan du propriétaire (3 s, sans nom écrit), une poussée lente | marque · « WHERE IN JAPAN *IS THIS?* » · anneau 3-2-1 | cœur, grave qui monte, tic-toc à chaque seconde |
| 6 → 12 | 3 → 6 | La vraie carte : tout le Japon, la région du lieu s'allume en rouge (l'indice du jeu), la caméra s'en approche | « HINT: IT'S IN *TOHOKU* » (au temps 6,5, avec la teinte) | coup, rythme sans koto, petit carillon |
| 12 → 18 | 6 → 9 | La dernière image de l'énigme, figée (éclair d'appareil photo) | « COMMENT YOUR *GUESS* 👇 » | le rythme s'arrête, le cœur s'emballe, roulement |
| 18 → 23 | 9 → 11,5 | La carte plonge de la région sur le lieu (arrivée au temps 21), l'épingle seule | au temps 21 : LE NOM en gros, 📍 PRÉFECTURE | grand coup, tout le rythme, carillon de la réponse |
| 23 → 28 | 11,5 → 14 | Le plus beau plan du propriétaire (2,5 s) | le nom reste | |
| 28 → 36 | 14 → 18 | La fin : le plan flou, le logo, les rayons | « TODAY'S MYSTERY PLACE IS ON MY MAP 🗺️ », « DAILY CHALLENGE · 6 TRIES » et ses six cases (une par croche), « FREE · LINK IN BIO », l'adresse (au temps 31) | coup, la phrase du koto, les cases, un dernier coup |

Chaque texte reste au moins 0,3 s par mot une fois posé. Tout le texte entre y = 206 et y = 1370 (TikTok couvre le haut jusqu'à
220 environ, sa légende à partir de 1420, ses boutons à droite). Les crédits de la carte sur ses images.

## Les règles

- « I gathered 173 places in Japan on my map », jamais « I filmed ».
- Jamais le lieu du défi du jour en cours, ni de ceux des jours de publication. La liste du 2026-11-25 (défis 16 à 37) : Thirty
  Buddhas, Hokkawa Onsen, Lake Notoro, Udo Inari, Lake Yamanaka, Izumo Taisha, Lake Kurobe, Nanzoin, Kashima-jingu, Iwo Jima, Daio
  Wasabi Farm, Wakayama Farm, Takaya Shrine, Oshinkoshin Falls, Iya Valley Vine Bridge, Itsukushima, Kinkaku-ji, Kotohira Shrine,
  Hotel Iya Onsen, Hirosaki Park, Lake Tazawa, Ashino Park. Un lieu qui arrive sur la carte peut changer les défis à venir : refaire
  le calcul (lieuDuJour de defi.js, exposé par une route Playwright) avant une nouvelle série d'épisodes.
- Une région différente d'un jour à l'autre ; des lieux moins connus que Kinkaku-ji d'abord.
- Un seul écran à la fois, en grand. Pas de nom écrit dans le plan de l'énigme (les vidéos récentes ont un cartouche en haut à
  gauche : le recadrer avec « cadre »). Jamais Kumamon (Nagoro).
- Musique composée ici (musique.py), 6 dB sous le niveau habituel (−20 LUFS), et une version sans musique.

## Les 5 premiers épisodes

| Jour | Lieu | Préfecture · région | L'énigme | Le plus beau plan |
|---|---|---|---|---|
| 1 | Okuoi Rainbow Bridge | Shizuoka · Chubu | la vue ensoleillée du pont sur le lac turquoise (31,5 s) | le drone sur le pont et l'eau (23 s, ×0,8) |
| 2 | Okama Crater | Miyagi · Tohoku | le lac émeraude vu d'en haut (12 s) | le cratère et les montagnes (4 s) |
| 3 | Keya no Oto | Fukuoka · Kyushu | la grotte aux colonnes de basalte (18,5 s) | la grande arche et le bateau jaune (7,5 s, ×0,8) |
| 4 | Nagoro Scarecrow Village | Tokushima · Shikoku | les épouvantails dans le champ (13 s) | la classe pleine d'épouvantails (35 s, ×0,8) |
| 5 | Uradome Coast | Tottori · Chugoku | les îlots dans l'eau turquoise, en drone (7,5 s) | le rocher dans l'eau claire (34,5 s) |
