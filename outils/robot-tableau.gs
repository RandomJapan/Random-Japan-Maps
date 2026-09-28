/**
 * @OnlyCurrentDoc
 * ================================================================
 *  ROBOT DE LA CARTE « Random Japan Place »  (Google Apps Script)
 *
 *  Colle le lien d'une vidéo TikTok dans une ligne vide de l'onglet « Lieux »
 *  (colonne « Nom (EN) » ou « Lien TikTok ») : le robot remplit tout le reste
 *  (noms, GPS, catégorie, descriptions en 3 langues) grâce à l'IA Claude,
 *  puis colore la ligne en jaune « À vérifier ».
 *
 *  La colonne « Robot » montre ce qu'il fait, ses doutes et ses erreurs.
 *  Copie de référence de ce code : outils/robot-tableau.gs (dépôt GitHub).
 * ================================================================
 */

// --- Réglages ---------------------------------------------------------
const MODELE = 'claude-opus-5'; // IA utilisée. Moins chère (~2,5×) mais un peu moins fiable : 'claude-sonnet-5'
const EFFORT = 'medium'; // réflexion de l'IA : 'low' | 'medium' | 'high'
const RECHERCHES_WEB_MAX = 4; // recherches web par vidéo (1 cent chacune)
const LIGNES_PAR_PASSAGE = 3;
const ESSAIS_MAX = 2;
const COULEUR_A_VERIFIER = '#FFF2CC';
const ONGLET_LIEUX = 'Lieux';
const ONGLET_CATEGORIES = 'Catégories';
const ONGLET_A_TRIER = 'À trier';
const COLONNE_ROBOT = 'Robot';
const COLONNES_OBLIGATOIRES = ['Nom (EN)', 'Nom (FR)', 'Nom (日本語)', 'Catégorie', 'Coordonnées GPS', 'Lien TikTok',
  'Description (EN)', 'Description (FR)', 'Description (日本語)', 'Afficher ?', 'À vérifier'];

// --- Menu et installation ----------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi().createMenu('🗾 Robot carte')
    .addItem('Remplir les nouveaux liens maintenant', 'robotCarte')
    .addSeparator()
    .addItem('Enregistrer la clé IA (Claude)', 'enregistrerCle')
    .addItem('Installer / réparer le robot', 'installerRobot')
    .addToUi();
}

/** À lancer une fois : le robot passe toutes les 10 minutes, et tout de suite quand on colle un lien TikTok. */
function installerRobot() {
  for (const d of ScriptApp.getProjectTriggers()) ScriptApp.deleteTrigger(d);
  ScriptApp.newTrigger('robotCarte').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('quandModifie').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  colonnes_(feuilleLieux_());
  const cle = PropertiesService.getScriptProperties().getProperty('CLE_CLAUDE');
  informer_('Robot installé ✅' + (cle ? '' : '\n\nDernière étape : menu « 🗾 Robot carte » → « Enregistrer la clé IA (Claude) ».'));
}

