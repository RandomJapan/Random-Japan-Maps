// ================================================================
//  Le lecteur de musique : de la musique japonaise pendant qu'on se promène sur la carte.
//  Coupée au départ : rien ne se charge avant un appui sur lecture. Le panneau (bouton sous le choix
//  de la langue) choisit le style (traditionnelle, pop japonaise, café) et l'ambiance (calme, enjouée,
//  énergique), avec lecture/pause, morceau suivant et volume.
//  Les morceaux sont dans data/musique.json (outils/preparer_musique.py) : des auteurs japonais sous
//  licence CC BY 4.0, crédités (titre, auteur, lien) pendant chaque morceau.
// ================================================================

const STYLES = ['trad', 'pop', 'cafe'];
const AMBIANCES = ['calme', 'enjouee', 'energique'];
const VOLUME_DEPART = 0.7; // position du curseur au premier passage ; le son suit son carré (l'oreille entend en logarithme)
const FONDU = 0.6; // secondes : le son monte au départ et descend à la pause
const FONDU_CHANGEMENT = 0.25; // secondes : on baisse le morceau avant d'en changer
const MEMOIRE = 'musique'; // localStorage : { style, ambiance, volume } (le son, lui, est toujours coupé à l'arrivée)

const SVG = {
  jouer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.2v13.6L19 12z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z"/></svg>',
  suivant: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 5.5v13l9.5-6.5zM16 5h3v14h-3z"/></svg>',
  son: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9.2h3.8L12 5v14l-4.7-4.2H3.5z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M15.3 9a4.2 4.2 0 0 1 0 6M17.8 6.5a7.8 7.8 0 0 1 0 11"/></svg>',
  muet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9.2h3.8L12 5v14l-4.7-4.2H3.5z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="m15.5 9.5 5 5m0-5-5 5"/></svg>',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** iPhone et iPad : le volume d'un élément audio est en lecture seule (toujours 1). On passe alors par Web Audio. */
const volumeFixe = (() => {
  try { const a = new Audio(); a.volume = 0.5; return a.volume !== 0.5; } catch { return true; }
})();

/**
 * Branche le lecteur. `bouton` ouvre le panneau (géré par app.js, comme les autres panneaux) ; `panneau` est
 * rempli ici. Renvoie { remplir, majLangue, retrait } : retrait(raison, oui) baisse la musique pendant qu'une
 * vidéo TikTok joue avec le son, et la reprend ensuite.
 */
export function brancherMusique({ t, bouton, panneau }) {
  let donnees = null; // data/musique.json, lu à la première ouverture du panneau
  let chargement = null;
  let reglages = lireReglages();
  let morceau = null; // celui qui est chargé dans le lecteur
  let file = []; // les prochains morceaux du style et de l'ambiance choisis (mélangés)
  let voulu = false; // le visiteur veut de la musique (il a appuyé sur lecture)
  const retraits = new Set(); // ce qui fait taire la musique pour l'instant (une vidéo avec le son)
  let erreurs = 0;
  let nousPausons = false; // la pause vient de nous (fondu, vidéo) et non du téléphone ou du casque
  let contexte = null, gain = null; // Web Audio, seulement là où le volume de l'élément est fixe
  let minuterieFondu = 0;
  let avantMuet = 0; // le volume d'avant un appui sur le haut-parleur

  const audio = new Audio();
  audio.preload = 'none';

  function lireReglages() {
    let r = {};
    try { r = JSON.parse(localStorage.getItem(MEMOIRE)) || {}; } catch { /* navigation privée */ }
    return {
      style: STYLES.includes(r.style) ? r.style : 'trad',
      ambiance: AMBIANCES.includes(r.ambiance) ? r.ambiance : 'calme',
      volume: Number.isFinite(r.volume) ? Math.min(1, Math.max(0, r.volume)) : VOLUME_DEPART,
    };
  }
  function memoriser() {
    try { localStorage.setItem(MEMOIRE, JSON.stringify(reglages)); } catch { /* pas grave */ }
  }

  const morceauxDe = (style, ambiance) => donnees?.morceaux.filter((m) => m.style === style && m.ambiance === ambiance) ?? [];
  const niveau = () => reglages.volume ** 2;

  function charger() {
    chargement ??= fetch('data/musique.json').then((r) => r.json()).then((d) => {
      donnees = d;
      if (!morceauxDe(reglages.style, reglages.ambiance).length) reglages.ambiance = AMBIANCES.find((a) => morceauxDe(reglages.style, a).length);
      majPanneau();
      majMorceau();
    }).catch(() => { chargement = null; afficherErreur(); });
    return chargement;
  }

  /** Le prochain morceau : la liste du style et de l'ambiance, mélangée, sans rejouer tout de suite le même. */
  function prochain() {
    if (!file.length) {
      file = morceauxDe(reglages.style, reglages.ambiance);
      for (let i = file.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [file[i], file[j]] = [file[j], file[i]];
      }
      if (file.length > 1 && file[0] === morceau) file.push(file.shift());
    }
    return file.shift();
  }

  // ---- Le volume (avec fondu)
  function preparerGain() {
    if (!volumeFixe || contexte) return;
    try {
      contexte = new (window.AudioContext || window.webkitAudioContext)();
      gain = contexte.createGain();
      contexte.createMediaElementSource(audio).connect(gain).connect(contexte.destination);
    } catch { contexte = gain = null; }
  }
  /** Mène le son à `cible` (0 à 1) en `duree` secondes ; la promesse est tenue à la fin. */
  function regler(cible, duree = 0) {
    clearInterval(minuterieFondu);
    if (gain) {
      const g = gain.gain, maintenant = contexte.currentTime;
      g.cancelScheduledValues(maintenant);
      g.setValueAtTime(g.value, maintenant);
      g.linearRampToValueAtTime(cible, maintenant + duree);
    } else if (!duree) {
      audio.volume = cible;
    } else {
      const depart = audio.volume, debut = performance.now();
      minuterieFondu = setInterval(() => {
        const x = Math.min(1, (performance.now() - debut) / (duree * 1000));
        audio.volume = depart + (cible - depart) * x;
        if (x >= 1) clearInterval(minuterieFondu);
      }, 40);
    }
    return new Promise((ok) => setTimeout(ok, duree * 1000));
  }

  // ---- Lecture
  function changer(m) {
    morceau = m;
    audio.src = m.fichier;
    audio.preload = 'auto';
    majMorceau();
    majSession();
  }

  /** Lecture (appelée pendant l'appui, sans attendre : l'iPhone n'accepte le son qu'ainsi). */
  function jouer() {
    if (!donnees) return;
    if (!morceau) changer(prochain());
    voulu = true;
    majEtat();
    if (!retraits.size) demarrer();
  }
  function demarrer() {
    preparerGain();
    contexte?.resume().catch(() => {});
    if (audio.paused) regler(0);
    audio.play().then(() => { erreurs = 0; regler(niveau(), FONDU); }).catch((e) => {
      if (e.name === 'AbortError') return; // un autre morceau a pris sa place
      voulu = false;
      majEtat();
      if (e.name !== 'NotAllowedError') afficherErreur();
    });
  }
  function arreter() {
    voulu = false;
    majEtat();
    regler(0, FONDU).then(() => {
      if (voulu) return;
      nousPausons = true;
      audio.pause();
    });
  }
  /** Passe à `m` (ou au morceau suivant) et le joue ; en douceur si un morceau joue déjà. */
  function passerA(m = prochain()) {
    if (!m) return;
    if (!audio.paused && voulu) {
      regler(0, FONDU_CHANGEMENT).then(() => { changer(m); jouer(); });
    } else {
      changer(m);
      jouer();
    }
  }

  function choisir(style, ambiance) {
    if (!donnees) return;
    if (!morceauxDe(style, ambiance).length) ambiance = AMBIANCES.find((a) => morceauxDe(style, a).length);
    const pareil = style === reglages.style && ambiance === reglages.ambiance;
    reglages = { ...reglages, style, ambiance };
    memoriser();
    majChoix();
    if (pareil && morceau) { if (!voulu) jouer(); return; }
    file = [];
    passerA();
  }

  audio.addEventListener('ended', () => { if (voulu) passerA(); });
  // iPhone : Web Audio s'endort quand on quitte la page ; on le réveille au retour
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && contexte && voulu) contexte.resume().catch(() => {});
  });
  audio.addEventListener('pause', () => {
    // le téléphone, le casque ou l'écran verrouillé ont mis en pause : le bouton le montre
    if (nousPausons || audio.ended) { nousPausons = false; return; }
    if (!retraits.size) { voulu = false; majEtat(); }
  });
  audio.addEventListener('error', () => {
    if (!morceau || !audio.src) return;
    erreurs++;
    if (erreurs >= 3) { voulu = false; majEtat(); afficherErreur(); return; }
    if (voulu) setTimeout(() => passerA(), 800);
  });

  /** Une vidéo TikTok joue avec le son (fiche d'un lieu, visite) : la musique se tait, puis reprend. */
  function retrait(raison, oui) {
    if (oui) {
      if (retraits.has(raison)) return;
      retraits.add(raison);
      if (voulu && !audio.paused) {
        regler(0, FONDU).then(() => {
          if (!retraits.size) return;
          nousPausons = true;
          audio.pause();
        });
      }
    } else if (retraits.delete(raison) && !retraits.size && voulu) {
      demarrer();
    }
    majEtat();
  }

  // ---- L'écran verrouillé et les touches multimédia
  function majSession() {
    if (!('mediaSession' in navigator) || !morceau || typeof MediaMetadata === 'undefined') return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: morceau.titre,
      artist: donnees.auteurs[morceau.auteur].nom + (morceau.voix ? ` · ${morceau.voix}` : ''),
      album: 'Random Japan Place',
      artwork: [{ src: 'img/icone-180.png', sizes: '180x180', type: 'image/png' }],
    });
  }
  if ('mediaSession' in navigator) {
    for (const [action, faire] of [['play', jouer], ['pause', arreter], ['nexttrack', () => passerA()]]) {
      try { navigator.mediaSession.setActionHandler(action, faire); } catch { /* action inconnue ici */ }
    }
  }

  // ---- Le bouton et le panneau
  function majEtat() {
    bouton.classList.toggle('joue', voulu);
    bouton.classList.toggle('attente', voulu && retraits.size > 0);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = voulu ? 'playing' : 'paused';
    const jouerBtn = panneau.querySelector('[data-jouer]');
    if (jouerBtn) {
      jouerBtn.innerHTML = voulu ? SVG.pause : SVG.jouer;
      jouerBtn.setAttribute('aria-label', t(voulu ? 'musiquePause' : 'musiqueJouer'));
      jouerBtn.title = jouerBtn.getAttribute('aria-label');
    }
  }

  function remplir() {
    if (!panneau.firstChild) construire();
    charger();
  }

  function construire() {
    const boutons = (liste, attribut, prefixe) => liste.map((v) => `<button type="button" data-${attribut}="${v}" aria-pressed="false">${esc(t(prefixe + v))}</button>`).join('');
    panneau.innerHTML = `
      <p class="hasard-titre">${esc(t('musiqueTitre'))}</p>
      <p class="musique-etiquette" id="musique-txt-style">${esc(t('musiqueStyle'))}</p>
      <div class="onglets musique-onglets" role="group" aria-labelledby="musique-txt-style">${boutons(STYLES, 'style', 'style_')}</div>
      <p class="musique-etiquette" id="musique-txt-ambiance">${esc(t('musiqueAmbiance'))}</p>
      <div class="onglets musique-onglets" role="group" aria-labelledby="musique-txt-ambiance">${boutons(AMBIANCES, 'ambiance', 'ambiance_')}</div>
      <div class="musique-lecteur">
        <div class="musique-morceau" aria-live="polite"></div>
        <div class="musique-commandes">
          <button type="button" class="musique-jouer" data-jouer></button>
          <button type="button" class="musique-suivant" data-suivant aria-label="${esc(t('musiqueSuivant'))}" title="${esc(t('musiqueSuivant'))}">${SVG.suivant}</button>
          <div class="musique-volume">
            <button type="button" class="musique-muet" data-muet aria-label="${esc(t('musiqueVolume'))}"></button>
            <input type="range" min="0" max="100" step="1" data-volume aria-label="${esc(t('musiqueVolume'))}">
          </div>
        </div>
      </div>
      <p class="musique-credit"></p>`;
    majPanneau();
    majMorceau();
    majEtat();
  }

  /** Le panneau : choix, volume, crédits (sans toucher au morceau affiché). */
  function majPanneau() {
    if (!panneau.firstChild) return;
    majChoix();
    majVolumeAffiche();
    for (const b of panneau.querySelectorAll('[data-jouer], [data-suivant]')) b.disabled = !donnees;
    const credit = panneau.querySelector('.musique-credit');
    if (donnees && !credit.firstChild) {
      const liens = Object.values(donnees.auteurs).map((a) => `<a href="${esc(a.site)}" target="_blank" rel="noopener" lang="ja">${esc(a.nom)}</a>`).join(' · ');
      credit.innerHTML = `${esc(t('musiqueCredit'))} ${liens} · <a href="${esc(donnees.licence)}" target="_blank" rel="noopener">${esc(t('musiqueLicence'))}</a>`;
    }
  }

  /** Le style et l'ambiance choisis ; une ambiance sans morceau dans ce style est grisée. */
  function majChoix() {
    if (!panneau.firstChild) return;
    for (const b of panneau.querySelectorAll('[data-style]')) {
      b.setAttribute('aria-pressed', String(b.dataset.style === reglages.style));
    }
    for (const b of panneau.querySelectorAll('[data-ambiance]')) {
      b.setAttribute('aria-pressed', String(b.dataset.ambiance === reglages.ambiance));
      b.disabled = !!donnees && !morceauxDe(reglages.style, b.dataset.ambiance).length;
    }
  }

  function majVolumeAffiche() {
    const curseur = panneau.querySelector('[data-volume]');
    if (!curseur) return;
    curseur.value = Math.round(reglages.volume * 100);
    curseur.style.setProperty('--rempli', `${curseur.value}%`);
    panneau.querySelector('[data-muet]').innerHTML = reglages.volume > 0 ? SVG.son : SVG.muet;
  }

  /** Le morceau en cours, avec son crédit : titre (lien vers sa page chez l'auteur), auteur, voix. */
  function majMorceau() {
    const zone = panneau.querySelector('.musique-morceau');
    if (!zone) return;
    if (morceau) {
      const auteur = donnees.auteurs[morceau.auteur];
      zone.innerHTML = `<a class="musique-titre" lang="ja" href="${esc(morceau.page)}" target="_blank" rel="noopener">${esc(morceau.titre)}</a>
        <span class="musique-auteur"><span lang="ja">${esc(auteur.nom)}</span>${morceau.voix ? ` · ${esc(t('musiqueVoix', morceau.voix))}` : ''}</span>`;
    } else {
      zone.innerHTML = `<span class="musique-titre musique-coupee">${esc(t('musiqueCoupee'))}</span>`;
    }
  }

  function afficherErreur() {
    const zone = panneau.querySelector('.musique-morceau');
    if (zone) zone.innerHTML = `<span class="musique-titre musique-erreur">${esc(t('musiqueErreur'))}</span>`;
  }

  function majLangue() {
    if (!panneau.firstChild) return;
    panneau.innerHTML = '';
    construire();
  }

  panneau.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.style) choisir(b.dataset.style, reglages.ambiance);
    else if (b.dataset.ambiance) choisir(reglages.style, b.dataset.ambiance);
    else if ('jouer' in b.dataset) (voulu ? arreter() : jouer());
    else if ('suivant' in b.dataset) passerA();
    else if ('muet' in b.dataset) {
      if (reglages.volume > 0) { avantMuet = reglages.volume; reglages.volume = 0; } else reglages.volume = avantMuet || VOLUME_DEPART;
      majVolume();
    }
  });
  panneau.addEventListener('input', (e) => {
    if (!('volume' in e.target.dataset)) return;
    reglages.volume = e.target.value / 100;
    majVolume();
  });
  function majVolume() {
    memoriser();
    if (voulu && !retraits.size) regler(niveau(), 0.08);
    majVolumeAffiche();
  }

  return { remplir, majLangue, retrait };
}
