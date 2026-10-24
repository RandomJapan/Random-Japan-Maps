// ================================================================
//  Halloween sur la carte (événement du 20 au 31 octobre 2026). Le propriétaire a choisi, sur une page d'exemples :
//  - un panneau « Halloween au Japon » (bouton dans la rangée du haut) : comment se passe Halloween au Japon,
//    le défilé des cent démons (le faire passer tout de suite) et la chasse aux yōkai ;
//  - des chapeaux de sorcière sur les épingles (halloween.css) ;
//  - des chauves-souris à la place des grues pendant tout l'événement (oiseaux.js), un chat noir sur le cartouche
//    « Japan 日本 Japon », une toile d'araignée dans le coin de la carte ;
//  - les hitodama, feux follets japonais, la nuit, à la place de ce qui tombe de la saison (hitodama.js) ;
//  - le Hyakki Yagyō, défilé nocturne des cent démons (hyakki.js) ;
//  - la chasse aux yōkai : sept yōkai cachés dans des lieux hantés, à trouver en zoomant (comme les légendes),
//    un compteur, et une image à partager quand on les a tous.
//  app.js le charge et l'allume pendant l'événement (CONFIG.halloween), seulement en mode développeur tant que
//  CONFIG.halloween.public est faux, et l'éteint en sortant du mode développeur ou le 1er novembre à minuit : tout
//  ce qu'il a posé s'en va, les grues et les feuilles reviennent.
//  Ses textes sont ici, pas dans TEXTES (config.js) : l'événement est provisoire et partira d'un bloc.
// ================================================================

import { YOKAI, CHAT, CHAUVE_SOURIS, toileAraignee } from './halloween-dessins.js';
import { brancherDefile } from './hyakki.js';
import { lieuxDesHitodama } from './hitodama.js';
import { REGIONS } from './regions.js';
import { echapper, partagerFichier, telecharger, typoFr } from './commun.js';

const ZOOM_CHASSE = 6.5; // comme les légendes cachées : il faut zoomer sur une région
const MEMOIRE = 'yokaiTrouves'; // localStorage : les yōkai trouvés (ce navigateur seulement)
const SACRES = ['torii', 'temple', 'pagoda']; // les hitodama aiment les temples et les sanctuaires
const decalages = (h) => ({
  top: [0, 6], 'top-left': [0, 6], 'top-right': [0, 6],
  bottom: [0, -h], 'bottom-left': [0, -h], 'bottom-right': [0, -h],
  left: [30, -h / 2], right: [-30, -h / 2],
});
export const ICONE_CITROUILLE = '<svg class="citrouille" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 6.4C11.6 4.6 12.2 3.2 13.8 2.4"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 6.6C10.4 5.7 8.4 5.6 6.7 6.5 3.9 7.8 2.6 10.7 2.8 13.7 3.1 17.3 5.4 20.1 8.4 20.6 9.7 20.8 10.9 20.5 12 19.9 13.1 20.5 14.3 20.8 15.6 20.6 18.6 20.1 20.9 17.3 21.2 13.7 21.4 10.7 20.1 7.8 17.3 6.5 15.6 5.6 13.6 5.7 12 6.6Z"/><path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 6.8C10.4 10.4 10.4 16.4 12 19.8"/></svg>';

