// ================================================================
//  L'image « Mon voyage au Japon » à partager (1080 × 1920 : TikTok,
//  Instagram, stories), dessinée dans le navigateur au moment du partage.
//  Deux façons, au choix du visiteur (choix du propriétaire, 2026-10-12) :
//  - « carte » : la vraie carte en 3D avec la route rouge (une capture de
//    la carte, faite par partage-voyage.js), les étapes numérotées et les
//    temps de trajet, puis la liste des étapes ;
//  - « carnet » : une petite carte dessinée (les préfectures, la route), puis
//    chaque étape avec sa photo, ses noms et le trajet jusqu'à la suivante.
//  Même papier que l'image du bravo des légendes (bravo-image.js).
// ================================================================

import { chargerImage, adresseGrain, ajuster, dessinerLogo } from './bravo-image.js';

const L = 1080, H = 1920;
const PAPIER = '#efe4c8', PAPIER_CLAIR = '#f6eedb', TRAIT = '#8a6b45', ENCRE = '#35251a', ENCRE_2 = '#5b432d',
  ENCRE_3 = '#6e533a', ROUGE = '#a8321f', ROUGE_FONCE = '#8f2716', MER = '#8fbab2', SABLE = '#e3d0a7';
const TITRE = '"Zen Antique", "Noto Serif JP", Georgia, serif';
const CARTE = '"IM Fell English", "Zen Antique", Georgia, serif';
const TEXTE = '"Noto Sans", "Noto Sans JP", system-ui, sans-serif';
const MARGE = 74; // bord gauche et droit du contenu (dans le double filet)

/**
 * @param format - 'carte' ou 'carnet'
 * @param d - les textes et les données, préparés par partage-voyage.js :
 *   { titre: [début, fin en rouge], resume, appel, adresse, autres(n),
 *     etapes: [{ nom, second, infos, photo, lng, lat }],
 *     trajets: [{ texte, court, extra, ligne, sansRoute }], icone (SVG du mode), route (GeoJSON),
 *     capture: { image, points: [{ x, y }], etiquettes: [{ x, y, texte }] } (en fractions de l'image ; « carte » seulement) }
 * @returns Promise d'un Blob JPEG
 */
export async function imageVoyage(format, d) {
  const toile = document.createElement('canvas');
  toile.width = L;
  toile.height = H;
  const c = toile.getContext('2d');
  const tout = [...d.titre, d.resume, d.appel, ...d.etapes.flatMap((e) => [e.nom, e.second, e.infos])].join('');
  await Promise.all([
    document.fonts.load(`80px ${TITRE}`, tout),
    document.fonts.load(`italic 40px ${CARTE}`, d.adresse),
    document.fonts.load(`30px ${TEXTE}`, tout),
  ]).catch(() => {});
  const [grain, logo, icone] = await Promise.all([
    chargerImage(adresseGrain()).catch(() => null),
    chargerImage('img/logo.jpg').catch(() => null),
    chargerImage(svgEnImage(d.icone, ENCRE_3)).catch(() => null),
  ]);
  papier(c, grain);
  if (format === 'carnet') await carnet(c, d, logo, icone);
  else await carte(c, d, logo, grain);
  ruban(c, d.adresse, L / 2, 1790);
  c.font = `19px ${TEXTE}`;
  c.fillStyle = ENCRE_3;
  c.textAlign = 'center';
  // les sources de la carte, comme leurs licences le demandent
  c.fillText(`${format === 'carnet' ? '' : 'Mapterhorn · '}Natural Earth · © OpenStreetMap · OSRM`, L / 2, 1858);
  return new Promise((ok, ko) => toile.toBlob((b) => (b ? ok(b) : ko(new Error('toBlob'))), 'image/jpeg', 0.9));
}

