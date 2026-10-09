// ================================================================
//  Le serveur du jeu « Devine le lieu » à plusieurs (Cloudflare Workers, offre gratuite).
//  - Un Salon (Durable Object) par code de partie (« FUJI42 ») : c'est l'arbitre. Il garde les joueurs,
//    l'heure de début et de fin de chaque manche, les épingles, et compte les points.
//  - Un seul Annuaire (Durable Object) pour les amis : qui est ami avec qui, qui est en ligne, les
//    demandes d'ami et les invitations. Pas de compte : chaque navigateur a un numéro de joueur et un
//    secret (data/joueur dans son localStorage) ; l'annuaire ne garde que l'empreinte SHA-256 du secret.
//  Tout passe par des WebSockets « en hibernation » : une connexion qui ne dit rien ne coûte rien.
//  Le site (site/jeu.js, site/amis.js) parle à ce serveur ; les lieux, eux, restent dans le site
//  (l'hôte envoie les numéros et les coordonnées des 5 lieux de la partie).
// ================================================================
import { DurableObject } from 'cloudflare:workers';

// Les pages qui ont le droit de se connecter (le site, et le serveur local des essais)
const ORIGINES = ['https://map.randomjapanplace.com', 'https://randomjapan.github.io', 'http://localhost:8123', 'http://127.0.0.1:8123'];
const NUMERO = /^[A-Z0-9]{6,16}$/; // numéro de joueur
const CODE = /^[A-Z]{3,8}[0-9]{2,3}$/; // code de partie : un mot et deux chiffres (« FUJI42 »)

export default {
  async fetch(requete, env) {
    const url = new URL(requete.url);
    if (url.pathname === '/') return new Response('carte-jeu : ok');
    if (!ORIGINES.includes(requete.headers.get('Origin'))) return new Response('Interdit', { status: 403 });
    if (requete.headers.get('Upgrade') !== 'websocket') return new Response('WebSocket attendu', { status: 426 });
    if (!NUMERO.test(url.searchParams.get('joueur') || '')) return new Response('Numéro de joueur attendu', { status: 400 });
    const salon = url.pathname.match(/^\/salon\/([A-Z0-9]+)$/);
    if (salon && CODE.test(salon[1])) return env.SALONS.get(env.SALONS.idFromName(salon[1])).fetch(requete);
    if (url.pathname === '/annuaire') return env.ANNUAIRE.get(env.ANNUAIRE.idFromName('annuaire')).fetch(requete);
    return new Response('Inconnu', { status: 404 });
  },
};

/** Ouvre la WebSocket d'un joueur dans un Durable Object (étiquetée par son numéro). */
function accepter(ctx, requete, attache) {
  const joueur = new URL(requete.url).searchParams.get('joueur');
  const [client, serveur] = Object.values(new WebSocketPair());
  ctx.acceptWebSocket(serveur, [joueur]);
  serveur.serializeAttachment({ ...attache, joueur });
  return new Response(null, { status: 101, webSocket: client });
}

function envoyer(ws, message) {
  try { ws.send(JSON.stringify(message)); } catch { /* déjà fermée */ }
}

function lire(texte) {
  try {
    const m = JSON.parse(texte);
    return m && typeof m === 'object' && typeof m.type === 'string' ? m : null;
  } catch { return null; }
}

