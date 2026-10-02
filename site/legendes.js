// ================================================================
//  Les légendes cachées (style « vieille carte »). Vingt-deux petits dessins de légendes du Japon
//  (yokai, héros et guerriers, dieux, légendes de la mer), posés là où elles se passent.
//  On ne les voit qu'en zoomant sur une région : il faut les chercher, comme des œufs de Pâques.
//  Un appui ouvre une bulle qui raconte la légende. Le navigateur se souvient de celles déjà
//  trouvées : un compteur apparaît (bouton « Légendes »), et un « Bravo » quand tout est trouvé.
//  Dessins : legendes-dessins.js ; couleurs, animations, bulle et liste : legendes.css.
// ================================================================
import { DESSINS } from './legendes-dessins.js';
import { REGIONS } from './regions.js';

const ZOOM_LEGENDES = 6.5; // en dessous (tout le Japon à l'écran), les légendes restent cachées
const MEMOIRE = 'legendesTrouvees'; // localStorage : la liste des légendes déjà trouvées
// La bulle s'ouvre au-dessus du dessin (ou à côté, quand il n'y a pas la place).
// h = hauteur du dessin à l'écran (plus petit sur téléphone, voir legendes.css).
const decalages = (h) => ({
  top: [0, 6], 'top-left': [0, 6], 'top-right': [0, 6],
  bottom: [0, -h], 'bottom-left': [0, -h], 'bottom-right': [0, -h],
  left: [30, -h / 2], right: [-30, -h / 2],
});