// ---------------------------------------------------------------- A : la carte en 3D
async function carte(c, d, logo, grain) {
  if (logo) dessinerLogo(c, logo, L / 2, 150, 46);
  titre(c, d.titre, L / 2, 290, 'center', 84, 900);
  c.font = `34px ${TEXTE}`;
  c.fillStyle = ENCRE_2;
  c.textAlign = 'center';
  c.fillText(d.resume, L / 2, 352, 900);

  // la liste des étapes, sur deux colonnes, sous la carte
  const { cadre, montrees, lignes, hauteurLigne, hautListe } = miseEnPageCarte(d.etapes);

  ombreCadre(c, cadre);
  if (d.capture?.image) {
    c.drawImage(d.capture.image, cadre.x, cadre.y, cadre.l, cadre.h);
    if (grain) {
      c.save();
      c.globalAlpha = 0.45;
      c.fillStyle = c.createPattern(grain, 'repeat');
      c.fillRect(cadre.x, cadre.y, cadre.l, cadre.h);
      c.restore();
    }
    c.save();
    c.beginPath();
    c.rect(cadre.x, cadre.y, cadre.l, cadre.h);
    c.clip();
    const p = (q) => [cadre.x + q.x * cadre.l, cadre.y + q.y * cadre.h];
    // les temps de trajet : ceux des plus longs trajets d'abord, sans chevauchement ni sur les étapes
    const pris = d.capture.points.map((q) => { const [x, y] = p(q); return { g: x - 32, d: x + 32, h: y - 32, b: y + 32 }; });
    c.font = `600 23px ${TEXTE}`;
    for (const e of [...d.capture.etiquettes].sort((a, b) => b.duree - a.duree)) {
      const [x, y] = p(e);
      const l = c.measureText(e.texte).width + 26;
      const r = { g: x - l / 2 - 4, d: x + l / 2 + 4, h: y - 23, b: y + 23 };
      const dehors = r.g < cadre.x || r.d > cadre.x + cadre.l || r.h < cadre.y || r.b > cadre.y + cadre.h;
      if (dehors || pris.some((q) => r.g < q.d && r.d > q.g && r.h < q.b && r.b > q.h)) continue;
      pris.push(r);
      etiquette(c, x, y, e.texte);
    }
    etapesNumerotees(c, d.capture.points.map(p), 25);
    c.restore();
  } else {
    await carteDessinee(c, d, cadre);
  }

  const colonne = (cadre.l - 20) / 2;
  const elements = [...montrees.map((e, i) => ({ e, i })), ...(d.etapes.length > montrees.length ? [{ autres: d.etapes.length - montrees.length }] : [])];
  elements.forEach((el, k) => {
    const col = Math.floor(k / lignes), rang = k % lignes;
    const x = MARGE + 18 + col * (colonne + 20), y = hautListe + rang * hauteurLigne + hauteurLigne / 2;
    if (el.autres) {
      c.font = `26px ${TEXTE}`;
      c.fillStyle = ENCRE_3;
      c.textAlign = 'left';
      c.fillText(d.autres(el.autres), x + 4, y + 9);
      return;
    }
    numero(c, x + 20, y, el.i + 1, 21);
    c.textAlign = 'left';
    c.fillStyle = ENCRE;
    const taille = ajuster(c, el.e.nom, lignes > 4 ? 28 : 32, TITRE, colonne - 62);
    c.font = `${taille}px ${TITRE}`;
    c.fillText(el.e.nom, x + 52, el.e.second && lignes <= 4 ? y + 2 : y + 10);
    if (el.e.second && lignes <= 4) {
      c.font = `21px ${TITRE}`;
      c.fillStyle = ENCRE_3;
      c.fillText(el.e.second, x + 52, y + 28, colonne - 62);
    }
  });
}

/** La place de la carte dans l'image A (elle laisse la place de la liste des étapes en dessous). */
export function miseEnPageCarte(etapes) {
  const max = 12;
  const montrees = etapes.length > max ? etapes.slice(0, max - 1) : etapes;
  const lignes = Math.ceil((montrees.length + (etapes.length > max ? 1 : 0)) / 2);
  const hauteurLigne = lignes > 4 ? 52 : 64;
  const hautListe = 1712 - lignes * hauteurLigne;
  return { cadre: { x: MARGE, y: 396, l: L - 2 * MARGE, h: hautListe - 34 - 396 }, montrees, lignes, hauteurLigne, hautListe };
}

