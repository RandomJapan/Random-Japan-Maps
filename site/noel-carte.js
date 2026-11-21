// ================================================================
//  Noël sur la carte : les cadeaux du calendrier de l'Avent (noel.js) qui se posent sur la carte elle-même
//  (le propriétaire, 2026-11-21 : « commence par les cases de la carte »). Chacun apparaît le jour de sa case et reste
//  jusqu'à la fin de l'événement :
//  - le 12 : une tempête de neige tourne autour de Yuki-onna, la légende cachée dans les montagnes de Niigata ;
//  - le 14 : le kanji de l'année, écrit au pinceau sur une grande feuille posée sur Kyoto (CONFIG.noel.kanji) : une
//    image drapée sur le relief, sous les épingles (une feuille en repère HTML se perdait parmi les épingles de Kyoto) ;
//  - le 22 (Tōji) : un yuzu flotte près de chaque onsen de la carte ; tous trouvés, un koban pour la boutique de
//    Bunbuku, dans la balade 3D (localStorage baladeSecrets, comme un secret de la balade) ;
//  - le 24 : six Jizō sous la neige près du Murō-ji ; on pose un chapeau de paille sur chacun, comme dans le conte
//    « Kasa Jizō », et ils offrent le bonnet de Père Noël de la balade (localStorage noelTenue) ; la nuit, le traîneau
//    du Père Noël, tiré par deux cerfs de Nara, traverse le ciel.
//  Les repères passent par reperes.js, comme les légendes et les yōkai d'Halloween (même classe .legende : cachés de
//  loin, posés sous les épingles). Rien ne bouge par script à chaque image : les petits mouvements sont en CSS
//  (transform), et seulement à l'écran (.anime).
// ================================================================

import { DESSINS } from './legendes-dessins.js';
import { LEGENDES, ouvrirLegende } from './legendes.js';
import { echapper } from './commun.js';

const JOUR_TEMPETE = 12, JOUR_KANJI = 14, JOUR_YUZU = 22, JOUR_JIZO = 24;
const ZOOM_YUZU = 6.5; // comme les légendes : de plus loin, on ne les voit pas
const ZOOM_JIZO = 10.5;
const KANJI_2025 = '熊'; // le kanji de 2025 (l'ours), montré tant que celui de 2026 n'est pas écrit dans CONFIG.noel.kanji
const KYOTO = [135.768, 34.985]; // le centre de la feuille du kanji (la ville, le Kiyomizu-dera à l'est)
// la feuille : 400 × 480 pixels, 27 km de large sur Kyoto (1° de longitude ≈ 91 km, 1° de latitude ≈ 111 km à 35° N)
const FEUILLE = { l: 0.30, h: 0.295 };
const MUROJI = [136.0215, 34.5265]; // les six Jizō, à 2 km au sud-ouest du Murō-ji (plus près, son modèle 3D les couvrait)
const MEMO_YUZU = 'noelYuzus', MEMO_JIZO = 'noelJizo', MEMO_TENUE = 'noelTenue';
const SECRET_YUZU = 'noel2026-yuzu'; // compté par la balade comme un secret trouvé : un koban
const hasard = (a, b) => a + Math.random() * (b - a);

const lire = (cle, defaut) => { try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; } };
const garder = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch { /* navigation privée */ } };
const creer = (balise, classe, texte) => {
  const el = document.createElement(balise);
  if (classe) el.className = classe;
  if (texte != null) el.textContent = texte;
  return el;
};
const decalages = (h) => ({
  top: [0, 6], 'top-left': [0, 6], 'top-right': [0, 6],
  bottom: [0, -h], 'bottom-left': [0, -h], 'bottom-right': [0, -h],
  left: [30, -h / 2], right: [-30, -h / 2],
});

