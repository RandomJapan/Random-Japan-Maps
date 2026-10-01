// ================================================================
//  RÉGLAGES DE LA CARTE — c'est le seul fichier à modifier à la main.
//  (Les lieux, eux, se changent dans le tableau Google Sheets.)
// ================================================================

export const CONFIG = {
  // --- Le tableau Google Sheets --------------------------------------
  // Liens « Publier sur le Web » au format CSV, un par onglet.
  // Si c'est vide ou si Google ne répond pas, la carte utilise la copie de secours.
  tableau: {
    lieux: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTUzT0fUpIabpe865yMnXNPRU01WFUpoSA2ojpIIneR8K7e8pneCoWqNEXlj6wAUVWMLvgdL0WJe0Ow/pub?single=true&output=csv&gid=602979846',
    categories: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTUzT0fUpIabpe865yMnXNPRU01WFUpoSA2ojpIIneR8K7e8pneCoWqNEXlj6wAUVWMLvgdL0WJe0Ow/pub?single=true&output=csv&gid=2078332808',
  },
  secours: {
    lieux: 'data/secours-lieux.csv',
    categories: 'data/secours-categories.csv',
  },

  // --- Infos générales ------------------------------------------------
  titre: 'Random Japan Place',
  tiktokProfil: 'https://www.tiktok.com/@random_japan_place',
  logo: 'img/logo.jpg', // ton logo (fabriqué par outils/preparer_logo.py) ; mettre '' pour ne pas en afficher

  // --- Compteur de visites (GoatCounter) ------------------------------
  // Le code de ton compte GoatCounter (le début de l'adresse : « monsite » pour monsite.goatcounter.com).
  // Chaque visite y est comptée, et le total s'affiche en haut de la carte sur ordinateur.
  // Mettre '' pour ne rien compter ni afficher.
  goatcounter: '',

  // --- Caméra au démarrage -------------------------------------------
  camera: {
    ordinateur: { centre: [137.3, 36.7], zoom: 5.05, inclinaison: 52, orientation: -45 },
    // Sur téléphone, le Japon est tourné pour tenir debout dans l'écran (du Kyūshū en bas à Hokkaidō en haut)
    telephone: { centre: [137.6, 37.3], zoom: 4.5, inclinaison: 40, orientation: 38 },
    // centre = [longitude, latitude] ; inclinaison : 0 = vu du dessus, 70 = presque à l'horizontale ;
    // orientation : direction de la boussole en haut de l'écran (0 = le nord)
    tourneToutSeul: true, // la carte tourne doucement au démarrage
    vitesseRotation: 2, // degrés par seconde
  },

  // --- Relief ----------------------------------------------------------
  // Hauteur des montagnes selon le zoom [zoom, exagération] :
  // vu de loin = très exagéré (effet maquette), vu de près = presque réel.
  relief: [
    [4, 34],
    [5.3, 30],
    [6.5, 16],
    [8, 6],
    [10, 2.5],
    [12, 1.5],
  ],

  // --- Couleurs (celles d'une vieille carte en relief) -------------------
  couleurs: {
    mer: '#8fbab2', // turquoise pâle et un peu passé, comme une vieille carte
    ciel: '#e9dcbd', // au-dessus de l'horizon : du parchemin…
    horizon: '#d3d6c0', // …qui pâlit vers l'horizon
    brume: '#c4d6cc', // voile clair sur la mer et les terres lointaines
  },
};