// ---------------------------------------------------------------- B : le carnet de voyage
async function carnet(c, d, logo, icone) {
  // en-tête : le logo, le titre et le résumé à gauche, le sceau 旅 à droite
  if (logo) dessinerLogo(c, logo, 142, 150, 48);
  titre(c, d.titre, 214, 158, 'left', 66, 640);
  c.font = `29px ${TEXTE}`;
  c.fillStyle = ENCRE_2;
  c.textAlign = 'left';
  c.fillText(d.resume, 216, 210, 640);
  sceau(c, 952, 150);

  // les étapes : avec leur photo jusqu'à 8, au-delà plus serrées et sans photo (10 au plus)
  const max = 10;
  const montrees = d.etapes.length > max ? d.etapes.slice(0, max - 1) : d.etapes;
  const avecPhotos = montrees.length <= 8;
  const ligne = avecPhotos ? (montrees.length <= 6 ? 104 : 88) : 62;
  const trajet = avecPhotos ? 34 : 30;
  const plus = d.etapes.length > max ? 50 : 0;
  const hauteurListe = montrees.length * ligne + (montrees.length - 1) * trajet + plus;
  const hautCarte = 266;
  const hCarte = Math.max(300, Math.min(montrees.length <= 4 ? 820 : 640, 1650 - hauteurListe - 40 - hautCarte));
  const cadre = { x: MARGE, y: hautCarte, l: L - 2 * MARGE, h: hCarte };
  ombreCadre(c, cadre);
  await carteDessinee(c, d, cadre);

  const photos = avecPhotos ? await Promise.all(montrees.map((e) => (e.photo ? chargerImage(e.photo).catch(() => null) : null))) : [];
  let y = hautCarte + hCarte + 40 + Math.max(0, (1650 - hautCarte - hCarte - 40 - hauteurListe) / 2);
  const xNum = 122;
  montrees.forEach((e, i) => {
    const milieu = y + ligne / 2;
    numero(c, xNum, milieu, i + 1, avecPhotos ? 25 : 21);
    let x = xNum + 44;
    if (avecPhotos) {
      const [pl, ph] = ligne === 104 ? [78, 98] : [66, 82];
      cadrePhoto(c, photos[i], x, milieu - ph / 2, pl, ph);
      x += pl + 24;
    }
    const droite = L - MARGE - 18;
    c.textAlign = 'right';
    c.font = `${avecPhotos ? 30 : 24}px ${TITRE}`;
    c.fillStyle = TRAIT;
    const largeurSecond = e.second ? Math.min(c.measureText(e.second).width, 260) : 0;
    if (e.second) c.fillText(e.second, droite, milieu + (avecPhotos ? 10 : 8), 260);
    c.textAlign = 'left';
    c.fillStyle = ENCRE;
    const largeurNom = droite - x - largeurSecond - 24;
    c.font = `${ajuster(c, e.nom, avecPhotos ? 38 : 30, TITRE, largeurNom)}px ${TITRE}`;
    c.fillText(e.nom, x, avecPhotos ? milieu - 2 : milieu + 10);
    if (avecPhotos && e.infos) {
      c.font = `24px ${TEXTE}`;
      c.fillStyle = ENCRE_3;
      c.fillText(e.infos, x + 1, milieu + 32, largeurNom);
    }
    y += ligne;
    const t = d.trajets[i];
    if (i < montrees.length - 1 && t) {
      c.save();
      c.strokeStyle = ROUGE;
      c.lineWidth = 3;
      c.setLineDash([2, 7]);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(xNum, y - 2);
      c.lineTo(xNum, y + trajet + 2);
      c.stroke();
      c.restore();
      if (icone) c.drawImage(icone, xNum + 30, y + trajet / 2 - 13, 26, 26);
      c.font = `23px ${TEXTE}`;
      c.fillStyle = ENCRE_3;
      c.textAlign = 'left';
      c.fillText([t.texte, t.extra].filter(Boolean).join(' · '), xNum + 64, y + trajet / 2 + 8, L - MARGE - xNum - 90);
      y += trajet;
    }
  });
  if (plus) {
    c.font = `26px ${TEXTE}`;
    c.fillStyle = ENCRE_3;
    c.textAlign = 'left';
    c.fillText(d.autres(d.etapes.length - montrees.length), xNum + 44, y + 36);
  }
  c.font = `30px ${TEXTE}`;
  c.fillStyle = ENCRE_2;
  c.textAlign = 'center';
  c.fillText(d.appel, L / 2, 1716, 900);
}

// ---------------------------------------------------------------- La petite carte dessinée
let prefectures = null;