export const ICONE_HOUX = '<svg class="houx" viewBox="0 0 26 22" aria-hidden="true"><g stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><path fill="#5f7f4f" d="M12 12C9 9 7 10 4 7c1 3-1 4 0 6-2 0-3 1-3 2 3-1 6 1 11-3z"/><path fill="#5f7f4f" d="M14 12c3-3 5-2 8-5-1 3 1 4 0 6 2 0 3 1 3 2-3-1-6 1-11-3z"/><circle fill="#b8402c" cx="11" cy="15" r="2.6"/><circle fill="#b8402c" cx="15.4" cy="15.6" r="2.6"/><circle fill="#b8402c" cx="13.2" cy="18.8" r="2.6"/></g></svg>';

// Un yuzu qui flotte, avec sa feuille et des ronds dans l'eau
const YUZU = `<svg viewBox="0 0 48 44" aria-hidden="true">
  <ellipse class="nz-onde" cx="24" cy="36" rx="19" ry="4.6"/><ellipse class="nz-onde nz-onde2" cx="24" cy="36" rx="12" ry="2.8"/>
  <g class="nz-yuzu"><circle cx="24" cy="26" r="10.5" fill="#ecc23a" stroke="#35251a" stroke-width="1.5"/>
  <path d="M24 15.6 Q27 10 33.6 10.8 Q30.4 16.4 24 15.6 Z" fill="#5f7f4f" stroke="#35251a" stroke-width="1.3" stroke-linejoin="round"/>
  <g fill="#c99a1c"><circle cx="20" cy="23" r=".8"/><circle cx="27" cy="27" r=".8"/><circle cx="22" cy="30" r=".8"/><circle cx="28" cy="21.6" r=".7"/></g>
  <path d="M18.6 21 Q20 18.6 22.6 18" fill="none" stroke="#fff3bf" stroke-width="1.4" stroke-linecap="round"/></g></svg>`;

// Un Jizō de pierre sous la neige, son bavoir rouge ; le chapeau de paille (.nz-kasa) se montre quand on l'a posé
const JIZO = `<svg viewBox="0 0 24 34" aria-hidden="true">
  <path class="nz-kasa" d="M1.6 10.6 Q12 -1.4 22.4 10.6 Q12 8.4 1.6 10.6 Z" fill="#d9b25c" stroke="#35251a" stroke-width="1.1" stroke-linejoin="round"/>
  <path class="nz-kasa" d="M5.4 7.4 Q12 6 18.6 7.4 M8 4.6 Q12 3.8 16 4.6" fill="none" stroke="#9c7a2e" stroke-width=".8"/>
  <path d="M5 33 Q4.4 22 7 18.4 Q12 15.6 17 18.4 Q19.6 22 19 33 Z" fill="#a9a59a" stroke="#35251a" stroke-width="1.2"/>
  <circle cx="12" cy="13" r="5.4" fill="#b4b0a4" stroke="#35251a" stroke-width="1.2"/>
  <path class="nz-neige" d="M6.8 11.6 Q12 5.6 17.2 11.6 Q12 10 6.8 11.6 Z" fill="#fdfaf3" stroke="#35251a" stroke-width=".9"/>
  <path d="M7 18.6 Q12 24.6 17 18.6 Q12 20 7 18.6 Z" fill="#b8402c" stroke="#35251a" stroke-width="1"/>
  <path d="M10.2 14 h.01 M13.8 14 h.01" stroke="#35251a" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M10.6 16 Q12 16.9 13.4 16" fill="none" stroke="#35251a" stroke-width=".8" stroke-linecap="round"/>
  <path d="M2 33.4 Q12 30.6 22 33.4" fill="#fdfaf3" stroke="#35251a" stroke-width=".9"/></svg>`;

