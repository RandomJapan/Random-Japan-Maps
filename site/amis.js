// ================================================================
//  Les amis, sans compte (jeu « Devine le lieu » à plusieurs).
//  Chaque navigateur a son identité de joueur, créée la première fois : un numéro public (le « code
//  ami », 8 caractères) et un secret, dans localStorage (`joueur`), avec le pseudo. Le serveur (l'annuaire,
//  serveur/src/index.js) garde les amitiés, sait qui est en ligne et transmet demandes et invitations.
//  Changer de navigateur ou effacer ses données = une nouvelle identité (les amis restent sur l'ancienne).
//  Une demande ou une invitation qui arrive s'affiche en haut de l'écran, même hors du jeu.
// ================================================================
import { adresseServeur, connexion } from './reseau.js';

const MEMO = 'joueur'; // localStorage : { id, secret, pseudo }
const CHIFFRES = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // sans 0/O, 1/I/L : un code qui se lit et se dicte
const DUREE_ALERTE = { demande: 20_000, invitation: 60_000 };

const ICONES = {
  partager: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>',
  ajouter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20c.6-3.6 3.2-6 6.5-6 1.7 0 3.2.6 4.3 1.7M18 13v7M14.5 16.5h7"/></svg>',
  retirer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M7 7l10 10M17 7 7 17"/></svg>',
};

// ---- L'identité de ce navigateur
function aleatoire(n, alphabet) {
  const octets = crypto.getRandomValues(new Uint8Array(n));
  return [...octets].map((o) => alphabet[o % alphabet.length]).join('');
}

