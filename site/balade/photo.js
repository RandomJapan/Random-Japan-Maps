// ================================================================
//  L'appareil photo de la balade (acheté au marchand avec les koban, 2026-10-23) : on tourne autour du voyageur
//  (balade.js : la caméra), il prend la pose (et son compagnon avec lui), et l'on fait une carte postale : la vue du
//  jeu dans un cadre dessiné (une carte postale avec son timbre et son cachet, une estampe et son cartouche, un
//  instantané à la bordure blanche, une page de carnet avec les tampons du lieu), le nom du lieu, la date et
//  l'adresse de la carte. On l'enregistre, ou on la partage (le menu du téléphone).
//  creerPhoto(el, o) → { ouvrir(), fermer(), ouvert() } ; o : { t (les textes : tresors.photo), capturer() → canvas
//  (l'image du jeu, sans l'interface), infos() → { lieu, lieuJa, tampons [svg], compagnon, date }, pose(nom), fermer(), son }.
// ================================================================
import { partagerFichier, telecharger } from '../commun.js';

const POLICE = '"M PLUS Rounded 1c", "Noto Sans JP", sans-serif';
export const CADRES = ['carte', 'estampe', 'polaroid', 'carnet'];
export const POSES = ['naturel', 'victoire', 'saut', 'salut', 'coeur', 'coucou'];

/** Une image d'un SVG (les tampons du carnet). */
const imageSvg = (svg) => new Promise((ok) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => ok(null);
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/<svg /, '<svg xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" '))}`;
});
/** Le morceau du milieu de l'image source qui a la forme (l / h) voulue. */
function recadrer(src, l, h) {
  const r = l / h, sr = src.width / src.height;
  const w = sr > r ? src.height * r : src.width, hh = sr > r ? src.height : src.width / r;
  return [(src.width - w) / 2, (src.height - hh) / 2, w, hh];
}
/** Du papier : la couleur, un grain léger. */
function papier(c, W, H, couleur, grain = 0.05) {
  c.fillStyle = couleur;
  c.fillRect(0, 0, W, H);
  const n = Math.round(W * H / 900);
  for (let i = 0; i < n; i++) {
    c.fillStyle = `rgba(${Math.random() < 0.5 ? '90,70,50' : '255,255,255'},${grain * Math.random()})`;
    c.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
}
/** Un sceau rouge (un rond ou un carré) avec des caractères en colonne. */
function sceau(c, x, y, r, texte, rond = true) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.08);
  c.strokeStyle = c.fillStyle = '#c8302c';
  c.lineWidth = r * 0.09;
  c.beginPath();
  if (rond) c.arc(0, 0, r, 0, 2 * Math.PI); else c.rect(-r, -r, 2 * r, 2 * r);
  c.stroke();
  c.lineWidth = r * 0.03;
  c.beginPath();
  if (rond) c.arc(0, 0, r * 0.86, 0, 2 * Math.PI); else c.rect(-r * 0.86, -r * 0.86, r * 1.72, r * 1.72);
  c.stroke();
  const car = Array.from(texte), t = Math.min(r * 0.9, (r * 1.55) / car.length);
  c.font = `800 ${t}px ${POLICE}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  car.forEach((ch, k) => c.fillText(ch, 0, (k - (car.length - 1) / 2) * t * 1.02));
  c.restore();
}
/** Du texte en colonne (japonais vertical). */
function colonne(c, texte, x, y, taille, couleur) {
  c.font = `800 ${taille}px ${POLICE}`;
  c.fillStyle = couleur;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  Array.from(texte).forEach((ch, k) => c.fillText(ch, x, y + k * taille * 1.05));
}