// Le traîneau du Père Noël, tiré par deux cerfs de Nara (pelage fauve tacheté de blanc), qui vole vers la droite
const TRAINEAU = `<svg viewBox="0 0 220 80" aria-hidden="true">
  <path d="M66 46 L104 50 M66 52 L104 52" stroke="#c9a45c" stroke-width="1.3" fill="none"/>
  <g class="nz-cerf" style="--r:0s"><path d="M150 40 Q162 34 176 38 Q184 40 186 47 Q182 52 172 51 Q160 52 150 49 Z" fill="#a8753f" stroke="#35251a" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M182 40 Q186 30 192 27 Q198 26 200 30 Q197 34 192 35 L188 42 Z" fill="#a8753f" stroke="#35251a" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M193 27 Q192 20 188 17 M193 27 Q197 21 196 16 M190 21 Q187 21 185 19 M195 21 Q199 20 200 18" fill="none" stroke="#6b4a3a" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="197" cy="29.4" r=".9" fill="#35251a"/>
    <g fill="#fdfaf3"><circle cx="160" cy="41" r="1.2"/><circle cx="166" cy="39.6" r="1.2"/><circle cx="172" cy="41" r="1.2"/><circle cx="163" cy="44.6" r="1.1"/><circle cx="169" cy="44.6" r="1.1"/></g>
    <path class="nz-patte" d="M156 49 L150 60 M162 50 L158 61 M174 50 L182 59 M179 49 L188 56" stroke="#35251a" stroke-width="2.2" stroke-linecap="round"/></g>
  <g class="nz-cerf" style="--r:.18s"><path d="M104 44 Q116 38 130 42 Q138 44 140 51 Q136 56 126 55 Q114 56 104 53 Z" fill="#b5824b" stroke="#35251a" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M136 44 Q140 34 146 31 Q152 30 154 34 Q151 38 146 39 L142 46 Z" fill="#b5824b" stroke="#35251a" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M147 31 Q146 24 142 21 M147 31 Q151 25 150 20 M144 25 Q141 25 139 23" fill="none" stroke="#6b4a3a" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="151" cy="33.4" r=".9" fill="#35251a"/><circle cx="153.6" cy="35.6" r="1.6" fill="#b8402c"/>
    <g fill="#fdfaf3"><circle cx="114" cy="45" r="1.2"/><circle cx="120" cy="43.6" r="1.2"/><circle cx="126" cy="45" r="1.2"/><circle cx="117" cy="48.6" r="1.1"/></g>
    <path class="nz-patte" d="M110 53 L104 64 M116 54 L112 65 M128 54 L136 63 M133 53 L142 60" stroke="#35251a" stroke-width="2.2" stroke-linecap="round"/></g>
  <path d="M100 48 Q104 44 108 46" stroke="#b8402c" stroke-width="1.6" fill="none"/>
  <path d="M10 60 Q8 68 18 68 L70 68 Q78 68 80 62" fill="none" stroke="#c9a45c" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M14 38 L64 38 Q72 38 70 48 L66 60 L20 60 Q12 60 12 52 Z" fill="#b8402c" stroke="#35251a" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M18 44 Q40 48 64 42" fill="none" stroke="#d9a441" stroke-width="1.6"/>
  <path d="M24 38 Q22 26 30 22 Q38 20 42 26 L44 38 Z" fill="#b8402c" stroke="#35251a" stroke-width="1.4" stroke-linejoin="round"/>
  <circle cx="35" cy="20" r="5.4" fill="#f2cfa5" stroke="#35251a" stroke-width="1.2"/>
  <path d="M30 22 Q35 30 40 22 Q38 26 35 26.6 Q32 26 30 22 Z" fill="#fdfaf3" stroke="#35251a" stroke-width="1"/>
  <path d="M29.6 17 Q33 8 42 10 Q40 14 41 18 Z" fill="#b8402c" stroke="#35251a" stroke-width="1.2" stroke-linejoin="round"/>
  <rect x="28.6" y="15.6" width="13" height="3.4" rx="1.7" fill="#fdfaf3" stroke="#35251a" stroke-width="1"/>
  <circle cx="43" cy="10" r="2.4" fill="#fdfaf3" stroke="#35251a" stroke-width="1"/>
  <path d="M48 36 Q52 26 60 28 Q62 34 56 38 Z" fill="#5f7f4f" stroke="#35251a" stroke-width="1.2"/>
  <rect x="50" y="30" width="7" height="6" fill="#d9a441" stroke="#35251a" stroke-width="1"/></svg>`;