const TEXTES = {
  en: {
    bouton: 'Halloween',
    titre: 'Halloween in Japan',
    intro: [
      'Halloween reached Japan in the late 1990s, through Tokyo Disneyland and Universal Studios Japan. Since the 2010s it has become a big celebration.',
      "It's mostly about costumes: crowds in Shibuya, the Ikebukuro cosplay festival, the zombie nights at Universal Studios in Osaka. Few children go trick-or-treating.",
      'Shops turn orange and purple, with limited-edition pumpkin (kabocha) sweets and drinks.',
      "But Japan has its own spirits: the dead come home at Obon, in August, and old legends say that on certain nights, yōkai parade through the streets. This week, they're on the map!",
    ],
    defileTitre: 'The Night Parade of One Hundred Demons',
    defileSecond: '百鬼夜行 · Hyakki Yagyō',
    defileTexte: 'At night, when you zoom in on a region, yōkai sometimes cross the map: the haunted lantern and umbrella, the fox and its fire, the tanuki, the kappa, the oni… Tap one to learn more.',
    defileBouton: 'Summon the parade',
    defileEnCours: 'The parade is already passing by!',
    defileRate: 'No path for the parade here: zoom in on land.',
    defileImpossible: 'No parade during a game.',
    defileReduit: 'Animations are reduced on this device.',
    defileAria: 'The Night Parade of One Hundred Demons: learn more',
    hyakkiTitre: 'The Night Parade of One Hundred Demons',
    hyakkiLieu: 'Hyakki Yagyō',
    hyakkiTexte: 'On certain nights, say legends from the Heian period, the yōkai come out and parade through the streets: foxes, tanuki, oni, and even old objects that came to life after a hundred years, like a lantern or an umbrella. Best to stay home! Painted scrolls from the 16th century still show the procession.',
    chasseTitre: 'The yōkai hunt',
    chasseSecond: '妖怪探し',
    chasseTexte: 'Seven yōkai are hiding in haunted places of Japan. Zoom in on a region to find them, then tap one to hear its story.',
    chasseCompte: (n, total) => `${n} of ${total} found.`,
    chasseToutes: (total) => `You found all ${total} yōkai!`,
    pasTrouve: 'Not found yet',
    trouve: (n, total) => `Yōkai found! ${n}/${total}`,
    yokaiAria: (nom) => `Yōkai: ${nom}`,
    evenement: 'Halloween special',
    evenementCompte: (n, total) => `yōkai ${n}/${total}`,
    jusquau: 'Until the night of October 31.',
    bravoTitre: 'Hunt complete!',
    bravoTexte: (total) => `You found the ${total} yōkai hidden on the map of Japan.`,
    bravoDefi: 'Can you find them all?',
    partager: 'Share my victory',
    enregistrer: 'Save the image',
    fermer: 'Close',
    partageMessage: (total, adresse) => `I found the ${total} yōkai hidden on the map of Japan! 🎃 https://${adresse}`,
    imageEnregistree: 'Image saved.',
    imageErreur: "The image couldn't be made.",
  },
  fr: {
    bouton: 'Halloween',
    titre: 'Halloween au Japon',
    intro: [
      'Halloween est arrivé au Japon à la fin des années 1990, avec Tokyo Disneyland et Universal Studios Japan. Depuis les années 2010, c\'est une grande fête.',
      'On la fête surtout en se déguisant : foules costumées à Shibuya, festival de cosplay d\'Ikebukuro, nuits de zombies d\'Universal Studios à Osaka. Les enfants font peu de « bonbons ou farce ».',
      'Les magasins se mettent à l\'orange et au violet, avec des gâteaux et des boissons à la citrouille (kabocha) en édition limitée.',
      'Mais le Japon a ses propres esprits : les morts reviennent à Obon, en août, et selon les vieilles légendes, certaines nuits, les yōkai défilent dans les rues. Cette semaine, ils sont sur la carte !',
    ],
    defileTitre: 'Le défilé des cent démons',
    defileSecond: '百鬼夜行 · Hyakki Yagyō',
    defileTexte: 'La nuit, quand tu zoomes sur une région, des yōkai traversent parfois la carte : la lanterne et l\'ombrelle hantées, le renard et ses feux, le tanuki, le kappa, l\'oni… Touche-les pour en savoir plus.',
    defileBouton: 'Faire passer le défilé',
    defileEnCours: 'Le défilé est déjà en train de passer !',
    defileRate: 'Pas de chemin pour le défilé ici : zoome sur la terre.',
    defileImpossible: 'Pas de défilé pendant une partie.',
    defileReduit: 'Les animations sont réduites sur cet appareil.',
    defileAria: 'Le défilé des cent démons : en savoir plus',
    hyakkiTitre: 'Le défilé des cent démons',
    hyakkiLieu: 'Hyakki Yagyō',
    hyakkiTexte: 'Certaines nuits, disent les légendes de l\'époque de Heian, les yōkai sortent et défilent dans les rues : renards, tanukis, oni, et même de vieux objets devenus vivants au bout de cent ans, comme une lanterne ou une ombrelle. Mieux valait rester chez soi ! Des rouleaux peints du XVIᵉ siècle en gardent la mémoire.',
    chasseTitre: 'La chasse aux yōkai',
    chasseSecond: '妖怪探し',
    chasseTexte: 'Sept yōkai se cachent dans des lieux hantés du Japon. Zoome sur une région pour les trouver, puis touche-les pour entendre leur histoire.',
    chasseCompte: (n, total) => `${n} sur ${total} trouvés.`,
    chasseToutes: (total) => `Tu as trouvé les ${total} yōkai !`,
    pasTrouve: 'Pas encore trouvé',
    trouve: (n, total) => `Yōkai trouvé ! ${n}/${total}`,
    yokaiAria: (nom) => `Yōkai : ${nom}`,
    evenement: 'Spécial Halloween',
    evenementCompte: (n, total) => `yōkai ${n}/${total}`,
    jusquau: 'Jusqu\'au 31 octobre au soir.',
    bravoTitre: 'Chasse terminée !',
    bravoTexte: (total) => `Tu as trouvé les ${total} yōkai cachés sur la carte du Japon.`,
    bravoDefi: 'Et toi, tu les trouves ?',
    partager: 'Partager mon exploit',
    enregistrer: 'Enregistrer l\'image',
    fermer: 'Fermer',
    partageMessage: (total, adresse) => `J'ai trouvé les ${total} yōkai cachés sur la carte du Japon ! 🎃 https://${adresse}`,
    imageEnregistree: 'Image enregistrée.',
    imageErreur: 'L\'image n\'a pas pu être fabriquée.',
  },
  ja: {
    bouton: 'ハロウィン',
    titre: '日本のハロウィン',
    intro: [
      '日本のハロウィンは1990年代の終わり、東京ディズニーランドやユニバーサル・スタジオ・ジャパンから広まり、2010年代に大きなお祭りになりました。',
      '楽しみ方の中心は仮装。渋谷の人波、池袋のコスプレイベント、大阪のUSJのゾンビの夜がにぎわいます。子どもの「トリック・オア・トリート」はあまり盛んではありません。',
      'お店はオレンジと紫に彩られ、かぼちゃのお菓子や飲み物が期間限定で並びます。',
      'でも日本には昔からの霊たちがいます。お盆には先祖の霊が帰り、言い伝えでは、ある夜には妖怪たちが列をなして町を練り歩くとか。今週はこの地図にも現れます！',
    ],
    defileTitre: '百鬼夜行',
    defileSecond: 'Hyakki Yagyō',
    defileTexte: '夜、地方を拡大すると、ときどき妖怪の行列が地図を横切ります。提灯お化けに唐傘お化け、狐火を連れた狐、狸、河童、鬼……。触れてみてください。',
    defileBouton: '行列を呼ぶ',
    defileEnCours: '行列はもう通っています！',
    defileRate: 'ここには行列の通る道がありません。陸地を拡大してください。',
    defileImpossible: 'ゲーム中は行列は通りません。',
    defileReduit: 'この端末ではアニメーションが減らされています。',
    defileAria: '百鬼夜行：くわしく見る',
    hyakkiTitre: '百鬼夜行',
    hyakkiLieu: 'Hyakki Yagyō',
    hyakkiTexte: '平安時代の言い伝えでは、ある夜、妖怪たちが列をなして都の通りを練り歩いたといいます。狐や狸、鬼、さらに百年たって魂を宿した古い道具――提灯や唐傘も。その夜は家にこもるのが一番。室町時代の絵巻にも、その行列が描かれています。',
    chasseTitre: '妖怪探し',
    chasseSecond: 'Yōkai hunt',
    chasseTexte: '日本の怪談ゆかりの地に、7体の妖怪が隠れています。地方を拡大して探し、見つけたら触れて話を読んでみてください。',
    chasseCompte: (n, total) => `${n}/${total} 発見`,
    chasseToutes: (total) => `${total}体すべて見つけました！`,
    pasTrouve: 'まだ見つかっていません',
    trouve: (n, total) => `妖怪発見！ ${n}/${total}`,
    yokaiAria: (nom) => `妖怪：${nom}`,
    evenement: 'ハロウィン限定',
    evenementCompte: (n, total) => `妖怪 ${n}/${total}`,
    jusquau: '10月31日の夜まで。',
    bravoTitre: '妖怪探し達成！',
    bravoTexte: (total) => `日本地図に隠れた${total}体の妖怪をすべて見つけました。`,
    bravoDefi: 'あなたは見つけられる？',
    partager: '結果をシェア',
    enregistrer: '画像を保存',
    fermer: '閉じる',
    partageMessage: (total, adresse) => `日本地図に隠れた${total}体の妖怪をすべて見つけました！🎃 https://${adresse}`,
    imageEnregistree: '画像を保存しました。',
    imageErreur: '画像を作れませんでした。',
  },
};

