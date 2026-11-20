# Vidéo de Sumi, le peintre Inkami : le plan (2026-11-20, brag-slim)

**L'angle.** « I put myself in my own game » : le propriétaire s'est mis dans son propre jeu. Sumi, un peintre ambulant à son image (le chapeau blanc à taches grises, la barbe, le pull noir), est dans les 13 lieux de la balade ; il peint les personnages du jeu à l'encre sur de vieux journaux japonais ; on lui parle, on regarde son tableau en grand, et un bouton rouge mène à la boutique inkami.art. Sorti pour tout le monde le 19 novembre.

**À respecter (le propriétaire).** Jamais dire ni montrer que les portraits de la boutique sont peints à la main : dans le jeu c'est le personnage qui peint ; chez Inkami, le portrait est fait d'après la photo, puis collé à la main sur de vrais journaux, le prénom au pinceau. La voix dit donc « Want your own face on real Japanese newspapers? », rien sur la main. Que des humains sur les tableaux (les vingt du jeu le sont). Chaque morceau de voix sur son sous-titre, la musique et les sons bien sous la voix, chaque plan du jeu en grand.

**Filmé dans le jeu en ligne, en simple visiteur** (`'site': True` dans les prises `sm-*` de `rushes.py` : map.randomjapanplace.com, la mémoire du navigateur vide sauf la langue et le voyageur ; rien ne part vers le compteur de visites ni vers la boutique, que le navigateur du tournage remplace par une page vide).

**L'accroche (les 3 premières secondes).** Dès l'image 0, déjà posée (c'est aussi la miniature) : Sumi en gros plan qui peint, vu de derrière sa toile (son visage, sa barbe, le chapeau, le pinceau), et « I put *myself* in my own game 🎮 ». Sur « game », un grand sceau rouge 墨紙 (le vrai sceau de la marque, celui de son enseigne dans le jeu) s'abat sous son visage, l'encre gicle vers le bas, l'image tremble, et l'air démarre sur ce coup.

**L'ouverture.** L'introduction de l'air (8 temps) porte le grand plan d'Itsukushima (Sumi à son chevalet, le sanctuaire rouge et le grand torii dans la mer derrière ; « Meet *Sumi*… », l'étiquette « 墨 · Sumi · NEW ») puis Sumi qui se retourne vers le voyageur (« …yes, that's *me*! »). La mélodie entre quand il nous fait face.

**Le ton.** Celui des annonces de la balade (Tottori, Tsubosaka) : une accroche forte, un moment du jeu par plan de 3 ou 4 temps, panoramiques éclair, la voix « Sarah », les textes dans la boîte de la balade.

**La musique.** « odori », l'air de toute la balade (112 battements, 1 temps = 0,536 s), sans droits : rien avant le sceau, l'introduction (8 temps) jusqu'à ce que Sumi nous fasse face, la mélodie ensuite.

**La voix.** Une seule génération Flora (ElevenLabs v4, « Sarah », 0,096 $), une ligne par paragraphe, coupée en 18 morceaux (`voix.py`, `LONGUES` et `MORCEAUX`, `m0`).

**Découpage** (T = le sceau, 1,33 s ; n = temps de l'air ; 37,7 s en tout)

| Temps | Plan (prise) | Voix |
|---|---|---|
| 0 → 2 | Sumi en gros plan qui peint, Itsukushima (`sm-visage`) ; le sceau 墨紙 sur « game » | I put myself... in my own game! |
| 2 → 6 | Le grand plan : le chevalet, le sanctuaire, le torii dans la mer (`sm-large`) ; l'étiquette « 墨 Sumi · NEW » | Meet Sumi, a travelling painter... |
| 6 → 10 | Sumi se retourne vers la caméra (`sm-salut`) ; la mélodie entre à 8 | yes, that's me! |
| 10 → 14 | Himeji : Sumi sous le donjon (`sm-himeji`) | You'll find him at Himeji Castle, |
| 14 → 17 | Les dunes de Tottori, la mer (`sm-tottori`) | on the Tottori dunes, |
| 17 → 19,5 | Tsubosaka-dera, la porte rouge du temple (`sm-tsubosaka`) | at Tsubosaka-dera... |
| 19,5 → 24 | Les neuf autres lieux, un demi-temps chacun, leur tableau ; un compteur de 5 à 13 (`sm-p-*`) | in all thirteen places! |
| 24 → 28 | Le pinceau sur la toile du prêtre (`sm-pinceau`) | He paints the people he meets... |
| 28 → 34 | Le journal de près, la toile du samouraï (`sm-journal`) | in black ink, on old Japanese newspapers. |
| 34 → 38 | « Want a closer look at my painting? », « Yes », la fenêtre s'ouvre (`sm-parler`) | Talk to him, and see his painting up close! |
| 38 → 41 | Le prêtre d'Itsukushima en grand (`sm-parler`) | The priest of Itsukushima, |
| 41 → 44 | Le samouraï de Himeji (`sm-samourai`) | the samurai of Himeji, |
| 44 → 47 | Le chamelier des dunes (`sm-chamelier`) | the camel driver of the dunes... |
| 47 → 51 | « You, as a samurai » (`sm-voyageur`, le garçon) | and even you, as a samurai! |
| 51 → 56 | « What if it were you? », l'offre (`sm-voyageur`, zoomé) | Want your own face on real Japanese newspapers? |
| 56 → 60 | Le bouton rouge, un doigt appuie à 58 | This red button takes you to my shop! |
| 60 → fin | Sumi la nuit, à son lampion ; la fin (« Go say hi to Sumi! », in all 13 places · free, Link in bio) | Go say hi to him. Link in bio! |

**Le partage** (`videos/balade/balade-3d-sumi-partage.txt`). « I put myself in my own game 🎨 Meet Sumi, a travelling painter who looks a lot like me: find him in all 13 places of my 3D walk, see the people he paints in black ink on old Japanese newspapers… and even yourself, as a samurai. Free, link in bio. »