/** Les préfectures en papier sur la mer turquoise, la route en rouge et les étapes numérotées, dans le cadre. */
async function carteDessinee(c, d, cadre) {
  prefectures ??= fetch('data/prefectures.geojson').then((r) => r.json());
  const pref = await prefectures.catch(() => null);
  // les bornes : les étapes et la route, avec une marge. Un voyage dans une ville est montré dans sa région (~250 km) :
  // à cette échelle, la carte dessinée n'a que les préfectures, une vue plus proche serait vide.
  let [o, s, e, n] = [180, 90, -180, -90];
  const etendre = ([x, y]) => { o = Math.min(o, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); };
  d.etapes.forEach((l) => etendre([l.lng, l.lat]));
  for (const f of d.route?.features || []) f.geometry.coordinates.forEach(etendre);
  const my = (lat) => (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
  const lx = Math.max(e - o, 2.6), ly = Math.max(my(n) - my(s), 1.7);
  const marge = 0.1;
  const k = Math.min((cadre.l * (1 - 2 * marge)) / lx, (cadre.h * (1 - 2 * marge)) / ly);
  const cx = (o + e) / 2, cy = (my(n) + my(s)) / 2;
  const pt = ([x, y]) => [cadre.x + cadre.l / 2 + (x - cx) * k, cadre.y + cadre.h / 2 - (my(y) - cy) * k];
  const visible = { o: cx - cadre.l / 2 / k - 1, e: cx + cadre.l / 2 / k + 1 };

  c.save();
  c.beginPath();
  c.rect(cadre.x, cadre.y, cadre.l, cadre.h);
  c.clip();
  c.fillStyle = MER;
  c.fillRect(cadre.x, cadre.y, cadre.l, cadre.h);
  // de fines hachures d'eau, comme sur une carte gravée
  c.strokeStyle = 'rgba(61, 107, 100, 0.16)';
  c.lineWidth = 1.2;
  for (let i = -cadre.h; i < cadre.l; i += 13) {
    c.beginPath();
    c.moveTo(cadre.x + i, cadre.y + cadre.h);
    c.lineTo(cadre.x + i + cadre.h * 0.7, cadre.y);
    c.stroke();
  }
  if (pref) {
    const chemins = [];
    for (const f of pref.features) {
      const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
      for (const poly of polys) {
        const anneau = poly[0];
        if (!anneau.some(([x]) => x > visible.o && x < visible.e)) continue;
        const p = new Path2D();
        let der = null;
        anneau.forEach((q, i) => {
          const [x, y] = pt(q);
          if (der && i < anneau.length - 1 && Math.hypot(x - der[0], y - der[1]) < 1.2) return;
          if (der) p.lineTo(x, y); else p.moveTo(x, y);
          der = [x, y];
        });
        p.closePath();
        chemins.push(p);
      }
    }
    c.save();
    c.translate(5, 6);
    c.filter = 'blur(5px)';
    c.fillStyle = 'rgba(44, 74, 67, 0.35)';
    for (const p of chemins) c.fill(p);
    c.restore();
    c.fillStyle = SABLE;
    c.strokeStyle = TRAIT;
    c.lineWidth = 1.3;
    c.lineJoin = 'round';
    for (const p of chemins) c.fill(p);
    for (const p of chemins) c.stroke(p);
  }
  // la route : un liseré de papier sous le trait rouge ; bateaux et trajets sans route en pointillés
  const traces = (d.route?.features || []).map((f) => ({ type: f.properties.type, points: f.geometry.coordinates.map(pt) }));
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (const [couleur, largeur] of [[PAPIER_CLAIR, 13], [ROUGE, 6]]) {
    c.strokeStyle = couleur;
    c.lineWidth = largeur;
    for (const t of traces) if (t.type === 'route') trait(c, t.points);
  }
  c.strokeStyle = ROUGE;
  c.lineWidth = 5;
  c.setLineDash([2, 10]);
  for (const t of traces) if (t.type !== 'route') trait(c, t.points);
  c.setLineDash([]);
  etapesNumerotees(c, d.etapes.map((l) => pt([l.lng, l.lat])), 22);
  c.restore();
}

function trait(c, points) {
  c.beginPath();
  let der = null;
  points.forEach(([x, y], i) => {
    if (der && i < points.length - 1 && Math.hypot(x - der[0], y - der[1]) < 1.5) return;
    if (der) c.lineTo(x, y); else c.moveTo(x, y);
    der = [x, y];
  });
  c.stroke();
}

// ---------------------------------------------------------------- Les morceaux
function papier(c, grain) {
  c.fillStyle = PAPIER;
  c.fillRect(0, 0, L, H);
  if (grain) {
    c.save();
    c.scale(1.5, 1.5);
    c.fillStyle = c.createPattern(grain, 'repeat');
    c.fillRect(0, 0, L / 1.5, H / 1.5);
    c.restore();
  }
  const bord = c.createRadialGradient(L / 2, H / 2, H * 0.32, L / 2, H / 2, H * 0.62);
  bord.addColorStop(0, 'rgba(120, 84, 44, 0)');
  bord.addColorStop(1, 'rgba(120, 84, 44, 0.32)');
  c.fillStyle = bord;
  c.fillRect(0, 0, L, H);
  c.strokeStyle = TRAIT;
  c.lineWidth = 4;
  c.strokeRect(34, 34, L - 68, H - 68);
  c.globalAlpha = 0.6;
  c.lineWidth = 2;
  c.strokeRect(50, 50, L - 100, H - 100);
  c.globalAlpha = 1;
}

/** Le titre : la fin en rouge (« Mon voyage  » « au Japon » : l'espace est dans le début, il n'y en a pas en japonais). */
function titre(c, [debut, fin], x, y, alignement, taille, largeurMax) {
  const t = ajuster(c, debut + fin, taille, TITRE, largeurMax);
  c.font = `${t}px ${TITRE}`;
  const l1 = c.measureText(debut).width, l2 = c.measureText(fin).width;
  const x0 = alignement === 'center' ? x - (l1 + l2) / 2 : x;
  c.textAlign = 'left';
  c.fillStyle = ENCRE;
  c.fillText(debut, x0, y);
  c.fillStyle = ROUGE;
  c.fillText(fin, x0 + l1, y);
}

function sceau(c, x, y) {
  c.save();
  c.translate(x, y);
  c.rotate((-6 * Math.PI) / 180);
  c.fillStyle = 'rgba(168, 50, 31, 0.08)';
  c.fillRect(-52, -52, 104, 104);
  c.strokeStyle = ROUGE;
  c.lineWidth = 5;
  c.strokeRect(-52, -52, 104, 104);
  c.fillStyle = ROUGE;
  c.font = `64px ${TITRE}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('旅', 0, 4);
  c.restore();
}

/** Le cadre d'une carte : un liseré de papier, un filet d'encre et une ombre. */
function ombreCadre(c, { x, y, l, h }) {
  c.save();
  c.shadowColor = 'rgba(52, 36, 18, 0.3)';
  c.shadowBlur = 24;
  c.shadowOffsetY = 8;
  c.fillStyle = PAPIER_CLAIR;
  c.fillRect(x - 4, y - 4, l + 8, h + 8);
  c.restore();
  c.strokeStyle = TRAIT;
  c.lineWidth = 2;
  c.strokeRect(x - 5, y - 5, l + 10, h + 10);
}

function cadrePhoto(c, image, x, y, l, h) {
  c.fillStyle = PAPIER_CLAIR;
  c.fillRect(x - 3, y - 3, l + 6, h + 6);
  c.strokeStyle = TRAIT;
  c.lineWidth = 1.5;
  c.strokeRect(x - 4, y - 4, l + 8, h + 8);
  if (!image) {
    c.fillStyle = '#e4d5b1';
    c.fillRect(x, y, l, h);
    return;
  }
  const k = Math.max(l / image.width, h / image.height);
  const sl = l / k, sh = h / k;
  c.drawImage(image, (image.width - sl) / 2, (image.height - sh) / 2, sl, sh, x, y, l, h);
}

/**
 * Les étapes numérotées. Deux étapes trop proches (deux temples de Kyōto) ne se cachent pas : la seconde est
 * écartée, et un fin trait la relie à un point rouge à sa vraie place.
 */
function etapesNumerotees(c, points, r) {
  const places = [];
  points.forEach(([x, y], i) => {
    let [px, py] = [x, y];
    for (let essai = 0; essai < 12 && places.some(([qx, qy]) => Math.hypot(px - qx, py - qy) < 2 * r + 10); essai++) {
      const angle = -Math.PI / 4 + (essai * Math.PI) / 3;
      const loin = (2 * r + 12) * (1 + Math.floor(essai / 6) * 0.8);
      [px, py] = [x + Math.cos(angle) * loin, y + Math.sin(angle) * loin];
    }
    places.push([px, py]);
    if (px !== x || py !== y) {
      c.strokeStyle = ROUGE;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(px, py);
      c.stroke();
      c.beginPath();
      c.arc(x, y, 5.5, 0, Math.PI * 2);
      c.fillStyle = ROUGE;
      c.fill();
      c.strokeStyle = PAPIER_CLAIR;
      c.lineWidth = 2;
      c.stroke();
    }
  });
  places.forEach(([x, y], i) => numero(c, x, y, i + 1, r));
}

/** Une étape : un rond rouge cerclé de papier, avec son numéro. */
function numero(c, x, y, n, r) {
  c.save();
  c.shadowColor = 'rgba(40, 26, 12, 0.35)';
  c.shadowBlur = 6;
  c.shadowOffsetY = 2;
  c.beginPath();
  c.arc(x, y, r + 4, 0, Math.PI * 2);
  c.fillStyle = PAPIER_CLAIR;
  c.fill();
  c.restore();
  c.beginPath();
  c.arc(x, y, r + 4.5, 0, Math.PI * 2);
  c.strokeStyle = TRAIT;
  c.lineWidth = 1.2;
  c.stroke();
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = ROUGE;
  c.fill();
  c.fillStyle = PAPIER_CLAIR;
  c.font = `${Math.round(r * 1.2)}px ${TITRE}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(n), x, y + r * 0.08);
  c.textBaseline = 'alphabetic';
}

