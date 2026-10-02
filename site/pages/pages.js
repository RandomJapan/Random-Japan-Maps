// Petit script des pages des lieux (fabriquées par outils/fabriquer_pages.py) :
// les icônes des catégories, et la vidéo TikTok, chargée seulement quand on clique dessus.
import { iconeHTML } from '../icons.js';

for (const el of document.querySelectorAll('[data-icone]')) el.insertAdjacentHTML('afterbegin', iconeHTML(el.dataset.icone));

for (const bouton of document.querySelectorAll('[data-video]')) {
  bouton.addEventListener('click', () => {
    const lecteur = document.createElement('iframe');
    lecteur.className = 'lecteur';
    lecteur.src = `https://www.tiktok.com/player/v1/${bouton.dataset.video}?autoplay=1&music_info=1&description=0&rel=0`;
    lecteur.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
    lecteur.allowFullscreen = true;
    lecteur.title = 'TikTok';
    bouton.replaceWith(lecteur);
  }, { once: true });
}
