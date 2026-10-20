// ================================================================
//  Les feux d'artifice des nuits d'été (hanabi, du 11 juillet au 31 août ; ambiance.js, particules.js).
//  Refaits le 2026-10-20 : le propriétaire trouvait les anciens (une étoile dessinée qui grandissait) trop simples,
//  « on dirait juste une forme de différentes couleurs ». C'est maintenant un spectacle de hanabi dessiné image par
//  image sur une toile : chaque bombe monte en traînant des étincelles, éclate dans un éclair, et ses étoiles
//  s'écartent, freinées par l'air et tirées par la pesanteur, puis s'éteignent. Les sortes de bombes des hanabi
//  taikai :
//  - botan (pivoine) : une sphère d'étoiles nettes, parfois à double cœur d'une autre couleur (yae) ;
//  - kiku (chrysanthème) : des étoiles qui traînent une queue d'étincelles ;
//  - henka : des étoiles qui changent de couleur en route ;
//  - shidare-yanagi (saule) : de l'or qui retombe longuement en arcs pailletés ;
//  - wa (anneau) : un cercle incliné, parfois autour d'une petite pivoine ;
//  - senrin (mille fleurs) : des étoiles qui crépitent en petites gerbes en s'éteignant ;
//  - yashi (palmier) : quelques grosses comètes d'or ;
//  - tenmetsu : des étoiles qui clignotent ;
//  et de temps en temps une salve rapide de petites bombes (starmine).
//  Chaque étoile laisse une traînée de lumière dans le sens de sa course, d'autant plus longue qu'elle va vite,
//  comme à l'œil la nuit : une lueur étirée derrière elle (TRAINEE). La toile est vidée à chaque image : la garder
//  en l'effaçant peu à peu laissait des voiles sombres (les restes trop faibles ne s'effaçaient jamais tout à fait).
//  Les lumières s'additionnent (lighter) là où elles se croisent.
//  La boucle ne tourne que quand on la voit : arrêtée quand la carte bouge ou de loin (animerParticules),
//  page cachée (le navigateur), et pour de bon quand la toile quitte la page.
// ================================================================

const COULEURS = {
  rouge: '#ff3b2e', orange: '#ff8a2a', or: '#ffbe4a', argent: '#e8ecff', vert: '#3cf07a',
  bleu: '#4b9bff', violet: '#b47bff', rose: '#ff5cc8', citron: '#eef25a',
};
const VIVES = ['rouge', 'orange', 'vert', 'bleu', 'violet', 'rose', 'citron', 'argent', 'or'];
const TRAINEE = 0.07, TRAINEE_MAX = 60; // la traînée : le chemin des 70 dernières ms, 60 px au plus
const MAX_ETOILES = 2400; // au-delà, plus d'étincelles (un téléphone : 40 % de ce plafond)
const IMAGE = 1000 / 60; // ms

const hasard = (a, b) => a + Math.random() * (b - a);
const parmi = (liste) => liste[Math.floor(Math.random() * liste.length)];

/** Une lueur ronde de cette couleur : un cœur plus clair, la couleur, puis un halo qui s'efface (dessinée une fois). */
const lueurs = {};
function lueur(nom) {
  if (lueurs[nom]) return lueurs[nom];
  const hex = COULEURS[nom];
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const clair = (k) => [r, g, b].map((v) => Math.round(v + (255 - v) * k)).join(',');
  const T = 32, toile = document.createElement('canvas');
  toile.width = toile.height = T;
  const c = toile.getContext('2d');
  const d = c.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
  d.addColorStop(0, `rgba(${clair(0.55)},1)`);
  d.addColorStop(0.18, `rgba(${clair(0.15)},0.95)`);
  d.addColorStop(0.42, `rgba(${r},${g},${b},0.35)`);
  d.addColorStop(1, `rgba(${r},${g},${b},0)`);
  c.fillStyle = d;
  c.fillRect(0, 0, T, T);
  // sa traînée : une bande qui s'éteint vers l'arrière (à gauche) et sur ses bords
  const trait = document.createElement('canvas');
  trait.width = 64;
  trait.height = 16;
  const t = trait.getContext('2d');
  const long = t.createLinearGradient(0, 0, 64, 0);
  long.addColorStop(0, `rgba(${r},${g},${b},0)`);
  long.addColorStop(0.7, `rgba(${clair(0.1)},0.5)`);
  long.addColorStop(1, `rgba(${clair(0.4)},0.9)`);
  t.fillStyle = long;
  t.fillRect(0, 0, 64, 16);
  t.globalCompositeOperation = 'destination-in';
  const large = t.createLinearGradient(0, 0, 0, 16);
  large.addColorStop(0, 'rgba(0,0,0,0)');
  large.addColorStop(0.5, 'rgba(0,0,0,1)');
  large.addColorStop(1, 'rgba(0,0,0,0)');
  t.fillStyle = large;
  t.fillRect(0, 0, 64, 16);
  toile.trait = trait;
  return (lueurs[nom] = toile);
}