/** L'identité du joueur (créée la première fois) : { id, secret, pseudo }. */
export function identite() {
  try {
    const j = JSON.parse(localStorage.getItem(MEMO));
    if (j && /^[A-Z0-9]{8}$/.test(j.id) && typeof j.secret === 'string') return j;
  } catch { /* rien de lisible */ }
  const j = {
    id: aleatoire(8, CHIFFRES),
    secret: aleatoire(24, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'),
    pseudo: '',
  };
  memoriser(j);
  return j;
}

/** Ce navigateur a-t-il déjà une identité avec un pseudo (il a déjà joué à plusieurs) ? */
export function aDejaJoue() {
  try { return !!JSON.parse(localStorage.getItem(MEMO))?.pseudo; } catch { return false; }
}

function memoriser(j) {
  try { localStorage.setItem(MEMO, JSON.stringify(j)); } catch { /* navigation privée : le temps de la page */ }
}

/** « K7M2QX8P » → « K7M2-QX8P » */
export const formaterCodeAmi = (id) => `${id.slice(0, 4)}-${id.slice(4)}`;

/** Ce qu'on tape ou colle (« k7m2-qx8p », un lien …?ami=K7M2QX8P) → « K7M2QX8P », ou '' si ce n'en est pas un. */
export function lireCodeAmi(texte) {
  const s = String(texte || '');
  const lien = s.match(/[?&]ami=([A-Za-z0-9-]+)/);
  const code = (lien ? lien[1] : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z0-9]{8}$/.test(code) ? code : '';
}

/**
 * outils : { t, afficherMessage, adresse, rejoindre(code) → ouvre le jeu dans la partie code,
 *            partager(texte) → partage (téléphone) ou copie (ordinateur) }
 */
export function brancherAmis({ t, afficherMessage, adresse, rejoindre, partager }) {
  let cx = null;
  let connecte = false;
  let liste = { amis: [], recues: [], envoyees: [] };
  const abonnes = new Set();
  const alertees = new Set(); // demandes déjà montrées en alerte (une fois par page)
  const vues = new Map(); // élément → options : les listes d'amis affichées (redessinées à chaque changement)

  function demarrer() {
    if (cx || !adresseServeur()) return;
    const moi = identite();
    if (!moi.pseudo) return;
    cx = connexion('/annuaire', moi.id, {
      ouverte: () => cx.envoyer({ type: 'bonjour', secret: identite().secret, pseudo: identite().pseudo }),
      message: recevoir,
      coupee: () => { connecte = false; signaler(); },
    });
  }

  function recevoir(m) {
    if (m.type === 'amis') {
      connecte = true;
      liste = { amis: m.amis || [], recues: m.recues || [], envoyees: m.envoyees || [] };
      for (const d of liste.recues) {
        if (alertees.has(d.id)) continue;
        alertees.add(d.id);
        alerter('demande', t('amisDemandeRecue', d.pseudo), [
          [t('amisAccepter'), () => repondre(d.id, true)],
          [t('amisRefuser'), () => repondre(d.id, false)],
        ]);
      }
      signaler();
    } else if (m.type === 'demande') {
      const textes = { envoyee: t('amisDemandeEnvoyee', m.pseudo), inconnu: t('amisInconnu'), soi: t('amisSoi'), ami: t('amisDeja'), trop: t('amisTrop') };
      if (textes[m.etat]) afficherMessage(textes[m.etat]);
    } else if (m.type === 'accepte') afficherMessage(t('amisAccepte', m.pseudo));
    else if (m.type === 'invite') {
      const ami = liste.amis.find((a) => a.id === m.id);
      afficherMessage(m.ok ? t('amisInvitationEnvoyee', ami?.pseudo || '') : t('amisHorsLigne', ami?.pseudo || ''));
    } else if (m.type === 'invitation') {
      alerter('invitation', t('amisInvitationRecue', m.de.pseudo), [
        [t('amisRejoindre'), () => rejoindre(m.code)],
        [t('amisPlusTard'), () => {}],
      ]);
    } else if (m.type === 'refus') {
      // ce numéro est déjà pris avec un autre secret (très rare) : une nouvelle identité
      cx.fermer();
      cx = null;
      const ancien = identite();
      try { localStorage.removeItem(MEMO); } catch { /* */ }
      memoriser({ ...identite(), pseudo: ancien.pseudo });
      demarrer();
    }
  }

  function signaler() {
    for (const [el, options] of vues) {
      if (el.isConnected) dessiner(el, options);
      else vues.delete(el);
    }
    for (const f of abonnes) f();
  }

  // ---- Les actions
  function envoyer(m) {
    if (cx?.envoyer(m)) return true;
    afficherMessage(t('amisPasConnecte'));
    return false;
  }
  const demander = (id) => envoyer({ type: 'demander', id });
  const repondre = (id, oui) => envoyer({ type: 'repondre', id, oui });
  const inviter = (id, code) => envoyer({ type: 'inviter', id, code });

  /** Le pseudo choisi dans le jeu : gardé, et dit au serveur (les amis le voient changer). */
  function changerPseudo(pseudo) {
    const j = identite();
    const p = String(pseudo || '').trim().slice(0, 16);
    if (!p || p === j.pseudo) return;
    memoriser({ ...j, pseudo: p });
    if (cx) cx.envoyer({ type: 'pseudo', pseudo: p });
    else demarrer();
  }

  function partagerMonLien() {
    const j = identite();
    partager(t('amisLienTexte', j.pseudo, `https://${adresse}/?ami=${j.id}`), t('amisLienCopie'));
  }

  // ---- Les alertes en haut de l'écran (une à la fois)
  const boite = document.createElement('div');
  boite.className = 'amis-alerte panneau';
  boite.setAttribute('role', 'alert');
  boite.hidden = true;
  document.body.append(boite);
  const file = [];
  let minuterie = 0;

  function alerter(genre, texte, boutons) {
    file.push({ genre, texte, boutons });
    if (boite.hidden) suivante();
  }

  function suivante() {
    clearTimeout(minuterie);
    const a = file.shift();
    boite.hidden = !a;
    if (!a) return;
    boite.innerHTML = `<p>${echapper(a.texte)}</p><div>${a.boutons.map(([nom], k) =>
      `<button type="button" class="${k ? 'btn-secondaire' : 'btn-lancer'}">${echapper(nom)}</button>`).join('')}</div>`;
    boite.querySelectorAll('button').forEach((b, k) => b.addEventListener('click', () => { suivante(); a.boutons[k][1](); }));
    minuterie = setTimeout(suivante, DUREE_ALERTE[a.genre]);
  }

  // ---- La liste d'amis (dans la carte du jeu)
  /**
   * Dessine la liste dans el. options : { code } (un salon ouvert : « Inviter » à côté des amis en ligne),
   * { invitations: true } (seulement les amis en ligne, à inviter), { ajouter: 'K7M2QX8P' } (code à préremplir).
   */
  function dessiner(el, options = {}) {
    vues.set(el, options);
    const j = identite();
    if (options.invitations) {
      const enLigne = liste.amis.filter((a) => a.enLigne && !options.exclure?.includes(a.id)); // pas ceux déjà dans la partie
      el.hidden = !enLigne.length;
      el.innerHTML = enLigne.length ? `<h3>${echapper(t('amisInviter'))}</h3><ul class="amis-liste">${enLigne.map((a) => `
        <li><span class="amis-point en-ligne"></span><span class="amis-nom"><b>${echapper(a.pseudo)}</b></span>
          <button type="button" class="amis-bouton" data-inviter="${a.id}">${echapper(t('amisInviterBouton'))}</button></li>`).join('')}</ul>` : '';
    } else {
      // redessinée pendant qu'on tape un code : on garde ce qui est tapé, et le curseur
      const champ = el.querySelector('.amis-ajouter input');
      const tape = champ?.value;
      const avaitFocus = champ && document.activeElement === champ;
      const prerempli = tape ?? (options.ajouter ? formaterCodeAmi(options.ajouter) : '');
      el.innerHTML = `
        ${connecte ? '' : `<p class="amis-etat">${echapper(t('amisConnexion'))}</p>`}
        <div class="amis-moi">
          <span>${echapper(t('amisMonCode'))}</span>
          <b>${formaterCodeAmi(j.id)}</b>
          <button type="button" class="btn-secondaire amis-partager">${ICONES.partager}<span>${echapper(t('amisPartagerLien'))}</span></button>
        </div>
        <form class="amis-ajouter">
          <label class="champ-hasard"><span>${echapper(t('amisAjouterCode'))}</span>
            <input name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40" placeholder="K7M2-QX8P" value="${echapper(prerempli)}"></label>
          <button type="submit" class="btn-secondaire">${ICONES.ajouter}<span>${echapper(t('amisAjouter'))}</span></button>
        </form>
        ${liste.recues.length ? `<h3>${echapper(t('amisRecues'))}</h3><ul class="amis-liste">${liste.recues.map((d) => `
          <li><span class="amis-nom"><b>${echapper(d.pseudo)}</b></span>
            <button type="button" class="amis-bouton" data-accepter="${d.id}">${echapper(t('amisAccepter'))}</button>
            <button type="button" class="amis-bouton discret" data-refuser="${d.id}">${echapper(t('amisRefuser'))}</button></li>`).join('')}</ul>` : ''}
        <h3>${echapper(t('amisTitreListe', liste.amis.length))}</h3>
        ${liste.amis.length ? `<ul class="amis-liste">${liste.amis.map((a) => `
          <li><span class="amis-point${a.enLigne ? ' en-ligne' : ''}" title="${echapper(t(a.enLigne ? 'amisEnLigne' : 'amisAbsent'))}"></span>
            <span class="amis-nom"><b>${echapper(a.pseudo)}</b> <small>${echapper(t(a.enLigne ? 'amisEnLigne' : 'amisAbsent'))}</small></span>
            ${options.code && a.enLigne ? `<button type="button" class="amis-bouton" data-inviter="${a.id}">${echapper(t('amisInviterBouton'))}</button>` : ''}
            <button type="button" class="amis-retirer" data-retirer="${a.id}" aria-label="${echapper(t('amisRetirer', a.pseudo))}" title="${echapper(t('amisRetirer', a.pseudo))}">${ICONES.retirer}</button></li>`).join('')}</ul>`
          : `<p class="amis-vide">${echapper(t('amisVide'))}</p>`}
        ${liste.envoyees.length ? `<h3>${echapper(t('amisEnvoyees'))}</h3><ul class="amis-liste">${liste.envoyees.map((d) => `
          <li><span class="amis-nom"><b>${echapper(d.pseudo)}</b> <small>${echapper(t('amisEnAttente'))}</small></span></li>`).join('')}</ul>` : ''}`;
      if (avaitFocus) el.querySelector('.amis-ajouter input').focus();
      el.querySelector('.amis-partager').addEventListener('click', partagerMonLien);
      el.querySelector('.amis-ajouter').addEventListener('submit', (e) => {
        e.preventDefault();
        const champ = e.target.elements.code;
        const code = lireCodeAmi(champ.value);
        if (!code) { afficherMessage(t('amisCodeInvalide')); champ.focus(); return; }
        if (demander(code)) { champ.value = ''; options.ajouter = ''; }
      });
    }
    el.querySelectorAll('[data-inviter]').forEach((b) => b.addEventListener('click', () => {
      if (inviter(b.dataset.inviter, options.code)) { b.disabled = true; b.textContent = t('amisInvite'); }
    }));
    el.querySelectorAll('[data-accepter]').forEach((b) => b.addEventListener('click', () => repondre(b.dataset.accepter, true)));
    el.querySelectorAll('[data-refuser]').forEach((b) => b.addEventListener('click', () => repondre(b.dataset.refuser, false)));
    // retirer un ami : un second appui confirme
    el.querySelectorAll('[data-retirer]').forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('confirmer')) { envoyer({ type: 'retirer', id: b.dataset.retirer }); return; }
      b.classList.add('confirmer');
      b.textContent = t('amisRetirerConfirmer');
      setTimeout(() => { if (b.isConnected) { b.classList.remove('confirmer'); b.innerHTML = ICONES.retirer; } }, 3000);
    }));
  }

  return {
    demarrer, changerPseudo, demander, inviter, dessiner,
    connecte: () => connecte,
    estAmi: (id) => liste.amis.some((a) => a.id === id),
    demandeEnvoyee: (id) => liste.envoyees.some((d) => d.id === id),
    nbEnLigne: () => liste.amis.filter((a) => a.enLigne).length,
    nbRecues: () => liste.recues.length,
    surChange: (f) => { abonnes.add(f); return () => abonnes.delete(f); },
  };
}

const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
