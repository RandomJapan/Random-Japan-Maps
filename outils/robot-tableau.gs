/**
 * ================================================================
 *  ROBOT DE LA CARTE « Random Japan Place »  (Google Apps Script)
 *
 *  Colle le lien d'une vidéo TikTok dans une ligne vide de l'onglet « Lieux »
 *  (colonne « Nom (EN) » ou « Lien TikTok ») : le robot remplit tout le reste
 *  (noms, GPS, catégorie, descriptions en 3 langues), puis colore la ligne
 *  en jaune « À vérifier ». La colonne « Robot » montre ce qu'il fait,
 *  ses doutes et ses erreurs.
 *
 *  IA : Gemini de Google, version gratuite. Elle ne fait pas de recherche web,
 *  alors le robot cherche lui-même dans Wikipédia et Google Maps, puis donne
 *  ces informations à Gemini pour écrire la fiche.
 *  Clé IA : Paramètres du projet → Propriétés du script → CLE_GEMINI.
 *  Copie de référence de ce code : outils/robot-tableau.gs (dépôt GitHub).
 * ================================================================
 */

// --- Réglages ---------------------------------------------------------
const ID_TABLEAU = '1stIWJ2Vi8nV8wHAv4RDGdY3-xiTiNVLprGIPFA9g-mo'; // « Random Japan Place - Lieux de la carte »
// Modèles essayés dans l'ordre (si le quota gratuit du 1er est épuisé, on passe au suivant)
const MODELES_IDENTIFIER = ['gemini-3.5-flash-lite', 'gemini-3.8-flash']; // 1re question : quel lieu ?
const MODELES_REDIGER = ['gemini-3.8-flash', 'gemini-3.5-flash-lite']; // 2e question : écrire la fiche
const AGENT = 'RandomJapanPlaceRobot/1.0 (https://randomjapan.github.io/Random-Japan-Maps/)';
const LIGNES_PAR_PASSAGE = 3;
const ESSAIS_MAX = 2;
const COULEUR_A_VERIFIER = '#FFF2CC';
const ONGLET_LIEUX = 'Lieux';
const ONGLET_CATEGORIES = 'Catégories';
const ONGLET_A_TRIER = 'À trier';
const COLONNE_ROBOT = 'Robot';
const COLONNES_OBLIGATOIRES = ['Nom (EN)', 'Nom (FR)', 'Nom (日本語)', 'Catégorie', 'Coordonnées GPS', 'Lien TikTok',
  'Description (EN)', 'Description (FR)', 'Description (日本語)', 'Afficher ?', 'À vérifier'];

// --- Installation ----------------------------------------------------------
/** À lancer une fois : le robot passe toutes les 10 minutes, et tout de suite quand on colle un lien TikTok. */
function installerRobot() {
  for (const d of ScriptApp.getProjectTriggers()) ScriptApp.deleteTrigger(d);
  ScriptApp.newTrigger('robotCarte').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('quandModifie').forSpreadsheet(ID_TABLEAU).onEdit().create();
  colonnes_(feuilleLieux_());
  console.log('Robot installé ✅');
  verifierCle();
}

/** Vérifie la clé rangée dans Propriétés du script → CLE_GEMINI, et liste les modèles Gemini utilisables. */
function verifierCle() {
  const cle = (PropertiesService.getScriptProperties().getProperty('CLE_GEMINI') || '').trim();
  if (!cle) {
    console.log('Pas encore de clé IA : Paramètres du projet → Propriétés du script → CLE_GEMINI.');
    return false;
  }
  const r = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
    headers: { 'x-goog-api-key': cle }, muteHttpExceptions: true,
  });
  if (r.getResponseCode() !== 200) {
    console.log(`Clé IA refusée par Google (code ${r.getResponseCode()}) : ${r.getContentText().slice(0, 200)}`);
    return false;
  }
  const dispo = (JSON.parse(r.getContentText()).models || []).map((m) => m.name.replace('models/', ''));
  const voulus = [...new Set(MODELES_IDENTIFIER.concat(MODELES_REDIGER))];
  console.log('Clé IA vérifiée ✅ Modèles du robot : ' + voulus.map((m) => `${m} ${dispo.includes(m) ? '✅' : '❌ absent'}`).join(', '));
  return true;
}