/** n directions réparties sur une sphère (spirale de Fibonacci), tournée au hasard, vues de face : [dx, dy]. */
function sphere(n) {
  const [a, b, c] = [hasard(0, 6.28), hasard(0, 6.28), hasard(0, 6.28)];
  const res = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) * 2) / n, r = Math.sqrt(1 - y * y), t = i * 2.39996;
    let x = r * Math.cos(t), z = r * Math.sin(t), yy = y;
    [x, yy] = [x * Math.cos(a) - yy * Math.sin(a), x * Math.sin(a) + yy * Math.cos(a)];
    [x, z] = [x * Math.cos(b) - z * Math.sin(b), x * Math.sin(b) + z * Math.cos(b)];
    [yy, z] = [yy * Math.cos(c) - z * Math.sin(c), yy * Math.sin(c) + z * Math.cos(c)];
    res.push([x, yy]);
  }
  return res;
}

/** La toile des feux d'artifice, à mettre dans le conteneur des particules ; jouer(oui) l'arrête ou la relance. */
export function creerHanabi() {
  const toile = document.createElement('canvas');
  toile.className = 'hanabi';
  const ctx = toile.getContext('2d');
  const petit = matchMedia('(max-width: 720px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  const plafond = petit ? MAX_ETOILES * 0.4 : MAX_ETOILES;
  const peu = petit ? 0.6 : 1; // moins d'étoiles par bombe sur un téléphone
  let L = 0, H = 0, ratio = 1;
  let etoiles = [], bombes = [], eclairs = [];
  let raf = 0, avant = 0, prochain = 0.4, salve = 0, vue = false;

  // la taille de la toile, relue seulement quand elle change : la lire à chaque image forçait le navigateur à refaire
  // la mise en page (les grues et les repères bougent à chaque image), 4 % du temps d'un téléphone moyen simulé
  let aMesurer = true;
  new ResizeObserver(() => { aMesurer = true; }).observe(toile);
  function ajuster() {
    if (!aMesurer) return;
    aMesurer = false;
    const l = toile.clientWidth, h = toile.clientHeight;
    const r = Math.min(window.devicePixelRatio || 1, petit ? 1.5 : 2);
    if (l === L && h === H && r === ratio) return;
    L = l; H = h; ratio = r;
    toile.width = Math.round(l * r);
    toile.height = Math.round(h * r);
  }

  // ---------- Les étoiles ----------
  // une étoile : position, vitesse (px/s), frein de l'air k (/s), pesanteur g (px/s²), âge et vie (s), sa lueur,
  // sa taille, son éclat ;
  // une étincelle (braise) n'est plus créée au-delà du plafond
  function etoile(x, y, vx, vy, o) {
    if (o.braise && etoiles.length >= plafond) return;
    etoiles.push({ x, y, vx, vy, age: 0, k: 2.4, g: 0, taille: 2, eclat: 0.9, chaud: 0.14, phase: hasard(0, 6.28), ...o });
  }
  /** Les étincelles qu'une étoile sème derrière elle : { nom, tous (s), vie [min, max], g, taille, eclat, clignote }. */
  const semer = (nom, tous, vie, g, taille = 0.9, eclat = 0.6, clignote = false) => ({ img: lueur(nom), tous, vie, g, taille, eclat, clignote });

  /** Une gerbe : des étoiles qui partent du point (x, y) dans ces directions, jusqu'à un rayon R une fois freinées. */
  function gerbe(x, y, directions, R, o) {
    const k = o.k ?? 2.4;
    for (const [dx, dy] of directions) {
      const v = R * k * hasard(0.95, 1.04);
      etoile(x, y, dx * v, dy * v, { ...o, k, vie: o.vie * hasard(0.88, 1.08) });
    }
  }
  const n = (combien) => Math.round(combien * peu);

  const SORTES = {
    botan(x, y, R) {
      const c = parmi(VIVES);
      gerbe(x, y, sphere(n(120)), R, { img: lueur(c), vie: hasard(1.4, 1.8), g: 0.35 * R });
      if (Math.random() < 0.4) { // yae : un cœur d'une autre couleur
        gerbe(x, y, sphere(n(45)), R * 0.5, { img: lueur(parmi(VIVES.filter((v) => v !== c))), vie: hasard(1.1, 1.4), g: 0.35 * R });
      }
      return c;
    },
    kiku(x, y, R) {
      const c = Math.random() < 0.4 ? 'argent' : parmi(VIVES);
      gerbe(x, y, sphere(n(95)), R, { img: lueur(c), vie: hasard(1.8, 2.2), g: 0.35 * R, k: 2.1, braises: semer('or', 0.045, [0.3, 0.55], 0.1 * R) });
      return c;
    },
    henka(x, y, R) {
      const [a, b] = [parmi(VIVES), parmi(VIVES)];
      gerbe(x, y, sphere(n(110)), R, { img: lueur(a), img2: lueur(b === a ? 'argent' : b), change: hasard(0.38, 0.5), vie: hasard(1.8, 2.2), g: 0.35 * R });
      return a;
    },
    yanagi(x, y, R) {
      const c = Math.random() < 0.8 ? 'or' : 'argent';
      gerbe(x, y, sphere(n(42)), R * 0.9, {
        img: lueur(c), vie: hasard(3.4, 4.2), k: 1.15, g: 0.5 * R, taille: 1.6, chaud: 0.05, braises: semer(c, 0.05, [1.0, 1.6], 0.1 * R, 0.9, 0.55, true),
      });
      return c;
    },
    wa(x, y, R) {
      const c = parmi(VIVES), m = n(60);
      const penche = hasard(0.25, 1), tourne = hasard(0, 3.14);
      const cercle = Array.from({ length: m }, (_, i) => {
        const a = (i / m) * 6.283, dx = Math.cos(a), dy = Math.sin(a) * penche;
        return [dx * Math.cos(tourne) - dy * Math.sin(tourne), dx * Math.sin(tourne) + dy * Math.cos(tourne)];
      });
      gerbe(x, y, cercle, R, { img: lueur(c), vie: hasard(1.6, 2), g: 0.3 * R });
      if (Math.random() < 0.5) gerbe(x, y, sphere(n(26)), R * 0.32, { img: lueur(parmi(VIVES)), vie: 1.3, g: 0.3 * R });
      return c;
    },
    senrin(x, y, R) {
      const c = parmi(['or', 'argent', 'citron', 'rose']);
      gerbe(x, y, sphere(n(40)), R * 0.8, { img: lueur(c), vie: hasard(1.0, 1.3), g: 0.35 * R, crepite: true });
      return c;
    },
    yashi(x, y, R) {
      gerbe(x, y, sphere(n(12)).map(([dx, dy]) => [dx, dy - 0.3]), R * 1.1, {
        img: lueur('or'), vie: hasard(2.2, 2.6), k: 1.2, g: 0.55 * R, taille: 3, eclat: 1, chaud: 0.3, braises: semer('orange', 0.016, [0.5, 0.9], 0.18 * R, 1.1, 0.6),
      });
      return 'or';
    },
    tenmetsu(x, y, R) {
      const c = Math.random() < 0.6 ? 'argent' : parmi(VIVES);
      gerbe(x, y, sphere(n(95)), R, { img: lueur(c), vie: hasard(2.2, 2.6), g: 0.3 * R, clignote: true, eclat: 1 });
      return c;
    },
  };
  const TIRAGE = [['botan', 26], ['kiku', 18], ['henka', 10], ['yanagi', 14], ['wa', 8], ['senrin', 10], ['yashi', 7], ['tenmetsu', 7]];
  const sorteAuHasard = () => {
    let r = Math.random() * TIRAGE.reduce((s, [, p]) => s + p, 0);
    for (const [nom, p] of TIRAGE) if ((r -= p) < 0) return nom;
    return 'botan';
  };

  // ---------- Le spectacle ----------
  /** Une bombe qui monte de sous l'écran jusqu'à (x, y), puis éclate. */
  function tirer(sorte, x, y, R) {
    const montee = H * hasard(0.32, 0.52);
    bombes.push({ sorte, x, y, R, x0: x + hasard(-0.03, 0.03) * L, y0: y + montee, age: 0, duree: hasard(0.95, 1.4), phase: hasard(0, 6.28), braise: 0 });
  }
  function programmer(dt) {
    prochain -= dt;
    if (prochain > 0) return;
    const taille = Math.min(L, H);
    if (salve > 0) { // starmine : de petites bombes rapprochées, tirées vite
      salve--;
      tirer(parmi(['botan', 'kiku', 'senrin', 'henka']), L * hasard(0.25, 0.75), H * hasard(0.35, 0.55), taille * hasard(0.06, 0.09));
      prochain = salve ? hasard(0.12, 0.28) : hasard(1.4, 2.2);
      return;
    }
    if (Math.random() < 0.12) { salve = 4 + Math.floor(Math.random() * 3); prochain = 0; return; }
    const coups = Math.random() < 0.2 ? 2 : 1;
    for (let i = 0; i < coups; i++) {
      tirer(sorteAuHasard(), L * hasard(0.15, 0.85), H * hasard(0.16, 0.46), taille * hasard(0.11, 0.19));
    }
    prochain = hasard(0.7, 2.2);
  }

  function avancer(dt) {
    for (const b of bombes) {
      b.age += dt;
      const p = Math.min(1, b.age / b.duree), e = 1 - (1 - p) ** 2; // elle ralentit en montant
      const x = b.x0 + (b.x - b.x0) * p + Math.sin(p * 9 + b.phase) * 1.2, y = b.y0 + (b.y - b.y0) * e;
      if (b.px !== undefined && dt > 0) { b.vx = (x - b.px) / dt; b.vy = (y - b.py) / dt; }
      b.px = x;
      b.py = y;
      b.braise -= dt; // des étincelles derrière elle
      if (b.braise <= 0) {
        b.braise = 0.012;
        etoile(b.px, b.py, hasard(-8, 8), hasard(8, 30), { img: lueur('orange'), vie: hasard(0.3, 0.6), k: 3, g: 40, taille: 0.9, eclat: 0.6, chaud: 0, braise: true });
      }
      if (p >= 1) {
        b.fini = true;
        const c = SORTES[b.sorte](b.x, b.y, b.R);
        eclairs.push({ x: b.x, y: b.y, R: b.R, age: 0, img: lueur(c) });
      }
    }
    bombes = bombes.filter((b) => !b.fini);
    for (const e of eclairs) e.age += dt;
    eclairs = eclairs.filter((e) => e.age < 0.22);

    const nouvelles = [];
    for (const s of etoiles) {
      s.age += dt;
      const f = Math.exp(-s.k * dt);
      s.vx *= f;
      s.vy = s.vy * f + s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      // chrysanthème, saule, palmier : des étincelles semées derrière l'étoile, qui flottent et retombent
      const b = s.braises;
      if (b && s.age < s.vie * 0.85) {
        s.prochaine = (s.prochaine ?? hasard(0, b.tous)) - dt;
        if (s.prochaine <= 0) {
          s.prochaine = b.tous;
          nouvelles.push([s.x, s.y, s.vx * 0.1 + hasard(-4, 4), s.vy * 0.1 + hasard(-4, 4),
            { img: b.img, vie: hasard(...b.vie), k: 3, g: b.g, taille: b.taille, eclat: b.eclat, chaud: 0, braise: true, clignote: b.clignote }]);
        }
      }
      // senrin : en s'éteignant, chaque étoile crépite en une petite gerbe blanche
      if (s.crepite && !s.crepe && s.age > s.vie * 0.8 && Math.random() < dt * 8) {
        s.crepe = true;
        s.vie = s.age + 0.04;
        for (let i = 0; i < 6; i++) {
          const a = hasard(0, 6.28), v = hasard(25, 60);
          nouvelles.push([s.x, s.y, Math.cos(a) * v + s.vx, Math.sin(a) * v + s.vy, { img: lueur('argent'), vie: hasard(0.15, 0.3), k: 5, g: 20, taille: 1.2, eclat: 1, chaud: 0, braise: true }]);
        }
      }
    }
    // les étoiles éteintes s'en vont (sur place : pas de nouvelle liste à chaque image)
    let j = 0;
    for (const s of etoiles) if (s.age < s.vie) etoiles[j++] = s;
    etoiles.length = j;
    for (const x of nouvelles) etoile(...x);
  }

  function dessiner() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, toile.width, toile.height);
    ctx.globalCompositeOperation = 'lighter';
    const r = ratio;
    // une lueur ronde, et derrière elle sa traînée, étirée dans le sens de sa course
    const tache = (img, x, y, d, a, vx = 0, vy = 0) => {
      if (a <= 0.01) return;
      ctx.globalAlpha = Math.min(1, a);
      const v = Math.hypot(vx, vy), l = Math.min(v * TRAINEE, TRAINEE_MAX);
      if (l > 1.5) {
        const c = vx / v, s = vy / v;
        ctx.setTransform(r * c, r * s, -r * s, r * c, r * x, r * y);
        ctx.drawImage(img.trait, -l, -d * 0.22, l, d * 0.44);
        ctx.drawImage(img, -d / 2, -d / 2, d, d);
      } else {
        ctx.setTransform(r, 0, 0, r, 0, 0);
        ctx.drawImage(img, x - d / 2, y - d / 2, d, d);
      }
    };
    const blanc = lueur('argent');
    for (const e of eclairs) { // l'éclair de l'éclatement : une lueur large et brève de la couleur de la bombe
      const p = e.age / 0.22;
      tache(e.img, e.x, e.y, e.R * (1.1 + 0.6 * p), 0.22 * (1 - p) ** 2);
      tache(blanc, e.x, e.y, e.R * 0.22, 0.7 * (1 - p) ** 2);
    }
    for (const b of bombes) tache(lueur('or'), b.px, b.py, 4.5, 0.9, b.vx, b.vy);
    for (const s of etoiles) {
      const u = s.age / s.vie;
      // pleine lumière, puis elle s'éteint en vacillant
      let a = (u < 0.62 ? 1 : (1 - u) / 0.38) * s.eclat;
      if (u > 0.75) a *= hasard(0.55, 1);
      if (s.clignote && u > 0.3 && Math.sin(s.age * 62 + s.phase) < 0) a *= 0.06;
      const img = s.img2 && u > s.change ? s.img2 : s.img;
      const d = s.taille * 3.4 * (s.age < 0.1 ? 1.5 : 1); // plus gros à l'éclatement
      tache(img, s.x, s.y, d, a, s.braise ? 0 : s.vx, s.braise ? 0 : s.vy); // les étincelles, lentes : sans traînée
      if (u < s.chaud) tache(blanc, s.x, s.y, d * 0.6, a * 0.8); // un cœur blanc, très chaud au début
      if (s.img2 && Math.abs(u - s.change) < 0.025) tache(blanc, s.x, s.y, d * 1.3, a); // l'éclat du changement
    }
    ctx.globalAlpha = 1;
  }

  function image(t) {
    if (!toile.isConnected) {
      if (vue) { arreter(); return; } // la toile a quitté la page : fini
    } else vue = true;
    raf = requestAnimationFrame(image);
    // 60 images par seconde suffisent : un écran à 120 Hz n'en dessine pas deux fois plus
    if (avant && t - avant < IMAGE - 1) return;
    const dt = Math.min(0.05, avant ? (t - avant) / 1000 : 0.016);
    avant = t;
    ajuster();
    if (!L || !H) return;
    programmer(dt);
    avancer(dt);
    dessiner();
  }
  function arreter() {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  function demarrer() {
    if (raf) return;
    etoiles = []; bombes = []; eclairs = []; salve = 0; prochain = hasard(0.2, 0.6); avant = 0;
    ctx.clearRect(0, 0, toile.width, toile.height);
    raf = requestAnimationFrame(image);
  }
  toile.jouer = (oui) => (oui ? demarrer() : arreter());
  demarrer();
  return toile;
}