function enregistrerCle() {
  const ui = SpreadsheetApp.getUi();
  const rep = ui.prompt('Clé IA (Claude)',
    'Colle ici ta clé API Anthropic (elle commence par « sk-ant- »).\nElle reste cachée : elle n\'est pas écrite dans le tableau.',
    ui.ButtonSet.OK_CANCEL);
  if (rep.getSelectedButton() !== ui.Button.OK) return;
  const cle = rep.getResponseText().trim();
  if (!/^sk-ant-/.test(cle)) {
    ui.alert('Ça ne ressemble pas à une clé Claude : elle doit commencer par « sk-ant- ».');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('CLE_CLAUDE', cle);
  // Vérification gratuite : la liste des modèles ne consomme pas de crédit
  const test = UrlFetchApp.fetch('https://api.anthropic.com/v1/models', {
    headers: { 'x-api-key': cle, 'anthropic-version': '2023-06-01' }, muteHttpExceptions: true,
  });
  ui.alert(test.getResponseCode() === 200
    ? 'Clé enregistrée et vérifiée ✅\nTu peux coller un lien TikTok dans l\'onglet « Lieux ».'
    : `Clé enregistrée, mais Anthropic la refuse (code ${test.getResponseCode()}). Vérifie-la et recommence.`);
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
    const ia = demanderIA_(video, lireCategories_());
    if (ia.type_video !== 'lieu_unique') {
      versATrier_(video, ia);
      feuille.deleteRow(tache.ligne);
      return true;
    }
    const gps = choisirGPS_(ia);
    const largeur = feuille.getLastColumn();
    const plage = feuille.getRange(tache.ligne, 1, 1, largeur);
    const ligne = plage.getValues()[0];
    const mettre = (nomCol, valeur) => { ligne[col[nomCol] - 1] = valeur; };
    mettre('Nom (EN)', ia.nom_en);
    mettre('Nom (FR)', ia.nom_fr);
    mettre('Nom (日本語)', ia.nom_ja);
    mettre('Catégorie', ia.categorie);
    mettre('Coordonnées GPS', `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`);
    mettre('Lien TikTok', video.url);
    mettre('Description (EN)', ia.description_en);
    mettre('Description (FR)', ia.description_fr);
    mettre('Description (日本語)', ia.description_ja);
    mettre('Afficher ?', 'Oui');
    mettre('À vérifier', 'Oui');
    const notes = [`🤖 Rempli par le robot (confiance : ${ia.confiance}, position : ${gps.source}).`];
    if (gps.approx) notes.push('Position GPS approximative : vérifie-la sur Google Maps.');
    if (ia.remarque) notes.push(ia.remarque);
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

// --- L'IA Claude -----------------------------------------------------------
const CONSIGNES = `You fill in one row of the place list behind an interactive 3D map of Japan that shows every place featured in the TikTok videos of the travel account @random_japan_place. From the video caption, identify the exact place, confirm it with web search, then call the enregistrer_lieu tool exactly once.

- type_video: "lieu_unique" when the video is about one specific place (most videos; captions often look like "Udo Inari shrine | Miyazaki 📍"). "compilation" when it shows several places (a top 5, "hotels that…", a season across Japan…). "pas_un_lieu" otherwise. For compilation and pas_un_lieu, set the other text fields to "", the coordinates to 0, and explain briefly in remarque.
- nom_en: the English name travellers use ("Kegon Falls", "Himeji Castle", "Udo Inari Shrine"). nom_fr: the French name in the map's style ("Sanctuaire Udo Inari", "Temple Nanzoin", "Cascade de Kegon", "Château de Himeji", "Lac Tazawa"; keep famous Japanese names such as "Kinkaku-ji" as they are). nom_ja: the official Japanese name (for example 鵜戸稲荷神社).
- description_en, description_fr, description_ja: the same 2 or 3 sentences in each language, factual and warm, in a travel-guide tone. Start with where it is (town, prefecture), then what makes it special. Natural Japanese in です/ます style. Example: "Located in Kami Town, Hyogo Prefecture, Choraku-ji is a temple famously home to the Tajima Daibutsu: three monumental golden Buddha statues set within a vast main hall. Surrounded by tranquil mountain scenery, the complex also features a tall wooden five-story pagoda and thousands of smaller gilded Buddhist figures along its walls."
- categorie: the single best key from the allowed list.
- latitude, longitude: the exact spot, with 5 decimals, taken from a source when you found one.
- recherche_carte: a Japanese query that Google Maps resolves to exactly this place: name, municipality and prefecture (for example "鵜戸稲荷神社 宮崎県日南市").
- confiance: "haute" when the caption names the place and sources confirm it, "moyenne" when you are fairly sure, "basse" when you had to guess.
- remarque: one short sentence in French for the channel owner when something is uncertain (which place exactly, approximate position…), otherwise "".
Only state facts you could verify; leave out anything you are unsure of.`;

function outilLieu_(categories) {
  const texte = (description) => ({ type: 'string', description });
  return {
    name: 'enregistrer_lieu',
    description: 'Records the place featured in the TikTok video as a new row of the map. Call it exactly once, at the end.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['type_video', 'nom_en', 'nom_fr', 'nom_ja', 'categorie', 'recherche_carte', 'latitude', 'longitude',
        'description_en', 'description_fr', 'description_ja', 'confiance', 'remarque'],
      properties: {
        type_video: { type: 'string', enum: ['lieu_unique', 'compilation', 'pas_un_lieu'] },
        nom_en: texte('English name of the place'),
        nom_fr: texte('French name of the place'),
        nom_ja: texte('Official Japanese name of the place'),
        categorie: { type: 'string', enum: categories.map((c) => c.cle), description: 'Category key' },
        recherche_carte: texte('Japanese Google Maps query for this exact place'),
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        description_en: texte('2-3 sentences in English'),
        description_fr: texte('The same 2-3 sentences in French'),
        description_ja: texte('The same 2-3 sentences in Japanese'),
        confiance: { type: 'string', enum: ['haute', 'moyenne', 'basse'] },
        remarque: texte('Short note in French for the owner, or ""'),
      },
    },
  };
}

