// Noël sur la carte (demandé le 2026-11-10 ; en mode développeur d'abord, comme Halloween).
// Le calendrier de l'Avent : du 1er au 24 décembre, une case par jour (minuit chez le visiteur), les cases des jours
// passés restent à rattraper. Chaque case : un cadeau, un lieu d'hiver de la carte, une décoration, « Le savais-tu ? ».
// Les cases ouvertes sont gardées dans ce navigateur (localStorage). Les épingles portent un bonnet rouge.
// Les cadeaux pas encore faits (pret: false) montrent « En préparation » en mode développeur.
// Maquette choisie par le propriétaire : l'artifact « Calendrier de l'Avent de la carte ».
import { echapper, typoFr, partagerFichier, telecharger, tactile } from './commun.js';
import { chargerImage, adresseGrain } from './bravo-image.js';

const MEMOIRE = 'calendrierOuvert'; // les cases ouvertes (numéros des jours)
const MEMOIRE_ESSAI = 'calendrierOuvertEssai'; // les mêmes, quand le mode développeur simule un jour
const MEMOIRE_PRENOM = 'calendrierPrenom';
const BOUTIQUE = 'https://inkami.art/?utm_source=map&utm_medium=calendrier&utm_campaign=noel2026';
const POLICE_PINCEAU = '"Inkami Pinceau"'; // noel.css : noel/inkami-pinceau.woff2 (Yuji Boku, katakana seulement, OFL)

const ICONES = {
  boutique: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6M9 12.5h6M12 9v7"/>',
  telecharger: '<path d="M12 4v10M8 10.5l4 4 4-4M5 19h14"/>',
  balade: '<path d="M8 4l4 3 4-3 4 3-2 4h-2v9H8v-9H6L4 7z"/>',
  carte: '<path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
};
const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICONE_CADEAU = '<svg class="cadeau" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M4 10h16v10.5H4zM3 6.8h18V10H3zM12 6.8v13.7"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 6.8C10.8 4 7.6 3 6.9 4.9 6.2 6.6 9.6 6.8 12 6.8ZM12 6.8c1.2-2.8 4.4-3.8 5.1-1.9.7 1.7-2.7 1.9-5.1 1.9Z"/></svg>';

const TEXTES = {
  en: {
    bouton: 'Advent calendar',
    titre: 'Advent calendar',
    sousTitre: 'One box a day, until Christmas Eve',
    sortes: { boutique: 'Inkami shop', telecharger: 'To download', balade: '3D walk', carte: 'On the map' },
    ouvrir: (j) => `Open the box of December ${j}`,
    voir: (j, c) => `Box of December ${j}: ${c}`,
    fermee: (j) => `Opens on December ${j}`,
    pasEncore: (j) => `This box opens on December ${j}.`,
    avant: 'The calendar opens on December 1.',
    date: (j) => `December ${j}`,
    lieu: 'Place of the day',
    allerLieu: 'See the place and its video',
    surCarte: 'On the map today',
    savais: 'Did you know?',
    prenom: 'Your first name',
    prenomAide: 'Common first names are exact; the others follow a rule.',
    fondTelecharger: 'Download my wallpaper',
    fondPret: 'Your wallpaper is ready',
    fondTexte: 'My Christmas wallpaper from the 3D map of Japan',
    code: 'Code',
    copier: 'Copy',
    copie: 'Code copied',
    boutiqueAller: 'Go to the Inkami shop',
    enPreparation: 'Being made: this gift will be ready before December (developer mode only).',
    codeAFaire: 'Code to create in Shopify before December (developer mode only).',
    devJour: 'Simulated day',
    devRefermer: 'Close every box',
    devNote: 'Developer mode: boxes opened while simulating are kept apart from the real calendar.',
    fermer: 'Close',
  },
  fr: {
    bouton: 'Calendrier',
    titre: 'Calendrier de l’Avent',
    sousTitre: 'Une case par jour, jusqu’au soir de Noël',
    sortes: { boutique: 'Boutique Inkami', telecharger: 'À télécharger', balade: 'Balade 3D', carte: 'Sur la carte' },
    ouvrir: (j) => `Ouvrir la case du ${j === 1 ? '1er' : j} décembre`,
    voir: (j, c) => `Case du ${j === 1 ? '1er' : j} décembre : ${c}`,
    fermee: (j) => `S’ouvre le ${j === 1 ? '1er' : j} décembre`,
    pasEncore: (j) => `Cette case s’ouvrira le ${j === 1 ? '1er' : j} décembre.`,
    avant: 'Le calendrier s’ouvre le 1er décembre.',
    date: (j) => `${j === 1 ? '1er' : j} décembre`,
    lieu: 'Le lieu du jour',
    allerLieu: 'Voir le lieu et sa vidéo',
    surCarte: 'Sur la carte aujourd’hui',
    savais: 'Le savais-tu ?',
    prenom: 'Ton prénom',
    prenomAide: 'Les prénoms courants sont justes ; les autres suivent une règle.',
    fondTelecharger: 'Télécharger mon fond d’écran',
    fondPret: 'Ton fond d’écran est prêt',
    fondTexte: 'Mon fond d’écran de Noël, fait sur la carte 3D du Japon',
    code: 'Code',
    copier: 'Copier',
    copie: 'Code copié',
    boutiqueAller: 'Aller à la boutique Inkami',
    enPreparation: 'En préparation : ce cadeau sera prêt avant décembre (visible seulement en mode développeur).',
    codeAFaire: 'Code à créer dans Shopify avant décembre (visible seulement en mode développeur).',
    devJour: 'Jour simulé',
    devRefermer: 'Refermer toutes les cases',
    devNote: 'Mode développeur : les cases ouvertes en simulant un jour sont gardées à part du vrai calendrier.',
    fermer: 'Fermer',
  },
  ja: {
    bouton: 'アドベント',
    titre: 'アドベントカレンダー',
    sousTitre: '毎日ひとつ、クリスマスイブまで',
    sortes: { boutique: 'Inkamiショップ', telecharger: 'ダウンロード', balade: '3Dさんぽ', carte: 'マップ' },
    ouvrir: (j) => `12月${j}日の窓を開ける`,
    voir: (j, c) => `12月${j}日：${c}`,
    fermee: (j) => `12月${j}日に開きます`,
    pasEncore: (j) => `この窓は12月${j}日に開きます。`,
    avant: 'カレンダーは12月1日に始まります。',
    date: (j) => `12月${j}日`,
    lieu: '今日の場所',
    allerLieu: '場所と動画を見る',
    surCarte: '今日のマップ',
    savais: '豆知識',
    prenom: 'お名前（ローマ字）',
    prenomAide: 'よくある名前は正確です。ほかの名前は規則で変換します。',
    fondTelecharger: '壁紙をダウンロード',
    fondPret: '壁紙ができました',
    fondTexte: '日本の3Dマップで作ったクリスマスの壁紙',
    code: 'コード',
    copier: 'コピー',
    copie: 'コピーしました',
    boutiqueAller: 'Inkamiのショップへ',
    enPreparation: '準備中（開発者モードのみ表示）',
    codeAFaire: 'Shopifyでコードを作成（開発者モードのみ表示）',
    devJour: '日付のシミュレーション',
    devRefermer: 'すべて閉じる',
    devNote: '開発者モード：シミュレーション中に開けた窓は別に保存されます。',
    fermer: '閉じる',
  },
};

