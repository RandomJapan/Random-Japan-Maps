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
  // Gokayama (2026-10-23) : la maison au toit de chaume devant les montagnes (le belvédère) ; le torii sous les cèdres ;
  // les feuilles de papier qui sèchent au soleil ; la sasara de la kokiriko et ses baguettes ; les canons à eau
  gassho: `<path d="M6 70 L30 46 L44 58 L62 36 L80 52 L92 42 L114 70" fill="none" stroke-width="3"/>
    <path d="M24 88 L60 22 L96 88 Z"/><path d="M44 88 L60 58 L76 88 Z" class="vide"/>
    <rect x="53" y="66" width="14" height="5"/><rect x="50" y="76" width="20" height="5"/>
    <rect x="34" y="88" width="52" height="12"/><rect x="55" y="90" width="10" height="10" class="vide"/>`,
  jinja: `<path d="M12 96 L24 34 L36 96 Z"/><path d="M84 96 L96 34 L108 96 Z"/>
    <path d="M30 44 Q60 36 90 44 L89 51 Q60 43 31 51 Z"/><rect x="37" y="56" width="46" height="5"/>
    <rect x="42" y="49" width="6" height="47"/><rect x="72" y="49" width="6" height="47"/>
    <path d="M45 67 Q60 74 75 67" fill="none" stroke-width="3.2"/><rect x="51" y="70" width="3" height="8"/><rect x="66" y="70" width="3" height="8"/>
    <rect x="18" y="96" width="84" height="4"/>`,
  washi: `<circle cx="22" cy="22" r="8"/>
    <path d="M22 100 L44 22 L56 24 L36 100 Z"/><path d="M41 32 L52 34 L38 84 L27 82 Z" class="vide"/>
    <path d="M64 100 L86 22 L98 24 L78 100 Z"/><path d="M83 32 L94 34 L80 84 L69 82 Z" class="vide"/>
    <rect x="12" y="100" width="96" height="4"/>`,
  sasara: `${Array.from({ length: 15 }, (_, k) => {
    const a = Math.PI + (k * Math.PI) / 14, c = Math.cos(a), s = Math.sin(a);
    return `<path d="M${(60 + c * 20).toFixed(1)} ${(66 + s * 20).toFixed(1)} L${(60 + c * 38).toFixed(1)} ${(66 + s * 38).toFixed(1)}" fill="none" stroke-width="4.5"/>`;
  }).join('')}
    <rect x="17" y="64" width="9" height="12" rx="2"/><rect x="94" y="64" width="9" height="12" rx="2"/>
    <path d="M21 76 L18 88 M99 76 L102 88" fill="none" stroke-width="2.5"/>
    <path d="M36 100 L84 86 M36 86 L84 100" fill="none" stroke-width="5" stroke-linecap="round"/>`,
  hosui: `<path d="M17 86 Q34 10 66 42" fill="none" stroke-width="5" stroke-dasharray="8 4" stroke-linecap="round"/>
    <path d="M103 86 Q86 10 54 42" fill="none" stroke-width="5" stroke-dasharray="8 4" stroke-linecap="round"/>
    <circle cx="66" cy="48" r="2.5"/><circle cx="54" cy="50" r="2.5"/><circle cx="60" cy="44" r="2"/>
    <path d="M32 100 L60 54 L88 100 Z"/><path d="M50 100 L60 80 L70 100 Z" class="vide"/>
    <rect x="13" y="84" width="8" height="16"/><rect x="99" y="84" width="8" height="16"/>`,
  // Himeji (2026-10-25) : une fleur de cerisier ; la porte en losange (ses fenêtres en cloche, ses losanges) ; le puits
  // d'Okiku et sa petite flamme ; le grand donjon et ses toits ; une carpe et ses ronds dans l'eau
  sakura: `${Array.from({ length: 5 }, (_, k) => `<path transform="rotate(${k * 72} 60 60)" d="M60 58 C49 47 43 31 52 21 L60 28 L68 21 C77 31 71 47 60 58 Z"/>`).join('')}
    <circle cx="60" cy="60" r="9" class="vide"/>
    ${Array.from({ length: 5 }, (_, k) => { const a = (k * 72 + 36) * Math.PI / 180; return `<circle cx="${(60 + Math.sin(a) * 5).toFixed(1)}" cy="${(60 - Math.cos(a) * 5).toFixed(1)}" r="1.8"/>`; }).join('')}`,
  hishi: `<path d="M8 40 Q60 26 112 40 L107 48 Q60 36 13 48 Z"/>
    <rect x="22" y="49" width="76" height="17"/>
    <path d="M38 64 L38 56 Q38 51 43 51 Q48 51 48 56 L48 64 Z" class="vide"/><path d="M72 64 L72 56 Q72 51 77 51 Q82 51 82 56 L82 64 Z" class="vide"/>
    <rect x="16" y="68" width="88" height="11"/>
    ${[28, 44, 60, 76, 92].map((x) => `<path d="M${x} 69.5 L${x + 4} 73.5 L${x} 77.5 L${x - 4} 73.5 Z" class="vide"/>`).join('')}
    <rect x="24" y="80" width="10" height="20"/><rect x="86" y="80" width="10" height="20"/>
    <rect x="12" y="80" width="10" height="20"/><rect x="98" y="80" width="10" height="20"/><rect x="8" y="100" width="104" height="4"/>`,
  ido: `<path d="M60 22 Q51 13 58 3 Q59 10 64 12 Q69 16 65 21 Q63 24 60 22 Z"/>
    <rect x="24" y="30" width="7" height="42"/><rect x="89" y="30" width="7" height="42"/><rect x="18" y="27" width="84" height="6"/>
    <circle cx="60" cy="40" r="5"/><path d="M60 45 L60 56" fill="none" stroke-width="2"/><rect x="55" y="56" width="10" height="8"/>
    <path d="M28 72 L92 72 L89 100 Q60 106 31 100 Z"/>
    <ellipse cx="60" cy="72" rx="33" ry="7"/><ellipse cx="60" cy="72" rx="25" ry="4" class="vide"/>
    <path d="M30 86 L90 86 M44 74 L42 86 M62 76 L62 86 M80 74 L82 86 M36 88 L34 99 M54 88 L54 102 M72 88 L72 102 M88 88 L86 99" class="vide" fill="none" stroke-width="2"/>`,
  tenshu: `<path d="M52 18 L56 12 L58 18 Z M62 18 L64 12 L68 18 Z"/>
    <path d="M40 30 Q60 18 80 30 L76 33 L44 33 Z"/><rect x="47" y="33" width="26" height="7" class="vide" stroke-width="2"/>
    <path d="M34 46 Q60 36 86 46 L82 50 L38 50 Z"/><rect x="42" y="50" width="36" height="7" class="vide" stroke-width="2"/>
    <path d="M28 62 Q60 52 92 62 L88 66 L32 66 Z"/><rect x="37" y="66" width="46" height="8" class="vide" stroke-width="2"/>
    <path d="M22 78 Q60 68 98 78 L94 82 L26 82 Z"/>
    <path d="M30 82 L90 82 L98 102 L22 102 Z"/>
    <path d="M40 40 L40 38 M52 42 L52 40 M68 42 L68 40 M80 40 L80 38" fill="none"/>`,
  koi: `<path d="M86 24 Q102 30 98 46 Q94 60 76 68 Q60 76 48 88 L40 102 L38 88 Q26 94 18 88 Q32 82 42 78 Q56 66 62 52 Q70 32 86 24 Z"/>
    <circle cx="90" cy="34" r="3" class="vide"/><path d="M74 42 Q80 46 78 54 Q72 52 70 46 Z" class="vide"/><path d="M60 64 Q66 66 64 72 Q58 72 56 68 Z" class="vide"/>
    <path d="M66 58 L80 70 L72 72 Z M58 44 L44 40 L52 52 Z"/>
    <path d="M10 104 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke-width="3"/>
    <path d="M70 96 q6 -4 12 0 t12 0" fill="none" stroke-width="2.5"/>`,
  // Takachiho (2026-10-25) : la barque sous la cascade entre les colonnes de basalte ; les nouilles dans le bambou ; le
  // masque d'Okame et les grelots du kagura ; les cèdres mariés et leur corde ; les tas de pierres de la grotte des dieux
  barque: `<rect x="8" y="10" width="9" height="56"/><rect x="19" y="5" width="9" height="61"/><rect x="30" y="12" width="9" height="54"/>
    <rect x="82" y="8" width="9" height="58"/><rect x="93" y="4" width="9" height="62"/><rect x="104" y="12" width="8" height="54"/>
    <path d="M46 8 L46 58 M53 6 L53 61 M60 8 L60 58" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 64 q5 -5 10 0 t10 0 t10 0" fill="none" stroke-width="2.5"/>
    <circle cx="68" cy="68" r="5"/><rect x="63" y="72" width="10" height="9"/>
    <path d="M26 80 L96 80 L88 94 Q60 99 34 94 Z"/><path d="M40 85 L84 85" class="vide" fill="none" stroke-width="2"/>
    <path d="M44 90 L22 102 M80 90 L102 102" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path d="M6 106 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke-width="3"/>`,
  somen: `<path d="M8 34 L112 64 L112 78 L8 48 Z"/>
    <path d="M28 41 L26 50 M52 48 L50 57 M76 55 L74 64 M100 62 L98 71" class="vide" fill="none" stroke-width="2"/>
    <path d="M36 48 q5 -3 9 1 t9 1 t9 1" class="vide" fill="none" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M86 10 L66 58 M97 14 L73 60" fill="none" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M28 82 L92 82 Q90 106 60 106 Q30 106 28 82 Z"/><path d="M36 87 L84 87" class="vide" fill="none" stroke-width="2"/>`,
  kagura: `<circle cx="52" cy="58" r="33"/>
    <path d="M30 40 Q52 24 74 40" class="vide" fill="none" stroke-width="2.4"/>
    <ellipse cx="42" cy="34" rx="5" ry="2.6" class="vide"/><ellipse cx="62" cy="34" rx="5" ry="2.6" class="vide"/>
    <path d="M35 54 q6 -6 12 0 M57 54 q6 -6 12 0" class="vide" fill="none" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="52" cy="76" rx="4.5" ry="3" class="vide"/>
    <path d="M96 40 L96 104" fill="none" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="96" cy="22" r="4.5"/><circle cx="89" cy="30" r="4.5"/><circle cx="103" cy="30" r="4.5"/><circle cx="86" cy="39" r="4.5"/><circle cx="96" cy="38" r="4.5"/><circle cx="106" cy="39" r="4.5"/>
    <path d="M92 104 l-6 10 M96 104 l0 11 M100 104 l6 10" fill="none" stroke-width="2.5" stroke-linecap="round"/>`,
  meoto: `<path d="M34 40 L45 6 L56 40 Z"/><path d="M64 40 L75 6 L86 40 Z"/>
    <path d="M30 58 L45 24 L60 58 Z"/><path d="M60 58 L75 24 L90 58 Z"/>
    <path d="M41 58 L43 88 Q52 96 60 101 Q68 96 77 88 L79 58 L70 58 L68 84 Q64 88 60 90 Q56 88 52 84 L50 58 Z"/>
    <path d="M30 68 Q60 82 90 68" fill="none" stroke-width="4.5"/>
    <path d="M44 74 l-2 10 M60 78 l0 11 M76 74 l2 10" fill="none" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M12 106 L108 106" fill="none" stroke-width="3"/>`,
  // le Pavillon d'or (2026-10-26) : le pavillon et son reflet à l'envers dans l'étang ; la cascade de la porte du Dragon et sa
  // carpe qui saute ; la pièce qui tombe dans le bol devant la stèle ; le bol de thé, son fouet et le gâteau à la feuille d'or ;
  // le goshuin, sa feuille, l'encre et le sceau
  kinkaku: `<path d="M57 8 Q60 3 63 8 L66 6 Q64 11 61 12 L61 15 L59 15 L59 12 Q56 11 54 6 Z"/><rect x="56" y="15" width="8" height="5"/>
    <path d="M32 31 Q60 17 88 31 L85 35 Q60 25 35 35 Z"/><rect x="43" y="35" width="34" height="12"/>
    <path d="M49 46 V41 Q51 37.5 53 41 V46 Z M67 46 V41 Q69 37.5 71 41 V46 Z" class="vide"/><rect x="57" y="40" width="6" height="6" class="vide"/>
    <path d="M20 52 Q60 38 100 52 L96 57 Q60 46 24 57 Z"/><rect x="31" y="57" width="58" height="12"/>
    <path d="M33 60 H87" class="vide" fill="none" stroke-width="1.6"/>
    <rect x="31" y="69" width="58" height="11"/><path d="M41 70 V79 M51 70 V79 M60 70 V79 M69 70 V79 M79 70 V79" class="vide" fill="none" stroke-width="1.8"/>
    <rect x="12" y="81" width="96" height="3"/>
    <path d="M31 88 H89 M31 92 H89" fill="none" stroke-width="2.4" stroke-dasharray="7 3"/>
    <path d="M22 96 Q60 108 98 96 L94 93 Q60 103 26 93 Z" opacity="0.75"/>
    <path d="M44 104 H76" fill="none" stroke-width="2.4" stroke-dasharray="5 3" opacity="0.75"/>
    <path d="M34 108 Q60 117 86 108 L83 106 Q60 113 37 106 Z" opacity="0.6"/>`,
  ryumon: `<path d="M6 104 L10 40 Q16 26 30 30 L40 36 L44 104 Z"/><path d="M114 104 L110 44 Q104 28 90 32 L80 38 L76 104 Z"/>
    <path d="M44 34 Q60 28 76 34 L76 40 L44 40 Z"/>
    <path d="M52 40 L52 76 M60 40 L60 80 M68 40 L68 76" fill="none" stroke-width="3" stroke-dasharray="9 4"/>
    <path d="M58 92 Q50 74 56 60 Q62 50 70 54 Q66 60 68 66 L76 62 L72 72 Q72 84 64 94 Z"/>
    <circle cx="66" cy="60" r="1.6" class="vide"/><path d="M60 72 L56 70 M62 80 L57 79" class="vide" fill="none" stroke-width="1.4"/>
    <path d="M34 98 q6 -5 12 0 t12 0 t12 0 t12 0 t12 0" fill="none" stroke-width="3"/>
    <circle cx="48" cy="86" r="2.4"/><circle cx="80" cy="84" r="2"/><circle cx="44" cy="80" r="1.6"/>`,
  zeni: `<path d="M30 92 L30 40 Q30 16 60 16 Q90 16 90 40 L90 92 Z"/>
    <circle cx="60" cy="40" r="11" class="vide"/><path d="M50 74 Q50 54 60 52 Q70 54 70 74 Z" class="vide"/><circle cx="60" cy="40" r="6"/>
    <path d="M18 92 L102 92 L96 106 Q60 112 24 106 Z"/><ellipse cx="60" cy="92" rx="42" ry="5" class="vide"/>
    <circle cx="96" cy="24" r="9"/><rect x="93" y="21" width="6" height="6" class="vide"/>
    <path d="M86 36 L80 46 M100 38 L98 48 M92 40 L88 52" fill="none" stroke-width="2.2" stroke-linecap="round"/>`,
  matcha: `<path d="M14 54 L66 54 Q66 92 40 96 Q14 92 14 54 Z"/><ellipse cx="40" cy="54" rx="26" ry="6"/>
    <ellipse cx="40" cy="54" rx="21" ry="4" class="vide"/><path d="M28 54 q4 -2 8 0 t8 0 t8 0" class="vide" fill="none" stroke-width="1.6"/>
    <rect x="30" y="96" width="20" height="5"/>
    <path d="M86 20 L86 50" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M76 52 Q86 46 96 52 L100 84 Q86 92 72 84 Z"/><path d="M78 56 L76 82 M84 56 L83 84 M90 56 L91 84 M96 56 L98 82" class="vide" fill="none" stroke-width="1.6"/>
    <ellipse cx="88" cy="104" rx="18" ry="6"/><rect x="80" y="94" width="16" height="9" rx="3"/><rect x="85" y="95" width="6" height="5" class="vide"/>`,
  goshuin: `<rect x="26" y="8" width="68" height="104" rx="3"/><rect x="31" y="13" width="58" height="94" class="vide"/>
    <path d="M78 18 L76 34 M70 22 L80 24" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path d="M60 20 Q52 34 56 46 Q64 50 66 58 Q58 70 62 82 Q66 92 58 100" fill="none" stroke-width="6" stroke-linecap="round"/>
    <path d="M48 30 L70 32 M50 62 L68 60" fill="none" stroke-width="4" stroke-linecap="round"/>
    <rect x="42" y="66" width="34" height="34" fill="none" stroke-width="3"/><rect x="47" y="71" width="24" height="24" fill="none" stroke-width="1.6"/>
    <path d="M40 22 L40 44 M36 52 L36 70" fill="none" stroke-width="2.6" stroke-linecap="round"/>`,
  ishi: `<path d="M8 104 Q10 32 60 24 Q110 32 112 104 L100 104 Q98 46 60 40 Q22 46 20 104 Z"/>
    <ellipse cx="44" cy="96" rx="14" ry="5.5"/><ellipse cx="44" cy="85.5" rx="11" ry="4.5"/><ellipse cx="44" cy="76.5" rx="8" ry="3.6"/><ellipse cx="44" cy="69" rx="5" ry="2.8"/>
    <ellipse cx="75" cy="97" rx="12" ry="5"/><ellipse cx="75" cy="87.5" rx="9" ry="4"/><ellipse cx="75" cy="79.5" rx="6" ry="3.2"/>
    <ellipse cx="60" cy="100" rx="5" ry="3"/>`,
  // Beppu (2026-10-27) : le grand bassin bleu de l'enfer de la mer, sa vapeur et le panier d'œufs ; la bulle de boue en crâne
  // de moine et ses ronds ; le démon rouge sur son chaudron ; l'étang blanc sous son pin ; le lac de sang et sa vapeur
  umi: `<path d="M30 46 Q22 34 30 24 Q36 16 30 6 M52 44 Q44 30 52 20 Q58 12 52 2 M74 46 Q66 34 74 24 Q80 16 74 6" fill="none" stroke-width="4" stroke-linecap="round"/>
    <path d="M8 70 Q60 52 112 70 L106 92 Q60 108 14 92 Z"/>
    <path d="M22 78 q8 -4 16 0 t16 0 t16 0 t16 0" class="vide" fill="none" stroke-width="2.4"/>
    <path d="M88 26 L100 64 M100 26 L88 64" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path d="M94 58 L94 74" fill="none" stroke-width="1.6"/><path d="M86 72 L102 72 L100 84 L88 84 Z"/>
    <ellipse cx="91" cy="72" rx="2.6" ry="3.2" class="vide"/><ellipse cx="97" cy="72" rx="2.6" ry="3.2" class="vide"/>`,
  bozu: `<path d="M6 92 Q60 70 114 92 L110 108 L10 108 Z"/>
    <path d="M30 86 Q30 52 60 50 Q90 52 90 86 Z"/><path d="M42 64 Q50 56 58 58" class="vide" fill="none" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="60" cy="88" rx="44" ry="9" fill="none" stroke-width="2.4"/><ellipse cx="60" cy="90" rx="54" ry="12" fill="none" stroke-width="1.6"/>
    <circle cx="22" cy="80" r="6"/><circle cx="98" cy="78" r="5"/><circle cx="104" cy="66" r="2.6" fill="none" stroke-width="1.6"/>
    <path d="M40 40 Q34 30 40 20 M60 36 Q54 24 62 12 M80 40 Q74 30 80 20" fill="none" stroke-width="3" stroke-linecap="round"/>`,
  kamado: `<path d="M44 18 L40 6 L48 14 Z M76 18 L80 6 L72 14 Z"/>
    <circle cx="60" cy="30" r="14"/><circle cx="54" cy="28" r="3" class="vide"/><circle cx="66" cy="28" r="3" class="vide"/>
    <path d="M52 36 Q60 42 68 36" class="vide" fill="none" stroke-width="2.4"/>
    <path d="M42 46 Q60 40 78 46 L80 70 L40 70 Z"/><path d="M80 48 L96 26 L100 30 L86 52 Z"/>
    <path d="M28 70 L92 70 Q100 72 98 84 Q94 98 60 100 Q26 98 22 84 Q20 72 28 70 Z"/>
    <path d="M30 78 L90 78" class="vide" fill="none" stroke-width="2"/>
    <rect x="34" y="100" width="52" height="8"/>`,
  shiraike: `<path d="M24 54 Q20 40 34 34 Q42 22 56 28 Q66 18 78 28 Q92 26 92 40 Q102 48 92 56 Q60 66 24 54 Z"/>
    <path d="M58 56 Q56 70 52 82" fill="none" stroke-width="5" stroke-linecap="round"/>
    <path d="M6 88 Q60 70 114 88 L110 104 Q60 116 10 104 Z"/>
    <path d="M26 94 Q60 84 94 94" class="vide" fill="none" stroke-width="3"/>
    <path d="M20 66 Q16 58 22 52 M100 70 Q96 62 102 56" fill="none" stroke-width="2.4" stroke-linecap="round"/>`,
  chinoike: `<path d="M26 46 Q18 32 26 22 Q32 14 26 4 M50 42 Q42 28 50 18 Q56 10 50 0 M74 46 Q66 32 74 22 Q80 14 74 4 M96 48 Q90 36 96 28" fill="none" stroke-width="4" stroke-linecap="round"/>
    <path d="M6 66 Q60 50 114 66 L110 96 Q60 112 10 96 Z"/>
    <circle cx="36" cy="78" r="4" class="vide"/><circle cx="64" cy="84" r="5" class="vide"/><circle cx="88" cy="76" r="3.4" class="vide"/>
    <path d="M44 92 q6 -3 12 0 t12 0" class="vide" fill="none" stroke-width="2.2"/>`,
  // Motonosumi (2026-10-28) : les torii qui serpentent sur la pente jusqu'aux rochers et à la mer ; le grand torii et son tronc
  // tout en haut, une pièce qui vole ; le tunnel des torii, en enfilade ; le souffle du dragon entre deux rochers ; le renard
  // d'Inari et le tofu frit
  toriiPente: `<path d="M104 12 L118 12 M106.5 12 L106.5 24 M115.5 12 L115.5 24 M105 16.5 L117 16.5" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path d="M100 28 Q80 34 74 40 Q90 47 92 54 Q64 62 48 72 Q36 80 30 88" fill="none" stroke-width="9" stroke-dasharray="2.6 2.2"/>
    <path d="M6 96 Q16 82 30 88 Q40 84 50 96 Z"/><path d="M60 104 q7 -4 14 0 t14 0 t14 0 t14 0" fill="none" stroke-width="3"/>
    <path d="M4 108 q7 -4 14 0 t14 0 t14 0 t14 0 t14 0 t14 0 t14 0 t14 0" fill="none" stroke-width="2.6"/>`,
  saisen: `<path d="M12 30 Q60 20 108 30 L107 37 Q60 28 13 37 Z"/><rect x="22" y="46" width="76" height="6"/>
    <rect x="30" y="37" width="8" height="72"/><rect x="82" y="37" width="8" height="72"/>
    <rect x="48" y="38" width="24" height="15" rx="1.6"/><rect x="52" y="41" width="16" height="3.4" class="vide"/>
    <circle cx="60" cy="80" r="6"/><circle cx="60" cy="80" r="2.4" class="vide"/>
    <path d="M52 92 L56 87 M68 92 L64 87 M60 96 L60 89" fill="none" stroke-width="2.4" stroke-linecap="round"/>`,
  toriiTunnel: `<path d="M10 20 L110 20 L107 29 L13 29 Z"/><rect x="21" y="29" width="9" height="84"/><rect x="90" y="29" width="9" height="84"/>
    <path d="M27 38 L93 38 L91 44 L29 44 Z"/><rect x="35" y="44" width="6" height="58"/><rect x="79" y="44" width="6" height="58"/>
    <path d="M39 51 L81 51 L80 55 L40 55 Z"/><rect x="45" y="55" width="4.4" height="40"/><rect x="70.6" y="55" width="4.4" height="40"/>
    <path d="M48 61 L72 61 L71.4 63.6 L48.6 63.6 Z"/><rect x="51.5" y="63.6" width="3" height="27"/><rect x="65.5" y="63.6" width="3" height="27"/>
    <path d="M30 112 L90 112 M36 104 L84 104 M42 97 L78 97" fill="none" stroke-width="2.2"/>`,
  shiofuki: `<path d="M50 100 Q47 62 54 38 Q60 24 66 38 Q73 62 70 100 Z"/>
    <path d="M36 44 Q46 18 60 22 Q74 18 86 42" fill="none" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="34" cy="54" r="3"/><circle cx="88" cy="52" r="3.4"/><circle cx="44" cy="30" r="2.4"/><circle cx="78" cy="28" r="2.6"/><circle cx="60" cy="12" r="3"/>
    <path d="M4 108 L18 80 L38 86 L48 108 Z M72 108 L84 82 L102 78 L116 108 Z"/>
    <path d="M56 50 Q60 44 64 50" class="vide" fill="none" stroke-width="2.4"/>`,
  // les Trente Bouddhas (2026-10-29) : la mer de nuages et les pointes des cèdres ; la sandale de paille des Nio ; la cloche
  // du temple et son tronc ; un bouddha assis dans son halo, sa bougie ; l'écho : quelqu'un qui appelle, la falaise qui répond
  unkai: `<path d="M28 54 L37 28 L46 54 Z M53 48 L64 16 L75 48 Z M80 56 L89 34 L98 56 Z"/><circle cx="100" cy="18" r="7"/>
    <path d="M6 60 Q18 50 30 60 Q42 50 54 60 Q66 50 78 60 Q90 50 102 60 Q110 54 114 60 L114 72 L6 72 Z"/>
    <path d="M10 84 Q24 76 38 84 Q52 76 66 84 Q80 76 94 84 Q104 78 112 84" fill="none" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M22 100 Q36 92 50 100 Q64 92 78 100 Q90 94 100 100" fill="none" stroke-width="3.2" stroke-linecap="round"/>`,
  waraji: `<path d="M60 10 Q84 12 86 46 Q88 84 72 104 Q60 114 48 104 Q32 84 34 46 Q36 12 60 10 Z"/>
    <path d="M44 28 H76 M41 42 H79 M41 56 H79 M43 70 H77 M47 84 H73 M52 96 H68" class="vide" fill="none" stroke-width="2.6"/>
    <path d="M60 18 V100" class="vide" fill="none" stroke-width="2"/>
    <path d="M35 38 Q20 42 24 58 M85 38 Q100 42 96 58 M60 12 Q60 2 52 4" fill="none" stroke-width="3.4" stroke-linecap="round"/>`,
  kane: `<path d="M54 14 Q54 4 60 4 Q66 4 66 14" fill="none" stroke-width="4"/>
    <path d="M40 22 Q40 14 48 14 L72 14 Q80 14 80 22 L84 92 Q86 98 92 100 L28 100 Q34 98 36 92 Z"/>
    <rect x="38" y="56" width="45" height="3" class="vide"/><rect x="58" y="16" width="3" height="40" class="vide"/>
    ${[44, 51, 68, 75].map((x) => [26, 34, 42].map((y) => `<circle cx="${x}" cy="${y}" r="1.9" class="vide"/>`).join('')).join('')}
    <circle cx="60" cy="78" r="6" class="vide"/><circle cx="60" cy="78" r="2.4"/>
    <rect x="92" y="74" width="26" height="9" rx="4"/><path d="M98 74 V52 M112 74 V52" fill="none" stroke-width="2.4"/>`,
  hotoke: `<circle cx="58" cy="40" r="27" fill="none" stroke-width="4"/><circle cx="58" cy="39" r="11"/><circle cx="58" cy="26" r="5"/>
    <path d="M42 60 Q58 50 74 60 L78 86 L38 86 Z"/><path d="M22 90 Q58 78 94 90 Q90 100 58 100 Q26 100 22 90 Z"/>
    <path d="M28 104 Q38 96 48 104 Q58 96 68 104 Q78 96 88 104 L88 112 L28 112 Z"/>
    <path d="M52 70 Q58 66 64 70" class="vide" fill="none" stroke-width="2.2"/>
    <path d="M106 94 Q100 84 106 74 Q112 84 106 94 Z"/><rect x="102" y="96" width="8" height="16"/>`,
  yamabiko: `<path d="M84 8 L116 8 L116 116 L76 116 Q86 96 80 80 Q92 64 84 48 Q94 30 84 8 Z"/>
    <circle cx="20" cy="62" r="7"/><path d="M13 72 L27 72 L30 102 L10 102 Z"/>
    <path d="M36 52 Q44 64 36 76 M46 46 Q56 64 46 82 M56 40 Q68 64 56 88" fill="none" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M72 50 Q65 64 72 78" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 4"/>
    <path d="M90 30 Q96 36 92 44 M94 70 Q100 76 96 84" class="vide" fill="none" stroke-width="2"/>`,
  // Udo (2026-10-30) : la plaquette de vœux en lapin, sa ficelle ; l'escalier sous les torii d'Inari ; le lapin blanc qu'on caresse
  // sur son rocher ; les rochers de la mère, la corde sacrée, les gouttes dans le bassin ; le rocher de la tortue, son creux
  // carré, la corde, et la boule de chance qui vole
  emaLapin: `<path d="M60 4 V24" fill="none" stroke-width="2.6"/><circle cx="60" cy="6" r="3"/>
    <ellipse cx="45" cy="34" rx="9" ry="24" transform="rotate(-14 45 34)"/><ellipse cx="75" cy="34" rx="9" ry="24" transform="rotate(14 75 34)"/>
    <ellipse cx="45" cy="36" rx="3.6" ry="15" class="vide" transform="rotate(-14 45 36)"/><ellipse cx="75" cy="36" rx="3.6" ry="15" class="vide" transform="rotate(14 75 36)"/>
    <ellipse cx="60" cy="78" rx="40" ry="31"/>
    <circle cx="47" cy="70" r="4.4" class="vide"/><circle cx="73" cy="70" r="4.4" class="vide"/>
    <path d="M55 80 Q60 85 65 80" class="vide" fill="none" stroke-width="2.4"/>
    <path d="M40 94 H58 M62 94 H80" class="vide" fill="none" stroke-width="2.2"/>`,
  toriiEscalier: `<path d="M14 30 Q60 22 106 30 L105 37 Q60 30 15 37 Z"/><rect x="22" y="42" width="76" height="5"/>
    <rect x="27" y="36" width="7" height="76"/><rect x="86" y="36" width="7" height="76"/>
    <path d="M38 52 Q60 47 82 52 L81 57 Q60 52 39 57 Z"/><rect x="43" y="56" width="5" height="40"/><rect x="72" y="56" width="5" height="40"/>
    <path d="M50 66 Q60 63 70 66 L69 69 Q60 66 51 69 Z"/><rect x="53" y="68" width="3" height="20"/><rect x="64" y="68" width="3" height="20"/>
    <path d="M40 112 H80 M43 104 H77 M47 97 H73 M51 91 H69" fill="none" stroke-width="3"/>`,
  usagi: `<path d="M8 112 Q16 92 36 90 L84 90 Q104 92 112 112 Z"/>
    <ellipse cx="60" cy="70" rx="25" ry="21"/><circle cx="60" cy="44" r="15"/>
    <ellipse cx="51" cy="20" rx="5.5" ry="16" transform="rotate(-10 51 20)"/><ellipse cx="69" cy="20" rx="5.5" ry="16" transform="rotate(10 69 20)"/>
    <ellipse cx="51" cy="22" rx="2" ry="10" class="vide" transform="rotate(-10 51 22)"/><ellipse cx="69" cy="22" rx="2" ry="10" class="vide" transform="rotate(10 69 22)"/>
    <circle cx="54" cy="44" r="2.6" class="vide"/><circle cx="66" cy="44" r="2.6" class="vide"/>
    <path d="M30 34 Q22 30 18 36 M90 34 Q98 30 102 36 M26 52 Q18 54 16 60" fill="none" stroke-width="2.4" stroke-linecap="round"/>`,
  ochichi: `<path d="M14 22 Q60 34 106 22" fill="none" stroke-width="4"/>
    <path d="M36 28 l-4 8 l6 0 l-4 8 M60 31 l-4 8 l6 0 l-4 8 M84 28 l-4 8 l6 0 l-4 8" fill="none" stroke-width="2"/>
    <path d="M18 70 Q18 44 40 44 Q60 44 60 66 Q60 44 80 44 Q102 44 102 70 Z"/>
    <circle cx="40" cy="66" r="3.4" class="vide"/><circle cx="80" cy="66" r="3.4" class="vide"/>
    <path d="M40 74 Q36 82 40 86 Q44 82 40 74 Z M80 78 Q76 86 80 90 Q84 86 80 78 Z"/>
    <path d="M28 98 H92 L86 112 H34 Z"/><path d="M36 102 Q60 98 84 102" class="vide" fill="none" stroke-width="2.2"/>`,
  // Yakushima (2026-10-31) : le torii de pierre du Yaku-jinja devant les montagnes ; le singe sur sa branche et le cerf dessous ; le
  // rocher Taiko-iwa et les sommets ; la souche de Wilson et son cœur de ciel ; le Jōmon Sugi, son tronc énorme et sa cime
  yakujinja: `<path d="M4 84 L30 44 L46 62 L66 30 L92 66 L104 54 L116 84 Z" opacity="0.35"/>
    <rect x="12" y="34" width="96" height="9" rx="2"/><rect x="20" y="50" width="80" height="6"/>
    <rect x="30" y="40" width="9" height="74"/><rect x="81" y="40" width="9" height="74"/><rect x="55" y="42" width="10" height="9"/>
    <path d="M8 34 Q60 24 112 34 L112 30 Q60 20 8 30 Z"/>`,
  sarushika: `<path d="M4 30 Q50 22 116 26 L116 31 Q50 28 4 36 Z"/>
    <ellipse cx="74" cy="20" rx="9" ry="11"/><circle cx="74" cy="6" r="7"/><ellipse cx="74" cy="7" rx="4" ry="4.4" class="vide"/>
    <path d="M65 26 Q58 30 60 36 L64 34 Q64 30 68 28 Z"/><path d="M82 26 Q88 30 86 36 L82 34 Q82 30 79 28 Z"/>
    <path d="M30 112 L32 86 Q30 76 38 72 L70 70 Q80 64 84 52 L90 50 L94 58 Q92 68 84 74 L84 86 L86 112 L80 112 L78 88 Q60 92 44 88 L40 112 Z"/>
    <path d="M88 50 L84 40 M92 50 L98 42" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path d="M60 44 l-3 6 M66 48 l-1 6" fill="none" stroke-width="2.4" stroke-linecap="round"/>`,
  taikoiwa: `<path d="M2 76 L22 42 L34 54 L52 22 L66 40 L78 30 L98 58 L118 46 L118 80 Z" opacity="0.35"/>
    <path d="M4 112 Q8 80 40 74 Q62 70 84 76 Q114 84 116 112 Z"/>
    <path d="M30 86 Q50 80 70 84" fill="none" class="vide" stroke-width="3"/>
    <circle cx="58" cy="66" r="5"/><path d="M53 74 L58 70 L63 74 L61 76 L58 74 L55 76 Z"/>`,
  wilson: `<path d="M8 114 Q14 92 22 70 Q20 48 32 34 Q46 26 60 30 Q76 26 88 34 Q100 48 98 70 Q106 92 112 114 Z"/>
    <path d="M60 46 C 60 40, 50 36, 46 42 C 42 48, 48 56, 60 66 C 72 56, 78 48, 74 42 C 70 36, 60 40, 60 46 Z" class="vide"/>
    <path d="M50 114 Q54 96 60 92 Q66 96 70 114 Z" class="vide"/>
    <path d="M36 30 L34 8 L42 12 L40 30 Z M80 30 L84 6 L90 14 L84 30 Z"/>`,
  jomonsugi: `<path d="M10 116 Q22 104 30 104 Q32 86 36 70 Q30 64 34 54 Q42 50 44 40 L76 40 Q78 50 86 54 Q90 64 84 70 Q88 86 90 104 Q98 104 110 116 Z"/>
    <path d="M44 40 Q30 34 22 22 Q34 26 44 30 Q46 18 56 10 Q58 22 60 30 Q66 16 78 12 Q76 24 76 32 Q88 24 100 26 Q90 34 76 40 Z" opacity="0.8"/>
    <path d="M48 66 Q52 76 48 88 M64 60 Q60 74 66 92 M74 68 Q78 78 74 90" fill="none" class="vide" stroke-width="2.6" stroke-linecap="round"/>`,
  kameishi: `<path d="M6 108 Q16 100 26 108 Q36 100 46 108 Q56 100 66 108 Q76 100 86 108 Q96 100 106 108 L114 114 L6 114 Z"/>
    <path d="M14 104 Q16 66 60 62 Q104 66 106 104 Z"/>
    <rect x="50" y="66" width="20" height="10" class="vide"/>
    <ellipse cx="60" cy="71" rx="22" ry="8" fill="none" stroke-width="3"/>
    <path d="M100 92 Q110 84 112 92" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path d="M16 18 Q40 6 58 52" fill="none" stroke-width="2.4" stroke-dasharray="4 4" stroke-linecap="round"/>
    <circle cx="14" cy="20" r="8"/><path d="M10 20 H18 M14 16 V24" class="vide" fill="none" stroke-width="1.8"/>`,
  aburaage: `<path d="M30 46 L34 12 L52 36 L68 36 L86 12 L90 46 Q92 70 60 92 Q28 70 30 46 Z"/>
    <path d="M37 20 L40 36 L48 38 Z M83 20 L80 36 L72 38 Z" class="vide"/>
    <path d="M40 54 L54 58 L42 62 Z M80 54 L66 58 L78 62 Z" class="vide"/><ellipse cx="60" cy="80" rx="5" ry="3.6" class="vide"/>
    <rect x="36" y="96" width="48" height="16" rx="3" transform="rotate(-5 60 104)"/>
    <path d="M44 102 L48 102 M56 106 L60 106 M68 101 L72 101 M50 109 L54 109" class="vide" fill="none" stroke-width="2"/>`,
};