/** Déclencheur « à la modification » : si on vient de coller un lien TikTok dans « Lieux », on lance le robot. */
function quandModifie(e) {
  if (!e || !e.range || e.range.getSheet().getName() !== ONGLET_LIEUX) return;
  const texte = e.range.getValues().flat().join(' ');
  if (/tiktok\.com/i.test(texte)) robotCarte();
}

// --- Le robot ---------------------------------------------------------------
function robotCarte() {
  const verrou = LockService.getScriptLock();
  if (!verrou.tryLock(2000)) return; // un autre passage est déjà en cours
  try {
    const debut = Date.now();
    const feuille = feuilleLieux_();
    const col = colonnes_(feuille);
    const donnees = feuille.getDataRange().getValues();
    const aFaire = [];
    for (let i = 1; i < donnees.length; i++) {
      const nom = String(donnees[i][col['Nom (EN)'] - 1]).trim();
      const lien = String(donnees[i][col['Lien TikTok'] - 1]).trim();
      const robot = String(donnees[i][col[COLONNE_ROBOT] - 1]).trim();
      const lienDansNom = /tiktok\.com/i.test(nom);
      if (!lienDansNom && !(nom === '' && /tiktok\.com/i.test(lien))) continue;
      if (robot.startsWith('❌')) continue; // erreur : on attend que tu effaces le message
      aFaire.push({ ligne: i + 1, lien: lienDansNom ? nom : lien, robot });
    }
    for (const tache of aFaire.slice(0, LIGNES_PAR_PASSAGE)) {
      if (Date.now() - debut > 3.5 * 60 * 1000) break; // Google coupe à 6 minutes
      const ligneSupprimee = traiterLigne_(feuille, col, tache, donnees);
      SpreadsheetApp.flush();
      if (ligneSupprimee) break; // les numéros de ligne ont bougé : la suite au prochain passage
    }
  } finally {
    verrou.releaseLock();
  }
}

/** Remplit une ligne. Renvoie true si la ligne a été supprimée (vidéo déplacée dans « À trier »). */
function traiterLigne_(feuille, col, tache, donnees) {
  const ecrire = (nomCol, valeur) => feuille.getRange(tache.ligne, col[nomCol]).setValue(valeur);
  const essai = (Number((tache.robot.match(/essai (\d+)/) || [])[1]) || 0) + 1;
  if (essai > ESSAIS_MAX) {
    ecrire(COLONNE_ROBOT, '❌ Le robot n\'y arrive pas. Remplis la ligne à la main, ou efface ce message pour réessayer.');
    return false;
  }
  ecrire(COLONNE_ROBOT, `⏳ Le robot travaille… (essai ${essai})`);
  SpreadsheetApp.flush();
  try {
    const video = lireVideo_(tache.lien);
    const doublon = trouverDoublon_(donnees, col, video.id, tache.ligne);
    if (doublon) {
      ecrire(COLONNE_ROBOT, `❌ Cette vidéo est déjà sur la carte (ligne ${doublon}). Tu peux supprimer cette ligne.`);
      return false;
    }
    ecrire('Lien TikTok', video.url);
    const r = preparerFiche_(video, lireCategories_());
    if (r.aTrier) {
      versATrier_(video, r.identification);
      feuille.deleteRow(tache.ligne);
      return true;
    }
    const { fiche, gps, wikipedia } = r;
    const largeur = feuille.getLastColumn();
    const plage = feuille.getRange(tache.ligne, 1, 1, largeur);
    const ligne = plage.getValues()[0];
    const mettre = (nomCol, valeur) => { if (col[nomCol]) ligne[col[nomCol] - 1] = valeur; };
    mettre('Nom (EN)', fiche.nom_en);
    mettre('Nom (FR)', fiche.nom_fr);
    mettre('Nom (日本語)', fiche.nom_ja);
    mettre('Catégorie', fiche.categorie);
    mettre('Coordonnées GPS', gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : '');
    mettre('Lien TikTok', video.url);
    mettre('Description (EN)', fiche.description_en);
    mettre('Description (FR)', fiche.description_fr);
    mettre('Description (日本語)', fiche.description_ja);
    if (wikipedia && !String(ligne[col['Autre lien'] - 1] || '').trim()) mettre('Autre lien', wikipedia);
    mettre('Afficher ?', 'Oui');
    mettre('À vérifier', 'Oui');
    const notes = [`🤖 Rempli par le robot (confiance : ${fiche.confiance || '?'}${gps ? `, position : ${gps.source}` : ''}).`];
    if (!gps) notes.push('Position GPS introuvable : colle les coordonnées (clic droit sur le lieu dans Google Maps), sinon le lieu n\'apparaît pas sur la carte.');
    else if (gps.approx) notes.push('Position GPS approximative : vérifie-la sur Google Maps.');
    if (!fiche.categorie) notes.push('Catégorie à choisir.');
    if (fiche.remarque) notes.push(fiche.remarque);
    mettre(COLONNE_ROBOT, notes.join(' '));
    plage.setValues([ligne]);
    plage.setBackground(COULEUR_A_VERIFIER);
    return false;
  } catch (err) {
    const texte = String(err && err.message || err);
    const reessayer = err && err.reessayer && essai < ESSAIS_MAX;
    ecrire(COLONNE_ROBOT, reessayer
      ? `⏳ Petit souci (${texte}). Nouvel essai dans 10 minutes… (essai ${essai})`
      : `❌ ${texte} Efface ce message pour réessayer.`);
    console.error(err);
    return false;
  }
}

