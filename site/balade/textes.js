// ================================================================
//  Les textes de l'interface de la balade, en anglais, français et japonais. La langue est celle de la
//  carte (localStorage.langue, sinon celle du navigateur). Les textes des lieux (panneaux, passants,
//  tampons) sont dans le module de chaque lieu.
// ================================================================

export const LANGUES = ['en', 'fr', 'ja'];

export function choisirLangue() {
  try {
    const memo = localStorage.getItem('langue');
    if (LANGUES.includes(memo)) return memo;
  } catch { /* navigation privée : pas grave */ }
  for (const l of navigator.languages?.length ? navigator.languages : [navigator.language || 'en']) {
    const court = String(l).slice(0, 2).toLowerCase();
    if (LANGUES.includes(court)) return court;
  }
  return 'en';
}

export const TEXTES = {
  en: {
    titrePage: '3D walk', retour: 'Back to the map', carnet: 'Stamp book', menu: 'Menu', fermer: 'Close',
    aideOrdi: 'WASD or arrows: walk · Shift: run · E or Space: talk · drag: camera',
    aideTel: 'Joystick: walk · A: talk · slide: camera',
    parler: 'Talk', lire: 'Read', tamponner: 'Stamp', regarder: 'Look', toucher: 'Touch', prier: 'Pray', caresser: 'Pet',
    oui: 'Yes', non: 'No', garcon: 'Boy', fille: 'Girl', kon: 'Kon',
    tamponObtenu: (nom) => `You got the “${nom}” stamp!`,
    dejaTampon: 'You already have this stamp in your book.',
    carnetTitre: 'Stamp book', carnetCompte: (n, total) => `${n} / ${total} stamps`,
    carnetVide: 'Not found yet', carnetComplet: 'All the stamps of this place: well done!',
    menuVoyageur: 'Change traveller', menuLieu: 'Go to', menuSon: 'Sound', menuMusique: 'Music', menuLangue: 'Language', menuCarte: 'Back to the map',
    sonOui: 'On', sonNon: 'Off',
    videoTitre: (lieu) => `My video of ${lieu}`, videoFermer: 'Back to the walk',
    videoErreur: 'TikTok’s player could not start here.', videoSurTikTok: 'Watch it on TikTok', videoReessayer: 'Try again',
    videoLien: 'Video not starting? Watch it on TikTok',
    chargement: 'Loading…',
    // le renard, au départ et quand on lui parle
    konBonjour: (lieu) => [`Hello, hello! Welcome to ${lieu}!`, 'I am Kon, the messenger fox of Inari.', 'Tell me… are you a boy or a girl?'],
    konRetour: (lieu) => [`Welcome back to ${lieu}!`, 'Shall we go? I am right behind you.'],
    konParti: (n) => ['Perfect! Let’s explore together.', 'Talk to people and read the signs…', `…and find the ${n} stamps of this place!`],
    konIndice: 'Kon sniffs the air…', konOu: (ou) => `“A stamp… ${ou}!”`,
    konTout: ['You found every stamp here!', 'Shall we visit another place? Open the menu.'],
    herbes: 'A wild deer appeared!', herbesFuit: 'The deer ran away…',
  },
  fr: {
    titrePage: 'Balade en 3D', retour: 'Retour à la carte', carnet: 'Carnet de tampons', menu: 'Menu', fermer: 'Fermer',
    aideOrdi: 'ZQSD ou flèches : marcher · Maj : courir · E ou Espace : parler · glisser : caméra',
    aideTel: 'Joystick : marcher · A : parler · glisser : caméra',
    parler: 'Parler', lire: 'Lire', tamponner: 'Tamponner', regarder: 'Regarder', toucher: 'Toucher', prier: 'Prier', caresser: 'Caresser',
    oui: 'Oui', non: 'Non', garcon: 'Garçon', fille: 'Fille', kon: 'Kon',
    tamponObtenu: (nom) => `Tu obtiens le tampon « ${nom} » !`,
    dejaTampon: 'Tu as déjà ce tampon dans ton carnet.',
    carnetTitre: 'Carnet de tampons', carnetCompte: (n, total) => `${n} / ${total} tampons`,
    carnetVide: 'Pas encore trouvé', carnetComplet: 'Tous les tampons de ce lieu : bravo !',
    menuVoyageur: 'Changer de voyageur', menuLieu: 'Aller à', menuSon: 'Son', menuMusique: 'Musique', menuLangue: 'Langue', menuCarte: 'Retour à la carte',
    sonOui: 'Oui', sonNon: 'Non',
    videoTitre: (lieu) => `Ma vidéo ${/^[aeiouyhâéèêîôû]/i.test(lieu) ? 'd’' : 'de '}${lieu}`, videoFermer: 'Retour à la balade',
    videoErreur: 'Le lecteur de TikTok n’a pas pu démarrer ici.', videoSurTikTok: 'La voir sur TikTok', videoReessayer: 'Réessayer',
    videoLien: 'La vidéo ne se lance pas ? La voir sur TikTok',
    chargement: 'Chargement…',
    konBonjour: (lieu) => [`Bonjour, bonjour ! Bienvenue à ${lieu} !`, 'Je suis Kon, le renard messager d’Inari.', 'Dis-moi… es-tu un garçon ou une fille ?'],
    konRetour: (lieu) => [`Te revoilà à ${lieu} !`, 'On y va ? Je te suis.'],
    konParti: (n) => ['Parfait ! Explorons ensemble.', 'Parle aux gens, lis les panneaux…', `… et trouve les ${n} tampons de ce lieu !`],
    konIndice: 'Kon renifle l’air…', konOu: (ou) => `« Un tampon… ${ou} ! »`,
    konTout: ['Tu as trouvé tous les tampons d’ici !', 'On visite un autre lieu ? Ouvre le menu.'],
    herbes: 'Un daim sauvage apparaît !', herbesFuit: 'Le daim s’est enfui…',
  },
  ja: {
    titrePage: '3Dおさんぽ', retour: '地図にもどる', carnet: 'スタンプ帳', menu: 'メニュー', fermer: 'とじる',
    aideOrdi: 'WASD・矢印：あるく　Shift：はしる　E・スペース：はなす　ドラッグ：カメラ',
    aideTel: 'スティック：あるく　A：はなす　スライド：カメラ',
    parler: 'はなす', lire: 'よむ', tamponner: 'おす', regarder: 'みる', toucher: 'さわる', prier: 'おまいり', caresser: 'なでる',
    oui: 'はい', non: 'いいえ', garcon: 'おとこのこ', fille: 'おんなのこ', kon: 'コン',
    tamponObtenu: (nom) => `「${nom}」のスタンプを　てにいれた！`,
    dejaTampon: 'このスタンプは　もう　もっている。',
    carnetTitre: 'スタンプ帳', carnetCompte: (n, total) => `${n} / ${total} こ`,
    carnetVide: 'まだ　みつけていない', carnetComplet: 'ここのスタンプを　ぜんぶ　あつめた！',
    menuVoyageur: 'たびびとを　かえる', menuLieu: 'いどう', menuSon: 'おと', menuMusique: 'おんがく', menuLangue: 'ことば', menuCarte: '地図にもどる',
    sonOui: 'オン', sonNon: 'オフ',
    videoTitre: (lieu) => `${lieu}の　どうが`, videoFermer: 'おさんぽに　もどる',
    videoErreur: 'TikTokの　プレーヤーが　うごかなかった。', videoSurTikTok: 'TikTokで　みる', videoReessayer: 'もういちど',
    videoLien: 'うごかない　ときは　TikTokで　みる',
    chargement: 'よみこみちゅう…',
    konBonjour: (lieu) => [`こんにちは！　${lieu}へ　ようこそ！`, 'ぼくは　コン。おいなりさまの　つかいの　キツネだよ。', 'ところで……　きみは　おとこのこ？　それとも　おんなのこ？'],
    konRetour: (lieu) => [`おかえり！　${lieu}だよ！`, 'さあ、いこう。ぼくも　ついていくよ。'],
    konParti: (n) => ['よし！　いっしょに　たんけんしよう。', 'ひとに　はなしかけたり、かんばんを　よんだり……', `……ここの　スタンプを　${n}こ　あつめよう！`],
    konIndice: 'コンが　はなを　くんくん……', konOu: (ou) => `「スタンプは……${ou}！」`,
    konTout: ['ここの　スタンプは　ぜんぶ　あつめたね！', 'ほかの　ばしょにも　いってみる？　メニューを　ひらいてね。'],
    herbes: 'あっ！　やせいの　シカが　とびだしてきた！', herbesFuit: 'シカは　にげていった……',
  },
};
