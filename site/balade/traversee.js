// ================================================================
// La carte de la traversée en bateau (jeu.partir, balade.js) : d'Udo à Yakushima, et retour.
// Refaite le 2026-10-31 (le propriétaire, sur la première, une esquisse : « Tu peux refaire la carte mieux que ça avec le bateau
// qui avance petit à petit ») : le sud de Kyūshū d'après Natural Earth 1:10m (domaine public, la source du trait de côte de la
// carte), projeté sur 600 × 720 (longitudes 129,95 à 131,75, latitudes 30,15 à 32 ; 3,5 px par km), ses côtes lissées ; les
// reliefs (Sakurajima qui fume, le Kaimon-dake, les montagnes et les cèdres de Yakushima), les noms dans la langue du joueur ;
// la route par le cap Toi et le détroit d'Ōsumi, et le petit bateau du batelier (sa coque blanche, sa bande bleue, son drapeau)
// qui la suit pas à pas en traçant derrière lui la ligne rouge, avec son sillage et la houle.
// ================================================================

// les terres : Kyūshū, Yakushima, Tanegashima, puis les îles du bord (Koshikijima, Kuchinoerabujima, Kuroshima)
const KYUSHU = 'M326.0 -46.7 Q528.2 -46.7 513.6 0.6 Q499.1 47.9 499.5 51.4 Q500.0 55.0 499.6 57.2 Q499.2 59.4 500.6 64.3 Q502.0 69.3 504.0 72.6 Q506.0 75.9 510.7 77.7 Q515.4 79.4 511.9 86.0 Q508.4 92.6 504.3 114.2 Q500.2 135.8 501.0 141.7 Q501.8 147.5 494.5 154.3 Q487.2 161.1 486.4 164.3 Q485.6 167.5 483.0 171.5 Q480.3 175.6 479.3 179.9 Q478.4 184.1 479.8 187.0 Q481.1 189.8 481.2 193.9 Q481.2 198.1 478.3 201.3 Q475.4 204.5 473.3 215.2 Q471.3 225.9 468.2 230.7 Q465.2 235.5 463.9 239.8 Q462.7 244.2 461.6 245.1 Q460.4 246.1 458.3 244.6 Q456.1 243.2 457.2 240.7 Q458.3 238.1 448.5 239.5 Q438.6 240.8 436.0 239.5 Q433.3 238.1 432.5 236.7 Q431.7 235.2 431.4 230.0 Q431.0 224.8 425.9 218.5 Q420.9 212.2 418.8 211.7 Q416.8 211.2 413.2 212.1 Q409.5 213.1 404.9 209.4 Q400.2 205.7 393.3 207.1 Q386.5 208.4 380.2 211.3 Q373.9 214.2 369.5 218.5 Q365.1 222.8 362.2 227.8 Q359.4 232.8 356.9 240.3 Q354.5 247.9 356.5 249.6 Q358.5 251.4 368.1 254.4 Q377.8 257.5 381.2 259.3 Q384.7 261.2 385.2 263.5 Q385.8 265.7 385.3 267.2 Q384.8 268.8 381.2 271.2 Q377.7 273.6 376.2 276.5 Q374.7 279.4 377.8 280.6 Q380.9 281.7 386.2 279.4 Q391.6 277.0 392.8 278.7 Q394.0 280.4 382.1 290.9 Q370.1 301.5 365.5 301.1 Q361.0 300.6 356.9 301.9 Q352.7 303.1 352.5 307.3 Q352.2 311.4 347.8 320.0 Q343.3 328.5 339.4 333.3 Q335.4 338.1 330.0 341.7 Q324.7 345.2 315.8 348.5 Q306.9 351.8 298.4 353.5 Q289.8 355.2 285.3 357.1 Q280.8 358.9 277.7 361.3 Q274.6 363.7 273.6 365.5 Q272.5 367.2 265.5 369.0 Q258.5 370.9 250.6 379.1 Q242.6 387.2 239.3 387.6 Q235.9 387.9 236.8 375.0 Q237.8 362.1 242.1 358.1 Q246.3 354.1 255.3 348.0 Q264.2 342.0 267.9 329.3 Q271.6 316.6 269.8 313.2 Q268.0 309.8 272.4 302.3 Q276.8 294.8 278.3 288.5 Q279.9 282.1 281.1 272.3 Q282.2 262.6 282.0 258.9 Q281.8 255.1 277.5 243.9 Q273.2 232.6 269.5 226.1 Q265.8 219.7 258.5 215.1 Q251.1 210.4 249.3 205.3 Q247.5 200.2 249.6 191.8 Q251.8 183.4 250.2 180.1 Q248.5 176.8 238.7 174.9 Q229.0 173.1 222.5 169.6 Q216.1 166.0 214.9 163.6 Q213.6 161.1 217.5 156.1 Q221.3 151.0 225.3 148.9 Q229.3 146.9 233.4 147.8 Q237.4 148.7 241.7 148.4 Q245.9 148.1 249.9 149.1 Q253.9 150.1 255.7 153.4 Q257.4 156.7 256.9 161.9 Q256.4 167.1 257.0 168.5 Q257.6 169.9 259.8 170.7 Q262.0 171.4 265.8 170.6 Q269.5 169.8 272.5 166.6 Q275.5 163.5 279.2 157.3 Q283.0 151.1 284.9 143.5 Q286.8 135.8 285.8 128.8 Q284.8 121.7 280.2 117.2 Q275.5 112.8 269.1 113.1 Q262.7 113.5 254.0 110.1 Q245.3 106.8 238.5 108.9 Q231.6 111.0 226.3 117.3 Q221.0 123.6 219.2 132.2 Q217.4 140.8 211.6 148.1 Q205.9 155.4 204.3 162.1 Q202.8 168.8 200.1 173.6 Q197.4 178.3 195.2 183.9 Q193.0 189.4 190.9 201.1 Q188.7 212.8 189.4 216.8 Q190.2 220.9 195.2 232.0 Q200.2 243.2 202.2 251.1 Q204.2 259.0 206.0 262.9 Q207.8 266.7 212.7 269.2 Q217.6 271.7 221.1 276.8 Q224.6 281.9 230.7 282.7 Q236.8 283.5 237.0 286.0 Q237.3 288.5 233.6 302.6 Q229.9 316.6 223.9 319.4 Q217.9 322.1 215.0 325.4 Q212.1 328.7 210.0 326.4 Q207.9 324.0 201.7 325.0 Q195.6 326.1 193.1 324.8 Q190.6 323.5 189.8 322.2 Q189.0 320.9 188.8 318.2 Q188.7 315.4 187.1 310.9 Q185.5 306.4 183.6 303.6 Q181.6 300.7 174.3 296.4 Q167.0 292.1 141.4 291.3 Q115.8 290.4 112.1 290.6 Q108.4 290.7 104.0 292.4 Q99.6 294.2 95.2 293.8 Q90.7 293.3 89.0 290.5 Q87.4 287.7 86.8 284.1 Q86.2 280.5 83.6 273.5 Q81.0 266.5 78.7 264.1 Q76.5 261.6 81.0 262.2 Q85.5 262.8 85.7 260.5 Q85.9 258.2 84.1 254.8 Q82.2 251.3 77.8 246.9 Q73.4 242.5 64.9 236.3 Q56.3 230.1 60.7 227.9 Q65.0 225.7 67.9 225.3 Q70.8 225.0 76.4 226.9 Q82.0 228.8 87.4 234.8 Q92.8 240.8 95.5 236.2 Q98.3 231.6 106.4 223.9 Q114.4 216.1 116.3 209.9 Q118.3 203.7 120.3 200.5 Q122.4 197.3 124.3 190.3 Q126.2 183.3 127.2 176.8 Q128.2 170.3 126.5 165.6 Q124.8 160.8 127.0 156.7 Q129.2 152.6 129.0 149.0 Q128.7 145.5 126.9 142.4 Q125.1 139.3 120.5 133.9 Q115.8 128.4 109.4 118.5 Q103.1 108.6 93.2 102.2 Q83.2 95.8 80.6 94.9 Q78.0 93.9 75.9 87.8 Q73.8 81.7 75.4 74.5 Q77.0 67.3 78.6 65.8 Q80.1 64.2 87.6 67.2 Q95.0 70.2 90.5 65.5 Q86.0 60.8 84.1 58.0 Q82.3 55.1 85.3 49.8 Q88.2 44.5 89.2 36.0 Q90.1 27.4 87.6 19.2 Q85.0 11.0 79.9 5.8 Q74.7 0.5 74.5 -3.2 Q74.3 -6.8 76.6 -8.6 Q78.8 -10.4 81.7 -14.6 Q84.7 -18.8 84.7 -23.5 Q84.7 -28.2 80.7 -32.3 Q76.6 -36.4 81.0 -41.5 Q85.4 -46.7 94.5 -46.7 Q103.6 -46.7 106.6 -42.9 Q109.6 -39.1 112.9 -40.2 Q116.2 -41.2 120.0 -44.0 Q123.9 -46.7 326.0 -46.7Z';
const YAKUSHIMA = 'M240.7 639.4 Q239.8 646.2 236.1 655.7 Q232.4 665.3 225.1 672.7 Q217.9 680.1 213.5 683.3 Q209.1 686.6 199.2 688.2 Q189.2 689.8 183.9 690.2 Q178.7 690.5 170.6 687.9 Q162.6 685.4 160.8 682.1 Q159.0 678.9 152.2 662.6 Q145.4 646.2 144.2 641.1 Q143.0 636.0 142.5 630.4 Q142.1 624.9 143.8 624.1 Q145.5 623.4 151.6 623.3 Q157.8 623.1 160.8 618.6 Q163.7 614.0 167.1 610.3 Q170.4 606.7 171.4 603.6 Q172.4 600.4 175.9 600.5 Q179.4 600.5 181.2 598.4 Q183.0 596.2 187.1 599.8 Q191.2 603.4 198.6 606.0 Q205.9 608.7 211.2 613.3 Q216.5 617.8 223.0 619.8 Q229.6 621.7 235.5 627.1 Q241.5 632.6 240.7 639.4Z';
const AUTRES = ['M368.9 451.3 Q370.5 451.2 370.7 454.3 Q370.8 457.5 372.7 462.3 Q374.5 467.2 376.9 470.5 Q379.3 473.8 376.5 476.4 Q373.7 479.0 373.7 485.2 Q373.7 491.4 375.0 498.9 Q376.3 506.3 372.1 513.5 Q367.9 520.8 368.6 524.6 Q369.3 528.4 369.2 534.4 Q369.2 540.5 368.2 543.2 Q367.1 546.0 364.9 547.5 Q362.6 549.1 362.2 555.3 Q361.9 561.5 358.9 562.7 Q356.0 563.9 353.6 563.9 Q351.1 563.9 349.6 567.5 Q348.0 571.1 346.1 573.7 Q344.2 576.3 343.9 580.6 Q343.5 584.9 341.2 588.4 Q339.0 591.8 339.1 594.7 Q339.3 597.7 338.8 599.2 Q338.3 600.8 339.6 602.2 Q341.0 603.6 341.8 605.8 Q342.7 608.1 341.6 610.3 Q340.6 612.5 340.2 614.6 Q339.9 616.7 341.2 619.6 Q342.6 622.6 340.2 625.3 Q337.8 628.1 337.6 630.7 Q337.4 633.3 334.3 632.9 Q331.2 632.5 325.0 634.2 Q318.8 635.9 316.3 638.0 Q313.7 640.0 312.8 642.3 Q311.9 644.5 309.4 644.5 Q306.8 644.5 306.3 642.6 Q305.8 640.7 304.1 638.3 Q302.4 635.9 303.8 629.8 Q305.2 623.7 304.7 618.6 Q304.2 613.4 302.7 610.1 Q301.1 606.8 300.5 602.8 Q299.8 598.9 300.1 597.1 Q300.5 595.4 303.6 596.6 Q306.7 597.8 307.7 594.6 Q308.8 591.3 312.9 586.8 Q317.0 582.3 321.9 575.1 Q326.7 567.9 330.2 557.3 Q333.6 546.8 333.2 537.8 Q332.8 528.9 331.9 526.3 Q331.1 523.7 331.5 521.8 Q331.8 519.9 330.8 518.3 Q329.8 516.7 334.3 511.1 Q338.8 505.4 341.9 499.9 Q345.0 494.4 345.1 492.1 Q345.1 489.8 347.5 489.0 Q349.9 488.2 351.3 483.8 Q352.7 479.5 352.4 475.4 Q352.1 471.2 355.6 465.3 Q359.1 459.5 362.1 456.1 Q365.1 452.7 366.2 452.0 Q367.3 451.4 368.9 451.3Z', 'M-6.4 52.2 Q-7.2 53.0 -7.3 53.8 Q-7.4 54.7 -7.1 55.9 Q-6.8 57.0 -7.0 59.6 Q-7.2 62.1 -6.7 63.5 Q-6.2 64.8 -6.6 66.1 Q-6.9 67.4 -8.1 68.8 Q-9.3 70.1 -12.4 70.5 Q-15.6 70.8 -17.8 72.2 Q-20.0 73.7 -22.4 73.6 Q-24.7 73.5 -25.9 72.1 Q-27.1 70.7 -28.7 69.6 Q-30.3 68.6 -31.2 66.4 Q-32.1 64.2 -33.1 62.5 Q-34.2 60.9 -34.3 59.5 Q-34.5 58.0 -33.3 57.2 Q-32.2 56.4 -32.7 55.9 Q-33.2 55.5 -35.0 56.2 Q-36.8 57.0 -38.4 59.0 Q-40.0 61.0 -40.0 55.5 Q-40.0 50.1 -37.5 48.3 Q-35.0 46.5 -31.8 47.4 Q-28.5 48.4 -22.2 53.8 Q-16.0 59.1 -14.7 59.6 Q-13.4 60.1 -12.9 58.9 Q-12.4 57.6 -13.1 55.7 Q-13.8 53.8 -13.0 52.6 Q-12.2 51.5 -9.7 51.1 Q-7.1 50.7 -6.3 51.1 Q-5.5 51.4 -6.4 52.2Z', 'M93.8 596.4 Q97.6 597.9 100.8 601.2 Q104.0 604.4 104.1 606.7 Q104.1 609.1 100.5 609.1 Q96.9 609.1 95.4 611.3 Q93.9 613.5 90.7 614.1 Q87.5 614.6 84.3 611.0 Q81.0 607.3 81.2 604.8 Q81.5 602.4 80.8 600.6 Q80.1 598.8 77.2 600.2 Q74.4 601.5 72.7 598.7 Q71.0 596.0 69.1 594.2 Q67.3 592.4 65.6 590.2 Q63.9 587.9 67.8 587.8 Q71.7 587.7 76.0 590.4 Q80.3 593.0 82.2 591.9 Q84.1 590.8 87.1 592.8 Q90.0 594.8 93.8 596.4Z', 'M-0.3 450.3 Q2.8 452.6 3.0 454.2 Q3.3 455.9 1.7 457.7 Q0.1 459.5 -1.7 460.6 Q-3.5 461.8 -5.5 461.8 Q-7.4 461.8 -10.0 460.6 Q-12.7 459.3 -14.0 456.5 Q-15.3 453.6 -11.7 450.7 Q-8.2 447.7 -7.1 447.3 Q-6.0 446.9 -4.7 447.4 Q-3.3 448.0 -0.3 450.3Z'];
// les îlots trop petits pour Natural Earth : x, y, demi-longueur, demi-largeur, angle (Mageshima, Iōjima, Takeshima)
const ILOTS = [[301.7, 488.4, 8.0, 3.5, -30], [115.0, 472.1, 10.1, 5.2, -10], [156.7, 462.4, 7.3, 2.4, -15]];
// les petites vagues dessinées en mer (loin des côtes, de la route et des noms)
const VAGUES = [[36, 351], [55, 137], [257, 597], [373, 672], [571, 109], [49, 209], [194, 446], [468, 517], [37, 498], [451, 438], [494, 670], [49, 560], [174, 340], [561, 174], [528, 567], [30, 626], [316, 692], [110, 562], [163, 513], [560, 360], [494, 380], [387, 580], [75, 430], [273, 413], [552, 242], [579, 600], [107, 350], [25, 287], [52, 696], [569, 422], [423, 629], [474, 597], [404, 513], [437, 690], [439, 270], [432, 362], [563, 520], [136, 689], [394, 317], [235, 237], [241, 700], [103, 177], [389, 236], [266, 540], [583, 295], [498, 300], [206, 389], [227, 496], [171, 578], [345, 359], [21, 86]];
// la route d'Udo (le port de Fukei) à Miyanoura (le port de Yakushima) : le long de la côte de Nichinan, au large du cap Toi,
// par le détroit d'Ōsumi ; une courbe de Catmull-Rom par ces points (à plus de 15 px des côtes : la carte vérifiée)
const ROUTE = [[512, 140], [524, 190], [494, 264], [420, 338], [302, 424], [244, 520], [214, 598]];
// les noms, dans les trois langues
const NOMS = {
  udo: { fr: 'Udo', en: 'Udo', ja: '鵜戸' },
  yakushima: { fr: 'Yakushima', en: 'Yakushima', ja: '屋久島' },
  kyushu: { fr: 'Kyūshū', en: 'Kyūshū', ja: '九州' },
  kagoshima: { fr: 'Kagoshima', en: 'Kagoshima', ja: '鹿児島' },
  miyazaki: { fr: 'Miyazaki', en: 'Miyazaki', ja: '宮崎' },
  sakurajima: { fr: 'Sakurajima', en: 'Sakurajima', ja: '桜島' },
  tanegashima: { fr: 'Tanegashima', en: 'Tanegashima', ja: '種子島' },
  miyanoura: { fr: 'port de Miyanoura', en: 'Miyanoura port', ja: '宮之浦港' },
  fukei: { fr: 'port de Fukei', en: 'Fukei port', ja: '吹毛井港' },
  pacifique: { fr: ['Océan', 'Pacifique'], en: ['Pacific', 'Ocean'], ja: ['太平洋'] },
  chine: { fr: ['Mer de Chine', 'orientale'], en: ['East China', 'Sea'], ja: ['東シナ海'] },
  osumi: { fr: 'détroit d’Ōsumi', en: 'Ōsumi Strait', ja: '大隅海峡' },
};
const TITRE = { fr: (n) => `En route pour ${n}…`, en: (n) => `Sailing to ${n}…`, ja: (n) => `${n}へ　しゅっこう！` };

