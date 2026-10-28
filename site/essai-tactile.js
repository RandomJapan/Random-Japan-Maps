/**
 * L'essai des doigts : par-dessus la carte ou la balade, ce que le navigateur dit des doigts posés sur l'écran.
 *
 * Le propriétaire (2026-10-27, avec une vidéo filmée dans le navigateur de TikTok, Android) : « quand j'essaye de
 * zoomer, ça fait un peu n'importe quoi […] quand je mets le joystick vers le haut, ça avance tout seul ». Dans
 * Chrome tout marche. Ce navigateur ne s'ouvre que depuis l'application (le lien de la bio) : pas d'adresse à taper.
 * On l'allume donc depuis la carte, par cinq appuis rapides sur le « i » des sources (app.js) ; la balade le reprend
 * (même localStorage). Rien n'est envoyé nulle part : tout s'affiche à l'écran, pour être filmé.
 *
 * À l'écran : un rond rouge par doigt que le navigateur croit posé (TouchEvent.touches, son numéro « t »), un anneau
 * bleu par pointeur ouvert (pointerdown sans pointerup ni pointercancel, « p »). Un rond qui reste après qu'on a levé
 * le doigt = un doigt fantôme ; deux numéros qui s'échangent = des doigts mélangés. Les compteurs disent combien de
 * doigts sont arrivés et repartis ; « sauts » compte les doigts qui bondissent de plus de 120 px d'un coup.
 */

const SAUT = 120;
const t0 = performance.now();
const compte = {};
const journal = [];
const pointeurs = new Map(); // pointerId → { x, y }
const derniers = new Map(); // identifier → { x, y } : le dernier endroit connu de chaque doigt
let doigts = []; // [{ id, x, y }] : TouchEvent.touches du dernier événement
let sauts = 0;
let inconnus = 0; // des pointermove d'un pointeur jamais posé
let demande = false;

const ua = navigator.userAgent;
const appareil = [
  (ua.match(/Chrome\/(\d+)/) || [])[0],
  /; wv\)/.test(ua) && 'wv',
  /Bytedance|musical_ly|trill_|TikTok/i.test(ua) && 'TikTok',
  /Android (\d+)/.test(ua) && ua.match(/Android (\d+)/)[0],
].filter(Boolean).join(' ');

const style = document.createElement('style');
style.textContent = `
.essai-tactile { position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; font: 700 12px/1.3 ui-monospace, Menlo, Consolas, monospace; color: #fff; }
.essai-tactile .et-boite { position: absolute; top: calc(env(safe-area-inset-top) + 64px); left: 8px; right: 8px; padding: 6px 8px; background: rgba(0, 0, 0, .66); border-radius: 6px; }
.essai-tactile .et-gros { font-size: 16px; }
.essai-tactile .et-journal { margin-top: 4px; font-weight: 500; font-size: 11px; opacity: .9; white-space: pre; overflow: hidden; }
.essai-tactile .et-point { position: absolute; left: 0; top: 0; width: 56px; height: 56px; margin: -28px 0 0 -28px; border-radius: 50%; display: grid; place-items: center; font-size: 14px; }
.essai-tactile .et-doigt { background: rgba(220, 30, 40, .45); border: 3px solid #ff3b3b; }
.essai-tactile .et-pointeur { width: 80px; height: 80px; margin: -40px 0 0 -40px; border: 3px solid #3ba0ff; align-items: start; padding-top: 2px; color: #9fd0ff; }
`;
document.head.append(style);
const calque = document.createElement('div');
calque.className = 'essai-tactile';
calque.innerHTML = '<div class="et-boite"><div class="et-gros"></div><div class="et-compte"></div><div class="et-journal"></div></div>';
document.body.append(calque);
const [gros, comptes, lignes] = ['.et-gros', '.et-compte', '.et-journal'].map((s) => calque.querySelector(s));

const temps = () => ((performance.now() - t0) / 1000).toFixed(1).padStart(5);
const xy = (x, y) => `${Math.round(x)},${Math.round(y)}`;
function noter(texte) {
  journal.push(`${temps()} ${texte}`);
  if (journal.length > 9) journal.shift();
}