/** Toute la réflexion, sans rien écrire : identifier le lieu, chercher des infos, rédiger la fiche, choisir le GPS. */
function preparerFiche_(video, categories) {
  const identification = identifierLieu_(video);
  if (identification.type_video !== 'lieu_unique') return { aTrier: true, identification };
  const sources = []
    .concat(chercherWikipedia_('en', identification.recherche_wikipedia_en, 3))
    .concat(chercherWikipedia_('ja', identification.recherche_wikipedia_ja, 2));
  const carte = chercherCarte_(identification.recherche_carte);
  if (carte) sources.push(carte);
  const fiche = redigerFiche_(video, identification, sources, categories);
  const choisie = sources.find((s) => s.id === fiche.source_gps);
  return {
    identification, sources, fiche,
    gps: choisirGPS_(choisie, carte),
    wikipedia: choisie && choisie.url && choisie.id.startsWith('wikipedia') ? choisie.url : '',
  };
}

// --- La vidéo TikTok ------------------------------------------------------
function lireVideo_(texte) {
  const trouve = String(texte).match(/https?:\/\/[^\s"'<>]*tiktok\.com[^\s"'<>]*/i);
  if (!trouve) throw erreur_('Je ne trouve pas de lien TikTok dans cette case.');
  let url = trouve[0];
  let id = (url.match(/\/video\/(\d+)/) || [])[1];
  // Lien court (vm.tiktok.com/…, tiktok.com/t/…) : on suit les redirections pour trouver la vraie adresse
  for (let i = 0; i < 4 && !id; i++) {
    const r = UrlFetchApp.fetch(url, { followRedirects: false, muteHttpExceptions: true, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const entetes = r.getHeaders();
    const suite = entetes.Location || entetes.location;
    if (!suite) break;
    url = suite.startsWith('http') ? suite : 'https://www.tiktok.com' + suite;
    id = (url.match(/\/video\/(\d+)/) || [])[1];
  }
  const propre = url.split('?')[0];
  const r = UrlFetchApp.fetch('https://www.tiktok.com/oembed?url=' + encodeURIComponent(propre), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) {
    throw erreur_(`TikTok ne trouve pas cette vidéo (code ${r.getResponseCode()}) : vérifie le lien.`, r.getResponseCode() >= 500);
  }
  const o = JSON.parse(r.getContentText());
  id = id || o.embed_product_id;
  if (!id) throw erreur_('Je ne trouve pas le numéro de la vidéo dans ce lien.');
  const auteur = o.author_unique_id || (propre.match(/@([\w.]+)/) || [])[1] || 'random_japan_place';
  return { id: String(id), url: `https://www.tiktok.com/@${auteur}/video/${id}`, legende: o.title || '', auteur };
}

function trouverDoublon_(donnees, col, id, ligneCourante) {
  for (let i = 1; i < donnees.length; i++) {
    if (i + 1 === ligneCourante) continue;
    if (String(donnees[i][col['Lien TikTok'] - 1]).includes(`/video/${id}`)) return i + 1;
  }
  return 0;
}

// --- Recherches gratuites : Wikipédia et Google Maps ------------------------
/** Les meilleurs articles Wikipédia pour cette recherche : résumé, coordonnées, titre dans l'autre langue. */
function chercherWikipedia_(langue, recherche, combien) {
  if (!recherche) return [];
  const autre = langue === 'en' ? 'ja' : 'en';
  const url = `https://${langue}.wikipedia.org/w/api.php?` + [
    'action=query', 'format=json', 'formatversion=2', 'redirects=1',
    'generator=search', 'gsrsearch=' + encodeURIComponent(recherche), 'gsrlimit=' + combien,
    'prop=extracts%7Ccoordinates%7Clanglinks%7Cinfo', 'exintro=1', 'explaintext=1', 'exlimit=max',
    'inprop=url', 'lllang=' + autre, 'lllimit=max',
  ].join('&');
  try {
    const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { 'User-Agent': AGENT } });
    if (r.getResponseCode() !== 200) return [];
    const pages = ((JSON.parse(r.getContentText()).query || {}).pages || []).sort((a, b) => a.index - b.index);
    return pages.map((p, i) => ({
      id: `wikipedia_${langue}_${i + 1}`,
      titre: p.title,
      titreAutreLangue: p.langlinks && p.langlinks.length ? p.langlinks[0].title : '',
      extrait: String(p.extract || '').slice(0, 1500),
      lat: p.coordinates ? p.coordinates[0].lat : null,
      lng: p.coordinates ? p.coordinates[0].lon : null,
      url: p.fullurl || '',
    }));
  } catch (e) {
    console.warn('Wikipédia indisponible', e);
    return [];
  }
}

/** Google Maps (gratuit dans Apps Script) : adresse et position du lieu. */
function chercherCarte_(recherche) {
  if (!recherche) return null;
  try {
    const g = Maps.newGeocoder().setRegion('jp').setLanguage('ja').geocode(recherche);
    if (!g || g.status !== 'OK' || !g.results.length) return null;
    const res = g.results[0];
    const vague = (res.types || []).some((t) => /^(locality|sublocality|administrative_area|political|country|postal_code|route)/.test(t));
    return {
      id: 'google_maps', titre: res.formatted_address, extrait: `Adresse trouvée par Google Maps : ${res.formatted_address}`,
      lat: res.geometry.location.lat, lng: res.geometry.location.lng, precis: !vague, url: '',
    };
  } catch (e) {
    console.warn('Google Maps indisponible', e);
    return null;
  }
}

// --- L'IA Gemini ---------------------------------------------------------------
const CONSIGNES_IDENTIFIER = `You help a robot add places to an interactive map of Japan from the TikTok captions of the travel account @random_japan_place. Reply with a single JSON object and nothing else:
{"type_video": "lieu_unique" | "compilation" | "pas_un_lieu", "nom_en": string, "nom_ja": string, "prefecture_en": string, "recherche_wikipedia_en": string, "recherche_wikipedia_ja": string, "recherche_carte": string, "remarque": string}
- type_video: "lieu_unique" when the video is about one specific place (most videos; captions often look like "Udo Inari shrine | Miyazaki 📍"). "compilation" when it shows several places (a top 5, "hotels that…", a season across Japan…). "pas_un_lieu" otherwise.
- Use your knowledge of Japan to recognise the place even when the caption spelling is unusual. nom_en: the English name travellers use, with clean spelling and capitals ("Kegon Falls", "Himeji Castle", "Udo Inari Shrine"). nom_ja: its official Japanese name if you know it, otherwise "".
- The place is the one the caption names. When it is a small place next to a more famous one (a small shrine beside a big shrine, a waterfall inside a famous gorge…), keep the small place: never swap it for the famous neighbour.
- recherche_wikipedia_en: a short query to find its English Wikipedia article (for example "Kegon Falls Nikko"). recherche_wikipedia_ja: the same for Japanese Wikipedia, usually the Japanese name (for example "華厳滝"). recherche_carte: a Japanese Google Maps query with name, municipality and prefecture (for example "華厳滝 栃木県日光市"). All three look for the place the caption names.
- remarque: one short sentence in French when you are unsure or when it is not a single place, otherwise "".`;

const CONSIGNES_REDIGER = `You write one entry of an interactive map of Japan that lists every place featured in the TikTok videos of the travel account @random_japan_place. You receive the place (its name is already decided from the video caption), the caption, search results from Wikipedia and Google Maps (each with an id) and the allowed categories. Reply with a single JSON object and nothing else:
{"source_gps": string, "nom_fr": string, "categorie": string, "description_en": string, "description_fr": string, "description_ja": string, "confiance": "haute" | "moyenne" | "basse", "remarque": string}
- The entry is about the given place, under its given name. Search results can be about another place, often a more famous neighbour (for example the main shrine next to a small shrine): use them only for the surroundings, and never describe that other place as if it were this one.
- source_gps: the id of the search result that is exactly this place and gives its position (for example "wikipedia_en_1" or "google_maps"), or "aucune". A result about the town or a neighbouring place does not count.
- nom_fr: the French name of the given place in the map's style ("Sanctuaire Udo Inari", "Temple Nanzoin", "Cascade de Kegon", "Château de Himeji", "Lac Tazawa"; famous Japanese names such as "Kinkaku-ji" stay as they are).
- categorie: exactly one key from the allowed categories.
- description_en, description_fr, description_ja: the same 2 or 3 sentences in each language, factual and warm, in a travel-guide tone, written in your own words (never copy sentences from the sources). Start with where it is (town, prefecture), then what makes it special. Natural Japanese in です/ます style. Example: "Located in Kami Town, Hyogo Prefecture, Choraku-ji is a temple famously home to the Tajima Daibutsu: three monumental golden Buddha statues set within a vast main hall. Surrounded by tranquil mountain scenery, the complex also features a tall wooden five-story pagoda and thousands of smaller gilded Buddhist figures along its walls."
- Only use facts from the search results or facts you are certain of. If the results say little, write a shorter description rather than guessing.
- confiance: "haute" when a search result is exactly this place and agrees with the caption, "moyenne" when fairly sure, "basse" when the results were about other places and you relied on the caption.
- remarque: one short sentence in French for the channel owner when something is uncertain, otherwise "".`;

function identifierLieu_(video) {
  const r = demanderGemini_(MODELES_IDENTIFIER, CONSIGNES_IDENTIFIER,
    `TikTok video: ${video.url}\nCaption: ${JSON.stringify(video.legende)}`);
  if (!['lieu_unique', 'compilation', 'pas_un_lieu'].includes(r.type_video)) r.type_video = 'lieu_unique';
  return r;
}

function redigerFiche_(video, identification, sources, categories) {
  const blocs = sources.map((s) => [
    `[${s.id}] ${s.titre}${s.titreAutreLangue ? ` (${s.titreAutreLangue})` : ''}` +
      (s.lat != null ? ` — GPS ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}` : ' — pas de GPS'),
    s.extrait,
  ].join('\n'));
  const texte = [
    `Place: ${identification.nom_en}${identification.nom_ja ? ` (${identification.nom_ja})` : ''}, ${identification.prefecture_en} Prefecture`,
    `Caption: ${JSON.stringify(video.legende)}`,
    '',
    'Search results:',
    blocs.length ? blocs.join('\n\n') : '(none)',
    '',
    'Allowed categories (key, French name):',
    categories.map((c) => `- ${c.cle} (${c.fr})`).join('\n'),
  ].join('\n');
  const f = demanderGemini_(MODELES_REDIGER, CONSIGNES_REDIGER, texte);
  // Vérifications : catégorie connue, textes présents
  const cat = categories.find((c) => c.cle.toLowerCase() === String(f.categorie || '').trim().toLowerCase());
  f.categorie = cat ? cat.cle : '';
  for (const k of ['nom_fr', 'description_en', 'description_fr', 'description_ja', 'remarque', 'confiance', 'source_gps']) {
    f[k] = String(f[k] == null ? '' : f[k]).trim();
  }
  // Le nom vient toujours de la légende (1re question) : l'IA ne peut pas le remplacer par un lieu voisin plus connu
  f.nom_en = String(identification.nom_en || '').trim();
  f.nom_ja = String(identification.nom_ja || '').trim();
  if (!f.nom_en || !f.description_en) throw erreur_('L\'IA n\'a pas rempli la fiche.', true);
  return f;
}

/** Pose une question à Gemini (réponse JSON). Si un modèle n'a plus de quota gratuit, on essaie le suivant. */
function demanderGemini_(modeles, consignes, texte) {
  const cle = (PropertiesService.getScriptProperties().getProperty('CLE_GEMINI') || '').trim();
  if (!cle) throw erreur_('Pas de clé IA : dans le projet « Robot carte », Paramètres du projet → Propriétés du script → CLE_GEMINI.');
  let derniere = null;
  for (const modele of modeles) {
    let r;
    try {
      r = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`, {
        method: 'post', contentType: 'application/json', muteHttpExceptions: true,
        headers: { 'x-goog-api-key': cle },
        payload: JSON.stringify({
          systemInstruction: { parts: [{ text: consignes }] },
          contents: [{ role: 'user', parts: [{ text: texte }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
    } catch (e) {
      derniere = erreur_(`Gemini ne répond pas (${e.message}).`, true);
      continue;
    }
    const code = r.getResponseCode();
    const corps = r.getContentText();
    if (code === 200) {
      const j = JSON.parse(corps);
      const candidat = (j.candidates || [])[0];
      const reponse = candidat && candidat.content ? (candidat.content.parts || []).map((p) => p.text || '').join('') : '';
      try {
        return lireJSON_(reponse);
      } catch (e) {
        derniere = erreur_(`Réponse de Gemini illisible (${candidat ? candidat.finishReason : 'vide'}).`, true);
        continue;
      }
    }
    let detail = corps.slice(0, 300);
    try { detail = JSON.parse(corps).error.message; } catch (e) { /* pas du JSON */ }
    if (/API key|API_KEY/i.test(detail) && (code === 400 || code === 401 || code === 403)) {
      throw erreur_('Clé IA refusée : vérifie CLE_GEMINI dans les Propriétés du script du projet « Robot carte ».');
    }
    console.warn(`Gemini ${modele} : ${code} ${detail}`);
    derniere = erreur_(code === 429 ? 'Quota gratuit de Gemini atteint pour aujourd\'hui.' : `Erreur de Gemini (${code} : ${detail}).`,
      code === 429 || code >= 500);
    if (code === 429 || code === 404 || code >= 500) continue; // modèle suivant
    throw derniere;
  }
  throw derniere || erreur_('Aucun modèle Gemini disponible.', true);
}

function lireJSON_(texte) {
  const t = String(texte || '').replace(/```(?:json)?/g, '');
  const debut = t.indexOf('{');
  const fin = t.lastIndexOf('}');
  if (debut < 0 || fin < debut) throw new Error('pas de JSON');
  return JSON.parse(t.slice(debut, fin + 1));
}

// --- Position GPS -------------------------------------------------------------
/** La source choisie par l'IA (Wikipédia a des coordonnées précises), ou Google Maps si c'est plus sûr. */
function choisirGPS_(choisie, carte) {
  const ok = (s) => s && s.lat != null && auJapon_(s);
  if (ok(choisie)) {
    // Google Maps précis et tout proche : on le préfère (il pointe le bâtiment lui-même)
    if (choisie.id !== 'google_maps' && ok(carte) && carte.precis && distanceKm_(carte, choisie) < 3) {
      return { lat: carte.lat, lng: carte.lng, source: 'Google Maps' };
    }
    return { lat: choisie.lat, lng: choisie.lng, source: choisie.id === 'google_maps' ? 'Google Maps' : 'Wikipédia',
      approx: choisie.id === 'google_maps' && !choisie.precis };
  }
  if (ok(carte)) return { lat: carte.lat, lng: carte.lng, source: 'Google Maps', approx: !carte.precis };
  return null;
}

const auJapon_ = (p) => p.lat > 20 && p.lat < 46.5 && p.lng > 122 && p.lng < 154.5;

function distanceKm_(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// --- Tableau ------------------------------------------------------------------
const tableau_ = () => SpreadsheetApp.openById(ID_TABLEAU);

function feuilleLieux_() {
  const f = tableau_().getSheetByName(ONGLET_LIEUX);
  if (!f) throw new Error(`Onglet « ${ONGLET_LIEUX} » introuvable.`);
  return f;
}

/** Numéro de chaque colonne d'après la ligne 1 ; ajoute la colonne « Robot » si elle manque. */
function colonnes_(feuille) {
  let entetes = feuille.getRange(1, 1, 1, feuille.getLastColumn()).getValues()[0].map((v) => String(v).trim());
  if (!entetes.includes(COLONNE_ROBOT)) {
    const n = entetes.length + 1;
    feuille.getRange(1, 1).copyTo(feuille.getRange(1, n), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    feuille.getRange(1, n).setValue(COLONNE_ROBOT);
    feuille.setColumnWidth(n, 420);
    entetes = entetes.concat(COLONNE_ROBOT);
  }
  const col = {};
  entetes.forEach((nom, i) => { if (nom && !col[nom]) col[nom] = i + 1; });
  const manque = COLONNES_OBLIGATOIRES.filter((nom) => !col[nom]);
  if (manque.length) throw new Error('Colonnes introuvables dans « Lieux » : ' + manque.join(', '));
  return col;
}

function lireCategories_() {
  const valeurs = tableau_().getSheetByName(ONGLET_CATEGORIES).getDataRange().getValues();
  const categories = valeurs.slice(1)
    .filter((l) => String(l[0]).trim())
    .map((l) => ({ cle: String(l[0]).trim(), fr: String(l[4] || l[3] || l[0]).trim() }));
  if (!categories.length) throw erreur_('L\'onglet « Catégories » est vide.');
  return categories;
}

function versATrier_(video, identification) {
  const f = tableau_().getSheetByName(ONGLET_A_TRIER);
  const pourquoi = identification.type_video === 'compilation'
    ? 'Compilation : plusieurs lieux (ajoutée par le robot)' : 'Pas un lieu précis (ajoutée par le robot)';
  f.appendRow([video.url, video.legende, identification.remarque ? `${pourquoi}. ${identification.remarque}` : pourquoi, '']);
}

// --- Petits outils ----------------------------------------------------------
function erreur_(message, reessayer) {
  const e = new Error(message);
  e.reessayer = !!reessayer;
  return e;
}

// --- Tests (résultat dans le « Journal d'exécution », rien n'est écrit dans le tableau) ---
const LIEN_TEST = 'https://www.tiktok.com/@random_japan_place/video/7641332794487999766'; // Udo Inari Shrine

/** Sans IA : légende TikTok, Wikipédia, Google Maps. */
function testerSansIA() {
  const video = lireVideo_(LIEN_TEST);
  console.log(JSON.stringify(video));
  console.log(JSON.stringify(chercherWikipedia_('en', 'Udo Inari Shrine Miyazaki', 2).map((s) => [s.id, s.titre, s.titreAutreLangue, s.lat, s.lng])));
  console.log(JSON.stringify(chercherCarte_('鵜戸稲荷神社 宮崎県日南市')));
}

/** Test complet sur une vidéo, sans rien écrire (2 questions à Gemini). */
function testerAvecIA() {
  const debut = Date.now();
  const r = preparerFiche_(lireVideo_(LIEN_TEST), lireCategories_());
  console.log(JSON.stringify(r.identification, null, 1));
  console.log(JSON.stringify((r.sources || []).map((s) => [s.id, s.titre, s.lat, s.lng])));
  console.log(JSON.stringify(r.fiche, null, 1));
  console.log(JSON.stringify(r.gps), r.wikipedia, `durée : ${Math.round((Date.now() - debut) / 1000)} s`);
}