/** Une courbe lisse (Catmull-Rom, en courbes de Bézier) par ces points. */
function courbe(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], e = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6], c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${c[0]} ${c[1]}`;
  }
  return d;
}
/** Une montagne (une pente au soleil, l'autre à l'ombre), de taille s, en x, y (le pied). */
const montagne = (x, y, s = 1, c = '#b49e72', o = '#957f56') =>
  `<path d="M${x - 11 * s} ${y} L${x} ${y - 13 * s} L${x + 11 * s} ${y} Z" fill="${c}"/><path d="M${x} ${y - 13 * s} L${x + 11 * s} ${y} L${x + 2 * s} ${y} Z" fill="${o}"/>`;
/** Un petit cèdre (Yakushima). */
const cedre = (x, y, s = 1) => `<path d="M${x} ${y - 9 * s} L${x + 4 * s} ${y} L${x - 4 * s} ${y} Z" fill="#3f6a3a"/>`;

/**
 * La carte, en SVG (viewBox 600 × 720) : de, vers (udo, yakushima), l : la langue. Le bateau est au port de départ ; c'est
 * animerTraversee qui le fait partir.
 */
export function carteTraversee(de, vers, l) {
  const t = (cle) => NOMS[cle][l] ?? NOMS[cle].en;
  const titre = (TITRE[l] || TITRE.en)(t(vers));
  const pts = de === 'udo' ? ROUTE : [...ROUTE].reverse(), d = courbe(pts), [x0, y0] = pts[0], [x1, y1] = pts[pts.length - 1];
  const lignes = (cle, x, y, taille, h) => t(cle).map((s, i) => `<text x="${x}" y="${y + i * h}" font-size="${taille}">${s}</text>`).join('');
  const vagues = VAGUES.map(([x, y]) => `M${x - 8} ${y} q4 -3.5 8 0 q4 -3.5 8 0`).join(' ');
  const ilots = ILOTS.map(([x, y, a, b, r]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" transform="rotate(${r} ${x} ${y})"/>`).join('');
  const toutes = [KYUSHU, YAKUSHIMA, ...AUTRES].join(' ');
  return `<svg class="carte-mer" viewBox="0 0 600 720" role="img" aria-label="${titre}">
  <defs>
    <linearGradient id="mer-eau" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#d5e9ef"/><stop offset="1" stop-color="#b3d1de"/></linearGradient>
    <radialGradient id="mer-terre" cx="0.55" cy="0.3" r="0.8"><stop offset="0" stop-color="#efe5c6"/><stop offset="1" stop-color="#e2d4ab"/></radialGradient>
    <clipPath id="mer-cadre"><rect x="6" y="6" width="588" height="708" rx="18"/></clipPath>
    <mask id="mer-trace" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="720"><path class="trace-masque" d="${d}" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-dasharray="0 9999"/></mask>
  </defs>
  <g clip-path="url(#mer-cadre)">
    <rect width="600" height="720" fill="url(#mer-eau)"/>
    <path class="vagues" d="${vagues}" fill="none" stroke="#86b0c2" stroke-width="1.5" stroke-linecap="round"/>
    <g fill="none" stroke-linejoin="round"><path d="${toutes}" stroke="#c4dfe8" stroke-width="24"/><path d="${toutes}" stroke="#d9ecf1" stroke-width="11"/></g>
    <g fill="#c4dfe8" stroke="#c4dfe8" stroke-width="12">${ilots}</g>
    <path d="${KYUSHU} ${AUTRES.join(' ')}" fill="url(#mer-terre)" stroke="#86714f" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="${YAKUSHIMA}" fill="#cfe0a6" stroke="#6f7d4a" stroke-width="1.7" stroke-linejoin="round"/>
    <g fill="#e8dcb6" stroke="#86714f" stroke-width="1.4">${ilots}</g>
    <g>${montagne(372, 176, 1.1)}${montagne(338, 210, 0.9)}${montagne(152, 238, 0.9)}${montagne(287, 302, 0.85)}${montagne(412, 196, 0.75)}</g>
    <g class="kaimon">${montagne(192.7, 324, 1.05, '#a99568', '#8a7550')}</g>
    <g class="sakurajima"><path d="M222 170 L231 156 L240 156 L249 170 Z" fill="#9c8a66"/><path d="M235.5 156 L240 156 L249 170 L241 170 Z" fill="#82704e"/>
      <g class="fumee" fill="#f2efe8" stroke="#b9b2a2" stroke-width="1"><circle cx="236" cy="149" r="4"/><circle cx="241" cy="141" r="5.5"/><circle cx="248" cy="132" r="7"/></g></g>
    <g class="foret-yaku">${montagne(176, 655, 1.15, '#7e9a5a', '#62804a')}${montagne(195, 650, 1.35, '#7e9a5a', '#62804a')}${montagne(212, 662, 0.95, '#7e9a5a', '#62804a')}
      ${cedre(160, 640)}${cedre(168, 668)}${cedre(186, 678)}${cedre(205, 676)}${cedre(224, 648)}${cedre(214, 628)}${cedre(190, 618)}${cedre(156, 656)}${cedre(228, 664)}</g>
    <g class="noms" fill="#4a3e2e">
      <text x="352" y="112" font-size="25" letter-spacing="5" fill="#8a7656" font-weight="700">${t('kyushu')}</text>
      <circle cx="202.3" cy="157.2" r="3.6" fill="#4a3e2e"/><text x="195" y="151" font-size="17" text-anchor="end">${t('kagoshima')}</text>
      <circle cx="491.3" cy="34.6" r="3.6" fill="#4a3e2e"/><text x="498" y="41" font-size="16">${t('miyazaki')}</text>
      <text x="236" y="192" font-size="14" text-anchor="middle" font-style="italic">${t('sakurajima')}</text>
      <text x="374" y="551" font-size="17">${t('tanegashima')}</text>
      <text x="136" y="661" font-size="23" text-anchor="end" font-weight="700">${t('yakushima')}</text>
    </g>
    <g class="mers" fill="#5f8799" font-style="italic" letter-spacing="2" text-anchor="middle">
      <g>${lignes('pacifique', 520, 470, 18, 22)}</g>
      <g>${lignes('chine', 84, 390, 16, 20)}</g>
      <text x="372" y="434" font-size="14" letter-spacing="1">${t('osumi')}</text>
    </g>
    <path class="route-a-venir" d="${d}" fill="none" stroke="#c8402c" stroke-width="2.6" stroke-dasharray="1 8" stroke-linecap="round" opacity="0.45"/>
    <path class="route" d="${d}" fill="none" stroke="#c8402c" stroke-width="3.4" stroke-dasharray="10 7" stroke-linecap="round" mask="url(#mer-trace)"/>
    <g class="udo"><path d="M489 120 H509 M491 124 H507 M493 120 V134 M505 120 V134" stroke="#c8402c" stroke-width="2.6" stroke-linecap="round"/><path d="M487 118 Q499 114 511 118" fill="none" stroke="#c8402c" stroke-width="3" stroke-linecap="round"/>
      <text x="484" y="134" font-size="21" font-weight="700" fill="#4a3e2e" text-anchor="end">${t('udo')}</text></g>
    <circle class="depart" cx="${x0}" cy="${y0}" r="6.5" fill="#fffaf0" stroke="#c8402c" stroke-width="3"/>
    <g class="arrivee"><circle class="onde" cx="${x1}" cy="${y1}" r="7" fill="none" stroke="#c8402c" stroke-width="3"/><circle cx="${x1}" cy="${y1}" r="7" fill="#c8402c" stroke="#fffaf0" stroke-width="2"/></g>
    <text class="port" x="${de === 'udo' ? 182 : 482}" y="${de === 'udo' ? 578 : 168}" font-size="15" fill="#4a3e2e" font-style="italic" text-anchor="end">${t(de === 'udo' ? 'miyanoura' : 'fukei')}</text>
    <g class="sillage" fill="none" stroke="#ffffff" stroke-width="1.6"></g>
    <g class="bateau" transform="translate(${x0} ${y0})"><g transform="scale(1.45)">
      <ellipse cx="0" cy="7" rx="18" ry="3" fill="#2a4a5a" opacity="0.18"/>
      <path d="M-18 -1 L18 -1 L12.5 7.5 L-14 7.5 Z" fill="#ffffff" stroke="#2a2420" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M-16 2.6 L16 2.6" stroke="#2f6ab0" stroke-width="2.6"/>
      <rect x="-10" y="-10" width="12" height="9" rx="1.5" fill="#f4f2ea" stroke="#2a2420" stroke-width="1.4"/><rect x="-7.5" y="-7.5" width="3.5" height="3.2" fill="#8fc3e6"/><rect x="-2.5" y="-7.5" width="3" height="3.2" fill="#8fc3e6"/>
      <path d="M6 -1 V-22" stroke="#2a2420" stroke-width="1.6" stroke-linecap="round"/><path d="M6 -22 L18 -18.5 L6 -15 Z" fill="#e8583e" stroke="#2a2420" stroke-width="1" stroke-linejoin="round"/>
    </g></g>
    <g class="boussole" transform="translate(552 668)"><circle r="23" fill="#fbf6e9" stroke="#6a5a3e" stroke-width="1.6"/><path d="M0 -18 L5 0 L0 18 L-5 0 Z" fill="#8a7656"/><path d="M0 -18 L5 0 L-5 0 Z" fill="#c8402c"/><path d="M-18 0 L0 -4 L18 0 L0 4 Z" fill="#8a7656" opacity="0.55"/><text y="-27" text-anchor="middle" font-size="13" font-weight="700" fill="#6a5a3e">N</text></g>
    <g class="titre"><rect x="128" y="20" width="344" height="52" rx="12" fill="#fbf6e9" stroke="#6a5a3e" stroke-width="2"/><rect x="134" y="26" width="332" height="40" rx="8" fill="none" stroke="#6a5a3e" stroke-width="0.8" opacity="0.6"/>
      <text x="300" y="54" font-size="${titre.length > 22 ? 23 : 25}" text-anchor="middle" font-weight="700" fill="#2a2420">${titre}</text></g>
  </g>
  <rect x="6" y="6" width="588" height="708" rx="18" fill="none" stroke="#6a5a3e" stroke-width="3"/>
  <rect x="13" y="13" width="574" height="694" rx="13" fill="none" stroke="#6a5a3e" stroke-width="1" opacity="0.5"/>
</svg>`;
}

