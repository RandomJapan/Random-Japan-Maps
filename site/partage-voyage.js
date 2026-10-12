// ================================================================
//  Partager son voyage (2026-10-12) : depuis l'itinéraire des favoris,
//  un lien (…/?voyage=lieu1.lieu2…&mode=bike) qui montre le même voyage à
//  qui l'ouvre, et une image verticale à poster, au choix du visiteur :
//  « carte » (la vraie carte en 3D avec la route) ou « carnet » (une petite
//  carte dessinée et chaque étape avec sa photo). Voir voyage-image.js.
//  Chargé au premier appui sur « Partager ».
//  Les images sont préparées dès l'ouverture de la fenêtre : sur téléphone,
//  le partage doit partir juste après l'appui.
// ================================================================

import { milieu } from './itineraire.js';
import { imageVoyage, miseEnPageCarte } from './voyage-image.js';

const FORMATS = ['carte', 'carnet'];
const ICONES = {
  fermer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>',
  partager: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>',
  enregistrer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg>',
  lien: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M10 14a4 4 0 0 0 5.7 0l3.5-3.5a4 4 0 0 0-5.7-5.7L12 6.3M14 10a4 4 0 0 0-5.7 0l-3.5 3.5a4 4 0 0 0 5.7 5.7l1.5-1.5"/></svg>',
};
const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** L'adresse du lien d'un voyage : les identifiants des lieux dans l'ordre, et la façon de voyager si ce n'est pas la voiture. */
export function lienVoyage(liste, mode) {
  return `${location.origin}${location.pathname}?voyage=${liste.map((l) => l.id).join('.')}${mode && mode !== 'car' ? `&mode=${mode}` : ''}`;
}

/**
 * @param deps - { t, langue(), enLangue, adresse, infos(l), photo(l), texteDuree, texteDistance, icones (SVG du site),
 *   afficherMessage, arreterRotation, jour() (passe la carte au jour et renvoie de quoi revenir au moment présent) }
 */