// Les sept yōkai de la chasse, du nord au sud. ou = [longitude, latitude] : là où le pied du dessin se pose,
// décalé de quelques kilomètres quand une épingle de lieu est déjà sur place (Osorezan, Himeji, Kyoto).
const CHASSE = [
  {
    id: 'yurei', region: 'tohoku', ou: [141.0, 41.3],
    nom: { en: 'The wandering soul', fr: "L'âme errante", ja: '幽霊' },
    lieu: { en: 'Mount Osore, Aomori', fr: 'Osorezan, Aomori', ja: '恐山（青森県）' },
    texte: {
      en: "At the tip of the Shimokita Peninsula, Mount Osore, 'the mountain of dread', is said to be the gate to the afterlife: its steaming volcanic ground recalls hell, its lake paradise. Pinwheels are planted there for lost children, and in summer blind mediums, the itako, let the dead speak. Souls in white kimono, without feet, need no invitation.",
      fr: "Au bout de la péninsule de Shimokita, l'Osorezan, la « montagne de la peur », passe pour la porte de l'au-delà : sa terre volcanique qui fume rappelle les enfers, son lac le paradis. On y plante des moulins à vent pour les enfants disparus, et chaque été, des médiums aveugles, les itako, y font parler les morts. Les âmes en kimono blanc, sans pieds, n'ont pas besoin d'invitation.",
      ja: '下北半島の恐山は、あの世への入り口といわれる霊場。湯気の立つ岩場は地獄、湖は極楽にたとえられます。亡くなった子どものために風車が供えられ、夏の大祭ではイタコが死者の言葉を伝えます。白い着物に足のない幽霊も、ここではお招きいらず。',
    },
  },
  {
    id: 'oiwa', region: 'kanto', ou: [139.7224, 35.6862],
    nom: { en: "Oiwa's lantern", fr: "La lanterne d'Oiwa", ja: 'お岩' },
    lieu: { en: 'Yotsuya, Tokyo', fr: 'Yotsuya, Tokyo', ja: '四谷（東京都）' },
    texte: {
      en: "Japan's most famous ghost story: betrayed and disfigured by poison, Oiwa came back to haunt her husband until he went mad. In a print by Hokusai, her face appears in a torn lantern. Even today, actors who perform her story go to pray at the Oiwa Inari shrine in Yotsuya.",
      fr: "La plus célèbre histoire de fantôme du Japon : trahie et défigurée par un poison, Oiwa revint hanter son mari jusqu'à la folie. Dans une estampe de Hokusai, son visage apparaît dans une lanterne déchirée. Aujourd'hui encore, les acteurs qui jouent son histoire vont prier au sanctuaire Oiwa Inari, à Yotsuya.",
      ja: '日本一有名な怪談『四谷怪談』。夫に裏切られ、毒で顔が崩れたお岩は、幽霊となって夫を狂わせました。葛飾北斎は、破れた提灯にお岩の顔が浮かぶ姿を描いています。今も上演の前には、役者たちが四谷の於岩稲荷にお参りするといいます。',
    },
  },
  {
    id: 'ittan', region: 'kyushu', ou: [130.95, 31.34],
    nom: { en: 'The ittan-momen', fr: "L'ittan-momen", ja: '一反木綿' },
    lieu: { en: 'Kimotsuki, Kagoshima', fr: 'Kimotsuki, Kagoshima', ja: '肝付町（鹿児島県）' },
    texte: {
      en: 'In Kimotsuki, at the southern tip of Kyūshū, people say a long strip of white cotton flies through the night. It wraps itself around the faces and necks of late travellers to smother them. Children made sure to be home before dark!',
      fr: "À Kimotsuki, à la pointe sud de Kyūshū, on raconte qu'une longue bande de coton blanc vole la nuit. Elle s'enroule autour du visage ou du cou des passants attardés pour les étouffer. Les enfants rentraient vite à la maison avant la nuit !",
      ja: '九州の南、肝付町には、夜になると長い白い木綿の布が空を飛ぶという話があります。遅くまで出歩く人の顔や首に巻きついて、息をできなくするのだとか。子どもたちは暗くなる前に急いで家に帰ったそうです。',
    },
  },
  {
    id: 'okiku', region: 'kansai', ou: [134.615, 34.925],
    nom: { en: 'Okiku and the nine plates', fr: 'Okiku et les neuf assiettes', ja: 'お菊' },
    lieu: { en: 'Himeji Castle', fr: 'Château de Himeji', ja: '姫路城' },
    texte: {
      en: "A servant at Himeji Castle, Okiku was accused of losing one of her master's ten precious plates and thrown into a well. Ever since, every night, her voice rises from the well, counting 'one… two…' up to nine, then bursting into tears. Okiku's Well can still be seen in the castle.",
      fr: "Servante au château de Himeji, Okiku fut accusée d'avoir perdu une des dix précieuses assiettes de son maître, puis jetée dans un puits. Depuis, chaque nuit, sa voix monte du puits et compte : « une… deux… » jusqu'à neuf, puis éclate en sanglots. Le puits d'Okiku est toujours dans le château.",
      ja: '姫路城の女中お菊は、家宝の皿十枚のうち一枚をなくしたと責められ、井戸に投げ込まれました。それから毎晩、井戸の底から「一枚、二枚……」と数える声が聞こえ、九枚まで数えると泣き出すのだとか。お菊井戸は今も城内に残っています。',
    },
  },
  {
    id: 'enma', region: 'kansai', ou: [135.815, 35.005],
    nom: { en: 'Enma, king of hell', fr: 'Enma, roi des enfers', ja: '閻魔大王' },
    lieu: { en: 'Rokudō Chinnō-ji, Kyoto', fr: 'Rokudō Chinnō-ji, Kyoto', ja: '六道珍皇寺（京都市）' },
    texte: {
      en: 'This small Kyoto temple stands on the border between the world of the living and that of the dead. Legend says the poet Ono no Takamura went down its well every night to help Enma, king of hell, judge the souls, and came back up in the morning. The well is still in the garden.',
      fr: "Ce petit temple de Kyoto se dresse à la frontière entre le monde des vivants et celui des morts. Selon la légende, le poète Ono no Takamura descendait chaque nuit par son puits pour aider Enma, le roi des enfers, à juger les âmes, et remontait au matin. Le puits est toujours dans le jardin.",
      ja: '京都の六道珍皇寺は、この世とあの世の境目に建つといわれる寺。平安時代の小野篁は、夜ごとこの寺の井戸から冥界へ下り、閻魔大王の裁きを手伝って朝に戻ってきたと伝えられます。その井戸は今も境内にあります。',
    },
  },
  {
    id: 'hitotsume', region: 'chugoku', ou: [133.2337, 35.544],
    nom: { en: 'The one-eyed boy', fr: 'Le petit moine à un œil', ja: '一つ目小僧' },
    lieu: { en: 'Mizuki Shigeru Road, Sakaiminato', fr: 'Route Mizuki Shigeru, Sakaiminato', ja: '水木しげるロード（境港市）' },
    texte: {
      en: 'In Sakaiminato, hometown of the manga artist Mizuki Shigeru, more than 170 yōkai statues line the main street. The hitotsume-kozō, a little bald monk with a single eye who sticks out his tongue, has slipped in among them. He likes to startle passers-by, but he is harmless.',
      fr: "À Sakaiminato, la ville natale du dessinateur Mizuki Shigeru, plus de 170 statues de yōkai bordent la rue principale. Le hitotsume-kozō, un petit moine chauve à un seul œil qui tire la langue, s'est glissé parmi elles. Il aime faire peur aux passants, mais il n'est pas méchant.",
      ja: '漫画家・水木しげるのふるさと境港市では、170体以上の妖怪ブロンズ像が通りに並びます。その中に、ぺろりと舌を出す一つ目の小僧がまぎれこんでいます。人を驚かすのが好きですが、悪さはしません。',
    },
  },
  {
    id: 'konaki', region: 'shikoku', ou: [133.7672, 33.877],
    nom: { en: 'The crying old man', fr: 'Le vieux qui pleure', ja: '子泣き爺' },
    lieu: { en: 'Ōboke Gorge, Tokushima', fr: "Gorges d'Ōboke, Tokushima", ja: '大歩危（徳島県）' },
    texte: {
      en: "In the mountains of Tokushima, you may hear a baby crying by the path. Whoever picks it up finds an old man with a baby's face, who grows heavy as a stone and won't let go. The konaki-jijii comes from the village of Yamashiro, near the Ōboke Gorge, now known as a 'yōkai village'.",
      fr: "Dans les montagnes de Tokushima, on entend parfois un bébé pleurer au bord du chemin. Celui qui le prend dans ses bras découvre un vieillard au visage de nourrisson, qui devient lourd comme une pierre et ne lâche plus prise. Le konaki-jijii vient du village de Yamashiro, près des gorges d'Ōboke, devenu le « village des yōkai ».",
      ja: '徳島の山道で赤ん坊の泣き声がしたら要注意。抱き上げると、それは赤ん坊の顔をした老人で、石のように重くなってしがみついて離れません。子泣き爺は大歩危に近い山城町の伝説で、この地は今「妖怪の里」として知られています。',
    },
  },
];
CHASSE.sort((a, b) => b.ou[1] - a.ou[1]); // du nord au sud (la liste et l'image du bravo)