function demanderIA_(video, categories) {
  const cle = PropertiesService.getScriptProperties().getProperty('CLE_CLAUDE');
  if (!cle) throw erreur_('Pas de clé IA : menu « 🗾 Robot carte » → « Enregistrer la clé IA (Claude) ».');
  const liste = categories.map((c) => `- ${c.cle} (${c.fr})`).join('\n');
  const messages = [{
    role: 'user',
    content: `TikTok video: ${video.url}\nAccount: @${video.auteur}\nCaption: ${JSON.stringify(video.legende)}\n\nAllowed categories (key, French name):\n${liste}`,
  }];
  const corps = {
    model: MODELE,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: EFFORT },
    system: CONSIGNES,
    tools: [
      { type: 'web_search_20260209', name: 'web_search', max_uses: RECHERCHES_WEB_MAX },
      outilLieu_(categories),
    ],
    tool_choice: { type: 'auto' },
    messages,
  };
  const entetes = { 'x-api-key': cle, 'anthropic-version': '2023-06-01' };
  if (/^claude-(opus-5|fable)/.test(MODELE)) { // si l'IA refuse par prudence, Anthropic relance sur un autre modèle
    corps.fallbacks = 'default';
    entetes['anthropic-beta'] = 'server-side-fallback-2026-07-01';
  }

  for (let tour = 0; tour < 4; tour++) {
    const reponse = appelerClaude_(corps, entetes);
    if (reponse.stop_reason === 'refusal') throw erreur_('L\'IA a refusé de traiter cette vidéo.');
    const appel = (reponse.content || []).find((b) => b.type === 'tool_use' && b.name === 'enregistrer_lieu');
    if (appel) return appel.input;
    // pause_turn : les recherches web ne sont pas finies, on renvoie la réponse telle quelle pour qu'elle continue.
    // end_turn sans résultat : on lui rappelle d'enregistrer le lieu.
    messages.push({ role: 'assistant', content: reponse.content });
    if (reponse.stop_reason !== 'pause_turn') {
      messages.push({ role: 'user', content: 'Call the enregistrer_lieu tool now with your answer.' });
    }
  }
  throw erreur_('L\'IA n\'a pas donné de réponse complète.', true);
}

function appelerClaude_(corps, entetes) {
  let r;
  try {
    r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', headers: entetes,
      payload: JSON.stringify(corps), muteHttpExceptions: true,
    });
  } catch (e) {
    throw erreur_(`L'IA met trop de temps à répondre (${e.message}).`, true);
  }
  const code = r.getResponseCode();
  let json = {};
  try { json = JSON.parse(r.getContentText()); } catch (e) { /* réponse vide */ }
  if (code === 200) return json;
  const detail = (json.error && json.error.message) || r.getContentText().slice(0, 200);
  if (code === 401) throw erreur_('Clé IA refusée : enregistre-la de nouveau (menu « 🗾 Robot carte »).');
  if (/credit balance/i.test(detail)) throw erreur_('Plus de crédit sur ton compte Anthropic : recharge-le sur console.anthropic.com.');
  throw erreur_(`Erreur de l'IA (${code} : ${detail}).`, code === 429 || code >= 500);
}