/**
 * Fait avancer le bateau de la carte (el : ce qui la contient), en duree ms, doucement au départ et à l'arrivée ; la ligne rouge
 * se trace derrière lui, son sillage s'élargit et s'efface. Rend une promesse, tenue à l'arrivée (l'onde du port d'arrivée).
 */
export function animerTraversee(el, { duree = 6500 } = {}) {
  const svg = el.querySelector('svg'), route = svg.querySelector('.route'), masque = svg.querySelector('.trace-masque');
  const bateau = svg.querySelector('.bateau'), sillage = svg.querySelector('.sillage');
  const L = route.getTotalLength();
  masque.style.strokeDasharray = `${L} ${L}`;
  masque.style.strokeDashoffset = `${L}`;
  const vagues = [];
  return new Promise((fini) => {
    let debut = null, sens = 1, derniere = 0;
    const image = (now) => {
      if (debut === null) debut = now;
      const t = Math.min(1, (now - debut) / duree), p = 0.5 - 0.5 * Math.cos(Math.PI * t), s = p * L;
      const a = route.getPointAtLength(s), av = route.getPointAtLength(Math.min(L, s + 3)), ar = route.getPointAtLength(Math.max(0, s - 3));
      const dx = av.x - ar.x, dy = av.y - ar.y, n = Math.hypot(dx, dy) || 1;
      // (de profil : il regarde à gauche ou à droite, sa proue penche un peu dans les descentes ; la houle le berce)
      if (Math.abs(dx) > 0.4) sens = dx < 0 ? -1 : 1;
      const pente = Math.max(-20, Math.min(20, (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI)) * 0.55;
      const roulis = Math.sin(now / 240) * 3.2 * (t < 1 ? 1 : 0.4), houle = Math.sin(now / 310) * 1.2;
      bateau.setAttribute('transform', `translate(${a.x.toFixed(1)} ${(a.y + houle).toFixed(1)}) rotate(${(sens * pente + roulis).toFixed(1)}) scale(${sens} 1)`);
      masque.style.strokeDashoffset = `${(L - s).toFixed(1)}`;
      // le sillage : une petite vague derrière la poupe toutes les 130 ms, qui s'élargit et s'efface en 1,2 s
      if (t < 1 && now - derniere > 130) {
        derniere = now;
        const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        e.setAttribute('cx', (a.x - (dx / n) * 23).toFixed(1));
        e.setAttribute('cy', (a.y - (dy / n) * 23 + 9).toFixed(1));
        sillage.appendChild(e);
        vagues.push({ e, t0: now });
      }
      for (let i = vagues.length - 1; i >= 0; i--) {
        const v = vagues[i], age = (now - v.t0) / 1200;
        if (age >= 1) { v.e.remove(); vagues.splice(i, 1); continue; }
        v.e.setAttribute('rx', (3 + age * 9).toFixed(1));
        v.e.setAttribute('ry', (1.2 + age * 3).toFixed(1));
        v.e.setAttribute('opacity', (0.85 * (1 - age)).toFixed(2));
      }
      if (t < 1 || vagues.length) requestAnimationFrame(image);
      if (t >= 1 && !svg.classList.contains('arrive')) { svg.classList.add('arrive'); fini(); }
    };
    requestAnimationFrame(image);
  });
}
