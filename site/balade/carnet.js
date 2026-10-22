// ================================================================
//  Le carnet de tampons : au Japon, les gares et les sites ont un tampon à encre que les visiteurs pressent
//  dans un carnet (スタンプラリー). Chaque lieu de la balade en cache cinq. Ce module dessine les tampons
//  (SVG : un cadre, un petit dessin, le nom en japonais, une encre qui manque par endroits), les garde dans
//  ce navigateur (localStorage.baladeTampons) et affiche le carnet.
// ================================================================

const CLE = 'baladeTampons';

export function lireTampons() {
  try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch { return {}; }
}
function ecrireTampons(etat) {
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch { /* navigation privée */ }
}
export function aLeTampon(lieu, id) { return (lireTampons()[lieu] || []).includes(id); }
/** Ajoute le tampon ; vrai s'il est nouveau. */
export function ajouterTampon(lieu, id) {
  const etat = lireTampons();
  const liste = etat[lieu] || (etat[lieu] = []);
  if (liste.includes(id)) return false;
  liste.push(id);
  ecrireTampons(etat);
  return true;
}

// ---------------------------------------------------------------- Les dessins (120 × 120, centre 60, 60)
const MOTIFS = {
  torii: `<path d="M18 37 Q60 26 102 37 L101 44 Q60 35 19 44 Z"/><rect x="27" y="50" width="66" height="6"/>
    <rect x="34" y="42" width="7" height="40"/><rect x="79" y="42" width="7" height="40"/><rect x="56" y="43" width="8" height="10"/>
    <path d="M18 88 q7 -5 14 0 t14 0 t14 0 t14 0 t14 0 t14 0" fill="none" stroke-width="3.5"/>
    <path d="M30 96 q7 -5 14 0 t14 0 t14 0 t14 0" fill="none" stroke-width="3"/>`,
  sanctuaire: `<path d="M16 50 Q38 44 60 30 Q82 44 104 50 L100 55 Q80 50 60 38 Q40 50 20 55 Z"/>
    <rect x="28" y="56" width="64" height="5"/><rect x="31" y="61" width="5" height="22"/><rect x="50" y="61" width="5" height="22"/>
    <rect x="65" y="61" width="5" height="22"/><rect x="84" y="61" width="5" height="22"/><rect x="22" y="83" width="76" height="5"/>
    <rect x="16" y="91" width="88" height="4"/><circle cx="60" cy="69" r="4"/>`,
  pagode: `<rect x="58" y="14" width="4" height="16"/><circle cx="60" cy="16" r="2.5"/>
    <path d="M40 34 Q60 28 80 34 L78 38 L42 38 Z"/><rect x="47" y="38" width="26" height="7"/>
    <path d="M36 48 Q60 41 84 48 L82 52 L38 52 Z"/><rect x="45" y="52" width="30" height="7"/>
    <path d="M32 62 Q60 54 88 62 L86 66 L34 66 Z"/><rect x="43" y="66" width="34" height="7"/>
    <path d="M28 76 Q60 67 92 76 L90 80 L30 80 Z"/><rect x="41" y="80" width="38" height="8"/>
    <path d="M24 91 Q60 81 96 91 L94 95 L26 95 Z"/>`,
  daim: `<path d="M38 52 Q40 40 52 40 L58 34 Q60 30 64 32 L66 26 L68 32 Q72 30 70 36 L76 40 Q80 44 76 48 L66 50
    Q64 60 70 64 L88 66 Q96 68 96 76 L94 98 L89 98 L88 80 Q80 84 66 82 L64 98 L59 98 L58 80 Q46 76 44 64 Q38 60 38 52 Z"/>
    <path d="M60 32 L54 18 M56 24 L48 20 M66 28 L70 14 M68 20 L76 16" fill="none" stroke-width="3" stroke-linecap="round"/>
    <circle cx="70" cy="40" r="2" class="vide"/>`,
  momiji: `<path d="M60 18 L66 40 L84 28 L76 48 L98 48 L80 60 L92 74 L72 70 L72 82 L62 74 L60 100 L58 74 L48 82 L48 70
    L28 74 L40 60 L22 48 L44 48 L36 28 L54 40 Z"/>`,
  caldeira: `<path d="M10 84 Q24 50 40 44 L46 52 L52 47 Q60 38 68 47 L74 52 L80 44 Q96 50 110 84 Z"/>
    <path d="M50 70 Q60 52 70 70 Z" class="vide"/><path d="M10 92 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke-width="3"/>
    <circle cx="86" cy="24" r="7"/>`,
  vapeur: `<path d="M24 92 L96 92 L92 84 Q76 78 60 82 Q44 78 28 84 Z"/>
    <path d="M44 76 q-8 -10 0 -18 q8 -8 0 -18 q-6 -8 2 -14" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M62 76 q-8 -10 0 -20 q8 -8 0 -18 q-6 -8 2 -14" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M80 76 q-7 -9 0 -16 q7 -7 0 -15" fill="none" stroke-width="5" stroke-linecap="round"/>`,
  marmite: `<path d="M26 58 L94 58 L88 92 Q60 100 32 92 Z"/><rect x="22" y="52" width="76" height="7"/>
    <ellipse cx="46" cy="47" rx="8" ry="10" class="vide"/><ellipse cx="62" cy="45" rx="8" ry="10" class="vide"/><ellipse cx="77" cy="48" rx="7" ry="9" class="vide"/>
    <path d="M40 30 q-5 -7 0 -13 M60 28 q-5 -7 0 -14 M80 30 q-5 -7 0 -13" fill="none" stroke-width="4" stroke-linecap="round"/>`,
  etoiles: `<path d="M18 96 L42 62 L66 96 Z"/><path d="M42 62 L42 96" class="vide" stroke-width="2"/>
    <circle cx="30" cy="30" r="3"/><circle cx="52" cy="20" r="2"/><circle cx="76" cy="34" r="3.5"/><circle cx="92" cy="22" r="2"/>
    <circle cx="68" cy="56" r="2"/><circle cx="96" cy="58" r="2.5"/><circle cx="84" cy="74" r="2"/>
    <path d="M58 14 Q84 46 106 86" fill="none" stroke-width="7" stroke-dasharray="2 5" stroke-linecap="round"/>`,
  belvedere: `<path d="M8 96 Q30 70 46 74 Q60 50 78 60 Q96 64 112 96 Z"/>
    <rect x="70" y="30" width="4" height="34"/><path d="M58 30 L92 30 L96 36 L58 36 Z"/><path d="M58 40 L86 40 L90 46 L58 46 Z"/>
    <path d="M14 104 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke-width="3"/>`,
};