// Les 24 cases. lieu : l'identifiant du lieu sur la carte (son nom anglais en minuscules, comme dans ?voyage=).
// pret : le cadeau existe vraiment ; special : ce que la case montre de plus (prenom, fond) ; code : boutique Inkami.
// Les textes japonais des cases sont à écrire avant la sortie (en attendant : l'anglais).
const CASES = [
  { j: 1, k: 'boutique', lieu: 'hill-of-the-buddha', pret: true, special: 'prenom',
    cadeau: { en: 'Your name in Japanese', fr: 'Ton prénom en japonais', ja: 'あなたの名前をカタカナで' },
    texte: { en: 'Type your first name: it is written in katakana with a brush, on a phone wallpaper, with the Inkami seal. Inkami paints a name like this on each of its portraits.',
      fr: 'Tape ton prénom : il s’écrit en katakana au pinceau, sur un fond d’écran de téléphone, avec le sceau Inkami. Inkami peint ainsi un prénom sur chacun de ses portraits.' },
    deco: { en: 'The first snow falls, and the pins put on a red hat.', fr: 'La première neige tombe, et les épingles mettent un bonnet rouge.' },
    savais: { en: 'December is also called shiwasu (師走): « the month when even monks run ».', fr: 'Décembre se dit aussi shiwasu (師走) : « le mois où même les moines courent ».' } },
  { j: 2, k: 'carte', lieu: 'goryokaku-park', pret: false,
    cadeau: { en: 'The illuminations', fr: 'Les illuminations', ja: 'イルミネーション' },
    texte: { en: 'At night, the big cities on the map light up, like Japan’s winter illuminations, and a winter tune comes to the music player.',
      fr: 'La nuit, les grandes villes de la carte s’allument, comme les illuminations d’hiver au Japon, et une musique d’hiver arrive dans le lecteur.' },
    deco: { en: 'The star of the Goryokaku fort lights up.', fr: 'L’étoile du fort de Goryokaku s’allume.' },
    savais: { en: 'Every winter, Hakodate’s star-shaped fort is lit up every evening.', fr: 'Chaque hiver, le fort en forme d’étoile de Hakodate est illuminé tous les soirs.' } },
  { j: 3, k: 'telecharger', lieu: 'lake-kinrin', pret: false,
    cadeau: { en: 'The 2027 calendar to print', fr: 'Le calendrier 2027 à imprimer', ja: '2027年カレンダー' },
    texte: { en: '12 months, 12 places from the map, each in its best season: snow in January, cherry blossoms in April, red maples in November. A4 PDF.',
      fr: '12 mois, 12 lieux de la carte, chacun à sa plus belle saison : la neige en janvier, les cerisiers en avril, les érables rouges en novembre. En PDF, format A4.' },
    deco: { en: 'A garland hangs on the map’s title.', fr: 'Une guirlande s’accroche au titre de la carte.' },
    savais: { en: 'On winter mornings, mist rises from the lake, warmed by hot springs.', fr: 'Les matins d’hiver, une brume monte du lac, réchauffé par des sources chaudes.' } },
  { j: 4, k: 'boutique', lieu: 'fukuroda-falls', pret: false, code: 'CALENDRIER4',
    cadeau: { en: 'Free express delivery', fr: 'La livraison Express offerte', ja: '速達配送無料' },
    texte: { en: 'A code to get an Inkami portrait faster, in time for Christmas. For the first 10 orders.',
      fr: 'Un code pour recevoir son tableau Inkami plus vite, à temps pour Noël. Pour les 10 premières commandes.' },
    deco: { en: 'The waterfalls on the map freeze.', fr: 'Les cascades de la carte gèlent.' },
    savais: { en: 'In a hard frost the waterfall freezes: the Japanese call it hyōbaku, the « ice waterfall ».', fr: 'Par grand froid, la cascade gèle : les Japonais l’appellent hyōbaku, la « cascade de glace ».' } },
  { j: 5, k: 'balade', lieu: 'tsumago-juku', pret: false,
    cadeau: { en: 'The red scarf', fr: 'L’écharpe rouge', ja: '赤いマフラー' },
    texte: { en: 'A knitted scarf for the traveller of the 3D walk. The first piece of the winter outfit.',
      fr: 'Une écharpe tricotée pour le voyageur de la balade 3D. La première pièce de la tenue d’hiver.' },
    deco: { en: 'Lanterns light up in the old village streets.', fr: 'Des lanternes s’allument dans les vieilles rues des villages.' },
    savais: { en: 'Tsumago was a stop on the Nakasendō road between Kyoto and Edo (Tokyo). The village is kept almost as it was then.', fr: 'Tsumago était une étape de la route Nakasendō entre Kyoto et Edo (Tokyo). Le village est gardé presque comme à l’époque.' } },
  { j: 6, k: 'telecharger', lieu: 'lake-yamanaka', pret: false,
    cadeau: { en: 'Wallpaper: Mount Fuji in winter', fr: 'Fond d’écran : le Fuji en hiver', ja: '壁紙：冬の富士山' },
    texte: { en: 'Mount Fuji under the snow, seen from Lake Yamanaka, made with the map, for your phone.', fr: 'Le Fuji sous la neige, vu du lac Yamanaka, fait avec la carte, pour ton téléphone.' },
    deco: { en: 'The snow comes further down the mountains.', fr: 'La neige descend plus bas sur les montagnes.' },
    savais: { en: 'In winter, seen from the lake, the sun sometimes sets right on Fuji’s summit: the « Diamond Fuji ».', fr: 'En hiver, vu du lac, le soleil se couche parfois pile sur le sommet du Fuji : c’est le « Fuji diamant ».' } },
  { j: 7, k: 'boutique', lieu: 'toyokoro-ice-beach', pret: false, code: 'CALENDRIER7',
    cadeau: { en: 'Free gift wrapping', fr: 'L’emballage cadeau offert', ja: 'ギフト包装無料' },
    texte: { en: 'The portrait arrives wrapped, ready to give, with a handwritten card. For the first 10 orders.',
      fr: 'Le tableau arrive emballé, prêt à offrir, avec une carte écrite à la main. Pour les 10 premières commandes.' },
    deco: { en: 'Christmas trees light up in the big cities.', fr: 'Des sapins s’allument dans les grandes villes.' },
    savais: { en: 'In January and February, clear blocks of ice wash up on the beach and shine like jewels at sunrise.', fr: 'En janvier et février, des blocs de glace transparents s’échouent sur la plage et brillent comme des bijoux au lever du soleil.' } },
  { j: 8, k: 'carte', lieu: 'lake-kussharo', pret: false,
    cadeau: { en: 'Guess the place: the Christmas round', fr: 'Devine le lieu : la manche de Noël', ja: '場所当て：クリスマス編' },
    texte: { en: 'A special round of the game with winter places only, to play alone or with friends.', fr: 'Une partie spéciale du jeu, avec seulement des lieux d’hiver, à jouer seul ou avec des amis.' },
    deco: { en: 'Swans land on the northern lakes.', fr: 'Des cygnes se posent sur les lacs du nord.' },
    savais: { en: 'Whooper swans spend the winter by the lake, where hot springs keep it from freezing.', fr: 'Des cygnes chanteurs passent l’hiver au bord du lac, là où des sources chaudes l’empêchent de geler.' } },
  { j: 9, k: 'telecharger', lieu: 'kegon-falls', pret: false,
    cadeau: { en: 'The map’s origami paper', fr: 'Le papier origami de la carte', ja: 'マップ柄の折り紙' },
    texte: { en: 'A square sheet to print in the map’s colours, and how to fold the crane step by step.', fr: 'Une feuille carrée à imprimer aux couleurs de la carte, et le pliage de la grue pas à pas.' },
    deco: { en: 'Paper cranes fly over the map.', fr: 'Des grues en papier volent au-dessus de la carte.' },
    savais: { en: 'In Japan, people fold a thousand cranes (senbazuru) to make a wish: healing, happiness or peace.', fr: 'Au Japon, on plie mille grues (senbazuru) pour faire un vœu : guérison, bonheur ou paix.' } },
  { j: 10, k: 'boutique', lieu: 'hirosaki-castle', pret: false, code: 'CALENDRIER10',
    cadeau: { en: 'Last day for a portrait by Christmas', fr: 'Dernier jour pour un tableau à Noël', ja: 'クリスマスに間に合う最終日' },
    texte: { en: 'After today, a portrait may arrive after Christmas. −15% today only, for the first 10 orders.',
      fr: 'Après aujourd’hui, un tableau risque d’arriver après Noël. −15 % aujourd’hui seulement, pour les 10 premières commandes.' },
    deco: { en: 'Snow lanterns light up around the castle.', fr: 'Des lanternes de neige s’allument autour du château.' },
    savais: { en: 'In February, the castle park glows with lanterns made of snow.', fr: 'En février, le parc du château s’illumine de lanternes faites en neige.' } },
  { j: 11, k: 'balade', lieu: 'cape-notoro-misaki', pret: false,
    cadeau: { en: 'Snowflake glasses', fr: 'Les lunettes flocons', ja: '雪の結晶メガネ' },
    texte: { en: 'Snowflake-shaped glasses for the traveller of the 3D walk.', fr: 'Des lunettes en forme de flocons de neige pour le voyageur de la balade 3D.' },
    deco: { en: 'Drift ice arrives along the Sea of Okhotsk.', fr: 'La banquise arrive le long de la mer d’Okhotsk.' },
    savais: { en: 'From late January to March, ice from Russia drifts to the coast of Abashiri: the ryūhyō.', fr: 'De fin janvier à mars, de la glace venue de Russie dérive jusqu’aux côtes d’Abashiri : c’est le ryūhyō.' } },
  { j: 12, k: 'carte', lieu: 'togakushi-shrine', pret: false,
    cadeau: { en: 'The legend of Yuki-onna', fr: 'La légende de Yuki-onna', ja: '雪女の伝説' },
    texte: { en: 'A new legend hidden on the map: the snow woman, somewhere in the snowy mountains.', fr: 'Une nouvelle légende cachée sur la carte : la femme des neiges, quelque part dans les montagnes enneigées.' },
    deco: { en: 'Sometimes a white figure passes in the storm…', fr: 'Parfois, une silhouette blanche passe dans la tempête…' },
    savais: { en: 'The path to the shrine is lined with cedars planted about 400 years ago.', fr: 'L’allée qui mène au sanctuaire est bordée de cèdres plantés il y a environ 400 ans.' } },
  { j: 13, k: 'telecharger', lieu: 'gokayama', pret: false,
    cadeau: { en: 'Wallpaper: Gokayama in the snow', fr: 'Fond d’écran : Gokayama sous la neige', ja: '壁紙：雪の五箇山' },
    texte: { en: 'The village of the 3D walk at night, white roofs and lit windows.', fr: 'Le village de la balade 3D la nuit, les toits blancs et les fenêtres allumées.' },
    deco: { en: 'The farmhouse windows light up at night.', fr: 'Les fenêtres des fermes s’allument la nuit.' },
    savais: { en: 'On December 13, Japan starts preparing the New Year, with the big end-of-year cleaning (susuharai).', fr: 'Le 13 décembre, le Japon commence à préparer le Nouvel An, avec le grand ménage de fin d’année (susuharai).' } },
  { j: 14, k: 'carte', lieu: 'kinkaku-ji', pret: false,
    cadeau: { en: 'The kanji of the year', fr: 'Le kanji de l’année', ja: '今年の漢字' },
    texte: { en: 'Each December in Kyoto, the head priest of Kiyomizu-dera writes with a giant brush the kanji that sums up the year. The map shows it over Kyoto.',
      fr: 'Chaque mois de décembre à Kyoto, le grand prêtre du temple Kiyomizu-dera écrit au pinceau géant le kanji qui résume l’année. La carte l’affiche au-dessus de Kyoto.' },
    deco: { en: 'The kanji of the year appears over Kyoto.', fr: 'Le kanji de l’année s’écrit au-dessus de Kyoto.' },
    savais: { en: 'The kanji of 2025 was 熊, the bear, after a year of many bear encounters.', fr: 'Le kanji de 2025 était 熊, l’ours, après une année de nombreuses rencontres avec des ours.' } },
  { j: 15, k: 'telecharger', lieu: 'izumo-taisha', pret: false,
    cadeau: { en: 'The 2027 New Year card', fr: 'La carte de vœux 2027', ja: '2027年の年賀状' },
    texte: { en: 'A Japanese-style New Year card (nengajō) for the Year of the Sheep, to print or to send by message.',
      fr: 'Une carte de vœux à la japonaise (nengajō) pour l’année du Mouton, à imprimer ou à envoyer par message.' },
    deco: { en: 'New Year cards fly toward the cities.', fr: 'Des cartes de vœux volent vers les villes.' },
    savais: { en: 'From December 15, the Japanese post takes New Year cards. Posted before the 25th, they all arrive on the morning of January 1.',
      fr: 'Dès le 15 décembre, la poste japonaise prend les cartes de vœux. Postées avant le 25, elles arrivent toutes le matin du 1er janvier.' } },
  { j: 16, k: 'balade', lieu: 'noboribetsu-hell-valley', pret: false,
    cadeau: { en: 'The sack of gifts', fr: 'Le sac de cadeaux', ja: 'プレゼント袋' },
    texte: { en: 'Santa’s sack, worn on the back instead of the backpack.', fr: 'Le sac du Père Noël, à porter sur le dos à la place du sac à dos.' },
    deco: { en: 'Snow monkeys take a hot bath.', fr: 'Des singes des neiges prennent un bain chaud.' },
    savais: { en: 'In Noboribetsu, statues of oni (demons) guard the hot springs. Here, the demons protect the town.', fr: 'À Noboribetsu, des statues de démons (oni) gardent les sources chaudes. Ici, les démons protègent la ville.' } },
  { j: 17, k: 'boutique', lieu: 'lake-tazawa', pret: false, code: 'CALENDRIER17',
    cadeau: { en: 'The Inkami gift card', fr: 'Le bon cadeau Inkami', ja: 'Inkamiギフトカード' },
    texte: { en: 'Too late for delivery? A gift card to print and put under the tree: the person picks a style and sends a photo after Christmas. −10% on the card.',
      fr: 'Trop tard pour la livraison ? Un bon cadeau à imprimer et à mettre sous le sapin : la personne choisit son style et envoie sa photo après Noël. −10 % sur le bon.' },
    deco: { en: 'Snow huts (kamakura) light up in the north.', fr: 'Des huttes de neige (kamakura) s’allument dans le nord.' },
    savais: { en: 'On the evening of December 31, on the Oga peninsula (Akita), masked demons, the Namahage, visit homes to scold lazy children.',
      fr: 'Le soir du 31 décembre, dans la péninsule d’Oga (Akita), des démons masqués, les Namahage, passent dans les maisons pour gronder les enfants paresseux.' } },
  { j: 18, k: 'telecharger', lieu: 'saiko-iyashi-no-sato-nenba', pret: false,
    cadeau: { en: 'Gift tags', fr: 'Les étiquettes cadeaux', ja: 'ギフトタグ' },
    texte: { en: 'Tags to print for your gifts (Fuji, a daruma, a crane, a Nara deer), and how to wrap a gift in cloth, the Japanese way.',
      fr: 'Des étiquettes à imprimer pour tes cadeaux (le Fuji, un daruma, une grue, un cerf de Nara), et comment emballer un cadeau dans un tissu, à la japonaise.' },
    deco: { en: 'Gifts pile up under the Christmas trees.', fr: 'Des cadeaux s’empilent au pied des sapins.' },
    savais: { en: 'In Japan, a gift is often wrapped in a knotted cloth, the furoshiki, which is used again.', fr: 'Au Japon, on emballe souvent un cadeau dans un tissu noué, le furoshiki, qui se réutilise.' } },
  { j: 19, k: 'balade', lieu: 'hirayu-waterfall', pret: false,
    cadeau: { en: 'The lantern', fr: 'La lanterne', ja: 'ちょうちん' },
    texte: { en: 'A lit paper lantern to hold in the hand, like the Tottori parasol.', fr: 'Une lanterne en papier allumée, à tenir à la main, comme l’ombrelle de Tottori.' },
    deco: { en: 'The frozen waterfalls light up at night.', fr: 'Les cascades gelées s’illuminent la nuit.' },
    savais: { en: 'In February, the great frozen Hirayu waterfall is lit up at night for its festival.', fr: 'En février, la grande cascade gelée de Hirayu est illuminée la nuit, pendant sa fête.' } },
  { j: 20, k: 'telecharger', lieu: 'ghost-bridge', pret: true, special: 'fond',
    cadeau: { en: 'Wallpaper: Christmas night over Japan', fr: 'Fond d’écran : la nuit de Noël sur le Japon', ja: '壁紙：クリスマスの夜の日本' },
    texte: { en: 'All of Japan at night, the places and the cities lit up, made with the map set to the night of December 24.',
      fr: 'Tout le Japon la nuit, les lieux et les villes allumés, fait avec la carte réglée sur la nuit du 24 décembre.' },
    deco: { en: 'All of Japan shines at night.', fr: 'Tout le Japon brille la nuit.' },
    savais: { en: 'In winter the lake freezes, and you can walk on the ice to the old bridge.', fr: 'L’hiver, le lac gèle, et l’on peut marcher sur la glace jusqu’au vieux pont.' } },
  { j: 21, k: 'boutique', lieu: 'tsuru-no-maihashi-bridge', pret: false, code: 'CALENDRIER21',
    cadeau: { en: 'Valentine’s Day in advance', fr: 'La Saint-Valentin en avance', ja: 'ひと足早いバレンタイン' },
    texte: { en: 'A code for a second face on the same portrait, free. From January 1 to February 14, for the first 10 orders.',
      fr: 'Un code pour un deuxième visage offert sur le même tableau. Du 1er janvier au 14 février, pour les 10 premières commandes.' },
    deco: { en: 'Two cranes dance over the bridge.', fr: 'Deux grues dansent au-dessus du pont.' },
    savais: { en: 'Its name means « the dance of the cranes ». In Japan the crane, which keeps the same mate all its life, brings luck to couples.',
      fr: 'Son nom veut dire « la danse des grues ». Au Japon, la grue, qui garde le même compagnon toute sa vie, porte bonheur aux couples.' } },
  { j: 22, k: 'carte', lieu: 'the-hells-of-beppu', pret: false,
    cadeau: { en: 'The yuzu bath', fr: 'Le bain de yuzu', ja: 'ゆず湯' },
    texte: { en: 'It is Tōji, the shortest day of the year in Japan. Yuzu float in the map’s hot springs: find them all to win a koban for Bunbuku’s shop.',
      fr: 'C’est Tōji, le jour le plus court de l’année au Japon. Des yuzus flottent dans les onsens de la carte : trouve-les tous pour gagner un koban pour la boutique de Bunbuku.' },
    deco: { en: 'Yuzu float in the hot springs.', fr: 'Des yuzus flottent dans les onsens.' },
    savais: { en: 'On the winter solstice, the Japanese take a bath with yuzu and eat pumpkin, to get through winter without falling ill.',
      fr: 'Le jour du solstice, les Japonais prennent un bain avec des yuzus et mangent du potiron, pour passer l’hiver sans tomber malade.' } },
  { j: 23, k: 'telecharger', lieu: 'fujisan-hongu-sengen-taisha', pret: false,
    cadeau: { en: 'The Japanese Christmas cake recipe', fr: 'La recette du gâteau de Noël japonais', ja: 'クリスマスケーキのレシピ' },
    texte: { en: 'Japan’s Christmas cake, a sponge with whipped cream and strawberries, as a card to print.', fr: 'Le gâteau de Noël du Japon, une génoise avec de la crème fouettée et des fraises, en fiche à imprimer.' },
    deco: { en: 'The sleigh gets ready in Nara.', fr: 'Le traîneau se prépare à Nara.' },
    savais: { en: 'On the evening of the 24th, many Japanese families eat fried chicken: a habit born from a 1974 advert.', fr: 'Le soir du 24, beaucoup de familles japonaises mangent du poulet frit : une habitude née d’une publicité de 1974.' } },
  { j: 24, k: 'carte', lieu: 'muro-ji', pret: false, grande: true,
    cadeau: { en: 'Christmas night', fr: 'La nuit de Noël', ja: 'クリスマスの夜' },
    texte: { en: 'Santa’s sleigh, pulled by Nara deer, crosses the sky of the map. Six Jizō statues wait under the snow: give them a straw hat, as in the tale, and they bring you the last gift, the Santa hat that completes the winter outfit of the walk.',
      fr: 'Le traîneau du Père Noël, tiré par des cerfs de Nara, traverse le ciel de la carte. Six statues Jizō attendent sous la neige : pose-leur un chapeau de paille, comme dans le conte, et elles t’apportent le dernier cadeau, le bonnet de Père Noël qui complète la tenue d’hiver de la balade.' },
    deco: { en: 'The sleigh crosses the sky of the map.', fr: 'Le traîneau traverse le ciel de la carte.' },
    savais: { en: 'In the tale « Kasa Jizō », a poor old man covers six snowy statues with his straw hats. At night, they bring him what he needs to celebrate the New Year.',
      fr: 'Dans le conte « Kasa Jizō », un vieil homme pauvre couvre six statues enneigées avec ses chapeaux de paille. La nuit, elles viennent lui apporter de quoi fêter le Nouvel An.' } },
];

