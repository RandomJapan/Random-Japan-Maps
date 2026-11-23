# Trois vidéos de plus pour le calendrier de l'Avent (brag-plan, skill brag-slim)

Demande du propriétaire (2026-11-23), après la promo « les cadeaux sont vrais » et le tuto de la grue : « Tu peux faire encore
3 vidéos de plus pour présenter le calendrier de l'avent en gardant le thème de noël et chacune avec une version différente ».

Trois angles, trois styles, la même carte (le vrai calendrier, `site/noel.js`, ses décorations `noel-decors.js` et ses cadeaux
sur la carte `noel-carte.js`), en anglais, 1080 × 1920, 60 images/s, sur « Yuki akari » (la musique de Noël de la carte, case 2 :
à nous, sans crédit), un passage différent pour chacune. La musique est 6 dB plus bas que l'ancien −14 LUFS (le propriétaire
l'a demandé deux fois sur les premières), les bruitages à leur niveau. Chaque vidéo : avec et sans musique, une miniature, un
texte à copier.

## 1. `Jours` : « ma carte change chaque jour jusqu'à Noël »

- **L'angle** : la satisfaction d'une transformation. Chaque case ouvre une décoration sur la carte ; on la voit apparaître.
- **Le style** : la carte seule, sans son interface, de nuit ; un grand compteur de jour façon porte du calendrier (papier,
  chiffre en Zen Antique, losange rouge) qui tourne sur le temps ; deux mots sous le compteur ; une clochette de boîte à
  musique par jour, qui monte la gamme de ré.
- **Le son** : la fin du pont de « Yuki akari » (temps 176, son ralenti) puis le grand refrain final F1 (temps 180 → 212).
- **La prise** `cv-jours` : la page change de jour pendant la prise (l'horloge de la page est avancée, puis le rafraîchissement
  de minuit de la carte est appelé : `__jourSuivant`). Chaque plan s'ouvre la veille, et le jour change sur le temps : la
  décoration apparaît à l'écran.

| Temps (s) | Plan | Texte |
|---|---|---|
| 0 → 2,6 | tout le Japon de nuit, le 1er décembre | « My Japan map changes every day until Christmas 🎄 » |
| 2,6 → 17,6 | 12 jours, 1,25 s chacun : 1 les bonnets rouges des épingles, 4 les cascades gelées, 5 les lanternes des vieux villages, 8 les cygnes, 9 les grues en papier, 13 les fermes sous la neige, 14 le kanji de l'année, 15 les cartes de vœux qui volent, 17 les kamakura, 21 les grues qui dansent, 22 les yuzus dans les onsens, 23 les rennes au cap Sōya (les villes illuminées, les sapins, la guirlande des côtes et les singes se voyaient trop peu de nuit : retirés au tournage) | « DEC n » + deux mots |
| 17,6 → fin | le 24 : le traîneau traverse tout le Japon | « 24 days · 24 free gifts 🎁 » « link in bio » |

## 2. `Traditions` : « 5 choses que le Japon fait en décembre »

- **L'angle** : apprendre quelque chose (le « Le savais-tu ? » des cases), et chaque chose est sur la carte.
- **Le style** : liste numérotée à la TikTok, grands mots blancs cernés de noir, un mot surligné en rouge ; un plan de la carte
  par tradition, 3 s chacun.
- **Le son** : le deuxième couplet de « Yuki akari » (A2, temps 46 → 80), calme.

| Temps | Plan | Texte |
|---|---|---|
| accroche | le traîneau sur le Japon de nuit | « 5 things Japan does in December » |
| #1 | les yuzus dans les enfers de Beppu (case 22) | « a yuzu bath on the shortest day 🍋 » |
| #2 | le kanji de l'année sur Kyoto (case 14) | « the kanji of the year, with a giant brush » |
| #3 | les grues en papier qui volent (case 9) | « 1,000 paper cranes for a wish » |
| #4 | les cartes de vœux qui traversent la carte (case 15) | « New Year cards: all delivered on January 1 » |
| #5 | la recette du gâteau de Noël (case 23) | « fried chicken on Christmas Eve 🍗 (a 1974 ad) » |
| fin | les 24 portes | « one a day in my Japan map's Advent calendar · link in bio » |

## 3. `Cases` : « 24 cadeaux cachés dans ma carte »

- **L'angle** : la quantité ; un compte à rebours de 24 portes qui s'ouvrent, de plus en plus vite.
- **Le style** : l'aspect du vrai calendrier (ses portes en papier, ses couleurs par sorte de cadeau), en grand : la grille en
  haut, la fiche de la case (sa vraie capture, `captures.py`) qui glisse en bas, son titre.
- **Le son** : le premier refrain (B1, temps 76 → 112) ; une clochette par porte.
- Les 4 premières portes sur 2 temps (lisibles), puis 8 sur 1 temps, puis 12 sur un demi-temps ; toutes ouvertes à la fin :
  « 24 free gifts · December 1 → 24 · link in bio ».

## Ce qu'on ne montre pas

Aucune donnée personnelle (le prénom de la case 1 est celui du champ vide du site, « Emma », l'exemple du site) ; pas les
rushs du propriétaire (déjà dans la première promo) ; aucune musique d'ailleurs.