/** Un tampon en SVG : t = { id, motif, ja (nom japonais), encre, forme ('rond' | 'carre') }, lieuJa (le lieu en japonais). */
export function dessinTampon(t, lieuJa, taille = 120) {
  const f = `encre-${t.id}`;
  const rond = t.forme !== 'carre';
  const cadre = rond
    ? '<circle cx="60" cy="60" r="55" fill="none" stroke-width="4"/><circle cx="60" cy="60" r="49" fill="none" stroke-width="1.6"/>'
    : '<rect x="6" y="6" width="108" height="108" rx="14" fill="none" stroke-width="4"/><rect x="12" y="12" width="96" height="96" rx="10" fill="none" stroke-width="1.6"/>';
  // le nom du lieu sur l'arc du haut, le nom du tampon en bas
  return `<svg class="tampon-svg" viewBox="0 0 120 120" width="${taille}" height="${taille}" aria-hidden="true">
    <defs><filter id="${f}" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="${t.id.length * 7}" result="b"/>
      <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="trous"/>
      <feComposite in="SourceGraphic" in2="trous" operator="in" result="s"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="1" seed="5" result="d"/>
      <feDisplacementMap in="s" in2="d" scale="2.2"/>
    </filter>
    <path id="arc-${t.id}" d="M22 64 A38 38 0 0 1 98 64" fill="none"/></defs>
    <g filter="url(#${f})" fill="${t.encre}" stroke="${t.encre}" color="${t.encre}">
      ${cadre}
      <g transform="translate(60 54) scale(0.58) translate(-60 -60)" class="motif">${MOTIFS[t.motif] || ''}</g>
      <text font-size="13" font-weight="700" text-anchor="middle" stroke="none"><textPath href="#arc-${t.id}" startOffset="50%">${lieuJa}</textPath></text>
      <text x="60" y="${rond ? 98 : 101}" font-size="14" font-weight="700" text-anchor="middle" stroke="none">${t.ja}</text>
    </g>
  </svg>`;
}

/** Une rotation et un décalage propres à chaque tampon (on ne tamponne jamais droit). */
function biais(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { r: ((h % 21) - 10) * 0.9, x: ((h >> 5) % 9) - 4, y: ((h >> 9) % 9) - 4 };
}

/**
 * Le carnet. el : { fond (le voile), page (son contenu) } ; lieux() → [{ id, nom, nomJa, tampons, textes }]
 * (dans la langue du moment) ; t(cle) : les textes de l'interface ; texteLieu(lieu, tampon) → { nom, indice }.
 */
export function creerCarnet(el, { lieux, t, texteLieu }) {
  let ouvert = false, onglet = null;

  function contenu() {
    const etat = lireTampons();
    const liste = lieux();
    const L = liste.find((l) => l.id === onglet) || liste[0];
    const pris = etat[L.id] || [];
    const onglets = liste.map((l) => `<button type="button" data-onglet="${l.id}" class="${l.id === onglet ? 'actif' : ''}">${l.nom}<small>${(etat[l.id] || []).length}/${l.tampons.length}</small></button>`).join('');
    const cases = L.tampons.map((tp) => {
      const { nom, indice } = texteLieu(L, tp);
      if (!pris.includes(tp.id)) return `<li class="case vide"><span class="trou">?</span><b>${nom}</b><small>${indice}</small></li>`;
      const b = biais(tp.id);
      return `<li class="case"><span class="tampon" style="transform: translate(${b.x}px, ${b.y}px) rotate(${b.r}deg)">${dessinTampon(tp, L.nomJa, 104)}</span><b>${nom}</b></li>`;
    }).join('');
    const complet = pris.length >= L.tampons.length;
    return `<div class="carnet-onglets">${onglets}</div>
      <h2>${L.nom} <span>${L.nomJa}</span></h2>
      <p class="carnet-compte">${t('carnetCompte')(pris.length, L.tampons.length)}</p>
      <ol class="carnet-cases">${cases}</ol>
      ${complet ? `<p class="carnet-complet"><span class="sceau">完</span>${t('carnetComplet')}</p>` : ''}`;
  }

  el.page.addEventListener('click', (e) => {
    const b = e.target.closest('[data-onglet]');
    if (b) { onglet = b.dataset.onglet; el.page.querySelector('.carnet-contenu').innerHTML = contenu(); }
  });

  return {
    ouvert: () => ouvert,
    ouvrir(lieu) {
      if (lieu) onglet = lieu;
      el.page.querySelector('.carnet-contenu').innerHTML = contenu();
      el.fond.hidden = false;
      ouvert = true;
    },
    fermer() { el.fond.hidden = true; ouvert = false; },
  };
}
