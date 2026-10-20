// ================================================================
//  Les hitodama des nuits d'Halloween (halloween.js). Dans les histoires de fantômes japonaises, les âmes flottent
//  la nuit en petites boules de feu bleu pâle à longue queue. Pendant l'événement, la nuit et de près, elles
//  remplacent ce qui tombe de la saison (ambiance.js, particules.js) : une dizaine au plus, qui apparaissent près des
//  lieux à l'écran (temples, sanctuaires…), montent lentement en ondulant, vacillent et s'éteignent.
//  Dessinées sur une toile à 30 images par seconde (elles vont lentement), avec le même cycle que les feux
//  d'artifice (hanabi.js) : jouer(false) quand la carte bouge ou de loin, arrêt pour de bon quand la toile quitte
//  la page.
// ================================================================

const MAX = 10;
const IMAGE = 1000 / 30;
const hasard = (a, b) => a + Math.random() * (b - a);

let ouApparaitre = () => []; // des points de l'écran ({ x, y }) près desquels elles apparaissent
/** halloween.js donne les lieux à l'écran : les hitodama apparaissent autour. */
export function lieuxDesHitodama(fn) {
  ouApparaitre = fn || (() => []);
}

// La lueur (un halo bleu pâle) et la flamme (tête ronde en bas, queue effilée vers le haut), dessinées une fois
let dessins = null;
function preparer() {
  if (dessins) return dessins;
  const halo = document.createElement('canvas');
  halo.width = halo.height = 64;
  let c = halo.getContext('2d');
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(235, 248, 255, 0.85)');
  g.addColorStop(0.22, 'rgba(170, 225, 255, 0.5)');
  g.addColorStop(0.55, 'rgba(110, 175, 255, 0.16)');
  g.addColorStop(1, 'rgba(110, 175, 255, 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  const flamme = document.createElement('canvas');
  flamme.width = 40;
  flamme.height = 80;
  c = flamme.getContext('2d');
  c.scale(40 / 32, 80 / 64);
  const forme = new Path2D('M16 58C8 58 5 51 7 45 9 39 13 35 14 26 14.6 19 13 10 16 3 17.5 11 20.4 16 21 23 22 31 26 37 26 45 26 52 22.5 58 16 58Z');
  const long = c.createLinearGradient(0, 2, 0, 58);
  long.addColorStop(0, 'rgba(150, 210, 255, 0)');
  long.addColorStop(0.45, 'rgba(170, 225, 255, 0.55)');
  long.addColorStop(1, 'rgba(225, 246, 255, 0.95)');
  c.fillStyle = long;
  c.fill(forme);
  const coeur = c.createRadialGradient(16, 47, 0, 16, 47, 10);
  coeur.addColorStop(0, 'rgba(255, 255, 255, 1)');
  coeur.addColorStop(0.6, 'rgba(230, 248, 255, 0.85)');
  coeur.addColorStop(1, 'rgba(200, 235, 255, 0)');
  c.fillStyle = coeur;
  c.fill(forme);
  return (dessins = { halo, flamme });
}

/** La toile des hitodama, à mettre dans le conteneur des particules ; jouer(oui) l'arrête ou la relance. */
export function creerHitodama() {
  const toile = document.createElement('canvas');
  toile.className = 'hitodama';
  const ctx = toile.getContext('2d');
  const { halo, flamme } = preparer();
  let L = 0, H = 0, ratio = 1;
  let feux = [], raf = 0, avant = 0, prochain = 0, vue = false;
  let aMesurer = true;
  new ResizeObserver(() => { aMesurer = true; }).observe(toile);
  function ajuster() {
    if (!aMesurer) return;
    aMesurer = false;
    const l = toile.clientWidth, h = toile.clientHeight, r = Math.min(window.devicePixelRatio || 1, 2);
    if (l === L && h === H && r === ratio) return;
    L = l; H = h; ratio = r;
    toile.width = Math.round(l * r);
    toile.height = Math.round(h * r);
  }

  /** Une nouvelle âme : près d'un lieu à l'écran (au-dessus de lui), sinon n'importe où sur le bas de l'écran. */
  function naitre() {
    const lieux = ouApparaitre().filter((p) => p.x > 0 && p.x < L && p.y > H * 0.2 && p.y < H);
    const p = lieux.length && Math.random() < 0.85 ? lieux[Math.floor(Math.random() * lieux.length)] : null;
    const taille = hasard(9, 16);
    feux.push({
      x: p ? p.x + hasard(-70, 70) : hasard(0.06, 0.94) * L,
      y: p ? p.y - hasard(8, 60) : hasard(0.35, 0.92) * H,
      vx: hasard(-7, 7), vy: hasard(-11, -3), age: 0, vie: hasard(6, 10), taille, phase: hasard(0, 6.28),
    });
  }

  function avancer(dt) {
    prochain -= dt;
    if (prochain <= 0 && feux.length < MAX) {
      naitre();
      prochain = hasard(0.5, 1.3);
    }
    for (const f of feux) {
      f.age += dt;
      f.x += (f.vx + Math.sin(f.age * 1.3 + f.phase) * 9) * dt;
      f.y += f.vy * dt;
    }
    feux = feux.filter((f) => f.age < f.vie);
  }

  function dessiner() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, toile.width, toile.height);
    ctx.globalCompositeOperation = 'lighter';
    for (const f of feux) {
      // elle s'allume, brûle en vacillant, puis s'éteint
      const a = Math.min(1, f.age / 0.9, (f.vie - f.age) / 1.4) * (0.82 + 0.18 * Math.sin(f.age * 11 + f.phase));
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      const r = ratio, s = f.taille;
      ctx.setTransform(r, 0, 0, r, 0, 0);
      ctx.drawImage(halo, f.x - s * 1.6, f.y - s * 1.6, s * 3.2, s * 3.2);
      // la queue traîne derrière elle, et ondule
      const penche = -f.vx * 0.03 + Math.sin(f.age * 2.1 + f.phase) * 0.22;
      ctx.setTransform(r * Math.cos(penche), r * Math.sin(penche), -r * Math.sin(penche), r * Math.cos(penche), r * f.x, r * f.y);
      ctx.drawImage(flamme, -s * 0.62, -s * 1.85, s * 1.25, s * 2.5);
    }
    ctx.globalAlpha = 1;
  }

  function image(t) {
    if (!toile.isConnected) {
      if (vue) return arreter(); // sortie de la page : fini
    } else vue = true;
    raf = requestAnimationFrame(image);
    if (avant && t - avant < IMAGE - 1) return;
    const dt = Math.min(0.1, avant ? (t - avant) / 1000 : 0.03);
    avant = t;
    ajuster();
    if (!L || !H) return;
    avancer(dt);
    dessiner();
  }
  function arreter() {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  function demarrer() {
    if (raf) return;
    avant = 0;
    raf = requestAnimationFrame(image);
  }
  toile.jouer = (oui) => (oui ? demarrer() : arreter());
  demarrer();
  return toile;
}
