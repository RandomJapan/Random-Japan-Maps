// ================================================================
//  L'enregistrement du plongeon en vidéo MP4 (mode développeur, onglet Plongeon : case « Enregistrer
//  le plongeon en vidéo »). Demandé le 2026-10-19 pour le début des TikToks : juste le plongeon, sans
//  aucun bouton, de bonne qualité.
//  - La carte se met dans un cadre au format du film, dessinée à sa taille : horizontal 16:9 en 1920 × 1080
//    (demandé juste après, le même jour : c'est le choix par défaut) ou vertical 9:16 en 1080 × 1920 ; en anglais
//    (la langue des vidéos, comme l'affiche du nom).
//  - Le temps de la page s'arrête, puis avance image par image (1/30 s) : la carte (MapLibre lit
//    performance.now), les minuteries, les animations CSS. Chaque image attend que le relief soit
//    chargé : la vidéo est fluide même sur un téléphone lent (la fabrication, elle, prend un peu plus de
//    temps que le plongeon).
//  - Chaque image du film : la carte (WebGL), puis ce qui est en HTML sur la carte et qu'on y voit :
//    les noms des régions, le papier vieilli, les noms des mers, l'épingle du lieu, le bandeau du nom,
//    l'adresse et les sources. Les boutons et les barres ne sont jamais dans le film.
//  - Encodée en H.264 (WebCodecs) dans un MP4 (mp4-muxer), 16 Mb/s ; à la fin, « Enregistrer la vidéo »
//    (menu de partage du téléphone : dans les photos ; téléchargement sur ordinateur).
// ================================================================
import { imageAffiche, MARGE_AFFICHE, ECHELLE_AFFICHE } from './affiche.js';
import { chargerImage } from './bravo-image.js';
import { echapper, partagerFichier, telecharger, typoFr } from './commun.js';
import { TEXTES } from './config.js';

const URL_MUXER = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/+esm';
// cadre : la taille de la carte (px CSS) pendant le film, le film = cadre × pixelRatio ; vertical : la mise en page
// d'un téléphone dans ce cadre (caméra de départ, bandeau du nom plus haut), sinon celle d'un ordinateur
const FORMATS = {
  '16:9': { largeur: 1920, hauteur: 1080, cadre: [1280, 720], vertical: false },
  '9:16': { largeur: 1080, hauteur: 1920, cadre: [432, 768], vertical: true },
};
const IMAGES = 30; // par seconde
const DEBIT = 16_000_000; // bits par seconde : large, pour un début de vidéo net
const CODECS = ['avc1.640028', 'avc1.4d0028', 'avc1.640032', 'avc1.4d0032']; // H.264 High puis Main, niveau 4 puis 5
const DUREE_MAX = 60; // s de film au plus (la mémoire du téléphone)
const ATTENTE_RELIEF = 4000; // ms réelles au plus à attendre les tuiles d'une image
// le bandeau du nom : en vertical à 22 % du bas, hors de la légende de TikTok (style.css, body.plongeon) ; en horizontal
// à 52 px du bas et un peu plus grand, comme sur un ordinateur (body.mode-film .visite-titre)
const BAS_TITRE_VERTICAL = 0.22, BAS_TITRE_HORIZONTAL = 52, TAILLE_TITRE_HORIZONTAL = 28 / 22;
const HALO_TERRE = '#f6eedb', HALO_MER = 'rgba(173, 208, 199, 0.9)';
const SOURCES = '© Mapterhorn · © OpenStreetMap · Natural Earth';

/** Le codec H.264 que ce navigateur sait fabriquer à la taille de ce format, ou null (pas de WebCodecs, ou pas de H.264). */
export async function codecMp4(format) {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return null;
  for (const codec of CODECS) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported(configuration(codec, leFormat(format)));
      if (supported) return codec;
    } catch { /* suivant */ }
  }
  return null;
}

const leFormat = (format) => FORMATS[format] || FORMATS['16:9'];
const configuration = (codec, f) => ({
  codec, width: f.largeur, height: f.hauteur, bitrate: DEBIT, framerate: IMAGES, latencyMode: 'quality', avc: { format: 'avc' },
});

