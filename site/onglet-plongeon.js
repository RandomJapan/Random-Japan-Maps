// ================================================================
//  Les outils du propriétaire pour ses vidéos (mode développeur seulement ; app.js charge ce
//  fichier quand le mode développeur est ouvert) : les onglets « Plongeon » et « Point à point »
//  du panneau de la visite, et l'affiche du nom du lieu.
//  - Le début des vidéos se filme avant que le lieu soit dans le tableau : on plonge sur une
//    position collée (coordonnées GPS ou lien Google Maps), avec un lieu provisoire (épingle et
//    modèle 3D de son type), retiré quand le plongeon s'arrête. Pendant le plongeon, les autres
//    lieux se cachent. « Point à point » : le même volet, avec un départ en plus (lui aussi un lieu
//    provisoire) ; la caméra part de ce lieu, vu de près, et vole jusqu'à l'autre. Les deux règlent
//    la distance de la caméra et l'orbite à l'arrivée. Le vol lui-même est dans visite.js.
//  - L'affiche : le carton du nom (comme à l'arrivée du plongeon), en PNG transparent (affiche.js).
//  - « Enregistrer le plongeon en vidéo » : le plongeon devient un MP4 1080 × 1920, sans les boutons
//    (enregistrement.js, chargé seulement à ce moment-là).
// ================================================================
import { PREFECTURES } from './regions.js';
import { partagerFichier, telecharger } from './commun.js';

const $ = (id) => document.getElementById(id);

/**
 * app : { t, enLangue, reperes, modeles3d, visite, creerEpingle(lieu, rang), preparerPrefectures(), lireGPS(texte),
 *       slug(texte), afficherMessage(texte), appliquerFiltres(), lieux(), categories(), toutesCategories() (avec
 *       les catégories encore vides), trouverPrefecture() → (lng, lat) → numéro de préfecture, ou null,
 *       map, adresse, langue(), changerLangue(l) (pour l'enregistrement en vidéo, en anglais) }
 * Renvoie { choisirOnglet('visite' | 'plongeon' | 'point'), majLangue() }.
 */
