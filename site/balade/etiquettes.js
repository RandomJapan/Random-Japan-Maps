// ================================================================
//  Les textes peints sur les plaques et les enseignes de la balade (le nom du tunnel, « 炊事場 », « おみくじ »,
//  les titres des panneaux…) et les images peintes (le pin du nō, la vitrine d'un distributeur…), dans la police
//  de la page (M PLUS Rounded 1c, qui a les kanji), sur des rectangles posés contre les plaques. Les modèles ne
//  savent pas écrire (des barres noires faisaient le texte) : ces rectangles le font.
//  Toutes les étiquettes d'un lieu sont dessinées dans une seule image (un atlas), et forment un seul objet (deux,
//  avec celles qui brillent) : une vingtaine d'objets et de textures à part faisaient travailler la carte graphique
//  bien plus que leur taille (2026-10-23).
//  Une étiquette : { texte, x, y, z, ry (tourné vers +z à 0), l, h (en mètres), fond (ou null : transparent),
//  encre, sous (un second texte plus petit dessous), vertical (de haut en bas), lignes (n traits d'écriture
//  sous le titre : un panneau à lire), cadre (une bordure), lumineux (il ne prend pas l'ombre : un écran), forme
//  ('rond' : un panneau rond, cadre en anneau), dessin(contexte, largeur, hauteur) : une image peinte par le lieu }.
// ================================================================
const POLICE = '"M PLUS Rounded 1c", sans-serif';
const PIXELS_PAR_METRE = 240;
const ATLAS = 2048, MARGE = 4;

/** Les étiquettes du lieu, dans un groupe ; l'atlas se redessine dès que la police est là. */
export function creerEtiquettes(THREE, liste, { anisotropie = 4 } = {}) {
  // la taille de chaque image (au plus 1024 pixels de côté, sans la déformer), puis leur place dans l'atlas : par
  // rangées, les plus hautes d'abord
  const items = liste.map((e) => {
    const k = Math.min(1, 1024 / (Math.max(e.l, e.h) * PIXELS_PAR_METRE));
    return { e, W: Math.max(32, Math.round(e.l * PIXELS_PAR_METRE * k)), H: Math.max(32, Math.round(e.h * PIXELS_PAR_METRE * k)) };
  });
  let x = 0, y = 0, rang = 0;
  for (const it of [...items].sort((a, b) => b.H - a.H)) {
    if (x + it.W > ATLAS) { x = 0; y += rang + MARGE; rang = 0; }
    Object.assign(it, { px: x, py: y });
    x += it.W + MARGE;
    rang = Math.max(rang, it.H);
  }
  const hauteur = Math.min(ATLAS * 2, 2 ** Math.ceil(Math.log2(Math.max(64, y + rang))));
  const toile = document.createElement('canvas');
  toile.width = ATLAS;
  toile.height = hauteur;
  const c = toile.getContext('2d', { willReadFrequently: true });
  const toutDessiner = () => {
    c.clearRect(0, 0, ATLAS, hauteur);
    for (const it of items) {
      c.save();
      c.translate(it.px, it.py);
      c.beginPath(); c.rect(0, 0, it.W, it.H); c.clip();
      dessiner(c, it.e, it.W, it.H);
      c.restore();
    }
  };
  toutDessiner();
  const texture = new THREE.CanvasTexture(toile);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropie;

  // les rectangles : deux triangles chacun, dans le lieu, et leur coin de l'atlas
  const groupe = new THREE.Group();
  for (const lumineux of [false, true]) {
    const choix = items.filter((it) => !!it.e.lumineux === lumineux);
    if (!choix.length) continue;
    const pos = [], uv = [], nor = [];
    for (const { e, W, H, px, py } of choix) {
      const cs = Math.cos(e.ry || 0), sn = Math.sin(e.ry || 0), dl = e.l / 2, dh = e.h / 2;
      const coin = (u, v) => [e.x + u * cs, e.y + v, e.z - u * sn];
      const [A, B, C, D] = [coin(-dl, -dh), coin(dl, -dh), coin(dl, dh), coin(-dl, dh)];
      const [u0, u1, v0, v1] = [px / ATLAS, (px + W) / ATLAS, 1 - (py + H) / hauteur, 1 - py / hauteur];
      pos.push(...A, ...B, ...C, ...A, ...C, ...D);
      uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
      for (let i = 0; i < 6; i++) nor.push(sn, 0, cs);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    // (les étiquettes transparentes autour, comme le cadran rond : découpées)
    const mat = lumineux ? new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5 }) : new THREE.MeshLambertMaterial({ map: texture, alphaTest: 0.5 });
    const m = new THREE.Mesh(g, mat);
    m.receiveShadow = !lumineux;
    groupe.add(m);
  }
  // la police arrive (le temps de charger les morceaux qui ont ces caractères) : on redessine
  const texte = items.map((it) => [it.e.texte, it.e.sous].filter(Boolean).join('')).join('') + '0123456789℃';
  if (document.fonts) {
    Promise.all([700, 800].map((g) => document.fonts.load(`${g} 48px ${POLICE}`, texte))).then(() => { toutDessiner(); texture.needsUpdate = true; }, () => {});
  }
  return groupe;
}

