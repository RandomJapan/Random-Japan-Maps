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

  // --- Caméra au démarrage -------------------------------------------
  camera: {
    ordinateur: { centre: [137.3, 36.7], zoom: 5.05, inclinaison: 52, orientation: -45 },
    telephone: { centre: [136.0, 35.6], zoom: 4.0, inclinaison: 42, orientation: -12 },
    // centre = [longitude, latitude] ; inclinaison : 0 = vu du dessus, 70 = presque à l'horizontale
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

  // --- Couleurs --------------------------------------------------------
  couleurs: {
    mer: '#0c1823',
    ciel: '#1d3244',
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
    fermer: 'Close',
    chargement: 'Loading the map…',
    suivre: 'Follow on TikTok',
    aide: 'Drag to move · Right-click or 2 fingers to rotate & tilt',
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
    fermer: 'Fermer',
    chargement: 'Chargement de la carte…',
    suivre: 'Suivre sur TikTok',
    aide: 'Glisser pour bouger · Clic droit ou 2 doigts pour tourner et incliner',
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
    fermer: '閉じる',
    chargement: '地図を読み込み中…',
    suivre: 'TikTokをフォロー',
    aide: 'ドラッグで移動・右クリックまたは2本指で回転と傾き',
  },
};