export function brancherOngletPlongeon(app) {
  const { t, enLangue, reperes, modeles3d, visite, creerEpingle, preparerPrefectures, lireGPS, slug, afficherMessage, appliquerFiltres } = app;

  const MEMO_PLONGEON = 'plongeon'; // les derniers champs remplis (localStorage), pour refaire une prise plus tard
  const CHAMPS_PLONGEON = [['plongeon-position', 'position'], ['plongeon-nom', 'nom'], ['plongeon-nom-ja', 'nomJa'],
    ['plongeon-type', 'type'], ['plongeon-depart', 'depart'], ['plongeon-depart-nom', 'departNom'],
    ['plongeon-depart-nom-ja', 'departNomJa'], ['plongeon-depart-type', 'departType'],
    ['plongeon-distance', 'distance'], ['plongeon-orbite', 'orbite']];
  let ongletVisite = 'visite'; // 'visite', 'plongeon' ou 'point'
  let champsRemplis = false;
  let minuteriePosition = 0;

  function choisirOnglet(nom) {
    ongletVisite = nom;
    const vol = nom !== 'visite';
    for (const [id, n] of [['onglet-visite', 'visite'], ['onglet-plongeon', 'plongeon'], ['onglet-point', 'point']]) {
      $(id).setAttribute('aria-selected', String(n === nom));
    }
    $('volet-visite').hidden = vol;
    $('volet-plongeon').hidden = !vol;
    $('volet-plongeon').classList.toggle('point-a-point', nom === 'point');
    $('volet-plongeon').setAttribute('aria-labelledby', nom === 'point' ? 'onglet-point' : 'onglet-plongeon');
    majTextesPlongeon();
    if (!vol) return;
    let memo = {};
    try { memo = JSON.parse(localStorage.getItem(MEMO_PLONGEON)) || {}; } catch { /* pas grave */ }
    // les types (dans la langue de la carte), en gardant celui choisi
    for (const [id, cle] of [['plongeon-type', 'type'], ['plongeon-depart-type', 'departType']]) {
      const sel = $(id);
      const choisi = sel.value || memo[cle];
      sel.replaceChildren(...app.toutesCategories().map((c) => new Option(enLangue(c.nom), c.cle)));
      if (app.toutesCategories().some((c) => c.cle === choisi)) sel.value = choisi;
    }
    // les champs de la dernière prise, une fois (ensuite, ce qu'on a tapé reste)
    if (!champsRemplis) {
      champsRemplis = true;
      for (const [id, cle] of CHAMPS_PLONGEON) {
        if (memo[cle] == null || memo[cle] === '') continue;
        if ($(id).tagName === 'SELECT' && ![...$(id).options].some((o) => o.value === memo[cle])) continue;
        $(id).value = memo[cle];
      }
      $('plongeon-enregistrer').checked = !!memo.enregistrer;
    }
    $('plongeon-depart-erreur').hidden = true;
    preparerAfficheBientot();
    preparerPlongeonBientot(0);
  }

  /** Les textes qui changent entre « Plongeon » et « Point à point ». */
  function majTextesPlongeon() {
    const point = ongletVisite === 'point';
    $('plongeon-info').textContent = t(point ? 'pointInfo' : 'plongeonInfo');
    $('txt-plongeon-lancer').textContent = t(point ? 'pointLancer' : 'plongeonLancer');
  }

  /**
   * Les réglages du vol : { depart (point à point), zoom (à l'arrivée), orbite (° par seconde) } ;
   * depart vaut { erreur } si la position de départ ne se lit pas.
   */
  function reglagesPlongeon() {
    const point = ongletVisite === 'point';
    const depart = point ? lirePosition($('plongeon-depart').value) : null;
    if (depart?.erreur === 'plongeonErreurVide') depart.erreur = 'pointErreurDepart';
    return { depart, zoom: Number($('plongeon-distance').value) || 13, orbite: Number($('plongeon-orbite').value) };
  }

  /** Le relief du trajet se télécharge dès que les positions sont collées : il sera prêt pour « Plonger ». */
  function preparerPlongeonBientot(delai = 600) {
    clearTimeout(minuteriePosition);
    minuteriePosition = setTimeout(() => {
      const p = lirePosition($('plongeon-position').value);
      const reglages = reglagesPlongeon();
      if (p.erreur || reglages.depart?.erreur) return;
      visite.preparerPlongeon(p, reglages);
      modeles3d.preparer();
    }, delai);
  }

  /**
   * Une position collée : « 34.1302, 133.5345 » (comme dans le tableau), ou un lien Google Maps
   * (…!3d34.13!4d133.53… : le lieu lui-même ; …/@34.13,133.53,… : le centre de la vue). Les liens courts
   * (maps.app.goo.gl) ne se lisent pas depuis la page : il faut les coordonnées.
   */
  function lirePosition(texte) {
    const s = String(texte || '').trim();
    if (!s) return { erreur: 'plongeonErreurVide' };
    if (/goo\.gl|g\.co\//i.test(s)) return { erreur: 'plongeonErreurLienCourt' };
    const m = s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) || s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
      || s.match(/[?&](?:q|query|ll|destination|center)=(-?\d+(?:\.\d+)?)(?:,|%2C)\+?(-?\d+(?:\.\d+)?)/i);
    const p = m ? { lat: Number(m[1]), lng: Number(m[2]) } : /^https?:/i.test(s) ? null : lireGPS(s);
    if (!p) return { erreur: 'plongeonErreurPosition' };
    if (p.lng < 122 || p.lng > 154 || p.lat < 20 || p.lat > 46) return { erreur: 'plongeonErreurJapon' };
    return p;
  }

  /** Garde les champs remplis (pour refaire une prise ou une affiche plus tard). */
  function memoriserPlongeon() {
    try {
      localStorage.setItem(MEMO_PLONGEON, JSON.stringify({
        ...Object.fromEntries(CHAMPS_PLONGEON.map(([id, cle]) => [cle, $(id).value.trim()])),
        enregistrer: $('plongeon-enregistrer').checked,
      }));
    } catch { /* pas grave */ }
  }

  async function lancerPlongeon() {
    const p = lirePosition($('plongeon-position').value);
    const reglages = reglagesPlongeon();
    const erreur = $('plongeon-erreur');
    const erreurDepart = $('plongeon-depart-erreur');
    erreur.hidden = !p.erreur;
    erreurDepart.hidden = !reglages.depart?.erreur;
    if (p.erreur) erreur.textContent = t(p.erreur);
    if (reglages.depart?.erreur) erreurDepart.textContent = t(reglages.depart.erreur);
    if (p.erreur || reglages.depart?.erreur) return;
    memoriserPlongeon();
    await preparerPrefectures().catch(() => {}); // pour écrire la préfecture sous le nom
    const film = $('plongeon-enregistrer').checked ? await preparerFilm(reglages) : null; // (avant les lieux : en anglais)
    const l = lieuProvisoire('plongeon', p, $('plongeon-type').value, $('plongeon-nom').value, $('plongeon-nom-ja').value);
    // point à point : le départ a lui aussi son épingle, son modèle 3D et son nom
    const d = reglages.depart && lieuProvisoire('plongeon-depart', reglages.depart, $('plongeon-depart-type').value,
      $('plongeon-depart-nom').value, $('plongeon-depart-nom-ja').value);
    const provisoires = [l, d].filter(Boolean);
    modeles3d.provisoires(provisoires);
    modeles3d.preparer();
    visite.plonger(l, {
      ...reglages,
      depart: d || null,
      quandPret: film?.demarrer,
      quandArrive: film?.arrive,
      fin: () => {
        for (const x of provisoires) reperes.oublier(x.epingle);
        modeles3d.provisoires([]);
        modeles3d.filtrer(null);
        appliquerFiltres();
        film?.terminer(); // (Échap pendant le film : il s'arrête et se termine)
      },
    });
    // Seuls ces lieux : les autres épingles et leurs modèles 3D se cachent (les légendes aussi : style.css)
    for (const x of app.lieux()) reperes.montrer(x.epingle, false);
    modeles3d.filtrer((x) => provisoires.includes(x));
  }

  /**
   * Le plongeon filmé (enregistrement.js) : la carte passe dans un cadre 9:16, en anglais ; le film commence à
   * l'image fixe du départ. Renvoie { demarrer, arrive, terminer }, ou null si ce navigateur ne sait pas faire de MP4.
   */
  async function preparerFilm(reglages) {
    try {
      const module = await import('./enregistrement.js');
      const codec = await module.codecMp4();
      if (!codec) {
        afficherMessage(t('enregistrementImpossible'));
        return null;
      }
      const point = !!reglages.depart;
      return module.enregistrer(app.map, {
        codec, t, afficherMessage, adresse: app.adresse, langue: app.langue, changerLangue: app.changerLangue,
        nomFichier: `plongeon-${slug($('plongeon-nom').value) || 'japon'}.mp4`,
        titres: [texteAffiche(), point ? texteAffiche('plongeon-depart') : null],
        arreterPlongeon: () => visite.arreter(),
      });
    } catch (e) {
      console.warn('Enregistrement', e);
      afficherMessage(t('enregistrementErreur'));
      return null;
    }
  }

  /** Un lieu qui n'est pas dans le tableau, pour le plongeon : son épingle et son modèle 3D, du type choisi. */
  function lieuProvisoire(id, p, cleType, nom, nomJa) {
    const type = app.toutesCategories().find((c) => c.cle === cleType) || app.categories()[0];
    nom = nom.trim();
    nomJa = nomJa.trim();
    const l = {
      id, lng: p.lng, lat: p.lat, nouveau: false, provisoire: true,
      cat: { ...type, visible: true }, // une copie : une catégorie vide ou masquée a quand même son modèle
      nom: { en: nom, fr: nom, ja: nomJa || nom }, description: {},
    };
    l.prefecture = app.trouverPrefecture()?.(p.lng, p.lat);
    creerEpingle(l, app.lieux().length);
    l.el.querySelector('.repere-nom').textContent = enLangue(l.nom);
    reperes.montrer(l.epingle, true);
    return l;
  }

  // ---- L'affiche du lieu
  // Toujours en anglais, la langue des vidéos. Préparée d'avance pendant qu'on remplit les champs : sur téléphone,
  // le partage (« Enregistrer l'image » vers les photos) doit suivre l'appui de près.
  let affichePrete = null; // { cle, fichier }
  let minuterieAffiche = 0;

  /** Le texte de l'affiche : celle du lieu (prefixe « plongeon »), ou celle du départ en point à point (« plongeon-depart »). */
  function texteAffiche(prefixe = 'plongeon') {
    const nom = $(`${prefixe}-nom`).value.trim();
    if (!nom) return null;
    const type = app.toutesCategories().find((c) => c.cle === $(`${prefixe}-type`).value) || app.categories()[0];
    const p = lirePosition($(prefixe === 'plongeon' ? 'plongeon-position' : 'plongeon-depart').value);
    const pref = p.erreur ? null : app.trouverPrefecture()?.(p.lng, p.lat);
    const infos = [type && (type.nom.en || enLangue(type.nom)), pref && PREFECTURES[pref]?.en].filter(Boolean).join(' · ');
    return { nom, nomJa: $(`${prefixe}-nom-ja`).value.trim(), infos };
  }

  async function fabriquerAffiche() {
    await preparerPrefectures().catch(() => {}); // pour la préfecture sous le nom
    const texte = texteAffiche();
    if (!texte) return null;
    const cle = JSON.stringify(texte);
    if (affichePrete?.cle === cle) return affichePrete.fichier;
    const { imageAffiche } = await import('./affiche.js');
    const fichier = new File([await imageAffiche(texte)], `${slug(texte.nom) || 'affiche'}.png`, { type: 'image/png' });
    affichePrete = { cle, fichier };
    return fichier;
  }

  function preparerAfficheBientot() {
    clearTimeout(minuterieAffiche);
    minuterieAffiche = setTimeout(() => fabriquerAffiche().catch(() => {}), 500);
  }

  async function partagerAffiche() {
    const erreur = $('plongeon-erreur');
    if (!$('plongeon-nom').value.trim()) {
      erreur.textContent = t('plongeonErreurNom');
      erreur.hidden = false;
      $('plongeon-nom').focus();
      return;
    }
    erreur.hidden = true;
    memoriserPlongeon();
    const bouton = $('btn-affiche');
    bouton.disabled = true;
    try {
      const fichier = await fabriquerAffiche();
      // Sur téléphone : le menu de partage (« Enregistrer l'image » la range avec les photos, pour CapCut…)
      if (await partagerFichier(fichier)) return;
      telecharger(fichier);
      afficherMessage(t('plongeonAfficheEnregistree'));
    } catch (e) {
      console.warn('Affiche', e);
      afficherMessage(t('bravoImageErreur'));
    } finally {
      bouton.disabled = false;
    }
  }

  $('onglet-visite').addEventListener('click', () => choisirOnglet('visite'));
  $('onglet-plongeon').addEventListener('click', () => choisirOnglet('plongeon'));
  $('onglet-point').addEventListener('click', () => choisirOnglet('point'));
  $('btn-plongeon').addEventListener('click', lancerPlongeon);
  $('btn-affiche').addEventListener('click', partagerAffiche);
  for (const id of ['plongeon-position', 'plongeon-nom', 'plongeon-nom-ja', 'plongeon-type']) {
    $(id).addEventListener(id === 'plongeon-type' ? 'change' : 'input', preparerAfficheBientot);
  }
  $('plongeon-position').addEventListener('input', () => {
    $('plongeon-erreur').hidden = true;
    preparerPlongeonBientot();
  });
  $('plongeon-depart').addEventListener('input', () => {
    $('plongeon-depart-erreur').hidden = true;
    preparerPlongeonBientot();
  });
  $('plongeon-distance').addEventListener('change', () => preparerPlongeonBientot(0));
  $('plongeon-enregistrer').addEventListener('change', memoriserPlongeon);
  majTextesPlongeon();

  return {
    choisirOnglet,
    /** Les textes qui changent d'un onglet à l'autre, et les types dans la nouvelle langue. */
    majLangue() {
      majTextesPlongeon();
      if (!$('volet-plongeon').hidden) choisirOnglet(ongletVisite);
    },
  };
}