export function brancherPartageVoyage(map, deps) {
  const { t, enLangue } = deps;
  const tactile = () => matchMedia('(pointer: coarse)').matches && !!navigator.share;
  let images = null; // { cle, carte: Promise<File>, carnet: Promise<File>, prets: { carte, carnet } }
  let choix = 'carte';
  let fenetre = null;

  /** Les textes et les données des deux images. */
  function donnees(liste, it) {
    const n = liste.length;
    const lang = deps.langue();
    return {
      titre: t('voyageImageTitre'),
      resume: `${t('lieux', n)} · ${deps.texteDistance(it.distance)} · ≈ ${deps.texteDuree(it.duree)} ${t(`total_${it.mode}`)}`,
      appel: t('voyageImageAppel'),
      adresse: deps.adresse,
      autres: (k) => t('voyageAutres', k),
      icone: deps.icones[it.mode],
      route: it.donnees,
      etapes: liste.map((l) => {
        const nom = enLangue(l.nom);
        const second = lang === 'ja' ? (l.nom.en || '') : (l.nom.ja || '');
        return { nom, second: second !== nom ? second : '', infos: deps.infos(l), photo: deps.photo(l), lng: l.lng, lat: l.lat };
      }),
      trajets: it.trajets.map((tr) => ({
        texte: tr.sansRoute ? t('sansRouteCourt') : `${deps.texteDuree(tr.duree)} · ${deps.texteDistance(tr.distance)}`,
        extra: tr.bateau > 60 ? t('dontBateau', deps.texteDuree(tr.bateau)) : '',
      })),
    };
  }

  /** Attend que les tuiles de la vue soient là (8 s au plus), puis le fondu des nouvelles tuiles. */
  async function tuilesChargees(max = 8000) {
    const fin = performance.now() + max;
    while (!map.areTilesLoaded() && performance.now() < fin) await new Promise((ok) => setTimeout(ok, 100));
    await new Promise((ok) => setTimeout(ok, 450));
  }

  /**
   * Une capture de la carte (sans les repères HTML) cadrée sur le voyage, au format de la carte de
   * l'image A. Le fond de la carte est lu dans l'événement « render », avant que le navigateur l'efface. La caméra
   * et la finesse de dessin reviennent ensuite comme avant.
   */
  async function capturer(liste, it, cadre) {
    const W = map.getContainer().clientWidth, H = map.getContainer().clientHeight;
    const rapport = cadre.l / cadre.h;
    let cw = W, ch = W / rapport;
    if (ch > H) { ch = H; cw = H * rapport; }
    const cx = (W - cw) / 2, cy = (H - ch) / 2;
    const avant = { center: map.getCenter(), zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing(), padding: map.getPadding() };
    const finesseAvant = map.getPixelRatio();
    const finesse = Math.min(2.5, Math.max(finesseAvant, cadre.h / ch));
    deps.arreterRotation();
    const revenir = deps.jour?.(); // l'image est toujours prise de jour (avec la saison), même la nuit au Japon
    try {
      if (finesse !== finesseAvant) map.setPixelRatio(finesse);
      const { bearing, pitch } = orientation(liste, it, rapport);
      map.jumpTo({ pitch, bearing, padding: { top: 0, bottom: 0, left: 0, right: 0 } });
      const vue = map.cameraForBounds(it.bornes, {
        padding: { top: cy + ch * 0.12, bottom: cy + ch * 0.07, left: cx + cw * 0.09, right: cx + cw * 0.09 }, bearing, maxZoom: 12.5,
      });
      if (vue) map.jumpTo(vue);
      await tuilesChargees();
      return await new Promise((ok, ko) => {
        map.once('render', () => {
          try {
            const toile = map.getCanvas();
            const k = toile.width / W;
            const image = document.createElement('canvas');
            image.width = Math.round(cw * k);
            image.height = Math.round(ch * k);
            image.getContext('2d').drawImage(toile, cx * k, cy * k, cw * k, ch * k, 0, 0, image.width, image.height);
            const ici = (p) => ({ x: (p.x - cx) / cw, y: (p.y - cy) / ch });
            ok({
              image,
              points: liste.map((l) => ici(map.project([l.lng, l.lat]))),
              etiquettes: it.trajets.filter((tr) => tr.ligne.length > 1).map((tr) => ({
                ...ici(map.project(milieu(tr.ligne))), duree: tr.duree,
                texte: tr.sansRoute ? t('sansRouteCourt') : deps.texteDuree(tr.duree),
              })),
            });
          } catch (e) { ko(e); }
        });
        map.triggerRepaint();
      });
    } finally {
      if (finesse !== finesseAvant) map.setPixelRatio(finesseAvant);
      map.jumpTo(avant);
      revenir?.();
    }
  }

  /**
   * L'orientation de la capture : la carte tourne (40° au plus, et seulement si ça aide vraiment) pour que la route
   * remplisse au mieux le cadre, comme la carte du site sur téléphone. Si elle reste plus large que le cadre, elle
   * est vue plus inclinée : le relief en perspective remplit la hauteur.
   */
  function orientation(liste, it, rapport) {
    const merc = ([lng, lat]) => [(lng * Math.PI) / 180, Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
    const points = [...liste.map((l) => [l.lng, l.lat]), ...it.donnees.features.flatMap((f) => f.geometry.coordinates.filter((_, i) => i % 8 === 0))].map(merc);
    let mieux = { note: Infinity, bearing: 0, forme: 1 };
    for (let b = -40; b <= 40; b += 5) {
      const r = (b * Math.PI) / 180, cos = Math.cos(r), sin = Math.sin(r);
      let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
      for (const [x, y] of points) {
        const px = x * cos - y * sin, py = x * sin + y * cos;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
      const forme = Math.max(1e-6, x1 - x0) / Math.max(1e-6, y1 - y0);
      const note = Math.abs(Math.log(forme / rapport)) + 0.02 * Math.abs(b); // le nord en haut, sauf si ça aide vraiment
      if (note < mieux.note) mieux = { note, bearing: b, forme };
    }
    return { bearing: mieux.bearing, pitch: mieux.forme > rapport * 1.4 ? 50 : 32 };
  }

  /** Prépare les deux images (la carte d'abord : c'est le choix par défaut). Une seule fois par voyage et par langue. */
  function preparer(liste, it) {
    const cle = `${liste.map((l) => l.id).join('.')}|${it.mode}|${deps.langue()}|${it.duree}`;
    if (images?.cle === cle) return images;
    const d = donnees(liste, it);
    const nom = (format) => `${t('voyageFichier')}-${format}.jpg`;
    const fichier = (format, blob) => new File([blob], nom(format), { type: 'image/jpeg' });
    const prets = {};
    const carte = capturer(liste, it, miseEnPageCarte(d.etapes).cadre)
      .catch((e) => { console.warn('Capture de la carte', e); return null; }) // sans capture : la carte dessinée
      .then((capture) => imageVoyage('carte', { ...d, capture }))
      .then((blob) => (prets.carte = fichier('carte', blob)));
    const carnet = carte.catch(() => {}).then(() => imageVoyage('carnet', d)).then((blob) => (prets.carnet = fichier('carnet', blob)));
    images = { cle, carte, carnet, prets };
    for (const f of FORMATS) images[f].catch((e) => { console.warn('Image du voyage', e); if (images?.cle === cle) images = null; });
    return images;
  }

  function telecharger(fichier) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(fichier);
    a.download = fichier.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  /** Ouvre la fenêtre « Partager mon voyage » pour cette liste (dans l'ordre du voyage) et son itinéraire calculé. */
  function ouvrir(liste, it) {
    fermer();
    const url = lienVoyage(liste, it.mode);
    const texte = t('voyagePartageTexte', liste.length);
    const prep = preparer(liste, it);
    const fond = document.createElement('div');
    fond.className = 'voyage-fond';
    fond.innerHTML = `<div class="voyage-fenetre panneau" role="dialog" aria-modal="true" aria-labelledby="voyage-titre" tabindex="-1">
      <button type="button" class="voyage-fermer" title="${echapper(t('fermer'))}" aria-label="${echapper(t('fermer'))}">${ICONES.fermer}</button>
      <h2 id="voyage-titre">${echapper(t('partagerVoyage'))}</h2>
      <p class="voyage-resume">${echapper(`${t('lieux', liste.length)} · ≈ ${deps.texteDuree(it.duree)} ${t(`total_${it.mode}`)}`)}</p>
      <p class="voyage-sous-titre">${echapper(t('voyageChoixImage'))}</p>
      <div class="voyage-choix" role="radiogroup" aria-label="${echapper(t('voyageChoixImage'))}">
        ${FORMATS.map((f) => `<button type="button" role="radio" data-format="${f}" aria-checked="${f === choix}">
          <span class="voyage-apercu"><span class="voyage-attente">${echapper(t('voyagePreparation'))}</span></span>
          <span class="voyage-nom-format">${echapper(t(`voyageFormat_${f}`))}</span></button>`).join('')}
      </div>
      <div class="voyage-actions">
        <button type="button" class="btn-lancer" data-action="image" disabled>${tactile() ? ICONES.partager : ICONES.enregistrer}<span>${echapper(t(tactile() ? 'voyagePartagerImage' : 'bravoEnregistrer'))}</span></button>
        <button type="button" class="btn-secondaire" data-action="lien">${ICONES.lien}<span>${echapper(t(tactile() ? 'voyageEnvoyerLien' : 'copierLien'))}</span></button>
      </div>
    </div>`;
    const boite = fond.firstElementChild;
    const boutonImage = boite.querySelector('[data-action=image]');
    const majBouton = () => { boutonImage.disabled = !prep.prets[choix]; };
    // les aperçus arrivent quand chaque image est prête
    for (const f of FORMATS) {
      prep[f].then((fichier) => {
        const apercu = boite.querySelector(`[data-format=${f}] .voyage-apercu`);
        const im = new Image();
        im.alt = '';
        im.src = URL.createObjectURL(fichier);
        apercu.replaceChildren(im);
        majBouton();
      }).catch(() => {
        boite.querySelector(`[data-format=${f}] .voyage-attente`).textContent = t('bravoImageErreur');
      });
    }
    boite.querySelector('.voyage-choix').addEventListener('click', (e) => {
      const b = e.target.closest('[data-format]');
      if (!b) return;
      choix = b.dataset.format;
      for (const x of boite.querySelectorAll('[data-format]')) x.setAttribute('aria-checked', String(x === b));
      majBouton();
    });
    boutonImage.addEventListener('click', async () => {
      const fichier = prep.prets[choix];
      if (!fichier) return;
      if (tactile() && navigator.canShare?.({ files: [fichier] })) {
        try {
          await navigator.share({ files: [fichier], text: `${texte} ${url}` });
          return;
        } catch (e) {
          if (e?.name === 'AbortError') return; // menu fermé sans choisir
        }
      }
      telecharger(fichier);
      deps.afficherMessage(t('bravoImageEnregistree'));
    });
    boite.querySelector('[data-action=lien]').addEventListener('click', async () => {
      if (tactile()) {
        try {
          await navigator.share({ title: t('voyageImageTitre').join(''), text: texte, url });
          return;
        } catch (e) {
          if (e?.name === 'AbortError') return;
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        deps.afficherMessage(t('lienCopie'));
      } catch { deps.afficherMessage(url); }
    });
    boite.querySelector('.voyage-fermer').addEventListener('click', fermer);
    fond.addEventListener('click', (e) => { if (e.target === fond) fermer(); });
    fond.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); fermer(); } });
    document.body.append(fond);
    fenetre = fond;
    boite.focus();
  }

  function fermer() {
    if (!fenetre) return;
    for (const im of fenetre.querySelectorAll('.voyage-apercu img')) URL.revokeObjectURL(im.src);
    fenetre.remove();
    fenetre = null;
  }

  return { ouvrir, fermer };
}