// Du nord au sud. ou = [longitude, latitude] : là où le pied du dessin se pose.
export const LEGENDES = [
  {
    id: 'korpokkur', region: 'hokkaido', ou: [143.554, 43.244],
    nom: { en: 'The Korpokkur', fr: 'Les Korpokkur', ja: 'コロポックル' },
    lieu: { en: 'Ashoro · Hokkaido', fr: 'Ashoro · Hokkaidō', ja: '北海道・足寄' },
    texte: {
      en: 'In Ainu legends, the Korpokkur are tiny people who live under butterbur leaves. Shy, they brought fish to the Ainu without ever showing themselves. One day a man grabbed one by the hand to see its face: offended, the Korpokkur left the land forever. In Ashoro, giant butterbur grows taller than 2 metres!',
      fr: "Dans les légendes aïnoues, les Korpokkur sont des hommes minuscules qui vivent sous les feuilles de pétasite. Timides, ils apportaient du poisson aux Aïnous sans jamais se montrer. Un jour, un homme attrapa la main de l'un d'eux pour voir son visage : vexés, les Korpokkur quittèrent la région pour toujours. À Ashoro, les pétasites géants dépassent 2 mètres !",
      ja: 'アイヌの伝説に登場するコロポックルは、フキの葉の下に住む小さな人々。恥ずかしがり屋で、姿を見せずにアイヌの人々へ魚を届けていました。ところがある日、顔を見ようと一人の手をつかんだ男がいて、怒ったコロポックルはこの地を去ってしまったといいます。足寄のラワンブキは2メートルを超えることも！',
    },
  },
  {
    id: 'namahage', region: 'tohoku', ou: [139.74, 39.925],
    nom: { en: 'Namahage', fr: 'Les Namahage', ja: 'なまはげ' },
    lieu: { en: 'Oga Peninsula · Akita', fr: "Péninsule d'Oga · Akita", ja: '秋田・男鹿半島' },
    texte: {
      en: 'On New Year\'s Eve, demons with red masks and straw capes come down from Oga\'s mountains. They bang on doors shouting "Any crybabies here? Any lazybones?" Families welcome them with sake: they drive away bad luck and bring a good year. The tradition is on UNESCO\'s intangible heritage list.',
      fr: "Le soir du Nouvel An, des démons au masque rouge et à la cape de paille descendent des montagnes d'Oga. Ils frappent aux portes en criant : « Y a-t-il des pleurnichards ici ? Des paresseux ? » Les familles les accueillent avec du saké : ils chassent le malheur et apportent une bonne année. Cette tradition est inscrite au patrimoine immatériel de l'UNESCO.",
      ja: '大晦日の夜、赤い面にケデ（わらの衣）をまとったなまはげが、男鹿の山から下りてきます。「泣く子はいねがー、怠け者はいねがー」と叫びながら家々を回り、人々は酒でもてなします。なまはげは災いを払い、福をもたらす来訪神。ユネスコ無形文化遺産にも登録されています。',
    },
  },
  {
    id: 'kappa', region: 'tohoku', ou: [141.535, 39.333],
    nom: { en: 'The Kappa of Tōno', fr: 'Le kappa de Tōno', ja: '遠野のカッパ' },
    lieu: { en: 'Tōno · Iwate', fr: 'Tōno · Iwate', ja: '岩手・遠野' },
    texte: {
      en: 'Tōno, the town of folk tales, is full of kappa. One is said to live in the stream behind Jōken-ji temple, the Kappa-buchi pool. It loves cucumbers and drags careless people into the water. Its weak spot: the water in the dish on its head. Bow politely: it will bow back… and lose all its strength!',
      fr: "Tōno, la ville des contes populaires, est pleine de kappa. L'un d'eux vivrait dans la rivière derrière le temple Jōken-ji, la Kappa-buchi. Il adore les concombres et tire les imprudents dans l'eau. Son point faible : l'eau du creux sur sa tête. Salue-le poliment : il te rendra le salut… et perdra toute sa force !",
      ja: '民話のふるさと遠野には、カッパの話がたくさん残っています。常堅寺の裏を流れる小川「カッパ淵」にもカッパが住むといわれます。キュウリが大好きで、油断した人を水に引きずり込むとか。弱点は頭の皿の水。ていねいにおじぎをすれば、つられておじぎを返し、力をなくしてしまうそうです！',
    },
  },
  {
    id: 'kitsune', region: 'kanto', ou: [139.972, 37.106],
    nom: { en: 'The Nine-Tailed Fox', fr: 'Le renard à neuf queues', ja: '九尾の狐' },
    lieu: { en: 'Sesshō-seki, Nasu · Tochigi', fr: 'Sesshō-seki, Nasu · Tochigi', ja: '栃木・那須の殺生石' },
    texte: {
      en: 'Tamamo-no-Mae, the most beautiful lady at the imperial court, was really a nine-tailed fox. Unmasked, she fled to Nasu, where warriors defeated her. Her spirit turned into a stone: the Sesshō-seki, the "killing stone", wrapped in sulphur fumes. In 2022 the stone split in two… has the fox escaped?',
      fr: "Tamamo-no-Mae, la plus belle dame de la cour impériale, était en réalité un renard à neuf queues. Démasquée, elle s'enfuit jusqu'à Nasu, où des guerriers la vainquirent. Son esprit se changea en pierre : la Sesshō-seki, « la pierre qui tue », entourée de vapeurs de soufre. En 2022, la pierre s'est fendue en deux… le renard se serait-il échappé ?",
      ja: '宮中一の美女・玉藻前の正体は、九本の尾をもつ狐でした。正体を見破られて那須へ逃げ、討ち取られた狐は、毒気を吐く「殺生石」に姿を変えたといいます。いまも硫黄の煙が立ちこめるこの石が、2022年にまっぷたつに割れました。狐が逃げ出したのでしょうか……？',
    },
  },
  {
    id: 'namazu', region: 'kanto', ou: [140.77, 35.97],
    nom: { en: 'The Earthquake Catfish', fr: 'Le poisson-chat des séismes', ja: '大鯰と要石' },
    lieu: { en: 'Kashima · Ibaraki', fr: 'Kashima · Ibaraki', ja: '茨城・鹿島' },
    texte: {
      en: 'A giant catfish, the Namazu, sleeps beneath Japan. When it thrashes, the earth shakes. To keep it still, Takemikazuchi, the god of Kashima Shrine, pinned its head down with a magic stone, the kaname-ishi. It looks small, yet the lord Tokugawa Mitsukuni is said to have dug for seven days without ever reaching its bottom.',
      fr: "Sous le Japon dort un poisson-chat géant, le Namazu. Quand il remue, la terre tremble. Pour le tenir tranquille, Takemikazuchi, le dieu du sanctuaire de Kashima, lui a bloqué la tête avec une pierre magique, la kaname-ishi. Elle paraît petite, mais le seigneur Tokugawa Mitsukuni aurait creusé pendant sept jours sans jamais en trouver le fond.",
      ja: '日本の地下には大きな鯰が眠っていて、暴れると地震が起きるといわれます。鹿島神宮の神・武甕槌大神は、その頭を「要石」で押さえつけました。地上に見えるのはほんの少しですが、水戸黄門こと徳川光圀が七日七晩掘っても底に届かなかったと伝えられています。',
    },
  },
  {
    id: 'kintaro', region: 'kanto', ou: [139.005, 35.281],
    nom: { en: 'Kintarō', fr: 'Kintarō', ja: '金太郎' },
    lieu: { en: 'Mount Kintoki · Hakone', fr: 'Mont Kintoki · Hakone', ja: '箱根・金時山' },
    texte: {
      en: 'Kintarō was a little boy of incredible strength, raised in the Ashigara mountains. He wrestled bears, rode on their backs and felled trees with his big axe. One day the warrior Minamoto no Raikō noticed him, and he became the samurai Sakata no Kintoki. In Japan, people still wish little boys to grow up as strong as him.',
      fr: "Kintarō était un petit garçon d'une force incroyable, élevé dans les montagnes d'Ashigara. Il luttait avec les ours, se promenait sur leur dos et abattait des arbres avec sa grande hache. Un jour, le guerrier Minamoto no Raikō le remarqua : il devint le samouraï Sakata no Kintoki. Au Japon, on souhaite encore aux petits garçons de devenir aussi forts que lui.",
      ja: '足柄山で育った金太郎は、熊と相撲をとり、その背にまたがり、大きなまさかりで木を倒す力持ちの男の子でした。のちに源頼光に見いだされ、武将・坂田金時となります。今でも端午の節句には、金太郎のように強く育つよう願いが込められています。',
    },
  },
  {
    id: 'yukionna', region: 'chubu', ou: [138.85, 37.0],
    nom: { en: 'Yuki-onna, the Snow Woman', fr: 'Yuki-onna, la femme des neiges', ja: '雪女' },
    lieu: { en: 'Snow Country · Niigata', fr: 'Le pays de la neige · Niigata', ja: '新潟・雪国' },
    texte: {
      en: 'On stormy nights in deep-snow country like this, a woman all in white appears in the blizzard. Her icy breath can freeze a traveller where he stands. In the most famous tale, she spares a young woodcutter on one condition: never speak of her. Years later he tells the story… to his own wife. It was her.',
      fr: "Les nuits de tempête, dans les régions de grande neige comme ici, une femme toute blanche apparaît dans le blizzard. Son souffle glacé peut geler un voyageur sur place. Dans le conte le plus célèbre, elle épargne un jeune bûcheron à une condition : ne jamais parler d'elle. Des années plus tard, il raconte l'histoire… à sa propre femme. C'était elle.",
      ja: '大雪の降る地方では、吹雪の夜に真っ白な着物の女が現れるといいます。その冷たい息を吹きかけられた旅人は凍りついてしまうとか。有名な話では、雪女は若いきこりに「今夜のことを誰にも話すな」と約束させて命を助けます。何年もたって、男はついにその話をしてしまいます……自分の妻に。妻こそ、あの雪女だったのです。',
    },
  },
  {
    id: 'kaguya', region: 'chubu', ou: [138.727, 35.361],
    nom: { en: 'Princess Kaguya', fr: 'La princesse Kaguya', ja: 'かぐや姫' },
    lieu: { en: 'Mount Fuji', fr: 'Mont Fuji', ja: '富士山' },
    texte: {
      en: 'An old bamboo cutter found a tiny girl inside a glowing stalk. Kaguya grew into the most beautiful woman in the land, but one day she had to return to the Moon, her true home. She left the emperor an elixir of immortality. Too sad to live forever without her, he had it burned on the highest mountain, closest to the sky: the "deathless" mountain, Fuji.',
      fr: "Un vieux coupeur de bambou trouva une minuscule fille dans une tige qui brillait. Kaguya devint la plus belle femme du pays, mais un jour elle dut retourner sur la Lune, son vrai pays. Elle laissa à l'empereur un élixir d'immortalité. Trop triste pour vivre éternellement sans elle, il le fit brûler au sommet de la plus haute montagne, la plus proche du ciel : la montagne « sans mort », le Fuji.",
      ja: '竹取の翁が光る竹の中から見つけた小さな女の子・かぐや姫は、やがて国一番の美しい娘になりますが、月の都へ帰らなければなりませんでした。残された不死の薬を、帝は「姫のいない世で永く生きても仕方がない」と、天にいちばん近い山の頂で燃やさせます。その山は「不死の山」、のちに富士山と呼ばれるようになったといいます。',
    },
  },
  {
    id: 'ningyo', region: 'chubu', ou: [135.73, 35.53],
    nom: { en: "The Mermaid's Flesh", fr: 'La chair de sirène', ja: '八百比丘尼と人魚' },
    lieu: { en: 'Obama · Fukui', fr: 'Obama · Fukui', ja: '福井・小浜' },
    texte: {
      en: 'A girl from Obama once ate, without knowing it, the flesh of a ningyo, the Japanese mermaid. She stopped growing old. Everyone she loved died one after another, and she lived for 800 years as a nun, travelling all over Japan and planting camellias. She is called Yao Bikuni, "the 800-year-old nun".',
      fr: "Une jeune fille d'Obama goûta un jour, sans le savoir, de la chair de ningyo, la sirène japonaise. Elle cessa de vieillir. Ses proches moururent les uns après les autres, et elle vécut 800 ans : devenue nonne, elle parcourut tout le Japon en plantant des camélias. On l'appelle Yao Bikuni, « la nonne de huit cents ans ».",
      ja: '小浜の娘が、知らずに人魚の肉を食べてしまいました。娘はそれから年をとらなくなり、家族や友だちに次々と先立たれながら、尼となって椿を植えながら諸国を巡り、八百年を生きたといいます。人々は彼女を「八百比丘尼」と呼びました。',
    },
  },
  {
    id: 'urashima', region: 'kansai', ou: [135.34, 35.76],
    nom: { en: 'Urashima Tarō', fr: 'Urashima Tarō', ja: '浦島太郎' },
    lieu: { en: 'Tango Peninsula · Kyoto', fr: 'Péninsule de Tango · Kyoto', ja: '京都・丹後半島' },
    texte: {
      en: 'The fisherman Urashima Tarō saved a turtle that some children were tormenting. To thank him, it carried him to the Dragon Palace at the bottom of the sea. After three days of feasting he went home… but 300 years had passed. When he opened the box the princess had told him never to open, he turned into an old man.',
      fr: "Le pêcheur Urashima Tarō sauva une tortue que des enfants maltraitaient. Pour le remercier, elle l'emmena au palais du Dragon, au fond de la mer. Après trois jours de fête, il rentra chez lui… mais 300 ans avaient passé. En ouvrant la boîte que la princesse lui avait interdit d'ouvrir, il devint un vieillard.",
      ja: '漁師の浦島太郎は、子どもたちにいじめられていた亀を助けました。お礼に亀は太郎を海の底の竜宮城へ連れて行きます。三日ほど楽しく過ごして村へ帰ると、なんと三百年がたっていました。開けてはいけないと言われた玉手箱を開けると、太郎はおじいさんになってしまったのです。',
    },
  },
  {
    id: 'shutendoji', region: 'kansai', ou: [135.095, 35.455],
    nom: { en: 'Shuten-dōji, the Ogre King', fr: 'Shuten-dōji, le roi des ogres', ja: '酒呑童子' },
    lieu: { en: 'Mount Ōe · Kyoto', fr: 'Mont Ōe · Kyoto', ja: '京都・大江山' },
    texte: {
      en: 'Mount Ōe was home to Shuten-dōji, chief of the oni and a great drinker of sake, who kidnapped young women from the capital. The warrior Minamoto no Raikō and his four companions (including a grown-up Kintarō!) disguised themselves as monks, offered him a magic sake that put him to sleep… and cut off his head.',
      fr: "Sur le mont Ōe vivait Shuten-dōji, le chef des oni, grand buveur de saké, qui enlevait les jeunes filles de la capitale. Le guerrier Minamoto no Raikō et ses quatre compagnons (dont Kintarō devenu grand !) se déguisèrent en moines, lui offrirent un saké magique qui l'endormit… et lui tranchèrent la tête.",
      ja: '大江山には、都の娘たちをさらう鬼の頭領・酒呑童子が住んでいました。大の酒好きです。源頼光と四天王（大人になった金太郎こと坂田金時もその一人！）は山伏に化けて近づき、眠り薬入りの酒「神便鬼毒酒」を飲ませて退治したといいます。',
    },
  },
  {
    id: 'tengu', region: 'kansai', ou: [135.77, 35.118],
    nom: { en: 'Sōjōbō, King of the Tengu', fr: 'Sōjōbō, roi des tengu', ja: '鞍馬山の大天狗' },
    lieu: { en: 'Mount Kurama · Kyoto', fr: 'Mont Kurama · Kyoto', ja: '京都・鞍馬山' },
    texte: {
      en: 'Mount Kurama is home to Sōjōbō, king of the tengu, the long-nosed, bird-winged spirits of the mountains. Legend says he secretly taught swordsmanship to young Ushiwakamaru, who became Minamoto no Yoshitsune, one of the greatest warriors in Japanese history.',
      fr: "Sur le mont Kurama vit Sōjōbō, le roi des tengu, ces esprits des montagnes au long nez rouge et aux ailes d'oiseau. La légende dit qu'il enseigna en secret le sabre au jeune Ushiwakamaru, qui devint Minamoto no Yoshitsune, l'un des plus grands guerriers de l'histoire du Japon.",
      ja: '鞍馬山には、天狗の王・僧正坊が住むといわれます。長い鼻と鳥の翼をもつ山の精です。幼い牛若丸はここで僧正坊からひそかに剣術を学び、やがて日本史に名を残す武将・源義経になったと伝えられています。',
    },
  },
  {
    id: 'daidarabotchi', region: 'kansai', ou: [136.13, 35.33],
    nom: { en: 'Daidarabotchi the Giant', fr: 'Le géant Daidarabotchi', ja: 'ダイダラボッチ' },
    lieu: { en: 'Lake Biwa · Shiga', fr: 'Lac Biwa · Shiga', ja: '滋賀・琵琶湖' },
    texte: {
      en: 'Long ago, a giant named Daidarabotchi decided to build a mountain. He dug out the land of Ōmi with his bare hands and carried the earth east in baskets: it became Mount Fuji! The hole he left filled with water and became Lake Biwa, the largest lake in Japan.',
      fr: "Il y a très longtemps, un géant nommé Daidarabotchi voulut bâtir une montagne. Il creusa la terre d'Ōmi à mains nues et emporta la terre vers l'est dans des paniers : elle devint le mont Fuji ! Le trou qu'il laissa se remplit d'eau et devint le lac Biwa, le plus grand lac du Japon.",
      ja: 'むかし、巨人ダイダラボッチが山をつくろうと、近江の土を手で掘り、もっこに入れて東へ運びました。積み上げた土が富士山に、掘ったあとに水がたまって日本一大きな湖・琵琶湖になったといいます。',
    },
  },
  {
    id: 'lapin', region: 'chugoku', ou: [134.05, 35.54],
    nom: { en: 'The White Hare of Inaba', fr: "Le lapin blanc d'Inaba", ja: '因幡の白兎' },
    lieu: { en: 'Hakuto Beach · Tottori', fr: 'Plage de Hakuto · Tottori', ja: '鳥取・白兎海岸' },
    texte: {
      en: 'A hare wanted to cross the sea from the Oki Islands. It offered to count the sharks and had them line up all the way to the shore… so it could hop across their backs! Just before landing it mocked them, and the last shark tore off all its fur. The god Ōkuninushi healed it, and the hare foretold that he would marry the princess of the land.',
      fr: "Un lapin voulait traverser la mer depuis les îles Oki. Il proposa aux requins de les compter et les fit s'aligner jusqu'à la côte… pour sauter sur leur dos ! Juste avant d'arriver, il se moqua d'eux : le dernier requin lui arracha toute sa fourrure. Le dieu Ōkuninushi le soigna, et le lapin lui prédit qu'il épouserait la princesse du pays.",
      ja: '隠岐の島から海を渡りたかった白兎は、ワニ（サメ）に「仲間の数を数えてあげよう」と言って岸まで一列に並ばせ、その背中を跳んで渡りました。ところが最後に「だまされたな」と言ったため、毛をすっかりはがされてしまいます。大国主命に助けられた兎は、大国主命が八上比売と結ばれることを予言したといいます。',
    },
  },
  {
    id: 'orochi', region: 'chugoku', ou: [133.0, 35.2],
    nom: { en: 'Yamata no Orochi', fr: 'Yamata no Orochi', ja: 'ヤマタノオロチ' },
    lieu: { en: 'Okuizumo · Shimane', fr: 'Okuizumo · Shimane', ja: '島根・奥出雲' },
    texte: {
      en: 'Every year, a giant eight-headed, eight-tailed serpent devoured a young girl of Izumo. The god Susanoo made it drink eight vats of sake, slew it in its sleep… and found inside its tail the sword Kusanagi, one of the three sacred treasures of Japan.',
      fr: "Chaque année, un serpent géant à huit têtes et huit queues dévorait une jeune fille d'Izumo. Le dieu Susanoo lui fit boire huit tonneaux de saké, le tua pendant son sommeil… et trouva dans sa queue l'épée Kusanagi, l'un des trois trésors sacrés du Japon.",
      ja: '八つの頭と八つの尾をもつ大蛇・ヤマタノオロチは、毎年出雲の娘を一人ずつ食べていました。須佐之男命は八つの樽の酒を飲ませ、眠ったところを退治します。その尾から出てきたのが、三種の神器のひとつ・草薙剣です。',
    },
  },
  {
    id: 'momotaro', region: 'chugoku', ou: [133.918, 34.666],
    nom: { en: 'Momotarō, the Peach Boy', fr: "Momotarō, le garçon né d'une pêche", ja: '桃太郎' },
    lieu: { en: 'Okayama', fr: 'Okayama', ja: '岡山' },
    texte: {
      en: 'An old woman found a giant peach floating down the river. Inside: a baby, Momotarō! When he grew up, he set off to fight the ogres of Onigashima island, with millet dumplings to win over a dog, a monkey and a pheasant. Okayama, land of peaches, made him its hero… inspired, they say, by Prince Kibitsuhiko, who defeated the ogre Ura.',
      fr: "Une vieille femme trouva une pêche géante qui flottait sur la rivière. À l'intérieur : un bébé, Momotarō ! Devenu grand, il partit combattre les ogres de l'île d'Onigashima, avec des boulettes de millet pour amadouer un chien, un singe et un faisan. Okayama, pays des pêches, en a fait son héros… inspiré, dit-on, du prince Kibitsuhiko, vainqueur de l'ogre Ura.",
      ja: '川を流れてきた大きな桃から生まれた桃太郎。きびだんごで犬・猿・雉を家来にして、鬼ヶ島へ鬼退治に出かけます。桃の名産地・岡山では、鬼の温羅を退治した吉備津彦命がそのモデルだと伝えられています。',
    },
  },
  {
    id: 'heikegani', region: 'chugoku', ou: [130.958, 33.963],
    nom: { en: 'The Heike Crabs', fr: 'Les crabes samouraïs', ja: '平家蟹' },
    lieu: { en: 'Dan-no-ura · Yamaguchi', fr: 'Dan-no-ura · Yamaguchi', ja: '山口・壇ノ浦' },
    texte: {
      en: 'In 1185, in the Dan-no-ura strait, the Taira clan (the Heike) lost their last naval battle against the Minamoto. Rather than be captured, many samurai threw themselves into the sea along with the child emperor Antoku. Ever since, fishermen have found crabs whose shells show the face of an angry warrior: their souls, it is said.',
      fr: "En 1185, dans le détroit de Dan-no-ura, le clan des Taira (les Heike) perdit sa dernière bataille navale contre les Minamoto. Plutôt que d'être capturés, beaucoup de samouraïs se jetèrent à la mer avec le petit empereur Antoku. Depuis, les pêcheurs trouvent des crabes dont la carapace montre un visage de guerrier en colère : ce seraient leurs âmes.",
      ja: '1185年、壇ノ浦の戦いで平家は源氏に敗れ、多くの武者が幼い安徳天皇とともに海に身を投げました。それ以来この海では、甲羅に怒った武者の顔が浮かぶカニがとれるようになりました。人々はそれを平家の武士の魂だと考え、「平家蟹」と呼んでいます。',
    },
  },
  {
    id: 'tanuki', region: 'shikoku', ou: [134.585, 34.0],
    nom: { en: 'The Great Tanuki War of Awa', fr: "La grande guerre des tanuki d'Awa", ja: '阿波狸合戦' },
    lieu: { en: 'Komatsushima · Tokushima', fr: 'Komatsushima · Tokushima', ja: '徳島・小松島' },
    texte: {
      en: 'At the end of the Edo period, two tanuki clans went to war in Awa: Kinchō, hero of Komatsushima, against old Rokuemon. Hundreds of tanuki, shape-shifted into warriors, battled for days by the river. Kinchō won but died of his wounds. A shrine is still dedicated to him, and his name even appears in Studio Ghibli\'s Pom Poko.',
      fr: "À la fin de l'époque Edo, deux clans de tanuki se firent la guerre à Awa : celui de Kinchō, le héros de Komatsushima, contre celui du vieux Rokuemon. Des centaines de tanuki, changés en guerriers, s'affrontèrent pendant des jours au bord de la rivière. Kinchō gagna mais mourut de ses blessures. Un sanctuaire lui est encore dédié, et son nom apparaît même dans Pompoko, le film du studio Ghibli.",
      ja: '江戸時代の終わりごろ、阿波の国で狸の大合戦がありました。小松島の金長狸と、六右衛門狸の一族です。武者に化けた何百もの狸が川原で何日も戦い、金長は勝利しますが傷がもとで死んでしまいます。小松島にはいまも金長神社があり、ジブリ映画『平成狸合戦ぽんぽこ』にも金長の名が登場します。',
    },
  },
  {
    id: 'kamikaze', region: 'kyushu', ou: [130.35, 33.82],
    nom: { en: 'The Divine Wind', fr: 'Le vent divin', ja: '神風' },
    lieu: { en: 'Hakata Bay · Fukuoka', fr: 'Baie de Hakata · Fukuoka', ja: '福岡・博多湾' },
    texte: {
      en: 'In 1274 and again in 1281, the huge Mongol fleets of Kublai Khan attacked Japan through Hakata Bay. Both times, a terrible storm wrecked the enemy ships. The Japanese saw the hand of the gods in it and called it kamikaze, "the divine wind".',
      fr: "En 1274 puis en 1281, les immenses flottes mongoles de Kubilai Khan attaquèrent le Japon par la baie de Hakata. Les deux fois, une terrible tempête détruisit les navires ennemis. Les Japonais y virent la main des dieux et l'appelèrent kamikaze, « le vent divin ».",
      ja: '1274年と1281年の二度、フビライ・ハンの元の大艦隊が博多湾から日本に攻めてきました。そのたびに激しい嵐が起こり、敵の船は沈んでしまいます。人々はこれを神々の力だと信じ、「神風」と呼びました。',
    },
  },
  {
    id: 'amabie', region: 'kyushu', ou: [130.5, 32.72],
    nom: { en: 'Amabie', fr: 'Amabie', ja: 'アマビエ' },
    lieu: { en: 'Sea of Higo · Kumamoto', fr: 'Mer de Higo · Kumamoto', ja: '熊本・肥後の海' },
    texte: {
      en: 'In 1846, a light shone every night in the sea of Higo. When an official went to look, a strange creature with long hair, a beak and scales rose from the water. "If an epidemic comes," it said, "show my picture to the people." In 2020, during Covid, people all over Japan drew Amabie by the thousands.',
      fr: "En 1846, une lumière brillait chaque nuit dans la mer de Higo. Un fonctionnaire alla voir : une étrange créature aux longs cheveux, avec un bec et des écailles, sortit de l'eau. « Si une épidémie arrive, dit-elle, montrez mon portrait aux gens. » En 2020, pendant le Covid, les Japonais ont dessiné Amabie par milliers.",
      ja: '1846年、肥後の海に毎晩光るものが現れました。役人が見に行くと、長い髪にくちばし、うろこの体をもつ不思議な生きものが海から現れ、「疫病がはやったら、わたしの姿を描いて人々に見せなさい」と告げたといいます。2020年、コロナ禍の日本ではたくさんの人がアマビエを描きました。',
    },
  },
  {
    id: 'iwato', region: 'kyushu', ou: [131.42, 32.78],
    nom: { en: "The Sun Goddess's Cave", fr: 'La grotte de la déesse du soleil', ja: '天岩戸' },
    lieu: { en: 'Takachiho · Miyazaki', fr: 'Takachiho · Miyazaki', ja: '宮崎・高千穂' },
    texte: {
      en: 'Furious at her brother Susanoo, Amaterasu, the sun goddess, shut herself in a cave and the world fell into darkness. The gods made the roosters crow, and the goddess Ame-no-Uzume danced so comically that everyone burst out laughing. Curious, Amaterasu opened the stone door a crack… and light returned to the world.',
      fr: "Furieuse contre son frère Susanoo, Amaterasu, la déesse du soleil, s'enferma dans une grotte : le monde plongea dans la nuit. Les dieux firent chanter les coqs, et la déesse Ame-no-Uzume dansa si drôlement que tous éclatèrent de rire. Curieuse, Amaterasu entrouvrit la porte de pierre… et la lumière revint sur le monde.",
      ja: '弟・須佐之男命の乱暴に怒った太陽の女神・天照大御神は、天岩戸に隠れてしまい、世界は真っ暗になりました。神々は鶏を鳴かせ、天宇受売命がおもしろおかしく踊ると、みんな大笑い。気になった天照大御神が岩戸を少し開けたところで外へ引き出され、世界に光が戻ったのです。',
    },
  },
  {
    id: 'kijimuna', region: 'kyushu', ou: [128.13, 26.68],
    nom: { en: 'Kijimunā', fr: 'Le kijimunā', ja: 'キジムナー' },
    lieu: { en: 'Ōgimi · Okinawa', fr: 'Ōgimi · Okinawa', ja: '沖縄・大宜味' },
    texte: {
      en: "In Okinawa's old banyan trees live the kijimunā, mischievous red-haired spirits the size of a child. They love fishing and only eat the fish's left eye! A friendly kijimunā brings luck to the whole household. But beware: they hate octopus… and farts.",
      fr: "Dans les vieux banians d'Okinawa vivent les kijimunā, des esprits farceurs aux cheveux rouges, de la taille d'un enfant. Ils adorent la pêche et ne mangent que l'œil gauche des poissons ! Un kijimunā ami porte bonheur à toute la maison. Mais attention : il déteste les pieuvres… et les pets.",
      ja: '沖縄の古いガジュマルの木には、赤い髪をした子どものような精霊・キジムナーが住んでいます。いたずら好きで漁が得意、魚の左目だけを食べるそうです。仲良くなればその家は栄えますが、タコとおならが大嫌い。大宜味村では「ぶながや」とも呼ばれます。',
    },
  },
];