// ================================================================
//  TEXTES DU SITE DANS LES 3 LANGUES
// ================================================================
export const TEXTES = {
  en: {
    langue: 'English',
    sousTitre: 'Every place from my TikToks, in 3D',
    lieux: (n) => `${n} place${n > 1 ? 's' : ''}`,
    categories: 'Categories',
    chercher: 'Search a place…',
    tout: 'Show all',
    rien: 'Hide all',
    afficherSurCarte: 'Show on the map',
    voirLieux: 'See the places',
    aucunResultat: 'No place found',
    lireVideo: 'Play the video',
    voirTiktok: 'Watch on TikTok',
    itineraire: 'Directions',
    autreLien: 'More info',
    copierLien: 'Copy link',
    partager: 'Share',
    lienCopie: 'Link copied!',
    recentrer: 'Reset view',
    nord: 'Turn north up',
    fermer: 'Close',
    chargement: 'Loading the map…',
    suivre: 'Follow on TikTok',
    aide: 'Click a place to watch its video · Right-click to rotate & tilt',
    aideTel: 'Tap a place to watch its video',
    hasard: 'Random',
    hasardTitre: 'Let the dice pick your next place',
    region: 'Region',
    type: 'Type of place',
    partout: 'Anywhere in Japan',
    tousTypes: 'All types',
    toutLaRegion: (r) => `All of ${r}`,
    lancer: 'Roll the dice',
    possibles: (n) => `${n} possible place${n > 1 ? 's' : ''}`,
    aucunPossible: 'No place matches: try another region or type',
    unAutre: 'Another one',
    legendes: 'Legends',
    legendesTitre: 'Hidden legends',
    legendesInfo: (n, total) => `${n} of ${total} found. Zoom into each region of Japan to find the others!`,
    legendesToutes: (total) => `You found all ${total}. Well done!`,
    legendeTrouvee: (n, total) => `Legend found! ${n}/${total}`,
    legendeInconnue: 'Not found yet',
    legendeAria: (nom) => `Legend: ${nom}`,
    bravoTitre: 'Well done!',
    bravoTexte: (total) => `You found all ${total} hidden legends of Japan: yokai, heroes, gods and sea monsters.`,
    bravoBouton: 'Thank you!',
    visites: (n) => (n === 1 ? 'visit' : 'visits'),
    visitesInfo: 'Visits to the map (the total is updated every few hours)',
  },
  fr: {
    langue: 'Français',
    sousTitre: 'Tous les lieux de mes TikToks, en 3D',
    lieux: (n) => `${n} lieu${n > 1 ? 'x' : ''}`,
    categories: 'Catégories',
    chercher: 'Chercher un lieu…',
    tout: 'Tout afficher',
    rien: 'Tout masquer',
    afficherSurCarte: 'Afficher sur la carte',
    voirLieux: 'Voir les lieux',
    aucunResultat: 'Aucun lieu trouvé',
    lireVideo: 'Lire la vidéo',
    voirTiktok: 'Voir sur TikTok',
    itineraire: 'Itinéraire',
    autreLien: "Plus d'infos",
    copierLien: 'Copier le lien',
    partager: 'Partager',
    lienCopie: 'Lien copié !',
    recentrer: 'Recentrer',
    nord: 'Remettre le nord en haut',
    fermer: 'Fermer',
    chargement: 'Chargement de la carte…',
    suivre: 'Suivre sur TikTok',
    aide: 'Clique sur un lieu pour voir sa vidéo · Clic droit pour tourner et incliner',
    aideTel: 'Touche un lieu pour voir sa vidéo',
    hasard: 'Au hasard',
    hasardTitre: 'Laisse le dé choisir ton prochain lieu',
    region: 'Région',
    type: 'Type de lieu',
    partout: 'Partout au Japon',
    tousTypes: 'Tous les types',
    toutLaRegion: (r) => `Toute la région ${r}`,
    lancer: 'Lancer le dé',
    possibles: (n) => `${n} lieu${n > 1 ? 'x' : ''} possible${n > 1 ? 's' : ''}`,
    aucunPossible: 'Aucun lieu ne correspond : essaie une autre région ou un autre type',
    unAutre: 'Un autre !',
    legendes: 'Légendes',
    legendesTitre: 'Légendes cachées',
    legendesInfo: (n, total) => `${n} trouvée${n > 1 ? 's' : ''} sur ${total}. Zoome sur les régions du Japon pour trouver les autres !`,
    legendesToutes: (total) => `Les ${total} sont trouvées, bravo !`,
    legendeTrouvee: (n, total) => `Légende trouvée ! ${n}/${total}`,
    legendeInconnue: 'Pas encore trouvée',
    legendeAria: (nom) => `Légende : ${nom}`,
    bravoTitre: 'Bravo !',
    bravoTexte: (total) => `Tu as trouvé les ${total} légendes cachées du Japon : yokai, héros, dieux et monstres marins.`,
    bravoBouton: 'Merci !',
    visites: (n) => (n < 2 ? 'visite' : 'visites'),
    visitesInfo: 'Visites de la carte (le total se met à jour toutes les quelques heures)',
  },
  ja: {
    langue: '日本語',
    sousTitre: 'TikTokで紹介した場所を3Dマップで',
    lieux: (n) => `${n}か所`,
    categories: 'カテゴリー',
    chercher: '場所を検索…',
    tout: 'すべて表示',
    rien: 'すべて非表示',
    afficherSurCarte: '地図に表示',
    voirLieux: '場所を見る',
    aucunResultat: '見つかりませんでした',
    lireVideo: '動画を再生',
    voirTiktok: 'TikTokで見る',
    itineraire: 'ルート',
    autreLien: '詳細',
    copierLien: 'リンクをコピー',
    partager: '共有',
    lienCopie: 'コピーしました！',
    recentrer: '全体表示',
    nord: '北を上にする',
    fermer: '閉じる',
    chargement: '地図を読み込み中…',
    suivre: 'TikTokをフォロー',
    aide: '場所をクリックして動画を見よう・右クリックで回転と傾き',
    aideTel: '場所をタップして動画を見よう',
    hasard: 'ランダム',
    hasardTitre: 'サイコロで次の行き先を決めよう',
    region: '地域',
    type: '種類',
    partout: '日本全国',
    tousTypes: 'すべての種類',
    toutLaRegion: (r) => `${r}全域`,
    lancer: 'サイコロを振る',
    possibles: (n) => `候補：${n}か所`,
    aucunPossible: '該当する場所がありません。地域か種類を変えてみてください',
    unAutre: 'もう一度',
    legendes: '伝説',
    legendesTitre: '隠された伝説',
    legendesInfo: (n, total) => `${total}個中${n}個を発見。地方をズームして残りを探そう！`,
    legendesToutes: (total) => `${total}個すべて発見！おめでとう！`,
    legendeTrouvee: (n, total) => `伝説を発見！ ${n}/${total}`,
    legendeInconnue: 'まだ見つかっていません',
    legendeAria: (nom) => `伝説：${nom}`,
    bravoTitre: 'おめでとう！',
    bravoTexte: (total) => `日本に隠された${total}の伝説をすべて見つけました。妖怪、英雄、神々、海の怪物たち…`,
    bravoBouton: 'ありがとう！',
    visites: () => '回の訪問',
    visitesInfo: '地図の訪問数（数時間ごとに更新）',
  },
};