// ---------------------------------------------------------------- Le prénom en katakana (repris de la boutique Inkami)
const PRENOMS = { ema: 'エマ', emma: 'エマ', mathis: 'マティス', matis: 'マティス', matisse: 'マティス', lucas: 'リュカ', lea: 'レア', leo: 'レオ', hugo: 'ユゴー', louis: 'ルイ', chloe: 'クロエ', camille: 'カミーユ', thomas: 'トマ', julie: 'ジュリー', marie: 'マリー', paul: 'ポール', sarah: 'サラ', sara: 'サラ', nathan: 'ナタン', alice: 'アリス', antoine: 'アントワーヌ', jules: 'ジュール', manon: 'マノン', ines: 'イネス', tom: 'トム', noah: 'ノア', gabriel: 'ガブリエル', adam: 'アダム', raphael: 'ラファエル', arthur: 'アルチュール', john: 'ジョン', sophie: 'ソフィー', laura: 'ローラ', anna: 'アンナ', david: 'ダヴィッド', nicolas: 'ニコラ', pierre: 'ピエール', jean: 'ジャン', clara: 'クララ', zoe: 'ゾエ', lina: 'リナ', mia: 'ミア', sam: 'サム', emily: 'エミリー', james: 'ジェームズ', louise: 'ルイーズ' };
const RANGEES = { k: 'カキクケコ', g: 'ガギグゲゴ', s: 'サシスセソ', z: 'ザジズゼゾ', n: 'ナニヌネノ', h: 'ハヒフヘホ', b: 'バビブベボ', p: 'パピプペポ', m: 'マミムメモ', r: 'ラリルレロ', l: 'ラリルレロ', y: 'ヤイユエヨ', t: ['タ', 'ティ', 'トゥ', 'テ', 'ト'], d: ['ダ', 'ディ', 'ドゥ', 'デ', 'ド'], f: ['ファ', 'フィ', 'フ', 'フェ', 'フォ'], v: ['ヴァ', 'ヴィ', 'ヴ', 'ヴェ', 'ヴォ'], j: ['ジャ', 'ジ', 'ジュ', 'ジェ', 'ジョ'], w: ['ワ', 'ウィ', 'ウ', 'ウェ', 'ウォ'], c: ['シャ', 'シ', 'シュ', 'シェ', 'ショ'] };
const FINALES = { k: 'ク', g: 'グ', s: 'ス', z: 'ズ', n: 'ン', b: 'ブ', p: 'プ', m: 'ム', r: 'ル', l: 'ル', t: 'ト', d: 'ド', f: 'フ', v: 'ヴ', j: 'ジュ', c: 'シュ' };
export function enKatakana(brut) {
  const n = String(brut).trim();
  if (!n) return '';
  if (/[぀-ヿ㐀-鿿]/.test(n)) return n;
  let s = n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const connu = PRENOMS[s.replace(/[^a-z]/g, '')];
  if (connu) return connu;
  s = s.replace(/[^a-z]/g, '').replace(/eau|au/g, 'o').replace(/ou/g, 'u').replace(/ai|ei/g, 'e').replace(/ch|sh/g, 'C').replace(/ph/g, 'f')
    .replace(/th/g, 't').replace(/qu|q/g, 'k').replace(/x/g, 'ks').replace(/c(?=[ei])/g, 's').replace(/c/g, 'k').replace(/C/g, 'c')
    .replace(/y(?![aeou])/g, 'i').replace(/(.)\1/g, '$1').replace(/e$/, '');
  const V = 'aiueo';
  let r = '';
  for (let i = 0; i < s.length; i++) {
    const a = s[i], b = s[i + 1];
    if (V.includes(a)) { r += 'アイウエオ'[V.indexOf(a)]; continue; }
    if (b && V.includes(b) && RANGEES[a]) { r += RANGEES[a][V.indexOf(b)]; i++; continue; }
    if (FINALES[a]) r += FINALES[a];
  }
  return r;
}
const PETITES = new Set('ァィゥェォャュョッヮ');
const taillePinceau = (k, max, place) => Math.min(max, Math.floor(place / Math.max(1, [...k].length)));

