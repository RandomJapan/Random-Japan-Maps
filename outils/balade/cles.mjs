// Les textes d'un lieu : les mêmes clés dans les trois langues, les six compagnons partout, les tampons, les noms.
//   node outils/balade/cles.mjs <lieu>
import { pathToFileURL } from 'node:url';
const lieu = process.argv[2];
if (!lieu) { console.log('node outils/balade/cles.mjs <lieu>'); process.exit(1); }
globalThis.localStorage = { getItem: () => null, setItem() {} };
const m = await import(new URL(`../../site/balade/${lieu}.js`, import.meta.url).href);
const T = m.infos.textes, COMP = ['kon', 'pon', 'chapu', 'gao', 'fuwa', 'saya'];
let pb = 0;
const dire = (...a) => { pb++; console.log(...a); };
for (const l of ['en', 'ja']) {
  for (const k of Object.keys(T.fr)) if (!(k in T[l])) dire(`${l} : il manque « ${k} »`);
  for (const k of Object.keys(T[l])) if (!(k in T.fr)) dire(`${l} : « ${k} » en trop`);
  for (const k of Object.keys(T.fr.noms)) if (!(k in T[l].noms)) dire(`${l} : noms.${k} manque`);
}
for (const l of ['fr', 'en', 'ja']) {
  for (const [k, v] of Object.entries(T[l])) {
    // (un texte par compagnon : seulement s'il nomme au moins un compagnon ; les autres objets — les cibles des jumelles de Tottori,
    // les échos des Trente Bouddhas — ont leurs propres clés, comparées d'une langue à l'autre plus bas)
    if (v && typeof v === 'object' && !Array.isArray(v) && k !== 'noms' && k !== 'tampons' && Object.keys(v).some((c) => COMP.includes(c))) {
      for (const c of COMP) if (!v[c]) dire(`${l} : ${k}.${c} manque`);
    }
    // (une liste peut aussi tenir des objets, comme les bouddhas de Sanjubutsu : seule une phrase vide est une faute)
    if (Array.isArray(v)) for (const p of v.flat(3)) if (typeof p === 'string' && !p.trim()) dire(`${l} : ${k} a une page vide`);
  }
  for (const t of m.infos.tampons) if (!T[l].tampons[t.id]) dire(`${l} : le tampon ${t.id} n'a pas son texte`);
}
// les mêmes nombres de pages, à peu près (une question reste la dernière page)
for (const [k, v] of Object.entries(T.fr)) {
  if (Array.isArray(v)) for (const l of ['en', 'ja']) if (Array.isArray(T[l][k]) && T[l][k].length !== v.length) dire(`${l} : ${k} a ${T[l][k].length} page(s), le français ${v.length}`);
  // (un objet qui n'est pas par compagnon : les mêmes clés dans les trois langues)
  if (v && typeof v === 'object' && !Array.isArray(v) && k !== 'noms' && k !== 'tampons' && !Object.keys(v).some((c) => COMP.includes(c))) {
    for (const l of ['en', 'ja']) if (T[l][k] && typeof T[l][k] === 'object') for (const c of Object.keys(v)) if (!(c in T[l][k])) dire(`${l} : ${k}.${c} manque`);
  }
}
console.log(pb ? `${pb} problème(s)` : `textes de ${lieu} : rien à signaler (${Object.keys(T.fr).length} clés)`);