/**
 * outils : { reperes, tx(cle, …), enL(objet en/fr/ja), langue(), afficherMessage, lieux(), estSimule() }.
 * Renvoie { maj(jour), eteindre(), allerYukionna(), allerKanji(), etat() }.
 */
export function brancherNoelCarte(map, maplibregl, outils) {
  const { reperes, tx, enL, afficherMessage, lieux, estSimule } = outils;
  const sansMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conteneur = map.getCanvasContainer();
  const papier = document.getElementById('papier');
  const placer = (moi) => conteneur.insertBefore(moi, papier?.parentNode === conteneur ? papier.nextSibling : conteneur.firstChild);
  // en mode développeur, un jour simulé : les trouvailles sont gardées à part, et le koban n'est pas donné pour de vrai
  const cle = (c) => (estSimule() ? `${c}Essai` : c);
  let jour = 0;
  let kanji = null, yuzus = null, jizo = null, traineau = null;
  let bulle = null;

  // ---- Les bulles (comme celles des légendes, avec « Spécial Noël » en tête)
  function ouvrirBulle(lngLat, contenu, hauteur) {
    bulle?.remove();
    const popup = new maplibregl.Popup({ className: 'bulle-legende bulle-noel', offset: decalages(hauteur), maxWidth: '300px' })
      .setLngLat(lngLat).setDOMContent(contenu).addTo(map);
    popup.getElement().querySelector('.maplibregl-popup-close-button')?.setAttribute('aria-label', tx('fermer'));
    bulle = popup;
    popup.on('close', () => { if (bulle === popup) bulle = null; });
    requestAnimationFrame(() => {
      const r = popup.getElement()?.getBoundingClientRect();
      if (!r) return;
      const haut = (document.querySelector('.filtres-boutons')?.getBoundingClientRect().bottom || 0) + 10;
      const dy = r.top < haut ? r.top - haut : r.bottom > innerHeight - 10 ? Math.min(r.bottom - innerHeight + 10, r.top - haut) : 0;
      if (Math.abs(dy) > 2) map.panBy([0, dy], { duration: sansMouvement ? 0 : 450 });
    });
  }
  function contenu(titre, second, texte, compte) {
    const div = creer('div');
    const b = creer('p', 'bulle-evenement bulle-evenement-noel');
    b.innerHTML = `${ICONE_HOUX}<span>${echapper(tx('evenementNoel'))}</span>`;
    if (compte) b.append(creer('b', 'bulle-compte', compte));
    const s = creer('p', 'bulle-second', second);
    div.append(b, creer('h3', 'bulle-titre', titre), s, creer('p', 'bulle-texte', texte));
    return div;
  }

  // ---- Un repère du calendrier : un bouton « légende », caché de loin (zoom), animé seulement à l'écran
  function poser(lngLat, html, classe, aria, appui, zoomMin) {
    const el = creer('button', `legende lg ${classe}`);
    el.type = 'button';
    el.innerHTML = html;
    el.setAttribute('aria-label', aria);
    el.addEventListener('click', (e) => { e.stopPropagation(); appui(el, e); });
    const marqueur = new maplibregl.Marker({ element: el, anchor: 'bottom', opacityWhenCovered: '0.25' }).setLngLat(lngLat);
    reperes.suivre(marqueur, { voulu: false, placer });
    return { el, marqueur, lngLat, zoomMin, montre: null };
  }
  const tous = () => [jizo, ...(yuzus || [])].filter(Boolean);
  function majZoom() {
    const z = map.getZoom();
    const vue = map.getBounds();
    for (const r of tous()) {
      const voulu = z >= r.zoomMin - 0.35;
      if (voulu !== r.montre) { r.montre = voulu; reperes.montrer(r.marqueur, voulu, 450); }
      if (!sansMouvement) r.el.classList.toggle('anime', z >= r.zoomMin && vue.contains(r.lngLat));
    }
  }
  map.on('zoom', majZoom);
  map.on('moveend', majZoom);
  function retirer(r) { if (r) reperes.oublier(r.marqueur); }

  // ---- Le 12 : la tempête autour de Yuki-onna (noel.css : body.noel-tempete .legende[data-legende="yukionna"])
  function allerYukionna() {
    const l = LEGENDES.find((x) => x.id === 'yukionna');
    if (!l) return;
    map.flyTo({ center: l.ou, zoom: Math.max(map.getZoom(), 8.2), pitch: 40, duration: sansMouvement ? 0 : 2600, essential: true });
    map.once('moveend', () => setTimeout(() => ouvrirLegende('yukionna'), 350));
  }

  // ---- Le 14 : le kanji de l'année au-dessus de Kyoto
  const kanjiAnnee = () => {
    const k = String(outils.config?.kanji || '').trim();
    return k ? { k, annee: 2026 } : { k: KANJI_2025, annee: 2025 };
  };
  let policeKanji = null;
  /** Un pinceau japonais (Yuji Boku, Google Fonts), seulement pour ce kanji et le titre de la feuille ; la promesse se
   *  tient quand la feuille de style est lue (avant, document.fonts.load ne trouve pas la police et rend la main aussitôt). */
  function chargerPinceau(k) {
    if (policeKanji?.k === k) return policeKanji.pret;
    document.getElementById('police-kanji-noel')?.remove();
    const l = document.createElement('link');
    l.id = 'police-kanji-noel';
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=Yuji+Boku&text=${encodeURIComponent(`${k}今年の漢字`)}&display=swap`;
    const pret = new Promise((ok) => { l.onload = l.onerror = ok; });
    document.head.append(l);
    policeKanji = { k, pret };
    return pret;
  }
  async function poserKanji() {
    const { k, annee } = kanjiAnnee();
    kanji = { pose: false };
    const moi = kanji;
    const delai = new Promise((ok) => setTimeout(ok, 6000)); // sans réseau vers Google Fonts : la police de la carte
    await Promise.race([chargerPinceau(k).then(() => document.fonts.load('290px "Yuji Boku"', `${k}今年の漢字`)), delai]).catch(() => {});
    if (kanji !== moi) return; // retiré entre-temps
    const c = document.createElement('canvas');
    c.width = 400; c.height = 480;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(251, 247, 236, .93)';
    g.fillRect(14, 14, 372, 452);
    g.strokeStyle = 'rgba(138, 107, 69, .85)';
    g.lineWidth = 5;
    g.strokeRect(14, 14, 372, 452);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#6b5440';
    g.font = '38px "Yuji Boku", "Zen Antique", serif';
    g.fillText('今年の漢字', 200, 70);
    g.fillStyle = '#1c140d';
    g.font = '290px "Yuji Boku", "Zen Antique", serif';
    g.fillText(k, 200, 268);
    g.fillStyle = '#b8402c';
    g.fillRect(286, 404, 82, 42);
    g.fillStyle = '#fbf7ec';
    g.font = '600 26px "Noto Sans", sans-serif';
    g.fillText(String(annee), 327, 426);
    const [x, y] = KYOTO;
    const { l, h } = FEUILLE;
    // les coins : haut-gauche, haut-droite, bas-droite, bas-gauche (attention en vérifiant : au départ, la carte tourne
    // doucement sur elle-même, et la feuille avec elle ; elle a semblé à l'envers dans un essai, 2026-11-21)
    map.addSource('noel-kanji', { type: 'image', url: c.toDataURL(),
      coordinates: [[x - l / 2, y + h / 2], [x + l / 2, y + h / 2], [x + l / 2, y - h / 2], [x - l / 2, y - h / 2]] });
    // sur le relief, ses ombres et les lacs (le lac Biwa l'entamait), sous le trait des côtes et tout le reste
    const ids = map.getStyle().layers.map((c2) => c2.id);
    const avant = ['cote-encre', 'frontieres-prefectures-fond'].find((id) => ids.includes(id));
    map.addLayer({ id: 'noel-kanji', type: 'raster', source: 'noel-kanji', paint: { 'raster-fade-duration': 0 } }, avant);
    moi.pose = true;
  }
  function retirerKanji() {
    if (kanji?.pose) {
      if (map.getLayer('noel-kanji')) map.removeLayer('noel-kanji');
      if (map.getSource('noel-kanji')) map.removeSource('noel-kanji');
    }
    kanji = null;
  }
  function allerKanji() {
    map.flyTo({ center: KYOTO, zoom: 9.3, pitch: 35, bearing: 0, duration: sansMouvement ? 0 : 2600, essential: true });
  }

  // ---- Le 22 : les yuzus des onsens
  const onsens = () => lieux().filter((l) => String(l.categorie || '').toLowerCase() === 'onsen');
  const yuzusTrouves = () => new Set(lire(cle(MEMO_YUZU), []));
  function poserYuzus() {
    yuzus = onsens().map((l) => {
      const ou = [l.lng + 0.04, l.lat - 0.012]; // à 4 km à l'est du lieu, pour que son épingle et son modèle 3D ne le cachent pas
      const r = poser(ou, YUZU, 'noel-yuzu', tx('yuzuAria'), () => trouverYuzu(l, r), ZOOM_YUZU);
      r.id = l.id;
      r.el.classList.toggle('trouve', yuzusTrouves().has(l.id));
      return r;
    });
  }
  function trouverYuzu(l, r) {
    const t = yuzusTrouves();
    const total = yuzus.length;
    const nouveau = !t.has(l.id);
    if (nouveau) { t.add(l.id); garder(cle(MEMO_YUZU), [...t]); r.el.classList.add('trouve'); }
    const tous = yuzus.every((y) => t.has(y.id));
    ouvrirBulle(r.lngLat, contenu(tx('yuzuTitre'), enL(l.nom), tx('yuzuTexte'), `${t.size}/${total}`), 46);
    if (!nouveau) return;
    if (tous) {
      // le koban, compté par la balade comme un secret trouvé (balade/tresors.js : baladeSecrets.trouves)
      if (!estSimule()) {
        const s = lire('baladeSecrets', {});
        s.trouves = s.trouves || [];
        if (!s.trouves.includes(SECRET_YUZU)) s.trouves.push(SECRET_YUZU);
        garder('baladeSecrets', s);
      }
      setTimeout(() => afficherMessage(tx(estSimule() ? 'yuzuKobanEssai' : 'yuzuKoban')), 900);
    } else afficherMessage(tx('yuzuTrouve', t.size, total));
  }

  // ---- Le 24 : les six Jizō et le traîneau
  const chapeaux = () => new Set(lire(cle(MEMO_JIZO), []));
  function poserJizo() {
    const html = `<span class="nz-jizos">${Array.from({ length: 6 }, (_, i) => `<span class="nz-jizo" data-i="${i}">${JIZO}</span>`).join('')}</span>`;
    jizo = poser(MUROJI, html, 'noel-jizo', tx('jizoAria'), (el, e) => {
      const j = e.target.closest('.nz-jizo');
      const c = chapeaux();
      if (j && !c.has(Number(j.dataset.i))) {
        c.add(Number(j.dataset.i));
        garder(cle(MEMO_JIZO), [...c]);
        majJizo();
        if (c.size === 6) donnerBonnet();
        else afficherMessage(tx('jizoChapeau', c.size));
      }
      const h = el.querySelector('.nz-jizos').getBoundingClientRect().height;
      ouvrirBulle(MUROJI, contenu(tx('jizoTitre'), '笠地蔵', tx(c.size === 6 ? 'jizoMerci' : 'jizoTexte'), `${c.size}/6`), h);
    }, ZOOM_JIZO);
    majJizo();
  }
  function majJizo() {
    const c = chapeaux();
    for (const j of jizo?.el.querySelectorAll('.nz-jizo') || []) j.classList.toggle('coiffe', c.has(Number(j.dataset.i)));
  }
  function donnerBonnet() {
    // le bonnet de Père Noël, pour la garde-robe de la balade 3D (noelTenue : les pièces d'hiver du calendrier)
    if (!estSimule()) {
      const t = new Set(lire(MEMO_TENUE, []));
      t.add('bonnet');
      garder(MEMO_TENUE, [...t]);
    }
    setTimeout(() => afficherMessage(tx('jizoBonnet')), 900);
  }

  // le traîneau : un vol de temps en temps, la nuit, en travers de l'écran (une animation CSS, rien par script)
  let minuterieTraineau = null;
  function lancerTraineau() {
    clearTimeout(minuterieTraineau);
    minuterieTraineau = setTimeout(() => {
      if (traineau && document.body.classList.contains('nuit') && !document.hidden
        && !document.body.classList.contains('en-jeu') && !document.body.classList.contains('en-visite')) {
        traineau.style.setProperty('--haut', `${hasard(9, 26).toFixed(1)}%`);
        traineau.classList.remove('vole');
        void traineau.offsetWidth; // relance l'animation
        traineau.classList.add('vole');
      }
      lancerTraineau();
    }, hasard(60, 120) * 1000);
  }
  function poserTraineau() {
    if (sansMouvement) return;
    traineau = creer('div', 'noel-traineau');
    traineau.setAttribute('aria-hidden', 'true');
    traineau.innerHTML = `<div class="nz-vol">${TRAINEAU}</div>`;
    traineau.addEventListener('animationend', () => traineau?.classList.remove('vole'));
    document.body.append(traineau);
    minuterieTraineau = setTimeout(lancerTraineau, 0);
    // le premier passe vite (8 s), pour qu'on le voie
    setTimeout(() => {
      if (!traineau || !document.body.classList.contains('nuit')) return;
      traineau.style.setProperty('--haut', '16%');
      traineau.classList.add('vole');
    }, 8000);
  }

  // ---- Ce qui se montre, selon le jour du calendrier
  function maj(j) {
    jour = j;
    document.body.classList.toggle('noel-tempete', j >= JOUR_TEMPETE);
    if (j >= JOUR_KANJI && !kanji) poserKanji().catch((e) => console.warn('Kanji de l’année indisponible', e));
    if (j < JOUR_KANJI && kanji) retirerKanji();
    if (j >= JOUR_YUZU && !yuzus) poserYuzus();
    if (j < JOUR_YUZU && yuzus) { yuzus.forEach(retirer); yuzus = null; }
    if (j >= JOUR_JIZO && !jizo) { poserJizo(); poserTraineau(); }
    if (j < JOUR_JIZO && jizo) { retirer(jizo); jizo = null; retirerTraineau(); }
    majZoom();
  }
  function retirerTraineau() {
    clearTimeout(minuterieTraineau);
    traineau?.remove();
    traineau = null;
  }
  function eteindre() {
    bulle?.remove();
    document.body.classList.remove('noel-tempete');
    retirerKanji();
    yuzus?.forEach(retirer); yuzus = null;
    retirer(jizo); jizo = null;
    retirerTraineau();
    document.getElementById('police-kanji-noel')?.remove();
    policeKanji = null;
  }
  /** Où en est-on : pour les cases du calendrier. */
  function etat() {
    const o = onsens();
    return { yuzus: [...yuzusTrouves()].filter((id) => o.some((l) => l.id === id)).length, onsens: o.length,
      chapeaux: chapeaux().size, kanji: kanjiAnnee(), jour };
  }

  return { maj, eteindre, allerYukionna, allerKanji, etat };
}