/** Un pseudo propre : sans caractères de contrôle ni chevrons, 16 caractères au plus. */
function pseudoPropre(p) {
  const s = String(p ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim();
  return [...s].slice(0, 16).join('') || '?';
}

const nombre = (x) => typeof x === 'number' && Number.isFinite(x);

// ================================================================
//  Un salon : une partie à plusieurs
// ================================================================
const MAX_JOUEURS = 10;
const MAX_MANCHES = 5;
const DUREE_MANCHE = 30_000; // ms pour poser son épingle (comme le jeu seul)
const DECOMPTE = 3_500; // avant la 1re manche : les photos se chargent, « 3, 2, 1 »
const ENTRE_MANCHES = 1_200; // avant les manches suivantes (leur photo est déjà chargée)
const GRACE = 600; // ms après la fin du chrono : une épingle partie juste à temps compte
const VIE_SALON = 2 * 3600_000; // un salon sans activité depuis 2 h est effacé
const POINTS_MAX = 1000;
const ECHELLE_KM = 250; // points = 1000 × e^(−km/250) × la part gardée après les indices (comme jeu.js)
const PART_INDICES = [1, 0.75, 0.5];
// Les encres des joueurs, dans l'ordre d'arrivée (le rouge du site d'abord)
const COULEURS = ['#a8321f', '#2f5d8a', '#3f6e2a', '#b07818', '#6b3f8c', '#1f7a75', '#8a4b2a', '#c2577a', '#4a4f57', '#d0672a'];

export class Salon extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    // etat : { code, actif, hote, ordre [numéros], joueurs { numéro: { pseudo, couleur, total } }, partie,
    //          phase ('salon' | 'devine' | 'revele' | 'fin'), liste [{ id, lng, lat }], i, debut, fin,
    //          manche { numéro: { lng, lat, indices, valide } }, resultats [ { numéro: { lng, lat, km, pts, indices } } ] }
    ctx.blockConcurrencyWhile(async () => { this.etat = (await ctx.storage.get('etat')) || null; });
  }

  async fetch(requete) {
    const code = new URL(requete.url).pathname.split('/').pop();
    return accepter(this.ctx, requete, { code });
  }

  async webSocketMessage(ws, texte) {
    const m = lire(texte);
    if (!m) return;
    const { joueur, code } = ws.deserializeAttachment();
    if (m.type === 'entrer') return this.entrer(ws, joueur, code, m);
    const e = this.etat;
    if (!e?.joueurs[joueur] || !ws.deserializeAttachment().dedans) return;
    e.actif = Date.now();
    const hote = this.hote() === joueur;
    if (m.type === 'lancer' && hote && (e.phase === 'salon' || e.phase === 'fin')) this.lancer(m.liste);
    else if (m.type === 'epingle') this.epingle(joueur, m);
    else if (m.type === 'indices') this.indices(joueur, m.n);
    else if (m.type === 'valider') this.valider(joueur);
    else if (m.type === 'suivant' && hote && e.phase === 'revele') {
      if (e.i + 1 < e.liste.length) this.commencer(e.i + 1, ENTRE_MANCHES);
      else e.phase = 'fin';
    } else if (m.type === 'quitter') {
      this.retirer(joueur);
      try { ws.close(1000, 'quitte'); } catch { /* déjà fermée */ }
    } else return;
    await this.enregistrer();
  }

  async webSocketClose(ws) {
    try { ws.close(1000, 'fin'); } catch { /* déjà fermée */ }
    if (!this.etat) return;
    this.verifierManche(ws); // ceux qui restent ont peut-être tous validé
    await this.enregistrer(ws);
  }

  async webSocketError(ws) { await this.webSocketClose(ws); }

  async alarm() {
    const e = this.etat;
    if (!e) return;
    if (e.phase === 'devine' && Date.now() >= e.fin) {
      this.reveler();
      await this.enregistrer();
      return;
    }
    if (Date.now() - e.actif >= VIE_SALON && !this.ctx.getWebSockets().length) {
      this.etat = null;
      await this.ctx.storage.deleteAll();
      return;
    }
    await this.planifier();
  }

  // ---- Entrer dans le salon (le créer, le rejoindre, ou y revenir après une coupure)
  entrer(ws, joueur, code, m) {
    let e = this.etat;
    const vivant = e && Date.now() - e.actif < VIE_SALON && e.ordre.length > 0;
    if (m.creer && vivant && !e.joueurs[joueur]) return this.refuser(ws, 'occupe');
    if (!m.creer && !vivant) return this.refuser(ws, 'inconnu');
    if (!vivant) {
      e = this.etat = { code, actif: Date.now(), hote: joueur, ordre: [], joueurs: {}, partie: 0, phase: 'salon', liste: [], i: -1,
        debut: 0, fin: 0, manche: {}, resultats: [] };
    }
    if (!e.joueurs[joueur]) {
      if (e.ordre.length >= MAX_JOUEURS) return this.refuser(ws, 'plein');
      const prises = new Set(e.ordre.map((j) => e.joueurs[j].couleur));
      e.joueurs[joueur] = { pseudo: '', couleur: COULEURS.find((c) => !prises.has(c)) || COULEURS[0], total: 0 };
      e.ordre.push(joueur);
    }
    e.joueurs[joueur].pseudo = pseudoPropre(m.pseudo);
    e.actif = Date.now();
    // une seule connexion par joueur : l'ancienne (onglet resté ouvert, coupure) se ferme
    for (const autre of this.ctx.getWebSockets(joueur)) {
      if (autre !== ws) { envoyer(autre, { type: 'remplace' }); try { autre.close(1000, 'remplacée'); } catch { /* */ } }
    }
    ws.serializeAttachment({ ...ws.deserializeAttachment(), dedans: true });
    return this.enregistrer();
  }

  refuser(ws, raison) {
    envoyer(ws, { type: 'refus', raison });
    try { ws.close(1000, raison); } catch { /* déjà fermée */ }
  }

  retirer(joueur) {
    const e = this.etat;
    delete e.joueurs[joueur];
    e.ordre = e.ordre.filter((j) => j !== joueur);
    if (e.hote === joueur) e.hote = e.ordre[0] || null;
    this.verifierManche();
  }

  // ---- La partie
  lancer(liste) {
    const e = this.etat;
    if (!Array.isArray(liste)) return;
    const propre = liste.slice(0, MAX_MANCHES)
      .filter((l) => l && typeof l.id === 'string' && l.id.length <= 120 && nombre(l.lng) && nombre(l.lat))
      .map((l) => ({ id: l.id, lng: l.lng, lat: l.lat }));
    if (!propre.length) return;
    // ceux qui sont partis entre deux parties ne gardent pas de place
    for (const j of [...e.ordre]) if (!this.connecte(j)) this.retirer(j);
    for (const j of e.ordre) e.joueurs[j].total = 0;
    e.partie++;
    e.liste = propre;
    e.resultats = [];
    this.commencer(0, DECOMPTE);
  }

  commencer(i, delai) {
    const e = this.etat;
    Object.assign(e, { phase: 'devine', i, debut: Date.now() + delai, manche: {} });
    e.fin = e.debut + DUREE_MANCHE;
  }

  epingle(joueur, m) {
    const e = this.etat;
    const maintenant = Date.now();
    if (e.phase !== 'devine' || maintenant < e.debut - 500 || maintenant > e.fin + GRACE) return;
    if (!nombre(m.lng) || !nombre(m.lat) || Math.abs(m.lat) > 90) return;
    const r = (e.manche[joueur] ||= { indices: 0 });
    if (r.valide) return;
    r.lng = m.lng;
    r.lat = m.lat;
  }

  indices(joueur, n) {
    const e = this.etat;
    if (e.phase !== 'devine' || !Number.isInteger(n)) return;
    const r = (e.manche[joueur] ||= { indices: 0 });
    if (!r.valide) r.indices = Math.max(r.indices, Math.min(n, PART_INDICES.length - 1));
  }

  valider(joueur) {
    const e = this.etat;
    const r = e.manche[joueur];
    if (e.phase !== 'devine' || !r || r.lng == null || r.valide) return;
    r.valide = true;
    this.verifierManche();
  }

  /** Tous les joueurs encore là ont validé : on révèle sans attendre la fin du chrono. */
  verifierManche(partante) {
    const e = this.etat;
    if (e?.phase !== 'devine') return;
    const presents = e.ordre.filter((j) => this.connecte(j, partante));
    if (presents.length && presents.every((j) => e.manche[j]?.valide)) this.reveler();
  }

  reveler() {
    const e = this.etat;
    const lieu = e.liste[e.i];
    const res = {};
    for (const j of e.ordre) {
      const r = e.manche[j];
      if (r?.lng != null) {
        const d = km(lieu, r);
        const pts = Math.round(POINTS_MAX * Math.exp(-d / ECHELLE_KM) * PART_INDICES[r.indices || 0]);
        res[j] = { lng: r.lng, lat: r.lat, km: Math.round(d * 10) / 10, pts, indices: r.indices || 0 };
      } else res[j] = { km: null, pts: 0, indices: r?.indices || 0 };
      e.joueurs[j].total += res[j].pts;
    }
    e.resultats[e.i] = res;
    e.phase = 'revele';
  }

  // ---- L'hôte : celui qui a créé le salon ; s'il est déconnecté, le premier joueur encore là
  hote(partante) {
    const e = this.etat;
    if (e.hote && this.connecte(e.hote, partante)) return e.hote;
    return e.ordre.find((j) => this.connecte(j, partante)) || e.hote;
  }

  connecte(joueur, partante) {
    return this.ctx.getWebSockets(joueur).some((ws) => ws !== partante && ws.deserializeAttachment()?.dedans);
  }

  // ---- Enregistrer, prévenir tout le monde, et prévoir le prochain réveil
  async enregistrer(partante) {
    if (!this.etat) return;
    await this.ctx.storage.put('etat', this.etat);
    this.diffuser(partante);
    await this.planifier();
  }

  async planifier() {
    const e = this.etat;
    await this.ctx.storage.setAlarm(e.phase === 'devine' ? e.fin + GRACE : e.actif + VIE_SALON);
  }

  diffuser(partante) {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === partante) continue;
      const a = ws.deserializeAttachment();
      if (a?.dedans) envoyer(ws, this.vue(a.joueur, partante));
    }
  }

  /** Ce qu'un joueur voit du salon. Pendant une manche, il ne voit pas les épingles des autres. */
  vue(moi, partante) {
    const e = this.etat;
    const revele = e.phase === 'revele';
    return {
      type: 'etat', maintenant: Date.now(), code: e.code, moi, hote: this.hote(partante), partie: e.partie, phase: e.phase,
      liste: e.liste.map((l) => l.id), i: e.i, debut: e.debut, fin: e.fin,
      joueurs: e.ordre.map((j) => ({
        id: j, pseudo: e.joueurs[j].pseudo, couleur: e.joueurs[j].couleur, total: e.joueurs[j].total,
        connecte: this.connecte(j, partante), pose: e.manche[j]?.lng != null, valide: !!e.manche[j]?.valide,
      })),
      mienne: e.phase === 'devine' ? e.manche[moi] || null : null, // pour la retrouver après une coupure
      resultats: revele ? e.resultats[e.i] : null,
    };
  }
}