// --- Position GPS -------------------------------------------------------------
/** Google Maps (précis pour les lieux connus) si ça concorde avec l'estimation de l'IA, sinon l'estimation de l'IA. */
function choisirGPS_(ia) {
  const estimation = { lat: Number(ia.latitude), lng: Number(ia.longitude) };
  let trouve = null;
  try {
    const g = Maps.newGeocoder().setRegion('jp').setLanguage('ja').geocode(ia.recherche_carte);
    if (g && g.status === 'OK' && g.results.length) trouve = g.results[0];
  } catch (e) {
    console.warn('Google Maps indisponible', e);
  }
  if (trouve) {
    const p = trouve.geometry.location;
    const vague = (trouve.types || []).some((t) => /^(locality|sublocality|administrative_area|political|country|postal_code)/.test(t));
    const concorde = !auJapon_(estimation) || distanceKm_(p, estimation) < 25;
    if (auJapon_(p) && concorde && !vague) return { lat: p.lat, lng: p.lng, source: 'Google Maps' };
  }
  if (auJapon_(estimation)) return { ...estimation, source: 'IA', approx: !trouve };
  if (trouve && auJapon_(trouve.geometry.location)) return { ...trouve.geometry.location, source: 'Google Maps', approx: true };
  throw erreur_('Je ne trouve pas la position GPS de ce lieu : remplis « Coordonnées GPS » à la main.');
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
function feuilleLieux_() {
  const f = SpreadsheetApp.getActive().getSheetByName(ONGLET_LIEUX);
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
  const valeurs = SpreadsheetApp.getActive().getSheetByName(ONGLET_CATEGORIES).getDataRange().getValues();
  const categories = valeurs.slice(1)
    .filter((l) => String(l[0]).trim())
    .map((l) => ({ cle: String(l[0]).trim(), fr: String(l[4] || l[3] || l[0]).trim() }));
  if (!categories.length) throw erreur_('L\'onglet « Catégories » est vide.');
  return categories;
}

function versATrier_(video, ia) {
  const f = SpreadsheetApp.getActive().getSheetByName(ONGLET_A_TRIER);
  const pourquoi = ia.type_video === 'compilation' ? 'Compilation : plusieurs lieux (ajoutée par le robot)' : 'Pas un lieu précis (ajoutée par le robot)';
  f.appendRow([video.url, video.legende, ia.remarque ? `${pourquoi}. ${ia.remarque}` : pourquoi, '']);
}

// --- Petits outils ----------------------------------------------------------
function erreur_(message, reessayer) {
  const e = new Error(message);
  e.reessayer = !!reessayer;
  return e;
}

function informer_(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    console.log(message); // lancé depuis l'éditeur : pas de fenêtre
  }
}

/** Test sans IA ni écriture : lien court/long → légende TikTok, puis Google Maps. Résultat dans le journal d'exécution. */
function testerSansIA() {
  const video = lireVideo_('https://www.tiktok.com/@random_japan_place/video/7641332794487999766');
  console.log(JSON.stringify(video));
  const g = Maps.newGeocoder().setRegion('jp').setLanguage('ja').geocode('鵜戸稲荷神社 宮崎県日南市');
  console.log(g.status, JSON.stringify(g.results[0] && { lieu: g.results[0].formatted_address, types: g.results[0].types, gps: g.results[0].geometry.location }));
}

/** Test complet sur une vidéo, sans rien écrire dans le tableau (coûte quelques centimes). */
function testerAvecIA() {
  const debut = Date.now();
  const video = lireVideo_('https://www.tiktok.com/@random_japan_place/video/7641332794487999766');
  const ia = demanderIA_(video, lireCategories_());
  console.log(JSON.stringify(ia, null, 1));
  console.log(JSON.stringify(choisirGPS_(ia)), `durée : ${Math.round((Date.now() - debut) / 1000)} s`);
}