/** La carte postale (ou l'estampe, l'instantané, la page de carnet) : un canvas. */
async function composer(src, cadre, info) {
  try { await document.fonts?.load(`800 40px ${POLICE}`, info.lieuJa + info.lieu + info.salut); } catch { /* sans la police : celle du système */ }
  const W = { carte: 1500, estampe: 1000, polaroid: 1100, carnet: 1080 }[cadre], H = { carte: 1000, estampe: 1500, polaroid: 1320, carnet: 1350 }[cadre];
  const k = document.createElement('canvas');
  k.width = W; k.height = H;
  const c = k.getContext('2d');
  const photo = (x, y, l, h, filtre = 'none') => { c.save(); c.filter = filtre; c.drawImage(src, ...recadrer(src, l, h), x, y, l, h); c.restore(); };
  c.textAlign = 'left';
  if (cadre === 'carte') {
    // la photo en grand, bordée de blanc ; en bas à gauche « Bonjour de … » ; en haut à droite le timbre dentelé et le cachet
    papier(c, W, H, '#fbf8f0', 0.03);
    photo(36, 36, W - 72, H - 72);
    c.fillStyle = 'rgba(0,0,0,0.28)';
    c.font = `800 74px ${POLICE}`;
    c.fillText(info.salut, 92, H - 112);
    c.fillStyle = '#ffffff';
    c.fillText(info.salut, 86, H - 118);
    const tx = W - 250, ty = 70;
    c.fillStyle = '#ffffff';
    for (let i = 0; i <= 9; i++) for (const [a, b] of [[tx + i * 18.8, ty], [tx + i * 18.8, ty + 230], [tx, ty + i * 25.5], [tx + 170, ty + i * 25.5]]) { c.beginPath(); c.arc(a, b, 6, 0, 2 * Math.PI); c.fill(); }
    c.fillRect(tx, ty, 170, 230);
    c.fillStyle = '#e9f2f6';
    c.fillRect(tx + 14, ty + 14, 142, 170);
    if (info.tampons[0]) c.drawImage(info.tampons[0], tx + 22, ty + 26, 126, 126);
    c.fillStyle = '#c8302c';
    c.font = `800 26px ${POLICE}`;
    c.textAlign = 'center';
    c.fillText(info.lieuJa, tx + 85, ty + 214);
    c.strokeStyle = 'rgba(40,40,60,0.75)';
    c.lineWidth = 4;
    c.beginPath(); c.arc(tx - 40, ty + 190, 70, 0, 2 * Math.PI); c.stroke();
    for (const dy of [-18, 0, 18]) { c.beginPath(); c.moveTo(tx + 40, ty + 190 + dy); c.bezierCurveTo(tx + 90, ty + 170 + dy, tx + 140, ty + 210 + dy, tx + 200, ty + 190 + dy); c.stroke(); }
    c.fillStyle = 'rgba(40,40,60,0.8)';
    c.font = `700 22px ${POLICE}`;
    c.fillText(info.date, tx - 40, ty + 184);
    c.font = `800 17px ${POLICE}`;
    c.fillText(info.lieu.toUpperCase(), tx - 40, ty + 212);
  } else if (cadre === 'estampe') {
    // l'estampe : un large bord crème à double filet ; la photo aux couleurs chaudes ; le cartouche rouge vertical (le nom
    // en japonais), un second, crème, « Random Japan Place » ; le sceau « 旅 » (le voyage)
    papier(c, W, H, '#f3e7cc', 0.06);
    photo(70, 70, W - 140, H - 140, 'saturate(1.12) sepia(0.18) contrast(1.04)');
    c.strokeStyle = '#2a2420';
    c.lineWidth = 5;
    c.strokeRect(60, 60, W - 120, H - 120);
    c.lineWidth = 2;
    c.strokeRect(46, 46, W - 92, H - 92);
    const n = Array.from(info.lieuJa).length, hc = n * 66 + 50;
    c.fillStyle = '#c8302c';
    c.fillRect(W - 190, 110, 96, hc);
    c.strokeStyle = '#2a2420';
    c.lineWidth = 3;
    c.strokeRect(W - 190, 110, 96, hc);
    colonne(c, info.lieuJa, W - 142, 160, 60, '#fff8e8');
    c.fillStyle = '#fbf3df';
    c.fillRect(W - 262, 110, 60, 330);
    c.strokeRect(W - 262, 110, 60, 330);
    c.save();
    c.translate(W - 232, 275);
    c.rotate(Math.PI / 2);
    c.fillStyle = '#2a2420';
    c.font = `700 26px ${POLICE}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('Random Japan Place', 0, 0);
    c.restore();
    sceau(c, 150, H - 170, 52, '旅', false);
  } else if (cadre === 'polaroid') {
    // l'instantané : la bordure blanche, plus large en bas, où l'on a écrit le lieu et la date
    papier(c, W, H, '#fdfcf8', 0.02);
    photo(50, 50, W - 100, W - 100, 'contrast(1.05) saturate(1.05)');
    c.fillStyle = '#2a2a3a';
    c.font = `800 62px ${POLICE}`;
    c.textAlign = 'center';
    c.fillText(info.lieu, W / 2, W + 52);
    c.font = `700 36px ${POLICE}`;
    c.fillStyle = '#5a5a6a';
    c.fillText(`${info.date} · ${info.compagnon}`, W / 2, W + 116);
  } else {
    // la page de carnet : du papier kraft quadrillé, la photo de travers tenue par deux morceaux de ruban, les tampons
    // du lieu qu'on a, le nom et la date
    papier(c, W, H, '#e2c99c', 0.08);
    c.fillStyle = 'rgba(120,90,50,0.22)';
    for (let x = 30; x < W; x += 40) for (let y = 30; y < H; y += 40) c.fillRect(x, y, 3, 3);
    c.save();
    c.translate(W / 2, 450);
    c.rotate(-0.045);
    c.fillStyle = 'rgba(60,40,20,0.25)';
    c.fillRect(-440, -330, 900, 680);
    c.fillStyle = '#ffffff';
    c.fillRect(-450, -340, 900, 680);
    c.drawImage(src, ...recadrer(src, 860, 640), -430, -320, 860, 640);
    c.fillStyle = 'rgba(232,200,120,0.75)';
    c.save(); c.translate(-380, -335); c.rotate(-0.5); c.fillRect(-70, -20, 140, 40); c.restore();
    c.save(); c.translate(380, -335); c.rotate(0.45); c.fillRect(-70, -20, 140, 40); c.restore();
    c.restore();
    info.tampons.slice(0, 3).forEach((img, i) => { if (img) { c.save(); c.translate(180 + i * 250, 1030); c.rotate((i - 1) * 0.12); c.drawImage(img, -95, -95, 190, 190); c.restore(); } });
    c.fillStyle = '#3a2a1a';
    c.font = `800 60px ${POLICE}`;
    c.fillText(info.lieu, 70, 1240);
    c.font = `700 32px ${POLICE}`;
    c.fillText(`${info.date} · ${info.compagnon}`, 70, 1290);
    sceau(c, W - 140, 1245, 64, info.lieuJa.slice(0, 4));
  }
  // l'adresse de la carte, discrète, en bas à droite
  c.font = `700 ${cadre === 'carte' ? 22 : 24}px ${POLICE}`;
  c.textAlign = 'right';
  c.fillStyle = cadre === 'carte' ? 'rgba(255,255,255,0.85)' : 'rgba(42,36,32,0.65)';
  c.fillText('map.randomjapanplace.com', W - (cadre === 'carte' ? 56 : 40), H - (cadre === 'carte' ? 52 : cadre === 'polaroid' ? 34 : 26));
  return k;
}

export function creerPhoto(el, o) {
  let cadre = 'carte', pose = 'naturel', ouvert = false, url = null, fichier = null;
  const T = () => o.t();
  function dessinerUI() {
    const t = T();
    el.innerHTML = `
      <p class="photo-aide">${t.aide}</p>
      <button type="button" class="photo-fermer" aria-label="${t.fermer}">×</button>
      <div class="photo-barre cadre">
        <div class="photo-choix"><span>${t.cadre}</span><div>${CADRES.map((k) => `<button type="button" data-cadre="${k}" class="${k === cadre ? 'actif' : ''}">${t.cadres[k]}</button>`).join('')}</div></div>
        <div class="photo-choix"><span>${t.pose}</span><div>${POSES.map((k) => `<button type="button" data-pose="${k}" class="${k === pose ? 'actif' : ''}">${t.poses[k]}</button>`).join('')}</div></div>
        <button type="button" class="photo-declencheur" aria-label="${t.titre}"><span></span></button>
      </div>
      <div class="photo-flash"></div>
      <div class="photo-resultat voile" hidden><div class="cadre"><img alt=""><div class="photo-actions">
        <button type="button" class="photo-partager">${t.partager}</button><button type="button" class="photo-enregistrer">${t.enregistrer}</button><button type="button" class="photo-reprendre">${t.reprendre}</button>
      </div></div></div>`;
  }
  async function declencher() {
    o.son?.declic();
    el.querySelector('.photo-flash').classList.remove('eclair');
    void el.offsetWidth;
    el.querySelector('.photo-flash').classList.add('eclair');
    const src = o.capturer();
    const i = o.infos();
    const tampons = await Promise.all(i.tampons.map(imageSvg));
    const k = await composer(src, cadre, { ...i, tampons });
    const blob = await new Promise((ok) => k.toBlob(ok, 'image/jpeg', 0.92));
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(blob);
    fichier = new File([blob], `balade-${i.id}-${new Date().toISOString().slice(0, 10)}.jpg`, { type: 'image/jpeg' });
    const r = el.querySelector('.photo-resultat');
    r.querySelector('img').src = url;
    r.hidden = false;
  }
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.cadre) { cadre = b.dataset.cadre; dessinerUI(); o.son?.choix(); return; }
    if (b.dataset.pose) { pose = b.dataset.pose; o.pose(pose === 'naturel' ? null : pose); dessinerUI(); o.son?.choix(); return; }
    if (b.classList.contains('photo-declencheur')) { await declencher(); return; }
    if (b.classList.contains('photo-reprendre')) { el.querySelector('.photo-resultat').hidden = true; return; }
    if (b.classList.contains('photo-enregistrer')) { if (fichier) telecharger(fichier); return; }
    if (b.classList.contains('photo-partager')) { if (fichier && !(await partagerFichier(fichier, T().texte(o.infos().lieu)))) telecharger(fichier); return; }
    if (b.classList.contains('photo-fermer')) o.fermer();
  });
  // (on ne parle pas, on ne tourne pas la caméra à travers l'interface)
  el.addEventListener('pointerdown', (e) => { if (e.target.closest('button, .photo-barre, .photo-resultat')) e.stopPropagation(); });
  return {
    ouvert: () => ouvert,
    ouvrir() { ouvert = true; pose = 'naturel'; dessinerUI(); el.hidden = false; },
    fermer() { ouvert = false; el.hidden = true; el.innerHTML = ''; if (url) { URL.revokeObjectURL(url); url = null; } },
    /** Le résultat est-il affiché ? (Échap le ferme d'abord) */
    resultat: () => !el.querySelector('.photo-resultat')?.hidden,
    fermerResultat() { const r = el.querySelector('.photo-resultat'); if (r) r.hidden = true; },
    declencher,
  };
}