/** Distance en km entre deux points { lng, lat } (à vol d'oiseau), comme jeu.js. */
function km(a, b) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

// ================================================================
//  L'annuaire : les amis, sans compte
// ================================================================
const MAX_AMIS = 200;
const MAX_DEMANDES = 30; // demandes d'ami en attente envoyées par un même joueur

export class Annuaire extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS joueurs (id TEXT PRIMARY KEY, empreinte TEXT NOT NULL, pseudo TEXT NOT NULL, vu INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS amis (a TEXT NOT NULL, b TEXT NOT NULL, PRIMARY KEY (a, b));
      CREATE TABLE IF NOT EXISTS demandes (de TEXT NOT NULL, vers TEXT NOT NULL, quand INTEGER NOT NULL, PRIMARY KEY (de, vers));`);
  }

  async fetch(requete) {
    return accepter(this.ctx, requete, {});
  }

  async webSocketMessage(ws, texte) {
    const m = lire(texte);
    if (!m) return;
    const { joueur, ok } = ws.deserializeAttachment();
    if (m.type === 'bonjour') return this.bonjour(ws, joueur, m);
    if (!ok) return;
    const cible = typeof m.id === 'string' ? m.id.toUpperCase() : '';
    if (m.type === 'pseudo') {
      this.sql.exec('UPDATE joueurs SET pseudo = ? WHERE id = ?', pseudoPropre(m.pseudo), joueur);
      for (const a of this.amisDe(joueur)) this.envoyerListe(a.id);
    } else if (m.type === 'demander' && NUMERO.test(cible)) this.demander(ws, joueur, cible);
    else if (m.type === 'repondre' && NUMERO.test(cible)) this.repondre(joueur, cible, !!m.oui);
    else if (m.type === 'retirer' && NUMERO.test(cible)) {
      this.sql.exec('DELETE FROM amis WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)', joueur, cible, cible, joueur);
      this.sql.exec('DELETE FROM demandes WHERE (de = ? AND vers = ?) OR (de = ? AND vers = ?)', joueur, cible, cible, joueur);
      this.envoyerListe(joueur);
      this.envoyerListe(cible);
    } else if (m.type === 'inviter' && NUMERO.test(cible) && typeof m.code === 'string' && CODE.test(m.code)) {
      const amis = this.sql.exec('SELECT 1 FROM amis WHERE a = ? AND b = ?', joueur, cible).toArray().length > 0;
      const enLigne = amis && this.enLigne(cible);
      if (enLigne) this.envoyerA(cible, { type: 'invitation', de: { id: joueur, pseudo: this.pseudo(joueur) }, code: m.code });
      envoyer(ws, { type: 'invite', id: cible, ok: enLigne });
    }
  }

  async webSocketClose(ws) {
    try { ws.close(1000, 'fin'); } catch { /* déjà fermée */ }
    const { joueur, ok } = ws.deserializeAttachment() || {};
    // il n'est plus en ligne : ses amis le voient partir
    if (ok && !this.enLigne(joueur, ws)) for (const a of this.amisDe(joueur)) this.envoyerListe(a.id, ws);
  }

  async webSocketError(ws) { await this.webSocketClose(ws); }

  // ---- Se présenter : le numéro et le secret (la première fois, le joueur est inscrit)
  async bonjour(ws, joueur, m) {
    const secret = String(m.secret ?? '');
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(secret)) return this.refuser(ws);
    const empreinte = await sha256(secret);
    const connu = this.sql.exec('SELECT empreinte FROM joueurs WHERE id = ?', joueur).toArray()[0];
    if (connu && connu.empreinte !== empreinte) return this.refuser(ws);
    const pseudo = pseudoPropre(m.pseudo);
    if (connu) this.sql.exec('UPDATE joueurs SET pseudo = ?, vu = ? WHERE id = ?', pseudo, Date.now(), joueur);
    else this.sql.exec('INSERT INTO joueurs (id, empreinte, pseudo, vu) VALUES (?, ?, ?, ?)', joueur, empreinte, pseudo, Date.now());
    const deja = this.enLigne(joueur);
    ws.serializeAttachment({ ...ws.deserializeAttachment(), ok: true });
    this.envoyerListe(joueur);
    if (!deja) for (const a of this.amisDe(joueur)) this.envoyerListe(a.id); // il arrive : ses amis le voient en ligne
  }

  refuser(ws) {
    envoyer(ws, { type: 'refus' });
    try { ws.close(1000, 'refus'); } catch { /* déjà fermée */ }
  }

  // ---- Les demandes d'ami
  demander(ws, joueur, cible) {
    if (cible === joueur) return envoyer(ws, { type: 'demande', id: cible, etat: 'soi' });
    if (!this.sql.exec('SELECT 1 FROM joueurs WHERE id = ?', cible).toArray().length) return envoyer(ws, { type: 'demande', id: cible, etat: 'inconnu' });
    if (this.sql.exec('SELECT 1 FROM amis WHERE a = ? AND b = ?', joueur, cible).toArray().length) return envoyer(ws, { type: 'demande', id: cible, etat: 'ami' });
    // il m'avait déjà demandé : nous voilà amis
    if (this.sql.exec('SELECT 1 FROM demandes WHERE de = ? AND vers = ?', cible, joueur).toArray().length) return this.repondre(joueur, cible, true);
    const n = this.sql.exec('SELECT COUNT(*) AS n FROM demandes WHERE de = ?', joueur).one().n;
    if (n >= MAX_DEMANDES || this.amisDe(joueur).length >= MAX_AMIS) return envoyer(ws, { type: 'demande', id: cible, etat: 'trop' });
    this.sql.exec('INSERT OR REPLACE INTO demandes (de, vers, quand) VALUES (?, ?, ?)', joueur, cible, Date.now());
    envoyer(ws, { type: 'demande', id: cible, etat: 'envoyee', pseudo: this.pseudo(cible) });
    this.envoyerListe(joueur);
    this.envoyerListe(cible);
  }

  repondre(joueur, de, oui) {
    const avait = this.sql.exec('SELECT 1 FROM demandes WHERE de = ? AND vers = ?', de, joueur).toArray().length > 0;
    this.sql.exec('DELETE FROM demandes WHERE (de = ? AND vers = ?) OR (de = ? AND vers = ?)', de, joueur, joueur, de);
    if (avait && oui) {
      this.sql.exec('INSERT OR IGNORE INTO amis (a, b) VALUES (?, ?)', joueur, de);
      this.sql.exec('INSERT OR IGNORE INTO amis (a, b) VALUES (?, ?)', de, joueur);
      this.envoyerA(de, { type: 'accepte', id: joueur, pseudo: this.pseudo(joueur) });
    }
    this.envoyerListe(joueur);
    this.envoyerListe(de);
  }

  // ---- Ce que chacun voit : ses amis (en ligne ou non), les demandes reçues et envoyées
  envoyerListe(joueur, partante) {
    if (!this.enLigne(joueur, partante)) return;
    const amis = this.amisDe(joueur).map((a) => ({ ...a, enLigne: this.enLigne(a.id, partante) }));
    const recues = this.sql.exec('SELECT j.id, j.pseudo FROM demandes d JOIN joueurs j ON j.id = d.de WHERE d.vers = ? ORDER BY d.quand', joueur).toArray();
    const envoyees = this.sql.exec('SELECT j.id, j.pseudo FROM demandes d JOIN joueurs j ON j.id = d.vers WHERE d.de = ? ORDER BY d.quand', joueur).toArray();
    this.envoyerA(joueur, { type: 'amis', amis, recues, envoyees }, partante);
  }

  amisDe(joueur) {
    return this.sql.exec('SELECT j.id, j.pseudo FROM amis a JOIN joueurs j ON j.id = a.b WHERE a.a = ? ORDER BY j.pseudo COLLATE NOCASE', joueur).toArray();
  }

  pseudo(joueur) {
    return this.sql.exec('SELECT pseudo FROM joueurs WHERE id = ?', joueur).toArray()[0]?.pseudo || '?';
  }

  enLigne(joueur, partante) {
    return this.ctx.getWebSockets(joueur).some((ws) => ws !== partante && ws.deserializeAttachment()?.ok);
  }

  envoyerA(joueur, message, partante) {
    for (const ws of this.ctx.getWebSockets(joueur)) if (ws !== partante && ws.deserializeAttachment()?.ok) envoyer(ws, message);
  }
}

async function sha256(texte) {
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
  return [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, '0')).join('');
}