/** L'image d'une étiquette, dans le rectangle (0, 0, W, H) du contexte c. */
function dessiner(c, e, W, H) {
  if (e.forme === 'rond') {
    // un panneau rond (la vitesse limite) : le disque, son anneau, le texte au milieu
    const R = Math.min(W, H) / 2;
    c.beginPath(); c.arc(W / 2, H / 2, R * 0.97, 0, 2 * Math.PI); c.fillStyle = e.cadre || '#d8302c'; c.fill();
    c.beginPath(); c.arc(W / 2, H / 2, R * 0.74, 0, 2 * Math.PI); c.fillStyle = e.fond || '#ffffff'; c.fill();
    c.fillStyle = e.encre || '#2a4a9a'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 ${Math.round(R * 0.95)}px ${POLICE}`;
    c.fillText(e.texte, W / 2, H / 2 + R * 0.04);
    return;
  }
  if (e.fond !== null) { c.fillStyle = e.fond || '#fff8e8'; c.fillRect(0, 0, W, H); }
  // une image peinte (le pin du nō, les canettes d'un distributeur…) : dessin(contexte, largeur, hauteur)
  if (e.dessin) { c.save(); e.dessin(c, W, H); c.restore(); }
  if (e.cadre) {
    const t = Math.max(2, Math.min(W, H) * 0.06);
    c.strokeStyle = e.cadre;
    c.lineWidth = t;
    c.strokeRect(t * 1.2, t * 1.2, W - t * 2.4, H - t * 2.4);
  }
  c.fillStyle = e.encre || '#2a2420';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const police = (taille, gras = e.gras !== false) => `${gras ? 800 : 700} ${Math.round(taille)}px ${POLICE}`;
  if (!e.texte) return;
  if (e.vertical) {
    // de haut en bas, un caractère sous l'autre
    const car = [...e.texte], n = car.length;
    const taille = Math.min(W * 0.74, (H * 0.88) / n);
    c.font = police(taille);
    car.forEach((ch, i) => c.fillText(ch, W / 2, H / 2 + (i - (n - 1) / 2) * taille * 1.04));
    return;
  }
  // le titre (au-dessus si un second texte ou des lignes suivent), réduit s'il est trop large
  let taille = H * (e.lignes ? 0.3 : e.sous ? 0.48 : 0.64);
  c.font = police(taille);
  const large = c.measureText(e.texte).width;
  if (large > W * 0.88) { taille *= (W * 0.88) / large; c.font = police(taille); }
  const yTitre = e.lignes ? H * 0.24 : e.sous ? H * 0.38 : H * 0.53;
  c.fillText(e.texte, W / 2, yTitre);
  if (e.sous) {
    let t2 = H * 0.2;
    c.font = police(t2, false);
    const l2 = c.measureText(e.sous).width;
    if (l2 > W * 0.88) { t2 *= (W * 0.88) / l2; c.font = police(t2, false); }
    c.fillText(e.sous, W / 2, H * 0.8);
  }
  if (e.lignes && !e.sous) {
    // des lignes d'écriture : des traits d'encre arrondis, de longueurs différentes
    c.lineCap = 'round';
    c.strokeStyle = e.encre || '#2a2420';
    c.globalAlpha = 0.55;
    const ep = H * 0.045;
    c.lineWidth = ep;
    for (let i = 0; i < e.lignes; i++) {
      const y = H * (0.5 + i * 0.15), l = W * (0.74 - ((i * 37) % 23) / 100);
      c.beginPath();
      c.moveTo(W * 0.13, y);
      c.lineTo(W * 0.13 + l, y);
      c.stroke();
    }
    c.globalAlpha = 1;
  }
}
