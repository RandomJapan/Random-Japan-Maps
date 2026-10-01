// ================================================================
//  Compteur de visites, avec GoatCounter (statistiques gratuites, sans cookie).
//  - Chaque visite de la carte est envoyée à GoatCounter par son petit script count.js
//    (sur téléphone aussi ; il ne compte pas les essais en local, sur localhost).
//  - Sur ordinateur, le total s'affiche à droite du titre : il défile de 0 jusqu'au total,
//    puis la visite en cours s'ajoute (+1).
//  GoatCounter ne recalcule ce total public que toutes les quelques heures (sa règle, pour ménager
//  ses serveurs) : les chiffres à la minute près sont sur le tableau de bord du compte.
// ================================================================

const DUREE_DEFILEMENT = 1600; // ms, de 0 jusqu'au total
const ENTRE_RELEVES = 15 * 60 * 1000; // on redemande le total toutes les 15 minutes si la page reste ouverte

/**
 * code : le code du compte GoatCounter (monsite pour monsite.goatcounter.com).
 * afficher : faux sur téléphone (on compte la visite, sans montrer le total).
 * Renvoie majLangue(), à appeler quand la langue change.
 */
export function brancherCompteur({ code, afficher, t, langue }) {
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  document.head.append(script);

  const boite = document.getElementById('visites');
  const nombre = document.getElementById('visites-nombre');
  const mot = document.getElementById('visites-mot');
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let affiche = 0; // le chiffre à l'écran
  let total = null; // le dernier total connu (visite en cours comprise)
  let animation = 0;

  const formater = (n) => new Intl.NumberFormat(langue()).format(n);

  function ecrire(n) {
    affiche = n;
    nombre.textContent = formater(n);
    mot.textContent = t('visites', n);
  }

  // Défile du chiffre affiché jusqu'à « vers ». La largeur est réservée d'avance, pour que le titre ne bouge pas.
  function defiler(vers, fin) {
    cancelAnimationFrame(animation);
    nombre.style.minWidth = '';
    nombre.textContent = formater(vers);
    nombre.style.minWidth = `${nombre.offsetWidth}px`;
    const depart = affiche;
    if (calme || vers <= depart) {
      ecrire(vers);
      fin?.();
      return;
    }
    const debut = performance.now();
    const pas = (maintenant) => {
      const x = Math.min(1, (maintenant - debut) / DUREE_DEFILEMENT);
      ecrire(Math.round(depart + (vers - depart) * (1 - (1 - x) ** 3)));
      if (x < 1) animation = requestAnimationFrame(pas);
      else fin?.();
    };
    animation = requestAnimationFrame(pas);
  }

  async function relever() {
    // TOTAL = toutes les pages du site (seule la carte envoie des visites)
    const reponse = await fetch(`https://${code}.goatcounter.com/counter/TOTAL.json`);
    if (!reponse.ok) throw new Error(`compteur : ${reponse.status}`);
    return Number(String((await reponse.json()).count).replace(/\D/g, '')) || 0;
  }

  async function demarrer() {
    const n = await relever();
    boite.hidden = false;
    boite.title = t('visitesInfo');
    // Le total public a quelques heures de retard : la visite en cours s'y ajoute sous les yeux du visiteur.
    defiler(n, () => {
      setTimeout(() => {
        total = n + 1;
        ecrire(total);
        if (!calme) {
          nombre.classList.remove('plus-un');
          void nombre.offsetWidth; // relance l'animation
          nombre.classList.add('plus-un');
        }
      }, calme ? 0 : 600);
    });
    setInterval(async () => {
      if (document.hidden || total === null) return;
      const nouveau = await relever().catch(() => 0);
      if (nouveau > total) {
        total = nouveau;
        defiler(nouveau);
      }
    }, ENTRE_RELEVES);
  }

  // Pas de compte « Autoriser les compteurs » ou GoatCounter injoignable : la carte reste sans compteur.
  if (afficher) demarrer().catch(() => {});

  return {
    majLangue() {
      if (boite.hidden) return;
      boite.title = t('visitesInfo');
      ecrire(affiche);
      nombre.style.minWidth = '';
    },
  };
}