function lireTrouves() {
  try {
    const ids = JSON.parse(localStorage.getItem(MEMOIRE) || '[]');
    return new Set(ids.filter((id) => CHASSE.some((y) => y.id === id)));
  } catch {
    return new Set();
  }
}
function garderTrouves(trouves) {
  try { localStorage.setItem(MEMOIRE, JSON.stringify([...trouves])); } catch { /* pas grave */ }
}
const creer = (balise, classe, texte) => {
  const el = document.createElement(balise);
  if (classe) el.className = classe;
  if (texte != null) el.textContent = texte;
  return el;
};

/**
 * outils (app.js) : { langue(), afficherMessage, fermerFiche, fermerPanneau (celui d'Halloween), reperes, lieux(),
 * ambiance (remplacerParticules), choisirOiseaux, adresse, nomSite }.
 * Renvoie { allumer(), eteindre(), majLangue(), remplirPanneau() }.
 */
export function brancherHalloween(map, maplibregl, outils) {
  const { langue, afficherMessage, fermerFiche, fermerPanneau, reperes, lieux, ambiance, choisirOiseaux, adresse, nomSite } = outils;
  const typo = (s) => (langue() === 'fr' ? typoFr(s) : s);
  const tx = (cle, ...args) => {
    const v = TEXTES[langue()]?.[cle] ?? TEXTES.en[cle];
    return typo(typeof v === 'function' ? v(...args) : v);
  };
  const enL = (o) => typo(o?.[langue()] || o?.en || '');
  const bouton = document.getElementById('btn-halloween');
  const panneau = document.getElementById('panneau-halloween');
  const carte = map.getContainer();
  const conteneur = map.getCanvasContainer();
  const papier = document.getElementById('papier');
  const sansMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const total = CHASSE.length;
  const trouves = lireTrouves();
  let allume = false, defile = null, bulle = null, cachettes = null, gardees = null;

  const chat = creer('div', 'chat-noir');
  chat.setAttribute('aria-hidden', 'true');
  chat.innerHTML = CHAT;
  const toile = creer('div', 'toile-coin');
  toile.setAttribute('aria-hidden', 'true');
  toile.innerHTML = toileAraignee();

  /** La feuille de style, avant de rien montrer (sinon les dessins apparaîtraient un instant sans leurs couleurs). */
  let feuille = null;
  function chargerFeuille() {
    feuille ??= new Promise((ok) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'halloween.css';
      l.onload = l.onerror = ok;
      document.head.append(l);
    });
    return feuille;
  }

  // ---- Les hitodama apparaissent près des temples et sanctuaires à l'écran (sinon près de n'importe quel lieu)
  let points = [];
  function majPoints() {
    if (!allume) return;
    const vue = map.getBounds();
    const vus = lieux().filter((l) => vue.contains([l.lng, l.lat]));
    const sacres = vus.filter((l) => SACRES.includes(l.cat?.icone));
    points = (sacres.length ? sacres : vus).map((l) => map.project([l.lng, l.lat]));
  }

  // ---- Les bulles (yōkai de la chasse, défilé) : comme celles des légendes
  function ouvrirPopup(lngLat, contenu, hauteur) {
    fermerBulle();
    const popup = new maplibregl.Popup({ className: 'bulle-legende bulle-halloween', offset: decalages(hauteur), maxWidth: '300px' })
      .setLngLat(lngLat).setDOMContent(contenu).addTo(map);
    popup.getElement().querySelector('.maplibregl-popup-close-button')?.setAttribute('aria-label', tx('fermer'));
    bulle = { popup };
    popup.on('close', () => { if (bulle?.popup === popup) bulle = null; });
    requestAnimationFrame(() => garderVisible(popup));
    return bulle;
  }
  /** Les boutons du haut passent devant la carte : si la bulle se glisse dessous, la carte descend un peu. */
  function garderVisible(popup) {
    const r = popup.getElement()?.getBoundingClientRect();
    if (!r) return;
    const haut = document.querySelector('.filtres-boutons').getBoundingClientRect().bottom + 10;
    const bas = innerHeight - 10;
    let dy = 0;
    if (r.top < haut) dy = r.top - haut;
    else if (r.bottom > bas) dy = Math.min(r.bottom - bas, r.top - haut);
    if (Math.abs(dy) > 2) map.panBy([0, dy], { duration: sansMouvement ? 0 : 450 });
  }
  function fermerBulle() {
    bulle?.popup.remove();
  }
  /** En tête des bulles de l'événement : la citrouille et « Spécial Halloween » (pour ne pas les prendre pour des
   *  légendes de toute l'année), et pour un yōkai de la chasse, le compte des trouvés. */
  function bandeauEvenement(compte) {
    const p = creer('p', 'bulle-evenement');
    p.innerHTML = `${ICONE_CITROUILLE}<span>${echapper(tx('evenement'))}</span>`;
    if (compte) p.append(creer('b', 'bulle-compte', compte));
    return p;
  }
  function contenuBulle(titre, second, lieu, texte, secondLangue) {
    const div = creer('div');
    const s = creer('p', 'bulle-second', second);
    if (secondLangue) s.lang = secondLangue;
    div.append(creer('h3', 'bulle-titre', titre), s, creer('p', 'bulle-lieu', lieu), creer('p', 'bulle-texte', texte));
    return div;
  }
  const contenuYokai = (y) => {
    const div = contenuBulle(enL(y.nom), langue() === 'ja' ? y.nom.en : y.nom.ja, enL(y.lieu), enL(y.texte), langue() === 'ja' ? 'en' : 'ja');
    div.prepend(bandeauEvenement(tx('evenementCompte', trouves.size, total)));
    return div;
  };

  // ---- La chasse aux yōkai : des dessins sur la carte, comme les légendes (visibles en zoomant sur une région)
  function poserCachettes() {
    cachettes = CHASSE.map((y) => {
      const el = creer('button', 'legende lg yokai-cache');
      el.type = 'button';
      el.innerHTML = YOKAI[y.id];
      el.setAttribute('aria-label', tx('yokaiAria', enL(y.nom)));
      el.addEventListener('click', (e) => {
        e.stopPropagation(); // sinon la carte reçoit l'appui et referme la bulle aussitôt
        ouvrirYokai(y, el);
      });
      const marqueur = new maplibregl.Marker({ element: el, anchor: 'bottom', opacityWhenCovered: '0.25' }).setLngLat(y.ou);
      reperes.suivre(marqueur, {
        voulu: false,
        placer: (moi) => conteneur.insertBefore(moi, papier?.parentNode === conteneur ? papier.nextSibling : conteneur.firstChild),
      });
      return { y, el, marqueur };
    });
    gardees = null;
    majZoom();
  }
  function retirerCachettes() {
    for (const c of cachettes || []) reperes.oublier(c.marqueur);
    cachettes = null;
  }
  function animerVisibles() {
    if (sansMouvement || !cachettes) return;
    const vue = map.getBounds();
    const pres = map.getZoom() >= ZOOM_CHASSE;
    for (const c of cachettes) c.el.classList.toggle('anime', pres && vue.contains(c.y.ou));
  }
  function majZoom() {
    if (!cachettes) return;
    // posés un peu avant de se montrer (le fondu d'entrée des légendes se joue), retirés après
    const g = map.getZoom() >= ZOOM_CHASSE - 0.35;
    if (g !== gardees) {
      gardees = g;
      for (const c of cachettes) reperes.montrer(c.marqueur, g, 450);
    }
    animerVisibles();
  }
  map.on('zoom', majZoom);
  map.on('moveend', () => { animerVisibles(); majPoints(); });

  function ouvrirYokai(y, el) {
    const hauteur = el.querySelector('svg').getBoundingClientRect().height - 2;
    trouver(y); // avant la bulle : son compteur le compte déjà
    ouvrirPopup(y.ou, contenuYokai(y), hauteur);
    bulle.yokai = y;
  }

  function trouver(y) {
    if (trouves.has(y.id)) return;
    trouves.add(y.id);
    garderTrouves(trouves);
    majCompteur();
    if (!panneau.hidden) remplirPanneau();
    if (trouves.size === total) setTimeout(feliciter, 1200);
    else afficherMessage(tx('trouve', trouves.size, total));
  }

  function majCompteur() {
    document.getElementById('compteur-halloween').textContent = trouves.size ? `${trouves.size}/${total}` : '';
  }

  /** Depuis la liste : vole jusqu'au yōkai et ouvre sa bulle. */
  function allerA(y) {
    fermerPanneau();
    fermerFiche();
    fermerBulle();
    map.once('moveend', () => {
      const c = cachettes?.find((x) => x.y === y);
      if (c) ouvrirYokai(y, c.el);
    });
    map.flyTo({ center: y.ou, zoom: Math.max(map.getZoom(), 8.5), duration: sansMouvement ? 0 : 2200, essential: true });
  }

  // ---- Le défilé
  function faireDefiler() {
    if (sansMouvement) return afficherMessage(tx('defileReduit'));
    if (document.body.classList.contains('en-jeu')) return afficherMessage(tx('defileImpossible'));
    if (defile.enCours()) return afficherMessage(tx('defileEnCours'));
    fermerPanneau();
    fermerFiche();
    const partir = () => { if (!defile.lancer()) afficherMessage(tx('defileRate')); };
    if (map.getZoom() >= defile.ZOOM_DEFILE + 0.3) return partir();
    map.once('moveend', () => setTimeout(partir, 200));
    map.flyTo({ center: map.getCenter(), zoom: 10.2, pitch: Math.max(map.getPitch(), 50), duration: sansMouvement ? 0 : 2400, essential: true });
  }

  // ---- Le panneau « Halloween au Japon »
  function remplirPanneau() {
    const n = trouves.size;
    const titre = creer('p', 'hasard-titre');
    titre.innerHTML = `${ICONE_CITROUILLE}<span>${echapper(tx('titre'))}</span>`;
    const intro = creer('div', 'halloween-texte');
    intro.innerHTML = tx('intro').map((p) => `<p>${echapper(p)}</p>`).join('');

    const sDefile = creer('section', 'halloween-section');
    sDefile.innerHTML = `<h3>${echapper(tx('defileTitre'))}<small>${echapper(tx('defileSecond'))}</small></h3><p>${echapper(tx('defileTexte'))}</p>`;
    const bDefile = creer('button', 'btn-lancer', tx('defileBouton'));
    bDefile.type = 'button';
    bDefile.addEventListener('click', faireDefiler);
    sDefile.append(bDefile);

    const sChasse = creer('section', 'halloween-section');
    sChasse.innerHTML = `<h3>${echapper(tx('chasseTitre'))}<small>${echapper(tx('chasseSecond'))}</small></h3><p>${echapper(tx('chasseTexte'))}</p>`;
    sChasse.append(creer('p', 'legendes-info', n === total ? tx('chasseToutes', total) : tx('chasseCompte', n, total)));
    if (n === total) {
      const b = creer('button', 'btn-lancer legendes-partager', tx('partager'));
      b.type = 'button';
      b.addEventListener('click', () => { fermerPanneau(); feliciter(); });
      sChasse.append(b);
    }
    const liste = creer('ul', 'liste-legendes');
    for (const y of CHASSE) {
      const li = creer('li');
      if (trouves.has(y.id)) {
        const b = creer('button', 'legende-ligne');
        b.type = 'button';
        const mini = creer('span', 'legende-mini lg');
        mini.innerHTML = YOKAI[y.id];
        const textes = creer('span', 'legende-textes');
        textes.append(creer('b', '', enL(y.nom)), creer('small', '', enL(y.lieu)));
        b.append(mini, textes);
        b.addEventListener('click', () => allerA(y));
        li.append(b);
      } else {
        const d = creer('div', 'legende-ligne inconnue');
        const textes = creer('span', 'legende-textes');
        textes.append(creer('b', '', tx('pasTrouve')), creer('small', '', enL(REGIONS.find((r) => r.cle === y.region)?.nom)));
        d.append(creer('span', 'legende-mini', '?'), textes);
        li.append(d);
      }
      liste.append(li);
    }
    sChasse.append(liste);
    panneau.replaceChildren(titre, intro, sDefile, sChasse, creer('p', 'legendes-info', tx('jusquau')));
    if (n === total) preparerImage().catch(() => {});
  }

  // ---- Tous trouvés : le bravo et l'image à partager (bravo-image.js, comme celle des légendes)
  let image = null, fichierPret = null;
  function preparerImage() {
    image ||= import('./bravo-image.js')
      .then(({ imageBravo }) => imageBravo({
        legendes: CHASSE, dessins: YOKAI, sceau: '妖怪', grandes: true, feuilles: ['legendes.css', 'halloween.css'],
        textes: { titre: tx('bravoTitre'), texte: tx('bravoTexte', total), defi: tx('bravoDefi'), adresse, nomSite },
      }))
      .then((blob) => (fichierPret = new File([blob], `random-japan-place-${total}-yokai.jpg`, { type: 'image/jpeg' })));
    image.catch(() => { image = null; });
    return image;
  }
  async function partager(b, enregistrer = false) {
    b.disabled = true;
    try {
      const fichier = fichierPret || await preparerImage();
      if (enregistrer || !await partagerFichier(fichier, tx('partageMessage', total, adresse))) {
        telecharger(fichier);
        afficherMessage(tx('imageEnregistree'));
      }
    } catch (e) {
      console.warn('Image de la chasse aux yōkai', e);
      afficherMessage(tx('imageErreur'));
    } finally {
      b.disabled = false;
    }
  }
  function feliciter() {
    document.querySelector('.bravo-legendes')?.remove();
    const fond = creer('div', 'bravo-legendes');
    const carteBravo = creer('div', 'bravo-carte panneau');
    carteBravo.setAttribute('role', 'dialog');
    carteBravo.setAttribute('aria-modal', 'true');
    carteBravo.setAttribute('aria-labelledby', 'bravo-yokai-titre');
    const croix = creer('button', 'bravo-fermer');
    croix.type = 'button';
    croix.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>';
    croix.title = tx('fermer');
    croix.setAttribute('aria-label', croix.title);
    const sceau = creer('div', 'bravo-sceau', '妖怪');
    sceau.setAttribute('aria-hidden', 'true');
    const titre = creer('h2', '', tx('bravoTitre'));
    titre.id = 'bravo-yokai-titre';
    const bPartager = creer('button', 'btn-lancer', tx('partager'));
    bPartager.type = 'button';
    bPartager.addEventListener('click', () => partager(bPartager));
    const bGarder = creer('button', 'btn-secondaire bravo-enregistrer', tx('enregistrer'));
    bGarder.type = 'button';
    bGarder.style.marginTop = '8px';
    bGarder.style.width = '100%';
    bGarder.addEventListener('click', () => partager(bGarder, true));
    carteBravo.append(croix, sceau, titre, creer('p', '', tx('bravoTexte', total)), bPartager, bGarder);
    preparerImage().catch(() => {});
    fond.append(carteBravo);
    const fermer = () => fond.remove();
    croix.addEventListener('click', fermer);
    fond.addEventListener('click', (e) => { if (e.target === fond) fermer(); });
    fond.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermer(); });
    document.body.append(fond);
    carteBravo.tabIndex = -1;
    carteBravo.focus();
  }

  // ---- Allumer et éteindre tout l'événement
  async function allumer() {
    if (allume) return;
    allume = true;
    await chargerFeuille();
    if (!allume) return; // éteint pendant le chargement
    document.body.classList.add('halloween');
    document.querySelector('.bandeau')?.append(chat);
    carte.append(toile);
    bouton.hidden = false;
    choisirOiseaux({ svg: CHAUVE_SOURIS, classe: 'chauve-souris', nombre: [4, 6], vitesse: 1.25, entre: [18, 45] });
    lieuxDesHitodama(() => points);
    majPoints();
    ambiance?.remplacerParticules((m) => (m.nuit >= 0.5 ? 'hitodama' : undefined));
    defile = brancherDefile(map, maplibregl, {
      textes: () => ({ titre: tx('hyakkiTitre'), second: langue() === 'ja' ? 'Hyakki Yagyō' : '百鬼夜行', lieu: tx('hyakkiLieu'), texte: tx('hyakkiTexte'), aria: tx('defileAria') }),
      popup: (lngLat, contenu, h) => { contenu.prepend(bandeauEvenement()); ouvrirPopup(lngLat, contenu, h); },
    });
    poserCachettes();
    majLangue();
  }

  function eteindre() {
    if (!allume) return;
    allume = false;
    document.body.classList.remove('halloween');
    chat.remove();
    toile.remove();
    fermerPanneau();
    bouton.hidden = true;
    fermerBulle();
    choisirOiseaux(null);
    lieuxDesHitodama(null);
    ambiance?.remplacerParticules(null);
    defile?.arreter();
    defile = null;
    retirerCachettes();
    document.querySelector('.bravo-legendes')?.remove();
  }

  function majLangue() {
    image = null; // l'image du bravo est dans la langue choisie
    fichierPret = null;
    document.getElementById('txt-halloween').textContent = tx('bouton');
    bouton.title = tx('titre');
    majCompteur();
    for (const c of cachettes || []) c.el.setAttribute('aria-label', tx('yokaiAria', enL(c.y.nom)));
    defile?.majTextes();
    if (bulle?.yokai) bulle.popup.setDOMContent(contenuYokai(bulle.yokai));
    if (!panneau.hidden) remplirPanneau();
  }

  return { allumer, eteindre, majLangue, remplirPanneau, actif: () => allume };
}