/** Un tampon en SVG : t = { id, motif, ja (nom japonais), encre, forme ('rond' | 'carre') }, lieuJa (le lieu en japonais). */
export function dessinTampon(t, lieuJa, taille = 120) {
  const f = `encre-${t.id}`;
  const rond = t.forme !== 'carre';
  // (un motif mal nommé laissait le tampon sans dessin, sans rien dire : Udo, « toiriEscalier », 2026-10-31)
  if (!MOTIFS[t.motif]) console.error(`Tampon sans dessin : ${t.id} (motif « ${t.motif} »)`);
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
 * (dans la langue du moment) ; t(cle) : les textes de l'interface ; texteLieu(lieu, tampon) → { nom, indice } ;
 * recompense(lieu, complet) : le HTML de ce que rapportent tous ses tampons (tenues.js) ; secret(lieu, complet) : celui
 * de son secret (tresors.js : trouvé, ou qu'il en reste un, une fois tous les tampons trouvés), et les koban qu'on a.
 */
export function creerCarnet(el, { lieux, t, texteLieu, recompense = () => '', secret = () => '' }) {
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
      ${complet ? `<p class="carnet-complet"><span class="sceau">完</span>${t('carnetComplet')}</p>` : ''}
      ${recompense(L, complet)}${secret(L, complet)}`;
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