/** Le temps d'un trajet sur la carte : une étiquette de papier, comme sur le site. */
function etiquette(c, x, y, texte) {
  c.font = `600 23px ${TEXTE}`;
  const l = c.measureText(texte).width + 26, h = 38;
  c.save();
  c.shadowColor = 'rgba(40, 26, 12, 0.3)';
  c.shadowBlur = 6;
  c.shadowOffsetY = 2;
  c.fillStyle = PAPIER_CLAIR;
  c.fillRect(x - l / 2, y - h / 2, l, h);
  c.restore();
  c.strokeStyle = ROUGE;
  c.lineWidth = 2;
  c.strokeRect(x - l / 2 + 1, y - h / 2 + 1, l - 2, h - 2);
  c.fillStyle = ROUGE_FONCE;
  c.textAlign = 'center';
  c.fillText(texte, x, y + 8);
}

/** Le ruban rouge de l'adresse, avec ses deux queues repliées. */
function ruban(c, adresse, x, y) {
  c.font = `italic 42px ${CARTE}`;
  const l = Math.min(860, c.measureText(adresse).width + 96), h = 76;
  for (const sens of [-1, 1]) {
    const bx = x + sens * (l / 2 - 8);
    c.beginPath();
    c.moveTo(bx, y - h / 2 + 16);
    c.lineTo(bx + sens * 64, y - h / 2 + 16);
    c.lineTo(bx + sens * 44, y + 8 + 16);
    c.lineTo(bx + sens * 64, y + h / 2 + 16);
    c.lineTo(bx, y + h / 2 + 16);
    c.closePath();
    c.fillStyle = ROUGE_FONCE;
    c.fill();
  }
  c.save();
  c.shadowColor = 'rgba(52, 36, 18, 0.3)';
  c.shadowBlur = 14;
  c.shadowOffsetY = 5;
  c.fillStyle = ROUGE;
  c.fillRect(x - l / 2, y - h / 2, l, h);
  c.restore();
  c.fillStyle = PAPIER_CLAIR;
  c.textAlign = 'center';
  c.font = `italic ${ajuster(c, adresse, 42, CARTE, l - 60)}px ${CARTE}`;
  c.fillText(adresse, x, y + 13);
}

/** Une icône SVG du site (currentColor) en image pour le canevas. */
function svgEnImage(svg, couleur) {
  const texte = svg.replace(/currentColor/g, couleur).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" ');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(texte)}`;
}
