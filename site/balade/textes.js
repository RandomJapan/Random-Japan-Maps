// ================================================================
//  Les textes de l'interface de la balade, en anglais, français et japonais. La langue est celle de la
//  carte (localStorage.langue, sinon celle du navigateur). Les textes des lieux (panneaux, passants,
//  tampons) sont dans le module de chaque lieu. compagnons : ce que dit chacun des trois compagnons (son nom, sa
//  description au moment de le choisir, son salut, ses indices) : chacun sa façon de parler.
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
    parler: 'Talk', lire: 'Read', tamponner: 'Stamp', regarder: 'Look', toucher: 'Touch', prier: 'Pray', caresser: 'Pet', asseoir: 'Sit', lever: 'Stand up', acheter: 'Buy',
    oui: 'Yes', non: 'No', garcon: 'Boy', fille: 'Girl',
    tamponObtenu: (nom) => `You got the “${nom}” stamp!`,
    dejaTampon: 'You already have this stamp in your book.',
    carnetTitre: 'Stamp book', carnetCompte: (n, total) => `${n} / ${total} stamps`,
    carnetVide: 'Not found yet', carnetComplet: 'All the stamps of this place: well done!',
    menuVoyageur: 'Change traveller', menuCompagnon: 'Companion', menuLieu: 'Go to', menuSon: 'Sound', menuMusique: 'Music', menuLangue: 'Language', menuCarte: 'Back to the map',
    sonOui: 'On', sonNon: 'Off',
    videoTitre: (lieu) => `My video of ${lieu}`, videoFermer: 'Back to the walk',
    videoErreur: 'TikTok’s player could not start here.', videoSurTikTok: 'Watch it on TikTok', videoReessayer: 'Try again',
    videoLien: 'Video not starting? Watch it on TikTok',
    chargement: 'Loading…',
    // le départ : on choisit le voyageur (la première fois), puis le compagnon (à chaque visite)
    bienvenue: (lieu) => [`Welcome to ${lieu}!`, 'Before we set off… are you a boy or a girl?'],
    revoila: (lieu) => [`Welcome back to ${lieu}!`],
    compagnonQuestion: ['Three companions would love to walk with you.', 'Which one do you choose?'],
    ouTampon: (ou) => `“A stamp… ${ou}!”`,
    compagnons: {
      kon: {
        nom: 'Kon', choix: 'Kon, the messenger fox of Inari. Polite and clever, he can sniff out stamps from afar.',
        salut: (n) => ['I am Kon, the messenger fox of Inari. Let’s go together!', `Talk to people, read the signs… and let’s find the ${n} stamps of this place!`],
        indice: 'Kon sniffs the air…', tout: ['You found every stamp here!', 'Shall we visit another place? Open the menu.'],
      },
      pon: {
        nom: 'Pon', choix: 'Pon, the mischievous tanuki. Always cheerful… and always hungry!',
        salut: (n) => ['Pon! I’m Pon. I heard there’s good food around here…', `…and ${n} stamps to find! Shall we?`],
        indice: 'Pon drums on his belly and thinks…', tout: ['Every stamp! Well done… That calls for a feast, right?', 'For another place, open the menu.'],
      },
      chapu: {
        nom: 'Chapu', choix: 'Chapu, the river otter. She loves water: she swims whenever she can!',
        salut: (n) => ['Chapu! I’m Chapu! Is there water here? I love water!', `Come on, let’s find the ${n} stamps! Hop hop!`],
        indice: 'Chapu stands up on her hind legs and looks around…', tout: ['Every stamp! Chapu chapu!', 'Another place? Open the menu!'],
      },
    },
    herbes: 'A wild deer appeared!', herbesFuit: 'The deer ran away…',
  },
  fr: {
    titrePage: 'Balade en 3D', retour: 'Retour à la carte', carnet: 'Carnet de tampons', menu: 'Menu', fermer: 'Fermer',
    aideOrdi: 'ZQSD ou flèches : marcher · Maj : courir · E ou Espace : parler · glisser : caméra',
    aideTel: 'Joystick : marcher · A : parler · glisser : caméra',
    parler: 'Parler', lire: 'Lire', tamponner: 'Tamponner', regarder: 'Regarder', toucher: 'Toucher', prier: 'Prier', caresser: 'Caresser', asseoir: 'S’asseoir', lever: 'Se lever', acheter: 'Acheter',
    oui: 'Oui', non: 'Non', garcon: 'Garçon', fille: 'Fille',
    tamponObtenu: (nom) => `Tu obtiens le tampon « ${nom} » !`,
    dejaTampon: 'Tu as déjà ce tampon dans ton carnet.',
    carnetTitre: 'Carnet de tampons', carnetCompte: (n, total) => `${n} / ${total} tampons`,
    carnetVide: 'Pas encore trouvé', carnetComplet: 'Tous les tampons de ce lieu : bravo !',
    menuVoyageur: 'Changer de voyageur', menuCompagnon: 'Compagnon', menuLieu: 'Aller à', menuSon: 'Son', menuMusique: 'Musique', menuLangue: 'Langue', menuCarte: 'Retour à la carte',
    sonOui: 'Oui', sonNon: 'Non',
    videoTitre: (lieu) => `Ma vidéo ${/^[aeiouyhâéèêîôû]/i.test(lieu) ? 'd’' : 'de '}${lieu}`, videoFermer: 'Retour à la balade',
    videoErreur: 'Le lecteur de TikTok n’a pas pu démarrer ici.', videoSurTikTok: 'La voir sur TikTok', videoReessayer: 'Réessayer',
    videoLien: 'La vidéo ne se lance pas ? La voir sur TikTok',
    chargement: 'Chargement…',
    bienvenue: (lieu) => [`Bienvenue à ${lieu} !`, 'Avant de partir… es-tu un garçon ou une fille ?'],
    revoila: (lieu) => [`Te revoilà à ${lieu} !`],
    compagnonQuestion: ['Trois compagnons aimeraient faire la balade avec toi.', 'Lequel choisis-tu ?'],
    ouTampon: (ou) => `« Un tampon… ${ou} ! »`,
    compagnons: {
      kon: {
        nom: 'Kon', choix: 'Kon, le renard messager d’Inari. Poli et malin, il flaire les tampons de loin.',
        salut: (n) => ['Je suis Kon, le renard messager d’Inari. Allons-y ensemble !', `Parle aux gens, lis les panneaux… et trouvons les ${n} tampons de ce lieu !`],
        indice: 'Kon renifle l’air…', tout: ['Tu as trouvé tous les tampons d’ici !', 'On visite un autre lieu ? Ouvre le menu.'],
      },
      pon: {
        nom: 'Pon', choix: 'Pon, le tanuki farceur. Toujours de bonne humeur… et toujours affamé !',
        salut: (n) => ['Pon ! Moi, c’est Pon. Il paraît qu’on mange bien par ici…', `… et qu’il y a ${n} tampons à trouver ! On y va ?`],
        indice: 'Pon se tambourine le ventre et réfléchit…', tout: ['Tous les tampons ! Bravo… Ça se fête avec un bon repas, non ?', 'Pour un autre lieu, ouvre le menu.'],
      },
      chapu: {
        nom: 'Chapu', choix: 'Chapu, la loutre des rivières. Elle adore l’eau : elle nage dès qu’elle peut !',
        salut: (n) => ['Chapu ! Je suis Chapu ! Il y a de l’eau, ici ? J’adore l’eau !', `Allez, on cherche les ${n} tampons ! Hop hop !`],
        indice: 'Chapu se dresse sur ses pattes et regarde partout…', tout: ['Tous les tampons ! Chapu chapu !', 'Un autre lieu ? Ouvre le menu !'],
      },
    },
    herbes: 'Un daim sauvage apparaît !', herbesFuit: 'Le daim s’est enfui…',
  },
  ja: {
    titrePage: '3Dおさんぽ', retour: '地図にもどる', carnet: 'スタンプ帳', menu: 'メニュー', fermer: 'とじる',
    aideOrdi: 'WASD・矢印：あるく　Shift：はしる　E・スペース：はなす　ドラッグ：カメラ',
    aideTel: 'スティック：あるく　A：はなす　スライド：カメラ',
    parler: 'はなす', lire: 'よむ', tamponner: 'おす', regarder: 'みる', toucher: 'さわる', prier: 'おまいり', caresser: 'なでる', asseoir: 'すわる', lever: 'たつ', acheter: 'かう',
    oui: 'はい', non: 'いいえ', garcon: 'おとこのこ', fille: 'おんなのこ',
    tamponObtenu: (nom) => `「${nom}」のスタンプを　てにいれた！`,
    dejaTampon: 'このスタンプは　もう　もっている。',
    carnetTitre: 'スタンプ帳', carnetCompte: (n, total) => `${n} / ${total} こ`,
    carnetVide: 'まだ　みつけていない', carnetComplet: 'ここのスタンプを　ぜんぶ　あつめた！',
    menuVoyageur: 'たびびとを　かえる', menuCompagnon: 'なかま', menuLieu: 'いどう', menuSon: 'おと', menuMusique: 'おんがく', menuLangue: 'ことば', menuCarte: '地図にもどる',
    sonOui: 'オン', sonNon: 'オフ',
    videoTitre: (lieu) => `${lieu}の　どうが`, videoFermer: 'おさんぽに　もどる',
    videoErreur: 'TikTokの　プレーヤーが　うごかなかった。', videoSurTikTok: 'TikTokで　みる', videoReessayer: 'もういちど',
    videoLien: 'うごかない　ときは　TikTokで　みる',
    chargement: 'よみこみちゅう…',
    bienvenue: (lieu) => [`${lieu}へ　ようこそ！`, 'しゅっぱつ　まえに……　きみは　おとこのこ？　それとも　おんなのこ？'],
    revoila: (lieu) => [`おかえり！　${lieu}だよ！`],
    compagnonQuestion: ['3びきの　なかまが　いっしょに　さんぽ　したいって。', 'どの　こに　する？'],
    ouTampon: (ou) => `「スタンプは……${ou}！」`,
    compagnons: {
      kon: {
        nom: 'コン', choix: 'コン。おいなりさまの　つかいの　キツネ。れいぎ　ただしくて　かしこい。とおくの　スタンプも　かぎつける。',
        salut: (n) => ['ぼくは　コン。おいなりさまの　つかいの　キツネだよ。いっしょに　いこう！', `ひとに　はなしかけたり、かんばんを　よんだり……ここの　スタンプを　${n}こ　あつめよう！`],
        indice: 'コンが　はなを　くんくん……', tout: ['ここの　スタンプは　ぜんぶ　あつめたね！', 'ほかの　ばしょにも　いってみる？　メニューを　ひらいてね。'],
      },
      pon: {
        nom: 'ポン', choix: 'ポン。いたずら　ずきの　タヌキ。いつも　ごきげん……そして　いつも　はらぺこ！',
        salut: (n) => ['ポン！　おいらは　ポン。このへんは　おいしい　ものが　あるって　きいたよ……', `……それに　スタンプが　${n}こ！　さあ　いこう！`],
        indice: 'ポンは　おなかを　ポンポン　たたいて　かんがえた……', tout: ['スタンプ　ぜんぶ！　やったね……おいわいに　ごちそう　たべよ？', 'ほかの　ばしょは　メニューから　だよ。'],
      },
      chapu: {
        nom: 'チャプ', choix: 'チャプ。川の　カワウソ。水が　だいすきで、すぐ　およいじゃう！',
        salut: (n) => ['チャプ！　わたし　チャプ！　ここに　水は　ある？　水　だいすき！', `さあ、スタンプを　${n}こ　さがそう！　ぴょん　ぴょん！`],
        indice: 'チャプは　うしろあしで　たって、きょろきょろ……', tout: ['スタンプ　ぜんぶ！　チャプ　チャプ！', 'ほかの　ばしょ？　メニューを　ひらいて！'],
      },
    },
    herbes: 'あっ！　やせいの　シカが　とびだしてきた！', herbesFuit: 'シカは　にげていった……',
  },
};