// ---------------------------------------------------------------- Mémoire (ce navigateur seulement)
function lireTrouvees() {
  try {
    const ids = JSON.parse(localStorage.getItem(MEMOIRE) || '[]');
    return new Set(ids.filter((id) => LEGENDES.some((l) => l.id === id)));
  } catch {
    return new Set();
  }
}
function garderTrouvees(trouvees) {
  try { localStorage.setItem(MEMOIRE, JSON.stringify([...trouvees])); } catch { /* pas grave */ }
}

const creer = (balise, classe, texte) => {
  const el = document.createElement(balise);
  if (classe) el.className = classe;
  if (texte != null) el.textContent = texte;
  return el;
};

/**
 * Pose les légendes sur la carte. outils : { t, enLangue, langue() } pour les textes,
 * afficherMessage(texte), fermerPanneau() (la liste) et fermerFiche() (la fiche d'un lieu), venus d'app.js.
 * Renvoie { majLangue, remplirPanneau } : app.js les appelle au changement de langue et à l'ouverture de la liste.
 */
export function brancherLegendes(map, maplibregl, outils) {
  const { t, enLangue, langue, afficherMessage, fermerPanneau, fermerFiche, reperes, adresse, nomSite } = outils;
  const carte = map.getContainer();
  const conteneur = map.getCanvasContainer();
  const papier = document.getElementById('papier');
  const bouton = document.getElementById('btn-legendes');
  const panneau = document.getElementById('panneau-legendes');
  const sansMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const total = LEGENDES.length;
  const trouvees = lireTrouvees();
  let bulle = null; // { legende, popup } : la bulle ouverte
  let cachees = null;

  // ---- Les dessins sur la carte
  for (const l of LEGENDES) {
    const el = creer('button', 'legende lg');
    el.type = 'button';
    el.dataset.legende = l.id;
    el.innerHTML = DESSINS[l.id];
    el.addEventListener('click', (e) => {
      e.stopPropagation(); // sinon la carte reçoit le clic et referme la bulle aussitôt
      ouvrirBulle(l);
    });
    l.el = el;
    l.marqueur = new maplibregl.Marker({ element: el, anchor: 'bottom', opacityWhenCovered: '0.25' })
      .setLngLat(l.ou);
    // juste au-dessus du papier vieilli, donc sous les épingles des lieux, qui restent devant
    // (reperes.js ne la garde sur la carte que près de l'écran, et pas en vue lointaine)
    reperes.suivre(l.marqueur, {
      voulu: false,
      placer: (moi) => conteneur.insertBefore(moi, papier?.parentNode === conteneur ? papier.nextSibling : conteneur.firstChild),
    });
  }

  // ---- Cachées tant qu'on voit tout le Japon ; seules celles à l'écran bougent
  function animerVisibles() {
    if (sansMouvement) return;
    const vue = map.getBounds();
    for (const l of LEGENDES) l.el.classList.toggle('anime', !cachees && vue.contains(l.ou));
  }
  let gardees = null;
  function majZoom() {
    // posées un peu avant de se montrer (le fondu d'entrée se joue), retirées après le fondu de sortie
    const g = map.getZoom() >= ZOOM_LEGENDES - 0.35;
    if (g !== gardees) {
      gardees = g;
      for (const l of LEGENDES) reperes.montrer(l.marqueur, g, 450);
    }
    const c = map.getZoom() < ZOOM_LEGENDES;
    if (c === cachees) return;
    cachees = c;
    carte.classList.toggle('sans-legendes', c);
    if (c) fermerBulle();
    animerVisibles();
  }
  map.on('zoom', majZoom);
  map.on('moveend', animerVisibles);
  majZoom();

  // ---- La bulle qui raconte la légende
  function contenuBulle(l) {
    const div = creer('div');
    div.append(creer('h3', 'bulle-titre', enLangue(l.nom)));
    // Le nom japonais sous le titre ; en japonais, le nom anglais
    const second = langue() === 'ja' ? l.nom.en : l.nom.ja;
    const sous = creer('p', 'bulle-second', second);
    sous.lang = langue() === 'ja' ? 'en' : 'ja';
    div.append(sous, creer('p', 'bulle-lieu', enLangue(l.lieu)), creer('p', 'bulle-texte', enLangue(l.texte)));
    return div;
  }

  function ouvrirBulle(l) {
    fermerBulle();
    const hauteur = l.el.querySelector('svg').getBoundingClientRect().height - 2;
    const popup = new maplibregl.Popup({ className: 'bulle-legende', offset: decalages(hauteur), maxWidth: '300px' })
      .setLngLat(l.ou)
      .setDOMContent(contenuBulle(l))
      .addTo(map);
    popup.getElement().querySelector('.maplibregl-popup-close-button')?.setAttribute('aria-label', t('fermer'));
    bulle = { legende: l, popup };
    l.el.classList.add('ouverte');
    popup.on('close', () => {
      l.el.classList.remove('ouverte');
      if (bulle?.popup === popup) bulle = null;
    });
    requestAnimationFrame(() => garderVisible(popup));
    trouver(l);
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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermerBulle(); });

  // ---- Le compteur, la liste et le bravo
  function trouver(l) {
    if (trouvees.has(l.id)) return;
    trouvees.add(l.id);
    garderTrouvees(trouvees);
    majCompteur(true);
    if (!panneau.hidden) remplirPanneau();
    if (trouvees.size === total) setTimeout(feliciter, 1200);
    else afficherMessage(t('legendeTrouvee', trouvees.size, total));
  }

  function majCompteur(nouvelle = false) {
    bouton.hidden = trouvees.size === 0;
    document.getElementById('compteur-legendes').textContent = `${trouvees.size}/${total}`;
    bouton.classList.toggle('complet', trouvees.size === total);
    bouton.setAttribute('aria-label', `${t('legendesTitre')} : ${trouvees.size}/${total}`);
    if (nouvelle) {
      bouton.classList.remove('nouvelle');
      void bouton.offsetWidth; // relance la petite animation
      bouton.classList.add('nouvelle');
    }
  }

  /** Remplit la liste : les légendes trouvées (un appui y emmène), et des « ? » avec leur région pour les autres. */
  function remplirPanneau() {
    const n = trouvees.size;
    const liste = creer('ul', 'liste-legendes');
    for (const l of LEGENDES) {
      const li = creer('li');
      if (trouvees.has(l.id)) {
        const b = creer('button', 'legende-ligne');
        b.type = 'button';
        const mini = creer('span', 'legende-mini lg');
        mini.innerHTML = DESSINS[l.id];
        const textes = creer('span', 'legende-textes');
        textes.append(creer('b', '', enLangue(l.nom)), creer('small', '', enLangue(l.lieu)));
        b.append(mini, textes);
        b.addEventListener('click', () => allerA(l));
        li.append(b);
      } else {
        const d = creer('div', 'legende-ligne inconnue');
        const region = REGIONS.find((r) => r.cle === l.region);
        const textes = creer('span', 'legende-textes');
        textes.append(creer('b', '', t('legendeInconnue')), creer('small', '', enLangue(region?.nom)));
        d.append(creer('span', 'legende-mini', '?'), textes);
        li.append(d);
      }
      liste.append(li);
    }
    panneau.replaceChildren(
      creer('p', 'hasard-titre', t('legendesTitre')),
      creer('p', 'legendes-info', n === total ? t('legendesToutes', total) : t('legendesInfo', n, total)),
      ...(n === total ? [boutonPartage('btn-lancer legendes-partager')] : []),
      liste,
    );
    if (n === total) preparerImage().catch(() => {});
  }

  // ---- L'image « Bravo » à partager (bravo-image.js), fabriquée d'avance : sur téléphone, le partage
  //      doit partir juste après l'appui, sinon le navigateur le refuse.
  let image = null; // Promise du fichier
  function preparerImage() {
    image ||= import('./bravo-image.js')
      .then(({ imageBravo }) => imageBravo({
        legendes: LEGENDES, dessins: DESSINS,
        textes: { titre: t('bravoTitre'), texte: t('bravoImageTexte', total), defi: t('bravoImageDefi'), adresse, nomSite },
      }))
      .then((blob) => new File([blob], `random-japan-place-${total}-legendes.jpg`, { type: 'image/jpeg' }));
    image.catch(() => { image = null; });
    return image;
  }

  function boutonPartage(classe) {
    const b = creer('button', classe);
    b.type = 'button';
    b.innerHTML = `${ICONE_PARTAGE}<span>${echapper(t('bravoPartager'))}</span>`;
    b.addEventListener('click', () => partagerImage(b));
    return b;
  }

  async function partagerImage(bouton) {
    bouton.disabled = true;
    try {
      const fichier = await preparerImage();
      // Téléphone : la feuille de partage (TikTok, Instagram, messages…) ; ordinateur : l'image est enregistrée
      if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [fichier] })) {
        await navigator.share({ files: [fichier], text: t('bravoPartageMessage', total, adresse) }).catch(() => {});
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(fichier);
        a.download = fichier.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
        afficherMessage(t('bravoImageEnregistree'));
      }
    } catch (e) {
      console.warn('Image du bravo', e);
      afficherMessage(t('bravoImageErreur'));
    } finally {
      bouton.disabled = false;
    }
  }

  /** Depuis la liste : vole jusqu'à la légende et ouvre sa bulle. */
  function allerA(l) {
    fermerPanneau();
    fermerFiche();
    fermerBulle();
    map.once('moveend', () => ouvrirBulle(l));
    map.flyTo({ center: l.ou, zoom: Math.max(map.getZoom(), 8), duration: sansMouvement ? 0 : 2200, essential: true });
  }

  function feliciter() {
    const fond = creer('div', 'bravo-legendes');
    const carteBravo = creer('div', 'bravo-carte panneau');
    carteBravo.setAttribute('role', 'dialog');
    carteBravo.setAttribute('aria-modal', 'true');
    carteBravo.setAttribute('aria-labelledby', 'bravo-titre');
    const sceau = creer('div', 'bravo-sceau', '伝説');
    sceau.setAttribute('aria-hidden', 'true');
    const titre = creer('h2', '', t('bravoTitre'));
    titre.id = 'bravo-titre';
    const ok = creer('button', 'btn-secondaire bravo-merci', t('bravoBouton'));
    ok.type = 'button';
    carteBravo.append(sceau, titre, creer('p', '', t('bravoTexte', total)), boutonPartage('btn-lancer'), ok);
    preparerImage().catch(() => {});
    fond.append(carteBravo);
    const fermer = () => fond.remove();
    ok.addEventListener('click', fermer);
    fond.addEventListener('click', (e) => { if (e.target === fond) fermer(); });
    fond.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermer(); });
    document.body.append(fond);
    ok.focus();
  }

  function majLangue() {
    image = null; // l'image du bravo est dans la langue choisie
    document.getElementById('txt-legendes').textContent = t('legendes');
    for (const l of LEGENDES) l.el.setAttribute('aria-label', t('legendeAria', enLangue(l.nom)));
    majCompteur();
    if (bulle) bulle.popup.setDOMContent(contenuBulle(bulle.legende));
    if (!panneau.hidden) remplirPanneau();
  }
  majLangue();

  return { majLangue, remplirPanneau };
}

const ICONE_PARTAGE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>';
const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Pour les essais : ouvre tout de suite la bulle d'une légende (ex. « kitsune »), comme un appui. */
export function ouvrirLegende(id) {
  LEGENDES.find((l) => l.id === id)?.el?.click();
}
