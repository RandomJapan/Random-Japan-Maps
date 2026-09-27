// ================================================================
//  Régions et préfectures du Japon, pour le « lieu au hasard ».
//  La préfecture de chaque lieu est calculée à partir de ses coordonnées GPS
//  (contours dans data/prefectures.geojson, fabriqués par outils/fabriquer_prefectures.py).
// ================================================================

// Numéro officiel (JIS) de chaque préfecture → nom anglais (aussi utilisé en français) et japonais
export const PREFECTURES = {
  1: { en: 'Hokkaido', ja: '北海道' },
  2: { en: 'Aomori', ja: '青森県' },
  3: { en: 'Iwate', ja: '岩手県' },
  4: { en: 'Miyagi', ja: '宮城県' },
  5: { en: 'Akita', ja: '秋田県' },
  6: { en: 'Yamagata', ja: '山形県' },
  7: { en: 'Fukushima', ja: '福島県' },
  8: { en: 'Ibaraki', ja: '茨城県' },
  9: { en: 'Tochigi', ja: '栃木県' },
  10: { en: 'Gunma', ja: '群馬県' },
  11: { en: 'Saitama', ja: '埼玉県' },
  12: { en: 'Chiba', ja: '千葉県' },
  13: { en: 'Tokyo', ja: '東京都' },
  14: { en: 'Kanagawa', ja: '神奈川県' },
  15: { en: 'Niigata', ja: '新潟県' },
  16: { en: 'Toyama', ja: '富山県' },
  17: { en: 'Ishikawa', ja: '石川県' },
  18: { en: 'Fukui', ja: '福井県' },
  19: { en: 'Yamanashi', ja: '山梨県' },
  20: { en: 'Nagano', ja: '長野県' },
  21: { en: 'Gifu', ja: '岐阜県' },
  22: { en: 'Shizuoka', ja: '静岡県' },
  23: { en: 'Aichi', ja: '愛知県' },
  24: { en: 'Mie', ja: '三重県' },
  25: { en: 'Shiga', ja: '滋賀県' },
  26: { en: 'Kyoto', ja: '京都府' },
  27: { en: 'Osaka', ja: '大阪府' },
  28: { en: 'Hyogo', ja: '兵庫県' },
  29: { en: 'Nara', ja: '奈良県' },
  30: { en: 'Wakayama', ja: '和歌山県' },
  31: { en: 'Tottori', ja: '鳥取県' },
  32: { en: 'Shimane', ja: '島根県' },
  33: { en: 'Okayama', ja: '岡山県' },
  34: { en: 'Hiroshima', ja: '広島県' },
  35: { en: 'Yamaguchi', ja: '山口県' },
  36: { en: 'Tokushima', ja: '徳島県' },
  37: { en: 'Kagawa', ja: '香川県' },
  38: { en: 'Ehime', ja: '愛媛県' },
  39: { en: 'Kochi', ja: '高知県' },
  40: { en: 'Fukuoka', ja: '福岡県' },
  41: { en: 'Saga', ja: '佐賀県' },
  42: { en: 'Nagasaki', ja: '長崎県' },
  43: { en: 'Kumamoto', ja: '熊本県' },
  44: { en: 'Oita', ja: '大分県' },
  45: { en: 'Miyazaki', ja: '宮崎県' },
  46: { en: 'Kagoshima', ja: '鹿児島県' },
  47: { en: 'Okinawa', ja: '沖縄県' },
};

// Les 8 grandes régions, du nord au sud
export const REGIONS = [
  { cle: 'hokkaido', nom: { en: 'Hokkaido', fr: 'Hokkaidō', ja: '北海道' }, prefectures: [1] },
  { cle: 'tohoku', nom: { en: 'Tohoku', fr: 'Tōhoku', ja: '東北' }, prefectures: [2, 3, 4, 5, 6, 7] },
  { cle: 'kanto', nom: { en: 'Kanto', fr: 'Kantō', ja: '関東' }, prefectures: [8, 9, 10, 11, 12, 13, 14] },
  { cle: 'chubu', nom: { en: 'Chubu', fr: 'Chūbu', ja: '中部' }, prefectures: [15, 16, 17, 18, 19, 20, 21, 22, 23] },
  { cle: 'kansai', nom: { en: 'Kansai', fr: 'Kansai', ja: '関西' }, prefectures: [24, 25, 26, 27, 28, 29, 30] },
  { cle: 'chugoku', nom: { en: 'Chugoku', fr: 'Chūgoku', ja: '中国' }, prefectures: [31, 32, 33, 34, 35] },
  { cle: 'shikoku', nom: { en: 'Shikoku', fr: 'Shikoku', ja: '四国' }, prefectures: [36, 37, 38, 39] },
  { cle: 'kyushu', nom: { en: 'Kyushu & Okinawa', fr: 'Kyūshū et Okinawa', ja: '九州・沖縄' }, prefectures: [40, 41, 42, 43, 44, 45, 46, 47] },
];

export const regionDe = (code) => REGIONS.find((r) => r.prefectures.includes(code));

function dansAnneau(x, y, anneau) {
  let dedans = false;
  for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
    const [xi, yi] = anneau[i];
    const [xj, yj] = anneau[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}

function distanceSegment(x, y, a, b, k) {
  const ax = a[0] * k, ay = a[1], dx = b[0] * k - ax, dy = b[1] - ay, px = x * k;
  const t = dx === 0 && dy === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(ax + t * dx - px, ay + t * dy - y);
}

/**
 * Télécharge les contours et renvoie une fonction (lng, lat) → numéro de préfecture.
 * Un lieu au bord de la mer ou sur une toute petite île peut tomber juste hors des contours
 * simplifiés : on prend alors la préfecture dont le bord est le plus proche.
 */
export async function chargerPrefectures(url) {
  const geo = await (await fetch(url)).json();
  const polygones = [];
  for (const f of geo.features) {
    for (const anneaux of f.geometry.coordinates) {
      let [o, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
      for (const [x, y] of anneaux[0]) { o = Math.min(o, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
      polygones.push({ code: f.properties.code, anneaux, boite: [o, s, e, n] });
    }
  }
  return (lng, lat) => {
    for (const p of polygones) {
      const [o, s, e, n] = p.boite;
      if (lng < o || lng > e || lat < s || lat > n) continue;
      if (dansAnneau(lng, lat, p.anneaux[0]) && !p.anneaux.slice(1).some((trou) => dansAnneau(lng, lat, trou))) return p.code;
    }
    const k = Math.cos((lat * Math.PI) / 180);
    let proche = null, dmin = Infinity;
    for (const p of polygones) {
      const a = p.anneaux[0];
      for (let i = 0; i < a.length - 1; i++) {
        const d = distanceSegment(lng, lat, a[i], a[i + 1], k);
        if (d < dmin) { dmin = d; proche = p.code; }
      }
    }
    return proche;
  };
}
