// ================================================================
//  La prise de carte d'un épisode de « Japan Daily » (2026-11-25), sur le moteur des vidéos d'Halloween (halloween/plans.js :
//  window.__planMoteur.plan). rushes.py met l'épisode dans window.__JD ({ plan, lng, lat, codes }) et appelle
//  window.__lancerPlan(window.__JD.plan).
//  Une seule prise, continue, que le montage coupe en deux :
//   0 → 3 s : l'indice. Tout le Japon, de jour, sans épingle ni modèle 3D (on ne doit pas voir le lieu) ; la région du lieu
//             s'allume en rouge comme l'indice du jeu (jeu.js : montrerZone, la même couche sur data/prefectures.geojson), et la
//             caméra s'en approche (ses grands morceaux cadrés, comme jeu.js : les petites îles lointaines ne comptent pas).
//   3 → 6,2 s : la réponse. De la région, la caméra plonge sur le lieu en 1,5 s (arrivée à 4,5 s, sur le temps où le montage
//             écrit le nom), la région s'efface, l'épingle du lieu et les modèles 3D reviennent ; elle tourne lentement autour.
//  Le lieu finit plus bas que le milieu de l'image (le nom est écrit en haut).
// ================================================================
(() => {
  const { plan } = window.__planMoteur;
  const jd = window.__JD;
  const ROUGE = '#a8321f';
  const map = window.carte;
  const T_DIVE = 3.0, T_ARRIVEE = 4.5, DUREE = 6.2;
  const CAP = 34; // l'axe du Japon (sud-ouest → nord-est) à la verticale de l'image étroite
  const JAPON = [137.3, 36.4, 4.2, 28, CAP];
  const PROCHE = { zoom: 13.0, pitch: 58 };
  const MARGE = 180;
  const TOUR = 16; // degrés par seconde, de la plongée à la fin
  const lisse = (u) => u * u * (3 - 2 * u);
  const tresLisse = (u) => u * u * u * (u * (u * 6 - 15) + 10);
  const borne = (x) => Math.max(0, Math.min(1, x));
  const merc = ([lng, lat]) => [(lng + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2];
  const geo = ([x, y]) => [x * 360 - 180, (360 / Math.PI) * Math.atan(Math.exp((1 - 2 * y) * Math.PI)) - 90];

  /** Les grands morceaux de la région (≥ 10 % du plus grand, et celui du lieu) : leur boîte. */
  async function boiteRegion() {
    const geojson = await (await fetch('data/prefectures.geojson')).json();
    const morceaux = [];
    for (const f of geojson.features) {
      if (!jd.codes.includes(f.properties.code)) continue;
      for (const poly of f.geometry.coordinates) {
        const b = [Infinity, Infinity, -Infinity, -Infinity];
        let aire = 0;
        const a = poly[0];
        for (let k = 0; k < a.length; k++) {
          const [x, y] = a[k], [x2, y2] = a[(k + 1) % a.length];
          b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
          aire += x * y2 - x2 * y;
        }
        morceaux.push({ b, aire: Math.abs(aire) / 2 });
      }
    }
    const grand = Math.max(...morceaux.map((m) => m.aire));
    const dansB = (m) => jd.lng >= m.b[0] && jd.lng <= m.b[2] && jd.lat >= m.b[1] && jd.lat <= m.b[3];
    const garde = morceaux.filter((m) => m.aire >= grand * 0.1 || dansB(m));
    return garde.reduce((a, m) => [Math.min(a[0], m.b[0]), Math.min(a[1], m.b[1]), Math.max(a[2], m.b[2]), Math.max(a[3], m.b[3])],
      [Infinity, Infinity, -Infinity, -Infinity]);
  }

  async function lancer() {
    // Toute la prise a une marge en haut (MARGE px CSS d'une page de 432 × 768) : le centre de la caméra s'affiche à
    // MARGE + (768 − MARGE) / 2 = 474 px, soit 62 % de la hauteur. À l'arrivée le centre est le lieu lui-même (la caméra tourne
    // autour de lui) : il tombe sous le nom écrit en haut.
    // La région, cadrée dans le bas de l'image (en haut : l'indice écrit ; en bas : la légende de TikTok). cameraForBounds ne
    // connaît pas la marge (elle décale tout de MARGE / 2 vers le bas) : on remonte d'autant la boîte où la région doit tenir.
    const b = await boiteRegion();
    map.jumpTo({ pitch: 26, bearing: CAP });
    const cr = map.cameraForBounds([[b[0], b[1]], [b[2], b[3]]],
      { padding: { top: 290 - MARGE / 2, bottom: 170 + MARGE / 2, left: 36, right: 70 }, bearing: CAP, maxZoom: 7.4 });
    const R = [cr.center.lng, cr.center.lat, Math.min(7.4, cr.zoom), 26, CAP];
    const F = [jd.lng, jd.lat];
    // le Japon entier : le même cadre que sans marge (son centre pris MARGE / 2 plus bas à l'écran)
    map.jumpTo({ center: JAPON.slice(0, 2), zoom: JAPON[2], pitch: JAPON[3], bearing: JAPON[4], padding: { top: 0, bottom: 0, left: 0, right: 0 } });
    const cj = map.unproject([map.getContainer().clientWidth / 2, map.getContainer().clientHeight / 2 + MARGE / 2]);
    JAPON[0] = cj.lng; JAPON[1] = cj.lat;
    // les clés : l'indice (le Japon → la région), une tenue, puis la plongée calculée image par image : le zoom monte en douceur, et
    // l'écart (à l'écran) entre le centre et l'arrivée se réduit d'autant (en Mercator, multiplié par 2^(z0 − z)) : le lieu glisse
    // vers sa place sans jamais sortir de l'image
    const cles = [[0, ...JAPON], [0.35, ...JAPON.slice(0, 2), JAPON[2] + 0.04, ...JAPON.slice(3)], [2.5, ...R], [T_DIVE, R[0], R[1], R[2] + 0.08, R[3], R[4]]];
    const mR = merc([R[0], R[1]]), mF = merc(F);
    const z0 = R[2] + 0.08;
    for (let t = T_DIVE + 1 / 30; t <= DUREE + 1e-6; t += 1 / 30) {
      const u = borne((t - T_DIVE) / (T_ARRIVEE - T_DIVE));
      const z = t <= T_ARRIVEE ? z0 + (PROCHE.zoom - z0) * tresLisse(u) : PROCHE.zoom + 0.22 * lisse(borne((t - T_ARRIVEE) / (DUREE - T_ARRIVEE)));
      const k = Math.pow(2, z0 - z) * (1 - tresLisse(u));
      const m = [mF[0] + (mR[0] - mF[0]) * k, mF[1] + (mR[1] - mF[1]) * k];
      const p = R[3] + (PROCHE.pitch - R[3]) * lisse(u);
      cles.push([t, ...geo(m), z, p, CAP + TOUR * (t - T_DIVE)]);
    }

    // la région en rouge (comme l'indice du jeu, plus marquée pour un téléphone), sous les modèles 3D
    const filtre = ['in', ['get', 'code'], ['literal', jd.codes]];
    const dessous = map.getLayer('modeles-3d') ? 'modeles-3d' : undefined;
    map.addSource('jd-zone', { type: 'geojson', data: 'data/prefectures.geojson', maxzoom: 8 });
    map.addLayer({ id: 'jd-zone', type: 'fill', source: 'jd-zone', filter: filtre, paint: { 'fill-color': ROUGE, 'fill-opacity': 0 } }, dessous);
    map.addLayer({ id: 'jd-zone-bord', type: 'line', source: 'jd-zone', filter: filtre, layout: { 'line-join': 'round' },
      paint: { 'line-color': ROUGE, 'line-width': 3.2, 'line-opacity': 0 } }, dessous);
    const modeles = (oui) => { if (map.getLayer('modeles-3d')) map.setLayoutProperty('modeles-3d', 'visibility', oui ? 'visible' : 'none'); };
    modeles(false);

    // sans les épingles (leurs noms non plus) ; à la plongée, seulement celle du lieu
    const css = `.repere:not(.jd-vu) { visibility: hidden !important; } .repere-nom { display: none !important; }
      .repere.jd-vu .repere-tete { animation: jd-pop .45s cubic-bezier(.3, 1.6, .5, 1) both; transform-origin: 50% 100%; }
      @keyframes jd-pop { from { scale: 0.2; } to { scale: 1; } }`;
    const film = plan({ duree: DUREE, cles, css, marge: { top: MARGE }, actions: [[T_DIVE, () => modeles(true)]] });
    // l'épingle du lieu : le repère dont la position (le second translate que MapLibre lui donne) est celle du lieu à l'écran ;
    // le relief le remonte un peu (son altitude), d'où le poids plus faible de l'écart vertical. Choisie une fois la caméra assez
    // près pour qu'aucune autre ne s'en approche (0,7 s après le début de la plongée) : elle apparaît en route, d'un petit bond.
    let epingle = null;
    film.chaqueImage((t) => {
      if (t < T_DIVE + 0.7) return;
      if (!epingle?.isConnected) {
        const p = map.project([jd.lng, jd.lat]);
        let dmin = 60;
        for (const el of document.querySelectorAll('.repere')) {
          const m = [...el.style.transform.matchAll(/translate\(([-\d.]+)px, ([-\d.]+)px\)/g)].pop();
          if (!m) continue;
          const d = Math.abs(+m[1] - p.x) + 0.3 * Math.abs(+m[2] - p.y);
          if (d < dmin) { dmin = d; epingle = el; }
        }
      }
      epingle?.classList.add('jd-vu');
    });
    // la teinte : elle monte (0,2 → 0,5 s), bat une fois, se pose ; elle s'efface au début de la plongée
    film.chaqueImage((t) => {
      const monte = borne((t - 0.2) / 0.3), bat = Math.max(0, Math.sin(Math.PI * borne((t - 0.5) / 0.5)));
      const part = (t < T_DIVE ? 1 : 1 - borne((t - T_DIVE - 0.2) / 0.6)) * monte;
      map.setPaintProperty('jd-zone', 'fill-opacity', part * (0.34 + 0.2 * bat));
      map.setPaintProperty('jd-zone-bord', 'line-opacity', part * 0.95);
    });
    window.__jdCles = { R, F, JAPON };
  }

  window.__plansSupp = { [jd.plan]: () => { lancer(); } };
})();