// ---------------------------------------------------------------- La mémoire
function lire(cle, defaut) {
  try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; }
}
function garder(cle, valeur) {
  try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch { /* pas grave */ }
}
const creer = (balise, classe, texte) => {
  const el = document.createElement(balise);
  if (classe) el.className = classe;
  if (texte != null) el.textContent = texte;
  return el;
};

/**
 * outils (app.js) : { langue(), afficherMessage, lieux(), allerAuLieu(l), enLangue, fermerPanneau (celui du
 * calendrier), estDev(), config (CONFIG.noel) }. Renvoie { allumer(), eteindre(), majLangue(), remplirPanneau() }.
 */
export function brancherNoel(outils) {
  const { langue, afficherMessage, lieux, allerAuLieu, enLangue, fermerPanneau, estDev, config } = outils;
  const typo = (s) => (langue() === 'fr' ? typoFr(s) : s);
  const tx = (cle, ...args) => {
    const v = TEXTES[langue()]?.[cle] ?? TEXTES.en[cle];
    return typo(typeof v === 'function' ? v(...args) : v);
  };
  const enL = (o) => typo(o?.[langue()] || o?.en || '');
  const bouton = document.getElementById('btn-noel');
  const panneau = document.getElementById('panneau-noel');
  const sansMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let allume = false;
  let simule = null; // mode développeur : le jour simulé (1 à 24), sinon null
  let choisie = null; // la case montrée sous les portes
  let prenom = lire(MEMOIRE_PRENOM, '') || '';

  /** Le jour du calendrier chez le visiteur : 0 avant le 1er décembre, 1 à 24, 25 ensuite (tout est ouvert). */
  function jourReel() {
    const [a, m, j] = config.debut.split('-').map(Number);
    const maintenant = new Date();
    const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    const n = Math.round((aujourdhui - new Date(a, m - 1, j)) / 86400000) + 1;
    return Math.max(0, Math.min(25, n));
  }
  /** En mode développeur avant le 1er décembre, le calendrier se voit comme le 24 (tout s'ouvre) ; sinon le vrai jour. */
  function jour() {
    if (estDev() && simule) return simule;
    return jourReel();
  }
  const cleMemoire = () => (estDev() && simule ? MEMOIRE_ESSAI : MEMOIRE);
  const ouvertes = () => new Set(lire(cleMemoire(), []).filter((j) => j >= 1 && j <= 24));
  function marquerOuverte(j) {
    const o = ouvertes();
    o.add(j);
    garder(cleMemoire(), [...o].sort((a, b) => a - b));
    majPoint();
  }

  /** Le point rouge du bouton : la case du jour n'est pas encore ouverte. */
  function majPoint() {
    const j = jour();
    bouton.classList.toggle('a-ouvrir', j >= 1 && j <= 24 && !ouvertes().has(j));
  }

  // ---- La feuille de style, avant de rien montrer
  let feuille = null;
  function chargerFeuille() {
    feuille ??= new Promise((ok) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'noel.css';
      l.onload = l.onerror = ok;
      document.head.append(l);
    });
    return feuille;
  }

  // ---------------------------------------------------------------- Le panneau
  function remplirPanneau() {
    if (estDev() && !simule && jourReel() === 0) simule = 24; // avant décembre, le propriétaire voit tout
    const j = jour();
    const o = ouvertes();
    panneau.innerHTML = '';
    const tete = creer('div', 'noel-tete');
    tete.innerHTML = `${ICONE_CADEAU}<div><p class="hasard-titre">${echapper(tx('titre'))}</p><p class="noel-sous">${echapper(tx('sousTitre'))}</p></div>`;
    panneau.append(tete);
    if (j === 0) panneau.append(creer('p', 'legendes-info', tx('avant')));

    const portes = creer('div', 'noel-portes');
    for (const c of CASES) {
      const b = creer('button', 'porte');
      b.type = 'button';
      b.dataset.j = c.j;
      b.dataset.k = c.k;
      if (c.grande) b.classList.add('grande');
      const fermee = c.j > j;
      const ouverte = o.has(c.j) && !fermee;
      if (fermee) { b.classList.add('a-cle'); b.setAttribute('aria-disabled', 'true'); }
      if (ouverte) b.classList.add('ouverte');
      if (c.j === j && !ouverte) b.classList.add('du-jour');
      if (choisie === c.j && ouverte) b.classList.add('choisie');
      b.setAttribute('aria-label', fermee ? tx('fermee', c.j) : ouverte ? tx('voir', c.j, enL(c.cadeau)) : tx('ouvrir', c.j));
      b.innerHTML = `<span class="dedans"><span class="num-petit">${c.j}</span>${svg(ICONES[c.k])}</span>
        <span class="battant"><span class="num">${c.j}</span></span>`;
      b.addEventListener('click', () => {
        if (c.j > jour()) { afficherMessage(tx('pasEncore', c.j)); return; }
        const deja = ouvertes().has(c.j);
        if (!deja) marquerOuverte(c.j);
        choisie = c.j;
        if (!deja && !sansMouvement) {
          b.classList.add('ouverte'); // le battant pivote, puis la case s'affiche dessous
          setTimeout(() => { remplirPanneau(); montrerCase(); }, 550);
        } else { remplirPanneau(); montrerCase(); }
      });
      portes.append(b);
    }
    panneau.append(portes);

    if (estDev()) {
      const dev = creer('div', 'noel-dev');
      dev.innerHTML = `<label for="noel-jour">${echapper(tx('devJour'))} <output id="noel-jour-dit">${echapper(tx('date', j || 1))}</output></label>
        <input type="range" id="noel-jour" min="1" max="24" value="${j >= 1 && j <= 24 ? j : 24}">
        <p>${echapper(tx('devNote'))}</p>`;
      const r = dev.querySelector('input');
      r.addEventListener('input', () => { simule = Number(r.value); dev.querySelector('output').textContent = tx('date', simule); });
      r.addEventListener('change', () => { choisie = null; remplirPanneau(); majPoint(); });
      const refermer = creer('button', 'btn-secondaire', tx('devRefermer'));
      refermer.type = 'button';
      refermer.addEventListener('click', () => { garder(cleMemoire(), []); choisie = null; remplirPanneau(); majPoint(); });
      dev.append(refermer);
      panneau.append(dev);
    }

    const c = CASES.find((x) => x.j === choisie);
    if (c && o.has(c.j) && c.j <= j) panneau.append(ficheCase(c));
  }

  function montrerCase() {
    panneau.querySelector('.noel-case')?.scrollIntoView({ behavior: sansMouvement ? 'auto' : 'smooth', block: 'nearest' });
  }

  /** Le contenu d'une case ouverte : le cadeau, le lieu, la décoration, le « Le savais-tu ? ». */
  function ficheCase(c) {
    const s = creer('section', 'noel-case');
    s.dataset.k = c.k;
    s.innerHTML = `<p class="noel-date">${echapper(tx('date', c.j))}</p>
      <h3>${echapper(enL(c.cadeau))}</h3>
      <span class="noel-sorte">${svg(ICONES[c.k])}${echapper(tx('sortes')[c.k])}</span>
      <p>${echapper(enL(c.texte))}</p>`;
    if (c.special === 'prenom') s.append(blocPrenom());
    if (c.special === 'fond') s.append(blocFond());
    if (c.code) s.append(blocCode(c));
    if (!c.pret && estDev()) s.append(creer('p', 'noel-preparation', tx('enPreparation')));

    const l = lieux().find((x) => x.id === c.lieu);
    if (l) {
      const b = creer('div', 'noel-bloc');
      b.append(creer('span', 'noel-etiquette', tx('lieu')), creer('span', 'noel-lieu', enLangue(l.nom)));
      const aller = creer('button', 'noel-aller', tx('allerLieu'));
      aller.type = 'button';
      aller.addEventListener('click', () => { fermerPanneau(); allerAuLieu(l); });
      b.append(aller);
      s.append(b);
    }
    const d = creer('div', 'noel-bloc');
    d.append(creer('span', 'noel-etiquette', tx('surCarte')), creer('span', null, enL(c.deco)));
    const f = creer('div', 'noel-bloc');
    f.append(creer('span', 'noel-etiquette', tx('savais')), creer('span', null, enL(c.savais)));
    s.append(d, f);
    return s;
  }

  // ---- Case 1 : le prénom en japonais, sur un fond d'écran
  function blocPrenom() {
    const div = creer('div', 'noel-prenom');
    const k = enKatakana(prenom) || 'エマ';
    div.innerHTML = `<div class="noel-champ"><label for="noel-prenom">${echapper(tx('prenom'))}</label>
        <input id="noel-prenom" type="text" maxlength="14" autocomplete="off" spellcheck="false" value="${echapper(prenom)}" placeholder="Emma">
        <small>${echapper(tx('prenomAide'))}</small></div>
      <div class="noel-telephone" aria-hidden="true"><div class="noel-papier">
        <span class="noel-kata" style="font-size:${taillePinceau(k, 46, 190)}px">${echapper(k)}</span>
        <span class="noel-latin">${echapper(prenom.trim() || 'Emma')}</span>
        <img class="noel-sceau" src="noel/sceau-inkami.png" alt=""><span class="noel-adresse">INKAMI.ART</span></div></div>`;
    const champ = div.querySelector('input');
    champ.addEventListener('input', () => {
      prenom = champ.value;
      garder(MEMOIRE_PRENOM, prenom);
      const kk = enKatakana(prenom) || 'エマ';
      const kata = div.querySelector('.noel-kata');
      kata.textContent = kk;
      kata.style.fontSize = `${taillePinceau(kk, 46, 190)}px`;
      div.querySelector('.noel-latin').textContent = prenom.trim() || 'Emma';
      fichier = null;
    });
    let fichier = null;
    const b = creer('button', 'btn-lancer', tx('fondTelecharger'));
    b.type = 'button';
    b.addEventListener('click', async () => {
      b.disabled = true;
      try {
        fichier ??= await fondPrenom(prenom.trim() || 'Emma');
        if (!(await partagerFichier(fichier, tx('fondTexte')))) telecharger(fichier);
      } catch (e) {
        console.warn('Fond d’écran impossible', e);
      } finally { b.disabled = false; }
    });
    div.append(b);
    return div;
  }

  /** Le fond d'écran du prénom : 1170 × 2532 (un téléphone), papier de journal, katakana au pinceau, sceau Inkami. */
  async function fondPrenom(nom) {
    const k = enKatakana(nom) || 'エマ';
    const L = 1170, H = 2532;
    await document.fonts.load(`200px ${POLICE_PINCEAU}`, k);
    const [grain, sceau] = await Promise.all([chargerImage(adresseGrain()), chargerImage('noel/sceau-inkami.png')]);
    const can = document.createElement('canvas');
    can.width = L; can.height = H;
    const c = can.getContext('2d');
    c.fillStyle = '#ece0d0';
    c.fillRect(0, 0, L, H);
    const motif = c.createPattern(grain, 'repeat');
    motif.setTransform(new DOMMatrix().scale(3));
    c.fillStyle = motif;
    c.fillRect(0, 0, L, H);
    const v = c.createRadialGradient(L / 2, H / 2, H * 0.25, L / 2, H / 2, H * 0.62);
    v.addColorStop(0, 'rgba(120, 90, 50, 0)');
    v.addColorStop(1, 'rgba(120, 90, 50, 0.22)');
    c.fillStyle = v;
    c.fillRect(0, 0, L, H);

    // les katakana, en colonne, dans le bas des deux tiers (le haut reste à l'heure de l'écran verrouillé)
    const signes = [...k];
    const t = taillePinceau(k, 300, 1300);
    c.fillStyle = '#15100e';
    c.font = `${t}px ${POLICE_PINCEAU}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const y0 = H * 0.58 - ((signes.length - 1) * t) / 2;
    signes.forEach((s, i) => {
      c.save();
      c.translate(L / 2, y0 + i * t);
      if (s === 'ー') c.rotate(Math.PI / 2); // le trait d'allongement se met debout dans une colonne
      if (PETITES.has(s)) c.translate(t * 0.12, -t * 0.12); // les petits kana vont en haut à droite de leur case
      c.fillText(s, 0, 0);
      c.restore();
    });
    // le prénom en lettres, le sceau, l'adresse
    c.font = '600 44px "Noto Sans", sans-serif';
    if ('letterSpacing' in c) c.letterSpacing = '14px';
    c.fillText(nom.toUpperCase(), L / 2, y0 + signes.length * t + 40);
    if ('letterSpacing' in c) c.letterSpacing = '5px';
    c.font = '600 26px "Noto Sans", sans-serif';
    c.globalAlpha = 0.6;
    c.textAlign = 'left';
    c.fillText('INKAMI.ART', 96, H - 120);
    c.globalAlpha = 1;
    c.save();
    c.translate(L - 170, H - 170);
    c.rotate(-0.07);
    const ls = 140, hs = (sceau.naturalHeight / sceau.naturalWidth) * ls;
    c.drawImage(sceau, -ls / 2, -hs / 2, ls, hs);
    c.restore();
    const blob = await new Promise((ok) => can.toBlob(ok, 'image/png'));
    const nomFichier = `prenom-japonais-${nom.normalize('NFD').replace(/[^\w-]/g, '').toLowerCase() || 'noel'}.png`;
    return new File([blob], nomFichier, { type: 'image/png' });
  }

  // ---- Case 20 : le fond d'écran de la nuit de Noël (une image faite une fois avec la carte)
  function blocFond() {
    const div = creer('div', 'noel-fond');
    div.innerHTML = '<img src="noel/fond-nuit-de-noel-apercu.jpg" alt="" width="150" height="324">';
    const b = creer('button', 'btn-lancer', tx('fondTelecharger'));
    b.type = 'button';
    b.addEventListener('click', async () => {
      b.disabled = true;
      try {
        const r = await fetch('noel/fond-nuit-de-noel.jpg');
        const f = new File([await r.blob()], 'nuit-de-noel-japon.jpg', { type: 'image/jpeg' });
        if (!(await partagerFichier(f, tx('fondTexte')))) telecharger(f);
      } catch (e) {
        console.warn('Fond d’écran impossible', e);
      } finally { b.disabled = false; }
    });
    div.append(b);
    return div;
  }

  // ---- Les cases de la boutique Inkami : le code et le lien
  function blocCode(c) {
    const div = creer('div', 'noel-code');
    const code = creer('span', 'noel-code-texte', c.code);
    const copier = creer('button', 'btn-secondaire', tx('copier'));
    copier.type = 'button';
    copier.addEventListener('click', () => {
      navigator.clipboard?.writeText(c.code).then(() => afficherMessage(tx('copie')), () => {});
    });
    const p = creer('p', 'noel-code-ligne');
    p.append(creer('span', 'noel-etiquette', tx('code')), code, copier);
    const lien = creer('a', 'btn-lancer noel-boutique', tx('boutiqueAller'));
    lien.href = `${BOUTIQUE}&utm_content=case${c.j}`;
    lien.target = '_blank';
    lien.rel = 'noopener';
    div.append(p, lien);
    if (estDev()) div.append(creer('p', 'noel-preparation', tx('codeAFaire')));
    return div;
  }

  // ---------------------------------------------------------------- Allumer, éteindre
  async function allumer() {
    if (allume) return;
    allume = true;
    await chargerFeuille();
    if (!allume) return;
    document.body.classList.add('noel');
    bouton.hidden = false;
    majLangue();
  }

  function eteindre() {
    if (!allume) return;
    allume = false;
    document.body.classList.remove('noel');
    fermerPanneau();
    bouton.hidden = true;
    simule = null;
  }

  function majLangue() {
    document.getElementById('txt-noel').textContent = tx('bouton');
    bouton.title = tx('titre');
    majPoint();
    if (!panneau.hidden) remplirPanneau();
  }

  return { allumer, eteindre, majLangue, remplirPanneau, majPoint, actif: () => allume };
}
