// ================================================================
//  La connexion au serveur du jeu à plusieurs (dossier serveur/, chez Cloudflare) : une WebSocket qui
//  se reconnecte toute seule (coupure de réseau, téléphone mis en veille, appli changée pour partager le
//  code…). Utilisée par jeu.js (un salon) et amis.js (l'annuaire des amis).
// ================================================================
import { CONFIG } from './config.js';

const PING = 25_000; // ms : garde la connexion ouverte (le serveur répond « pong » sans se réveiller)

/** L'adresse du serveur : CONFIG.serveurJeu ; sur ce PC (essais), le serveur local de « npm run essai ». */
export function adresseServeur() {
  if (['localhost', '127.0.0.1'].includes(location.hostname)) return 'ws://127.0.0.1:8787';
  return CONFIG.serveurJeu || '';
}

/**
 * Ouvre une connexion à chemin (« /salon/FUJI42 », « /annuaire ») pour le joueur numero.
 * rappels : ouverte() à chaque (re)connexion, message(m) pour chaque message, coupee() quand elle tombe.
 * Renvoie { envoyer(m) → true si parti, fermer(), ouverte() }.
 */
export function connexion(chemin, numero, { ouverte, message, coupee }) {
  const adresse = `${adresseServeur()}${chemin}?joueur=${encodeURIComponent(numero)}`;
  let ws = null;
  let essais = 0;
  let fini = false;
  let ping = 0;
  let relance = 0;

  function ouvrir() {
    clearTimeout(relance);
    if (fini) return;
    ws = new WebSocket(adresse);
    ws.onopen = () => {
      essais = 0;
      ping = setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, PING);
      ouverte?.();
    };
    ws.onmessage = (e) => {
      if (e.data === 'pong') return;
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      message(m);
    };
    ws.onclose = () => {
      clearInterval(ping);
      if (fini) return;
      coupee?.();
      // 0,5 s, 1 s, 2 s… jusqu'à 8 s entre deux essais
      relance = setTimeout(ouvrir, Math.min(8000, 500 * 2 ** essais++));
    };
  }

  // La page revient au premier plan (téléphone rallumé, retour dans le navigateur) : on réessaie tout de suite
  const auRetour = () => {
    if (document.visibilityState === 'visible' && !fini && ws && ws.readyState > 1) { essais = 0; ouvrir(); }
  };
  document.addEventListener('visibilitychange', auRetour);
  addEventListener('online', auRetour);
  ouvrir();

  return {
    envoyer(m) {
      if (ws?.readyState !== 1) return false;
      ws.send(JSON.stringify(m));
      return true;
    },
    fermer() {
      fini = true;
      clearTimeout(relance);
      clearInterval(ping);
      document.removeEventListener('visibilitychange', auRetour);
      removeEventListener('online', auRetour);
      try { ws?.close(1000); } catch { /* déjà fermée */ }
    },
    ouverte: () => ws?.readyState === 1,
  };
}