/**
 * Prépare l'enregistrement (le cadre du format, l'anglais) ; le film commence à demarrer() (l'image fixe du départ)
 * et finit à terminer() (le bouton, Échap, ou la fin du plongeon).
 * outils : { codec, format ('16:9' | '9:16'), langue(), changerLangue(l), afficherMessage, adresse, nomFichier,
 *            titres: [{ nom, nomJa, infos }], arreterPlongeon(), pleineQualite(oui) }
 * Renvoie { demarrer, arrive, terminer }.
 */
export function enregistrer(map, outils) {
  const { codec, afficherMessage } = outils;
  const f = leFormat(outils.format);
  const LARGEUR = f.largeur, HAUTEUR = f.hauteur;
  const [L, H] = f.cadre; // le cadre de la carte, en px CSS (il peut déborder de l'écran : on y voit l'image du film)
  const k = LARGEUR / L; // pixels du film par pixel CSS
  const conteneur = map.getContainer();
  const avant = { pr: map.getPixelRatio(), langue: outils.langue() };
  // les textes de l'écran d'enregistrement restent dans la langue du propriétaire (la carte, elle, passe en anglais)
  const t = (cle, ...args) => {
    const v = TEXTES[avant.langue]?.[cle] ?? TEXTES.en[cle];
    const texte = typeof v === 'function' ? v(...args) : v;
    return avant.langue === 'fr' ? typoFr(texte) : texte;
  };
  let horloge = null; // le temps de la page, arrêté puis avancé image par image
  let encodeur = null, muxer = null, cible = null;
  let n = 0; // images du film
  let etape = 'prepare'; // 'prepare' | 'filme' | 'finit' | 'fini'
  let boucle = null;
  let arret = false;
  const toile = document.createElement('canvas'); // l'image du film
  toile.width = LARGEUR;
  toile.height = HAUTEUR;
  const c = toile.getContext('2d');
  const images = { papier: null, logo: null, titres: new Map(), icones: new Map() };

  // ---- L'écran pendant l'enregistrement : l'image du film elle-même, l'état, et « Arrêter » après l'arrivée
  const ecran = document.createElement('div');
  ecran.className = `enregistrement ${f.vertical ? 'vertical' : 'horizontal'}`;
  ecran.innerHTML = `<div class="enregistrement-tete"><span class="enregistrement-point"></span><span class="enregistrement-etat"></span></div>
    <div class="enregistrement-image"></div>
    <p class="enregistrement-note"></p>
    <div class="enregistrement-boutons"><button type="button" class="btn-lancer enregistrement-arreter" hidden></button></div>`;
  ecran.querySelector('.enregistrement-image').append(toile);
  document.body.append(ecran);
  const etat = ecran.querySelector('.enregistrement-etat');
  const boutonArreter = ecran.querySelector('.enregistrement-arreter');
  boutonArreter.textContent = t('enregistrementArreter');
  boutonArreter.addEventListener('click', () => terminer());
  etat.textContent = t('enregistrementPrepare');
  // si rien n'arrive (relief qui ne se charge pas…), on peut quand même tout arrêter (minuterie réelle : posée avant l'horloge)
  setTimeout(() => { if (etape !== 'fini') boutonArreter.hidden = false; }, 20000);
  ecran.querySelector('.enregistrement-note').textContent = t('enregistrementLent');
  c.fillStyle = '#111';
  c.fillRect(0, 0, LARGEUR, HAUTEUR);

  // ---- Le cadre du film (tout de suite : la caméra de départ du plongeon se calcule dans ce cadre)
  document.body.style.setProperty('--cadre-l', `${L}px`);
  document.body.style.setProperty('--cadre-h', `${H}px`);
  document.body.classList.add('enregistre', f.vertical ? 'film-vertical' : 'film-horizontal');
  map.resize();
  outils.pleineQualite?.(true); // un appareil peu puissant dessine moins fin (qualite.js) : le film, lui, a le temps
  map.setPixelRatio(k);
  if (avant.langue !== 'en') outils.changerLangue('en');

  /** Le plongeon est prêt (image fixe du départ) : le temps s'arrête, puis le film avance image par image. */
  function demarrer() {
    if (etape !== 'prepare') return;
    horloge = horlogeVirtuelle(); // tout de suite : la pause du départ (visite.js) part en temps du film
    etape = 'filme';
    boucle = (async () => {
      try {
        await preparerImages();
        const { Muxer, ArrayBufferTarget } = await import(URL_MUXER);
        cible = new ArrayBufferTarget();
        muxer = new Muxer({ target: cible, video: { codec: 'avc', width: LARGEUR, height: HAUTEUR, frameRate: IMAGES }, fastStart: 'in-memory' });
        encodeur = new VideoEncoder({
          output: (morceau, meta) => muxer.addVideoChunk(morceau, meta),
          error: (e) => { console.warn('Encodage', e); arret = true; },
        });
        encodeur.configure(configuration(codec, f));
        while (!arret) {
          if (n >= DUREE_MAX * IMAGES) break;
          horloge.avancer(1000 / IMAGES);
          await rendu();
          const debut = horloge.reel();
          while (!map.areTilesLoaded() && horloge.reel() - debut < ATTENTE_RELIEF) await rendu();
          await rendu(composer);
          const image = new VideoFrame(toile, { timestamp: Math.round((n * 1e6) / IMAGES), duration: Math.round(1e6 / IMAGES) });
          encodeur.encode(image, { keyFrame: n % IMAGES === 0 });
          image.close();
          n++;
          while (encodeur.encodeQueueSize > 4) await horloge.pause(5);
          etat.textContent = t('enregistrementEnCours', duree(n));
        }
      } catch (e) {
        console.warn('Enregistrement', e);
        afficherMessage(t('enregistrementErreur'));
      }
    })();
    boucle.then(() => { if (n >= DUREE_MAX * IMAGES) terminer(); });
  }

  /** La caméra est arrivée sur le lieu : on peut arrêter quand on veut. */
  function arrive() {
    boutonArreter.hidden = false;
  }

  /** Arrête le film, le termine en MP4, remet la carte comme avant et propose de l'enregistrer. */
  async function terminer() {
    if (etape === 'finit' || etape === 'fini') return;
    const filmait = etape === 'filme';
    etape = 'finit';
    arret = true;
    boutonArreter.hidden = true;
    etat.textContent = t('enregistrementFinalise');
    await boucle?.catch(() => {});
    horloge?.desinstaller();
    let fichier = null;
    try {
      if (filmait && encodeur && n > 0) {
        await encodeur.flush();
        muxer.finalize();
        fichier = new File([cible.buffer], outils.nomFichier, { type: 'video/mp4' });
      }
    } catch (e) {
      console.warn('Enregistrement', e);
    }
    try { encodeur?.close(); } catch { /* déjà fermé */ }
    etape = 'fini';
    outils.arreterPlongeon(); // (sans effet s'il est déjà arrêté : c'est peut-être lui qui nous arrête)
    document.body.classList.remove('enregistre', 'film-vertical', 'film-horizontal');
    map.setPixelRatio(avant.pr);
    outils.pleineQualite?.(false);
    map.resize();
    if (avant.langue !== 'en') outils.changerLangue(avant.langue);
    if (!fichier) {
      ecran.remove();
      if (filmait) afficherMessage(t('enregistrementErreur'));
      return;
    }
    montrerFilm(fichier);
  }

  /** La vidéo finie : on la regarde, puis « Enregistrer la vidéo » (photos du téléphone, ou téléchargement). */
  function montrerFilm(fichier) {
    const adresse = URL.createObjectURL(fichier);
    ecran.classList.add('fini');
    ecran.querySelector('.enregistrement-tete').innerHTML = `<span class="enregistrement-etat">${echapper(t('enregistrementPret', duree(n), `${LARGEUR} × ${HAUTEUR}`))}</span>`;
    ecran.querySelector('.enregistrement-image').innerHTML = `<video src="${adresse}" autoplay muted loop playsinline controls></video>`;
    ecran.querySelector('.enregistrement-note').textContent = '';
    ecran.querySelector('.enregistrement-boutons').innerHTML = `<button type="button" class="btn-lancer" data-sauver>${echapper(t('enregistrementSauver'))}</button>
      <button type="button" class="btn-secondaire" data-fermer>${echapper(t('fermer'))}</button>`;
    ecran.querySelector('[data-sauver]').addEventListener('click', async () => {
      if (!(await partagerFichier(fichier))) telecharger(fichier);
    });
    ecran.querySelector('[data-fermer]').addEventListener('click', () => {
      URL.revokeObjectURL(adresse);
      ecran.remove();
    });
  }

  // ---- Une image du film
  /** La carte se redessine (au temps du film) ; fn est appelée pendant ce dessin (l'image WebGL est encore là). */
  function rendu(fn) {
    return new Promise((ok) => {
      map.once('render', () => {
        try { fn?.(); } catch (e) { console.warn(e); }
        ok();
      });
      map.triggerRepaint();
    });
  }

  function composer() {
    const boite = conteneur.getBoundingClientRect();
    c.globalAlpha = 1;
    c.drawImage(map.getCanvas(), 0, 0, LARGEUR, HAUTEUR);
    // les noms des régions et des préfectures sont sous le papier (imprimés sur la feuille), ceux des mers dessus
    for (const el of conteneur.querySelectorAll('.nom-region, .nom-prefecture')) dessinerNom(el, boite, HALO_TERRE);
    const papier = conteneur.querySelector('#papier');
    if (images.papier && papier) {
      c.globalAlpha = opacite(papier);
      c.drawImage(images.papier, 0, 0);
      c.globalAlpha = 1;
    }
    for (const el of conteneur.querySelectorAll('.nom-mer')) dessinerNom(el, boite, HALO_MER);
    for (const el of conteneur.querySelectorAll('.repere')) dessinerEpingle(el, boite);
    dessinerTitre();
    if (document.body.classList.contains('mode-film')) dessinerFiligrane();
    dessinerSources();
  }

  /** Un nom écrit sur la carte (couché avec elle : aplati par l'inclinaison), avec son halo. */
  function dessinerNom(el, boite, halo) {
    const a = opacite(el);
    if (a < 0.02) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const s = getComputedStyle(el);
    const texte = s.textTransform === 'uppercase' ? el.textContent.toUpperCase() : el.textContent;
    const espace = parseFloat(s.letterSpacing) || 0;
    c.save();
    c.globalAlpha = a;
    c.translate((r.left - boite.left + r.width / 2) * k, (r.top - boite.top + r.height / 2) * k);
    c.scale(k, k * Math.cos((map.getPitch() * Math.PI) / 180));
    c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    c.textBaseline = 'middle';
    const largeurs = [...texte].map((x) => c.measureText(x).width);
    const total = largeurs.reduce((x, y) => x + y, 0) + espace * (largeurs.length - 1);
    const ecrire = () => {
      let x = -total / 2;
      [...texte].forEach((lettre, i) => { c.fillText(lettre, x, 0); x += largeurs[i] + espace; });
    };
    c.fillStyle = halo;
    c.shadowColor = halo;
    for (const flou of [8, 3]) { c.shadowBlur = flou * k; ecrire(); }
    c.shadowColor = 'transparent';
    c.fillStyle = s.color;
    ecrire();
    c.restore();
  }

  /** L'épingle d'un lieu : le blason de sa catégorie (ou un point, vu de loin) et sa pointe. */
  function dessinerEpingle(el, boite) {
    const a = opacite(el);
    const tete = el.querySelector('.repere-tete');
    if (a < 0.02 || !tete) return;
    const r = tete.getBoundingClientRect();
    if (!r.width) return;
    const s = getComputedStyle(tete);
    const loin = conteneur.classList.contains('loin');
    const nuit = document.body.classList.contains('nuit');
    const cx = (r.left - boite.left + r.width / 2) * k, cy = (r.top - boite.top + r.height / 2) * k, rayon = (r.width / 2) * k;
    const bord = (parseFloat(s.borderTopWidth) || 0) * k;
    const disque = (rr, couleur) => { c.beginPath(); c.arc(cx, cy, rr, 0, 2 * Math.PI); c.fillStyle = couleur; c.fill(); };
    c.save();
    c.globalAlpha = a;
    c.shadowColor = nuit ? 'rgba(255, 176, 80, 0.6)' : 'rgba(40, 26, 12, 0.4)';
    c.shadowBlur = (nuit ? 12 : loin ? 3 : 7) * k;
    c.shadowOffsetY = nuit ? 0 : (loin ? 1 : 3) * k;
    disque(rayon + k, 'rgba(53, 37, 26, 0.78)');
    c.shadowColor = 'transparent';
    disque(rayon, s.borderTopColor);
    disque(rayon - bord, s.backgroundColor);
    if (!loin) {
      c.beginPath();
      c.moveTo(cx - 5 * k, cy + rayon + k);
      c.lineTo(cx + 5 * k, cy + rayon + k);
      c.lineTo(cx, cy + rayon + 8 * k);
      c.fillStyle = '#35251a';
      c.fill();
      const svg = tete.querySelector(':scope > svg');
      const icone = svg && iconeEnImage(svg, s.color);
      if (icone?.complete && icone.naturalWidth) c.drawImage(icone, cx - rayon * 0.58, cy - rayon * 0.58, rayon * 1.16, rayon * 1.16);
    }
    c.restore();
  }

  /** L'icône d'une épingle, en image (préparée une fois par icône et par couleur). */
  function iconeEnImage(svg, couleur) {
    const code = svg.outerHTML.replace(/currentColor/g, couleur);
    if (!images.icones.has(code)) {
      const im = new Image();
      // une taille fixe (assez grande pour rester nette) et l'espace de noms du SVG, qu'une image exige
      const tete = code.match(/^<svg[^>]*>/)[0];
      const nouvelleTete = tete.replace(/\s(width|height|xmlns)="[^"]*"/g, '').replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"');
      im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(code.replace(tete, nouvelleTete))}`;
      images.icones.set(code, im);
    }
    return images.icones.get(code);
  }

  /** Le bandeau du nom (le même dessin que l'affiche), qui apparaît comme à l'écran. */
  function dessinerTitre() {
    const el = document.querySelector('.visite-titre');
    if (!el) return;
    const s = getComputedStyle(el);
    const a = Number(s.opacity);
    const im = images.titres.get(el.querySelector('b')?.textContent || '');
    if (a < 0.02 || !im) return;
    const glisse = new DOMMatrixReadOnly(s.transform === 'none' ? undefined : s.transform).m42; // l'entrée : 12 px → 0
    const e = f.vertical ? 1 : TAILLE_TITRE_HORIZONTAL;
    const largeur = (im.width / ECHELLE_AFFICHE) * e, hauteur = (im.height / ECHELLE_AFFICHE) * e; // px CSS, avec l'ombre
    const boiteL = largeur - 2 * MARGE_AFFICHE.cote * e, boiteH = hauteur - (MARGE_AFFICHE.haut + MARGE_AFFICHE.bas) * e;
    const x = (L - boiteL) / 2 - MARGE_AFFICHE.cote * e;
    const bas = f.vertical ? H * (1 - BAS_TITRE_VERTICAL) : H - BAS_TITRE_HORIZONTAL;
    const y = bas - boiteH - MARGE_AFFICHE.haut * e + glisse;
    c.globalAlpha = a;
    c.drawImage(im, x * k, y * k, largeur * k, hauteur * k);
    c.globalAlpha = 1;
  }

  /** L'adresse de la carte, en haut au centre (comme en mode film sur téléphone). */
  function dessinerFiligrane() {
    const texte = outils.adresse;
    c.save();
    c.scale(k, k);
    c.font = 'italic 15px "IM Fell English", Georgia, serif';
    const largeurTexte = c.measureText(texte).width + texte.length * 0.3;
    const l = 3 + 24 + 8 + largeurTexte + 12, h = 32;
    const x = (L - l) / 2, y = 12 + 64;
    c.shadowColor = 'rgba(52, 36, 18, 0.28)';
    c.shadowBlur = 14 * k;
    c.shadowOffsetY = 4;
    c.fillStyle = '#f6eedb';
    c.fillRect(x, y, l, h);
    c.shadowColor = 'transparent';
    c.strokeStyle = '#8a6b45';
    c.lineWidth = 1;
    c.strokeRect(x + 0.5, y + 0.5, l - 1, h - 1);
    if (images.logo) {
      c.save();
      c.beginPath();
      c.arc(x + 4 + 12, y + h / 2, 12, 0, 2 * Math.PI);
      c.clip();
      c.drawImage(images.logo, x + 4, y + h / 2 - 12, 24, 24);
      c.restore();
      c.beginPath();
      c.arc(x + 4 + 12, y + h / 2, 12, 0, 2 * Math.PI);
      c.strokeStyle = '#35251a';
      c.stroke();
    }
    c.fillStyle = '#35251a';
    c.textBaseline = 'middle';
    c.fillText(texte, x + 4 + 24 + 8, y + h / 2 + 1);
    c.restore();
  }

  /** Les sources de la carte, en tout petit dans le coin (les licences d'OpenStreetMap et de Mapterhorn le demandent). */
  function dessinerSources() {
    c.save();
    c.scale(k, k);
    c.font = '9px "Noto Sans", system-ui, sans-serif';
    const l = c.measureText(SOURCES).width + 8;
    c.fillStyle = 'rgba(246, 238, 219, 0.72)';
    c.fillRect(L - l - 4, H - 4 - 14, l, 14);
    c.fillStyle = '#5b432d';
    c.textBaseline = 'middle';
    c.fillText(SOURCES, L - l, H - 4 - 7);
    c.restore();
  }

  /** L'opacité d'un élément de la carte, avec celle de ses parents (0 s'il est caché). */
  function opacite(el) {
    let a = 1;
    for (let x = el; x && x !== conteneur; x = x.parentElement) {
      const s = getComputedStyle(x);
      if (s.display === 'none' || s.visibility === 'hidden') return 0;
      a *= Number(s.opacity);
    }
    return a;
  }

  /** Ce qui ne change pas d'une image à l'autre : le papier, le logo, les bandeaux de nom, les icônes. */
  async function preparerImages() {
    const polices = ['26px "Zen Antique"', 'italic 22px "IM Fell English"', '9px "Noto Sans"'];
    await Promise.all(polices.map((p) => document.fonts.load(p).catch(() => {})));
    images.papier = await papierVieilli().catch(() => null);
    images.logo = await chargerImage('img/logo.jpg').catch(() => null);
    for (const titre of outils.titres) {
      if (!titre?.nom) continue;
      try {
        const bloc = await imageAffiche(titre);
        images.titres.set(titre.nom, await chargerImage(URL.createObjectURL(bloc)));
      } catch { /* pas de bandeau */ }
    }
    for (const svg of conteneur.querySelectorAll('.repere-tete > svg')) {
      const im = iconeEnImage(svg, getComputedStyle(svg.parentElement).color);
      await im.decode().catch(() => {});
    }
  }

  /** Le papier vieilli (#papier de style.css : grain, grandes taches, bords brunis), une fois, à la taille du film. */
  async function papierVieilli() {
    const css = getComputedStyle(document.documentElement);
    const adresse = (nom) => css.getPropertyValue(nom).match(/url\(["']?(.*?)["']?\)\s*$/)?.[1];
    const [grain, taches] = await Promise.all([chargerImage(adresse('--grain')), chargerImage(adresse('--taches'))]);
    const p = document.createElement('canvas');
    p.width = LARGEUR;
    p.height = HAUTEUR;
    const g = p.getContext('2d');
    const tuile = document.createElement('canvas');
    tuile.width = tuile.height = Math.round(240 * k);
    tuile.getContext('2d').drawImage(grain, 0, 0, tuile.width, tuile.height);
    g.fillStyle = g.createPattern(tuile, 'repeat');
    g.fillRect(0, 0, LARGEUR, HAUTEUR);
    const cote = Math.max(LARGEUR, HAUTEUR); // « center / cover »
    g.drawImage(taches, (LARGEUR - cote) / 2, (HAUTEUR - cote) / 2, cote, cote);
    // radial-gradient(ellipse 82% 78% at 50% 50%, transparent 56%, rgba(92, 60, 28, .34) 100%)
    const rx = LARGEUR * 0.82, ry = HAUTEUR * 0.78;
    g.save();
    g.translate(LARGEUR / 2, HAUTEUR / 2);
    g.scale(1, ry / rx);
    const degrade = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    degrade.addColorStop(0.56, 'rgba(92, 60, 28, 0)');
    degrade.addColorStop(1, 'rgba(92, 60, 28, 0.34)');
    g.fillStyle = degrade;
    g.fillRect(-rx, -rx, 2 * rx, 2 * rx);
    g.restore();
    return p;
  }

  return { demarrer, arrive, terminer };
}

/** « 0:07 » */
const duree = (n) => {
  const s = Math.floor(n / IMAGES);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Le temps de la page arrêté, qui n'avance que quand on le dit (avancer(ms)) : performance.now, Date.now,
 * requestAnimationFrame (l'heure donnée aux images), les minuteries (sauf celles de 0 ms, qui servent à
 * passer la main et restent réelles) et les animations CSS. desinstaller() rend le vrai temps ; les
 * minuteries pas encore parties repartent en vrai, avec ce qu'il leur restait.
 */
function horlogeVirtuelle() {
  const vrai = {
    now: performance.now.bind(performance), date: Date.now, raf: window.requestAnimationFrame.bind(window),
    setTimeout: window.setTimeout, setInterval: window.setInterval, clearTimeout: window.clearTimeout, clearInterval: window.clearInterval,
  };
  const st = vrai.setTimeout.bind(window), si = vrai.setInterval.bind(window), ct = vrai.clearTimeout.bind(window), ci = vrai.clearInterval.bind(window);
  let v = vrai.now();
  const ecartDate = vrai.date() - v;
  const minuteries = new Map(); // numéro → { du, fn, args, periode }
  const devenues = new Map(); // numéro virtuel → numéro réel (après desinstaller)
  let numero = 2 ** 30;
  const departs = new WeakMap(); // animation → l'instant (virtuel) de son début

  performance.now = () => v;
  Date.now = () => Math.round(v + ecartDate);
  window.requestAnimationFrame = (fn) => vrai.raf(() => fn(v));
  window.setTimeout = (fn, d = 0, ...args) => {
    if (!(d > 0)) return st(fn, 0, ...args);
    minuteries.set(++numero, { du: v + d, fn, args });
    return numero;
  };
  window.setInterval = (fn, d = 0, ...args) => {
    minuteries.set(++numero, { du: v + Math.max(1, d), fn, args, periode: Math.max(1, d) });
    return numero;
  };
  const effacer = (id) => {
    if (minuteries.delete(id)) return;
    const r = devenues.get(id) ?? id;
    ct(r);
    ci(r);
  };
  window.clearTimeout = effacer;
  window.clearInterval = effacer;

  function calerAnimations() {
    for (const a of document.getAnimations()) {
      if (!departs.has(a)) {
        departs.set(a, v - (Number(a.currentTime) || 0));
        a.pause();
      }
      a.currentTime = v - departs.get(a);
    }
  }
  calerAnimations();

  return {
    reel: vrai.now,
    pause: (ms) => new Promise((ok) => st(ok, ms)),
    /** Le temps avance de ms : les minuteries arrivées à échéance partent, dans l'ordre. */
    avancer(ms) {
      const fin = v + ms;
      for (;;) {
        let prochain = null;
        for (const [id, m] of minuteries) if (m.du <= fin && (!prochain || m.du < prochain[1].du)) prochain = [id, m];
        if (!prochain) break;
        const [id, m] = prochain;
        v = Math.max(v, m.du);
        if (m.periode) m.du += m.periode;
        else minuteries.delete(id);
        try { m.fn(...m.args); } catch (e) { console.warn(e); }
      }
      v = fin;
      calerAnimations();
    },
    desinstaller() {
      performance.now = vrai.now;
      Date.now = vrai.date;
      window.requestAnimationFrame = vrai.raf;
      window.setTimeout = vrai.setTimeout;
      window.setInterval = vrai.setInterval;
      for (const [id, m] of minuteries) {
        const reste = Math.max(0, m.du - v);
        devenues.set(id, m.periode
          ? st(() => { m.fn(...m.args); devenues.set(id, si(m.fn, m.periode, ...m.args)); }, reste)
          : st(m.fn, reste, ...m.args));
      }
      minuteries.clear();
      // (clearTimeout et clearInterval gardent la traduction des anciens numéros)
      for (const a of document.getAnimations()) if (departs.has(a)) a.play();
    },
  };
}
