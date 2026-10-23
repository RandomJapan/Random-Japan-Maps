// ================================================================
//  La boîte de dialogue de la balade, comme dans les jeux Pokémon : le texte s'écrit lettre par lettre en bas
//  de l'écran, A (ou E, Espace, Entrée, un appui sur la boîte) le termine puis passe à la page suivante ;
//  un petit menu Oui / Non quand il faut choisir (ou plus d'options : le compagnon du départ, dont chaque option
//  survolée montre sa description dans la boîte). Une seule conversation à la fois.
// ================================================================

const VITESSE = 48; // lettres par seconde

/**
 * el : { boite, nom, texte, suite, choix } (éléments de la page) ; son : { bip(), choix() } ou null.
 * Renvoie { dire(pages, o), choisir(pages, options, o), appuyer(), deplacer(sens), ouvert() }.
 */
export function creerDialogue(el, son = null) {
  let ouvert = false;
  let pages = [], page = 0, lettres = 0, total = 0, minuterie = null;
  let fin = null; // résout la conversation
  let options = null, choixCourant = 0, finChoix = null, reglages = {};

  function ecrire() {
    clearInterval(minuterie);
    const texte = pages[page];
    // Array.from : un caractère par lettre, même pour les kanji rares et les emojis
    const morceaux = Array.from(texte);
    total = morceaux.length;
    lettres = 0;
    el.texte.textContent = '';
    el.suite.hidden = true;
    minuterie = setInterval(() => {
      lettres = Math.min(total, lettres + 1);
      el.texte.textContent = morceaux.slice(0, lettres).join('');
      if (lettres >= total) finirPage();
    }, 1000 / VITESSE);
  }

  function finirPage() {
    clearInterval(minuterie);
    el.texte.textContent = pages[page];
    lettres = total;
    const derniere = page === pages.length - 1;
    if (derniere && options) montrerChoix();
    else el.suite.hidden = false;
  }

  function montrerChoix() {
    el.choix.innerHTML = options.map((o, i) => `<button type="button" data-i="${i}">${o}</button>`).join('');
    // (de courtes options, plus de trois : sur un écran en hauteur, en grille sur toute la largeur, au-dessus de la boîte)
    el.choix.classList.toggle('nombreux', !!reglages.grille && options.length > 3);
    el.choix.hidden = false;
    choixCourant = reglages.depart || 0;
    marquer();
  }
  function marquer() {
    [...el.choix.children].forEach((b, i) => b.classList.toggle('actif', i === choixCourant));
    // (survol : ce que dit l'option marquée, à la place du texte)
    const texte = reglages.survol?.(choixCourant);
    if (typeof texte === 'string') el.texte.textContent = texte;
  }

  function fermer() {
    clearInterval(minuterie);
    ouvert = false;
    el.boite.hidden = true;
    el.choix.hidden = true;
    options = null;
  }

  function ouvrir(p, qui) {
    pages = p.filter(Boolean);
    page = 0;
    ouvert = true;
    el.nom.textContent = qui || '';
    el.nom.hidden = !qui;
    el.boite.hidden = false;
    ecrire();
  }

  el.boite.addEventListener('pointerdown', (e) => { e.preventDefault(); appuyer(); });
  // (à la souris, l'option survolée se marque)
  el.choix.addEventListener('pointerover', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b || e.pointerType !== 'mouse' || +b.dataset.i === choixCourant) return;
    choixCourant = +b.dataset.i;
    marquer();
  });
  el.choix.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    choixCourant = +b.dataset.i;
    marquer();
    valider();
  });

  function valider() {
    const r = choixCourant, f = finChoix;
    son?.choix();
    fermer();
    finChoix = null;
    f?.(r);
  }

  /** A : finit la page en cours, ou passe à la suivante, ou ferme ; dans un choix : valide. */
  function appuyer() {
    if (!ouvert) return;
    if (lettres < total) { finirPage(); return; }
    if (options && page === pages.length - 1) { valider(); return; }
    son?.bip();
    if (page < pages.length - 1) { page++; ecrire(); return; }
    const f = fin;
    fermer();
    fin = null;
    f?.();
  }

  return {
    ouvert: () => ouvert,
    appuyer,
    /** Haut / bas dans un choix (sens : -1 ou 1). */
    deplacer(sens) {
      if (!ouvert || !options || el.choix.hidden) return;
      choixCourant = (choixCourant + sens + options.length) % options.length;
      marquer();
    },
    /** Échap dans un choix : la dernière option (« Non »), sauf dans un choix qu'on ne peut pas refuser. */
    annuler() {
      if (!ouvert || !options || el.choix.hidden || reglages.obligatoire) return;
      choixCourant = options.length - 1;
      valider();
    },
    /** Dit des pages ; la promesse se résout quand on a tout lu. qui : le nom affiché (ou rien). */
    dire(p, { qui } = {}) {
      return new Promise((r) => { options = null; fin = r; reglages = {}; ouvrir(p, qui); });
    },
    /**
     * Dit des pages et finit par un choix ; la promesse donne l'indice de l'option choisie. depart : l'option marquée
     * d'abord ; survol(i) : appelé quand l'option i se marque (s'il renvoie un texte, la boîte le montre) ;
     * obligatoire : Échap ne choisit rien ; grille : de courtes options, en grille sur un écran en hauteur.
     */
    choisir(p, opts, { qui, depart = 0, survol = null, obligatoire = false, grille = false } = {}) {
      return new Promise((r) => { options = opts; finChoix = r; reglages = { depart, survol, obligatoire, grille }; ouvrir(p, qui); });
    },
  };
}