function surToucher(e) {
  compte[e.type] = (compte[e.type] || 0) + 1;
  for (const t of e.changedTouches) {
    const avant = derniers.get(t.identifier);
    if (e.type === 'touchmove' && avant && Math.hypot(t.clientX - avant.x, t.clientY - avant.y) > SAUT) {
      sauts++;
      noter(`SAUT t${t.identifier} ${xy(avant.x, avant.y)} → ${xy(t.clientX, t.clientY)}`);
    }
    if (e.type === 'touchend' || e.type === 'touchcancel') derniers.delete(t.identifier);
    else derniers.set(t.identifier, { x: t.clientX, y: t.clientY });
  }
  doigts = [...e.touches].map((t) => ({ id: t.identifier, x: t.clientX, y: t.clientY }));
  if (e.type !== 'touchmove') {
    noter(`${e.type.slice(5).padEnd(6)} t${[...e.changedTouches].map((t) => t.identifier).join(',t')} → ${e.touches.length} posé${e.touches.length > 1 ? 's' : ''} [${doigts.map((d) => 't' + d.id).join(' ')}]`);
  }
  dessiner();
}

function surPointer(e) {
  if (e.pointerType === 'mouse') return;
  compte[e.type] = (compte[e.type] || 0) + 1;
  const p = pointeurs.get(e.pointerId);
  if (e.type === 'pointerdown') pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  else if (e.type === 'pointermove') {
    if (!p) { inconnus++; return dessiner(); }
    p.x = e.clientX;
    p.y = e.clientY;
  } else if (e.type !== 'lostpointercapture') pointeurs.delete(e.pointerId);
  if (e.type !== 'pointermove') noter(`${e.type.replace('pointer', 'p-').replace('lostp-capture', 'p-perdu').padEnd(8)} p${e.pointerId} ${xy(e.clientX, e.clientY)}`);
  dessiner();
}

for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) addEventListener(type, surToucher, { capture: true, passive: true });
for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture']) addEventListener(type, surPointer, { capture: true, passive: true });
addEventListener('resize', () => { noter(`taille ${innerWidth}×${innerHeight}`); dessiner(); });
visualViewport?.addEventListener('resize', () => { noter(`loupe ×${visualViewport.scale.toFixed(2)}`); dessiner(); });
addEventListener('blur', () => { noter('page quittée (blur)'); dessiner(); });

function dessiner() {
  if (demande) return;
  demande = true;
  requestAnimationFrame(() => {
    demande = false;
    const c = (k) => compte[k] || 0;
    const carte = window.carte;
    gros.textContent = `doigts ${doigts.length} · pointeurs ${pointeurs.size}${carte ? ` · z ${carte.getZoom().toFixed(1)} cap ${Math.round(carte.getBearing())}°` : ''}`;
    comptes.textContent = `touch ↓${c('touchstart')} ↑${c('touchend')} ✕${c('touchcancel')} · pointer ↓${c('pointerdown')} ↑${c('pointerup')} ✕${c('pointercancel')} perdu ${c('lostpointercapture')} · sauts ${sauts}${inconnus ? ` · inconnus ${inconnus}` : ''}\n${appareil} · ${innerWidth}×${innerHeight} ×${devicePixelRatio.toFixed(2)}`;
    comptes.style.whiteSpace = 'pre-wrap';
    lignes.textContent = journal.join('\n');
    for (const el of calque.querySelectorAll('.et-point')) el.remove();
    for (const d of doigts) calque.append(point('et-doigt', `t${d.id}`, d.x, d.y));
    for (const [id, p] of pointeurs) calque.append(point('et-pointeur', `p${id}`, p.x, p.y));
  });
}
function point(classe, texte, x, y) {
  const el = document.createElement('div');
  el.className = `et-point ${classe}`;
  el.textContent = texte;
  el.style.transform = `translate(${x}px, ${y}px)`;
  return el;
}
// sur la carte, le zoom et le cap bougent aussi sans doigt (élan, animations) : on les suit
window.carte?.on('move', dessiner);
noter(`essai des doigts allumé · ${appareil}`);
dessiner();
