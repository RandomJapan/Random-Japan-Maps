# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This is an interactive 3D relief map of Japan showing every place featured on the TikTok account @random_japan_place. It is a static site in `site/`, hosted on GitHub Pages. The owner is French and not a developer: talk to them in simple French. Code identifiers and comments are in French too, so keep that convention.

The **source of truth for places is a Google Sheet**, not the repo. The owner adds or edits rows there, and the site reads the sheet on every page load. So adding a place never needs a code change or redeploy. `LISEZMOI.md` is the owner-facing guide.

## Commands

There is no build step, bundler, package.json, linter or test suite. The site is plain ES modules, and its libraries come from CDNs.

```bash
python -m http.server 8123 --directory site
```
This serves the site locally. It is also the `carte-japon` entry in `.claude/launch.json`, for the Browser pane via `preview_start`. The page must be served over HTTP: ES modules do not load from `file://`.

- `python outils/sauvegarder_tableau.py`: refreshes the fallback CSVs from the live Sheet. The nightly GitHub Action runs the same thing.
- `python outils/preparer_logo.py`: regenerates `site/img/logo.jpg`, `favicon.png`, `icone-180.png` and `partage.jpg` from the images in `outils/logo-source/`. Needs Pillow.
- `python outils/fabriquer_masque.py`: rebuilds `site/data/masque-voisins.geojson` from Natural Earth.
- `python outils/fabriquer_cote.py`: rebuilds `site/data/cote-japon.geojson`, the coastline used for the water-lines and the islands' shadow.
- `python outils/fabriquer_houle.py`: rebuilds two files from that coastline and from the neighbours mask. `site/data/distance-cote.png` is the distance-to-coast image behind the swell and the ships. `site/data/masque-large.geojson` is the open-sea mask. Run it after `fabriquer_cote.py` or `fabriquer_masque.py`. Needs numpy, Pillow and opencv-python.
- `python outils/fabriquer_eaux.py`: rebuilds `site/data/eaux-japon.geojson`, the lakes and big rivers.
  - The data comes from OpenStreetMap through the Overpass API (ODbL: the map credits "© OpenStreetMap"). Natural Earth only had Lake Biwa and three Japanese rivers.
  - It keeps river relations wider than `RIVIERE_GARDE` (50 km) and lakes, lagoons and reservoirs that have a Wikidata entry and are wider than 3.5 km. `distance-cote.png` tells Japan from its neighbours.
  - Overpass is often busy (504 and 429 errors): the script retries, asks for geometry in small batches, and caches every answer in the system temp folder (`carte-japon-eaux`), so a rerun resumes.
  - Keep the fetch threshold (`RIVIERE_MIN`) at 40 km: changing it changes the batches and downloads everything again. Change `RIVIERE_GARDE` instead.
  - Needs Pillow.
- `python outils/fabriquer_frontieres.py`: rebuilds `site/data/frontieres-japon.geojson`, the land borders between prefectures, from OpenStreetMap (Overpass, same cache and retries as `fabriquer_eaux.py`).
  - In OSM, Japan's prefecture relations (admin_level 4) are made of offshore lines (`maritime=yes`) plus the land borders. A land border is a way shared by two prefectures and not tagged `maritime=yes`.
  - Ways are stitched per prefecture pair and simplified to about 60 m. `n` is `r` for a border between two big regions (`REGIONS` is copied from `regions.js`), `p` otherwise. On `r` borders, `g` and `d` are the regions on the left and right of the line's direction (found by testing points 1 km to each side against `prefectures.geojson`), so the map can paint each side's colour.
  - It also prints a label point per prefecture (the point farthest from the edges). `site/noms-regions.js` keeps those points, several moved by hand off the legends: rerunning does not change the labels.
- Deploying means `git push` to `main`. `.github/workflows/mise-en-ligne.yml` publishes `site/` to GitHub Pages. The same workflow also runs nightly and on manual dispatch; in those runs it first commits refreshed `site/data/secours-*.csv`.

On this Windows machine, the shell is PowerShell 5.1. After a winget install, refresh PATH before using `git` or `gh`:
`$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`

### Visual verification

The Browser pane can be hidden, and then `requestAnimationFrame` pauses and the map never renders. In that case, take screenshots with Playwright (Python) and headless Edge:
- Launch with `channel="msedge"` and args `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- Wait for `window.carte && document.getElementById('chargement').classList.contains('fini')`.
- `window.carte` is the MapLibre map, exposed for debugging.

The TikTok embedded player shows "Player error" in headless Edge (codec issue). That is expected.

## Architecture

### Data flow (`site/app.js`)

1. `chargerCSV()` fetches the Sheet's "Publish to web" CSV URLs (`CONFIG.tableau.lieux` / `.categories` in `site/config.js`, fetched with `no-store`). If that fails, or the answer is HTML, it falls back to `site/data/secours-*.csv`.
2. `lireCSV()` is a small custom CSV parser (there is no PapaParse). Header names are matched loosely by `champ(ligne, [aliases])`, after `normaliser()` has removed accents, spaces and punctuation from them. So `Nom (EN)` matches the alias `nomen`.
   - When you add a Sheet column, add its alias in `construireLieux` / `construireCategories`.
   - Never rename the Sheet headers (row 1) or the tab names `Lieux` / `Catégories`.
3. `construireLieux()` skips rows with no English name, unparseable GPS, or `Afficher ? = Non`.
   - The id is the slug of the English name. It is also the URL hash deep link (`#udo-inari-shrine`).
   - `lireGPS` accepts `lat, lng`, decimal commas, and swapped order.
4. `construireCategories()` joins places to the Catégories tab by name, case-insensitively.
   - A category the tab doesn't know gets the `pin` icon and a `PALETTE` color.
   - Empty categories are hidden.
5. Each language has its own column (`nom.en/fr/ja`, `description.*`). `enLangue()` falls back to English. The FR/JA cells in the Sheet are prefilled with `GOOGLETRANSLATE` formulas, so `nettoyer()` treats `#ERROR…` and `Loading…` as empty.

### Map

- MapLibre GL JS **v6**. It is ESM-only, so import it with `import * as maplibregl from '…/maplibre-gl.mjs'` (there is no default export).
- There is no basemap, only these layers:
  - a `raster-dem` from **Mapterhorn** (terrarium, 512 px tiles; the sea is exactly 0 m, so it stays flat);
  - a `color-relief` hypsometric palette;
  - `hillshade`;
  - a GeoJSON mask that paints the neighbouring countries in the sea color, so Japan floats alone.
- Terrain exaggeration and the pin scale change with zoom in `majSelonZoom`. The relief curve lives in `CONFIG.relief`.
  - The pin scale is the `--t` CSS var. It moves in 0.1 steps only, because changing it every frame re-lays out all the pins.
- **Do not call `map.setTerrain()` to change exaggeration.** It destroys and rebuilds the whole terrain, which made zooming stutter badly. Use `changerRelief()` instead. It mutates `map.terrain.exaggeration`, then calls `map._camera.applyTerrainChange()`. These are MapLibre 6.11.2 internals (the version is pinned in the CDN URLs), so re-check `changerRelief` if you upgrade MapLibre. It falls back to `setTerrain` if the internals are missing.
- Do not guard terrain updates with `map.isStyleLoaded()`. It stays false while tiles load, which left the ×30 exaggeration stuck after flying to a place.
- Phone performance choices:
  - `pixelRatio` is capped at 2;
  - `.panneau` panels have no `backdrop-filter` (the blur was recomputed every frame);
  - place flights use a lower pitch.
- Places are HTML `Marker`s with `opacityWhenCovered`. Hiding a category removes its markers from the map (`appliquerFiltres`).
- The start-up camera is different for desktop and phone (`CONFIG.camera`, with `estTelephone()` at ≤720px). A turntable rotation runs until the first user interaction.

### UI

- The categories menu is `construireMenu`. Each row has a checkbox (show/hide on the map) and a button that unfolds the list of its places. Unfolded state is kept on the category object (`c.deplie`), because the menu is rebuilt on every language change and filter change.
- Search results and sub-list items both go through `allerAuLieu()`.
- The place card (`ouvrirLieu` / `remplirFiche`) is a side panel on desktop and a bottom sheet on phones.
  - On phones, its handle can be dragged (`brancherPoignee`). The sheet has three states: normal (`64dvh`), `.agrandie`, and closed. `paddingFiche()` keeps the place in view: it accounts for the card, and for the categories menu when that is open on desktop.
- If the `Photo` cell is empty, the card uses the TikTok oEmbed thumbnail. The video is the TikTok `player/v1/{id}` iframe, loaded on demand.
- All UI strings are in `TEXTES` (en/fr/ja) in `config.js`. `config.js` is also the only settings file meant for hand editing.

### Visual design ("vieille carte", the antique relief map)

The owner chose this world on 2026-09-30, from three reference images. It replaced the "Estampe" print world of 2026-09-29. **`DESIGN.md` is the design system**: read it before any visual change. `PRODUCT.md` holds the product context. `.impeccable/brief-carte.md` holds the direction contract; it is dev-only and must never be copied into `site/`.

The redesigns were done with the Impeccable skill (`~/.claude/skills/impeccable`, installed without its binary launcher or hooks). The key mechanics:
- **Palette.** Map inks live in `app.js` and in `CONFIG.couleurs`: the sepia relief ramp, the umber hillshade, the sky, horizon and haze, and the sea. UI tokens are CSS vars in `style.css`: `--papier*`, `--encre*`, `--trait`, `--rouge`, `--sarcelle`.
- **Sea.** The relief's sea stops are **transparent** (the float16 margin rule below still applies). The sea colour is the `background` layer, and three sets of line layers show through from under the relief: `cote-ombre` (the islands' shadow), `lignes-eau-1..3` (engraved water-lines, drawn with `line-gap-width`; once the animated swell of `mer.js` is ready it replaces them, see Living sea) and `cote-encre` (the coast ink, over the relief).
  - Their source is `site/data/cote-japon.geojson`, built by `outils/fabriquer_cote.py` from Natural Earth. It covers Japan's coasts plus the Kurils, since the mask leaves the Kurils visible.
  - The Natural Earth coast is too coarse to match the relief up close, so these layers fade out between zoom 6.5 and 8.5.
- **Lakes and rivers.** The owner asked for them on 2026-10-01, in the sea colour. They come from `eaux-japon.geojson` (source `eaux`, see `fabriquer_eaux.py`), drawn over the relief and under `cote-encre`:
  - `rivieres-bord` (water-line #3d6b64) under `rivieres` (sea colour) make a turquoise line with a fine dark edge. The width grows with the zoom and with `km` (the river's extent). Rivers shorter than 100 km fade in between zoom 4.5 and 6.5, so the far view only shows the big ones.
  - `lacs` (sea-colour fill) and `lacs-bord` (water-line edge) are drawn after the rivers, so rivers end cleanly in the lakes.
  - The OSM shapes are accurate (simplified to about 60 m), so unlike the coast layers they stay at every zoom.
- **Regions and prefectures.** The owner asked on 2026-10-01 for every region to be outlined and named when zooming in. Borders come from `frontieres-japon.geojson` (source `frontieres`, see `fabriquer_frontieres.py`) and are drawn over the relief, under the rivers:
  - Between two big regions: `lavis-g` and `lavis-d`, a blurred watercolour band on each side of the line in that region's colour (`LAVIS_REGIONS` in `app.js`, placed with `line-offset`), under `frontieres-regions`, a dash-dot sepia line. They show at every zoom.
  - Between two prefectures: `frontieres-prefectures`, short sepia dashes over `frontieres-prefectures-fond`, a pale paper underlay that keeps them readable in the mountains' shade. They fade in between zoom 5.5 and 6.5. (Dots were too faint on the ridges.)
  - Hokkaidō, Shikoku, Kyūshū and Okinawa have no land border with another region: the sea outlines them.
  - Names are HTML markers in `site/noms-regions.js`, pitched with the map like the sea names. Region names (Zen Antique spaced capitals; Kyūshū and Okinawa are written separately) show between zoom 5.5 and 7.4, then prefecture names (IM Fell italic, Zen Antique in Japanese; French uses the English name, as the dice does) between 7.4 and 10.5.
  - The text is in an inner `<span>`, because MapLibre sets the marker element's own opacity. The markers are inserted just before `#papier`, so the aged paper lies over them and the legends and pins stay in front.
- **Masks.** `voisins` (from `masque-voisins.geojson`) paints the neighbouring countries in the sea colour. `large` (from `masque-large.geojson`) paints everything farther than about 70 km from Japan, or closer to a neighbour than to Japan.
  - The second mask exists because Natural Earth misses thousands of tiny foreign islets, mostly off Korea. From above they showed as sub-pixel sand specks that twinkled whenever the map moved.
- **Aged paper.** `#papier` (grain, foxing and vignette: one static background with SVG turbulence, normal alpha) is moved by `app.js` into the map's canvas container, right after the canvas. It therefore sits over the relief and under the markers.
  - Do not use `mix-blend-mode` or `backdrop-filter` there. Both are recomputed every frame.
- **Ornaments.**
  - Sea names are HTML markers in `MERS` (`app.js`), with `pitchAlignment: 'map'` and `rotationAlignment: 'viewport'`. They hide below the `.loin` threshold. Their positions were picked so they fit on the phone start view.
  - The compass rose `#btn-rose` rotates with `-bearing` on every `rotate` event; a tap eases north up.
  - The title scroll `.bandeau` (Japan · 日本 · Japon, inline SVG) sits bottom-left. The attribution control is shifted to its right, and wraps on phones.
- **Category colours.** They come from the Sheet and are aged toward sepia in CSS with `color-mix(in oklab, var(--c) 78%, #4a3521)`, both for markers and for `.pastille`.
- **Far view.** Below zoom `ZOOM_POINTS` (6.2), `majSelonZoom` adds `.loin` on the map container. Markers then turn into 11px dots so the relief shows, and the sea names show.
- **Place card.**
  - The Japanese name is a vertical `.cartouche` over the photo. It is appended to `#fiche-media`, so it disappears when the video plays.
  - Category · prefecture sits under the title. The prefecture fills in asynchronously via `preparerPrefectures()`.
  - Share is an icon button on the photo (`#fiche-partager`), and "More info" is a link after the description (`#fiche-plus`).
- **First-visit hint.** `#aide` shows `aideTel` on phones and `aide` on desktop. It is shown once: a `localStorage` flag (`aideVue`) is set when it hides.
- **Phone camera.** The start-up camera is rotated (`orientation: 38`) so Japan stands upright on the tall screen.
- **Fonts.**
  - Zen Antique sets names and titles.
  - IM Fell English (italic) sets map lettering only.
  - Noto Sans sets everything else.

### 3D place models (`site/couche3d.js`, `site/modeles3d.js`)

When the map is zoomed in, every place shows a small low-poly model of its category's **icon**, on a round base in the (sepia-aged) category colour. The HTML marker floats just above its model.
- **Model set.** `modeles3d.js` builds every model from three.js primitives (no asset files), one per icon name in `ICONES`.
  - `ALIAS` maps `camera` to `viewpoint`, and `star` and `pin` to `stele`.
  - Emojis and unknown icons get `stele`.
  - Each model is about 1 unit tall, fits in a radius-0.5 disc, and is merged into one vertex-coloured geometry.
  - When you add an icon, add its model too (otherwise it shows the stele). `site/modeles.html` is the owner-facing gallery and the quickest visual check.
- **Loading.** three.js (pinned `0.186.1`, jsDelivr ESM, `URL_THREE` exported by `couche3d.js`) is dynamically imported, so start-up is unchanged. `mer.js` loads it about 1.5 s after the map is up, for the ships. Otherwise it loads the first time zoom reaches 7. If it fails to load, the map just has no models or ships.
- **Rendering.** One MapLibre custom layer, `modeles-3d` (`renderingMode: '3d'`), shares MapLibre's GL context and depth buffer, so terrain hides models behind mountains.
  - There is one `InstancedMesh` per model plus one for the bases: about 25 draw calls.
  - Instance matrices are rebuilt every frame, only for places inside the view bounds, relative to the map centre (relative-to-centre, so there is no float32 jitter at zoom 16). The projection is `defaultProjectionData.mainMatrix × translate(centre)`.
  - The base elevation is `map.queryTerrainElevation()` (exaggeration included). It is cached per place until the exaggeration changes or a `relief` tile arrives.
- **Pitfalls.**
  - The model-to-map basis is deliberately a **mirror**: (x, y, z) → (x, z, y). With a proper rotation, the faces rendered inside-out, showing back faces only (dark models, bases seen as arcs).
  - The models' directional light follows the camera, coming from the viewer's upper left. A fixed north-west light (like the hillshade) left every model backlit, because the camera usually looks north.
- **Size.** Models appear between zoom 8.6 and 9.6 (they grow out of the ground). Their on-screen height is `62px × 2^((z − 10.5) / 2)`, capped at 170px.
- **Marker lift.** `couche3d.js` sets `--leve` on the map container: the model's screen height × sin(pitch), in 4px steps, to avoid restyling every marker each frame. Each marker has `--h`, its model's height. `.repere-tete` and `.repere-nom` add `--leve × --h` to their `bottom`.
- **Clicks.** A tap on a model opens its place (`lieuSous()`, a screen-box test from the drawn places).
- **Antialiasing.** It is enabled only when `devicePixelRatio < 2` (`canvasContextAttributes`). Phones don't need it and it costs GPU time.

### Living sea (`site/mer.js`)

In the far view (below `ZOOM_CALME` = 7.2) the sea comes alive. The owner settled the parts on 2026-10-01: the coastal swell, a few 3D Edo ships far out at sea, a whale and a sea serpent.
- **What was dropped.** The owner first chose engraved wavelets and ships on fixed coastal routes. After seeing them live, they found it too busy: the map was harder to read. Keep the sea sparse and keep ships away from the coasts.
- **Hiding when zoomed in.** At 7.2 and above, the container gets `.mer-calme`: every `.vie-marine` element gets `display: none`, the ship layer draws nothing and the clock stops.
- **Swell.** The fixed `lignes-eau-1..3` layers are hidden once the swell is ready, and a custom layer, `houle`, redraws them as lines rolling in toward the coasts.
  - The custom layer is raw WebGL2: one quad over `BORNES`, plus a fragment shader that reads `data/distance-cote.png`. That image encodes the distance as `d = (v/255)² × 160` screen px at zoom 5, in Mercator, from Japan's coast only, so the masked neighbours get no swell.
  - Its GL resources are created in the first `render()`, which MapLibre wraps with `setDirty()`. The layer turns off `POLYGON_OFFSET_FILL` itself, because MapLibre does not track it.
  - It sits slightly above sea level with a polygon offset, so the relief hides it on land and behind mountains.
  - If WebGL2 or the image is missing, the fixed lines simply stay.
- **Why not animate the line layers?** With terrain, MapLibre bakes every line, fill, hillshade and color-relief layer into per-tile textures. Their cache key ignores paint values, and `setPaintProperty` fires a style event that re-bakes every tile. Changing paint every frame would re-render the whole relief every frame. A custom layer only needs `triggerRepaint()`, which redraws the cached textures.
- **The clock.** One `requestAnimationFrame` loop runs at 15 fps. It moves the ships, schedules the creatures and calls `triggerRepaint()` (for the swell and the ships). It does nothing while `.mer-calme` is set or the page is hidden.
- **Ships.** These are 3D bezaisen (kitamae-bune), drawn by `fabriquerBateau()` in `modeles3d.js` and rendered by a second three.js custom layer, `bateaux-3d`, with its own renderer on the shared GL context. It uses the same mirror basis and camera-relative sun as `couche3d.js`.
  - The waterline is y = 0 and the hull dips below it. The relief's sea surface (0 m) writes depth, so it hides the hull's underside.
  - At most `MAX_BATEAUX` (2) sail at once. A new one is tried every `ENTRE_BATEAUX` seconds.
  - Each trip is a straight line toward one of `PORTS` (Edo-period ports, each with a seaward bearing). It starts at least `LARGE_DEPART` (46px at zoom 5, about 90 km) from any coast. It ends where the line comes within `LARGE_FIN` (30px) of a coast.
  - 60% of ships sail in toward the port and 40% sail out. Each grows in, rocks as it sails, and shrinks away at the end.
  - They grow when you zoom in and shrink when you zoom out, but more slowly than the map: `TAILLE_BATEAU` = 22px tall at zoom 5, ×1.5 per zoom level (`CROISSANCE_BATEAU` = 0.6, while the map doubles). Their speed is fixed in map units (`VITESSE_BATEAU` = 3px/s at zoom 5).
  - The owner asked for both. First, a constant screen size looked wrong while zooming. Then, growing exactly with the map (40px at zoom 5) made a ship as big as Sado island: they asked for ships in proportion with the pins and legends.
  - Between zoom 6.6 and 7.2 (`FONDU_BATEAUX`) the material's opacity fades them out, so a 150px ship does not pop away at `ZOOM_CALME`.
  - A trip is rejected if `queryTerrainElevation` finds land along it (for example islands hidden under the masks), if the start is not `bienVisible`, or if another ship is within 140px.
- **Creatures.** `BETES` lists a whale (real whale-watching spots) and a sea serpent (open sea). Each plays a CSS scene when `mer.js` adds `.joue` (scene lengths are in `style.css`). A spot is used only if it passes `bienVisible`: on screen, clear of the sea names, and not behind relief (`map.unproject(map.project(spot))` must land near the spot).
  - `jouerScene(nom, [lng, lat])` is exported for tests: `(await import('/mer.js')).jouerScene('baleine', [134.4, 33.05])`.
- **Reduced motion.** Nothing in the sea moves:
  - the swell is not added (the fixed lines stay);
  - three.js is not loaded early and there are no ships;
  - the clock never starts and the CSS animations are off;
  - no creature appears.
- **Filming it.** For GIFs, Playwright can slow the page: wrap `requestAnimationFrame` timestamps and set `playbackRate` on `document.getAnimations()` in an init script. Then set the GIF frame times back to real speed.

### Hidden legends (`site/legendes.js`)

On 2026-10-01 the owner asked for easter eggs: references to Japanese legends scattered over the map, in the style of the whale and the serpent. From examples they chose: legends visible only when you zoom into a region, a found counter with a "Bravo" once all are found, all four themes (yokai, heroes and warriors, gods and myths, sea legends), and about twenty of them.
- **Content.** `LEGENDES` lists 22 legends, north to south. Each has an `id`, a `region` (a `REGIONS` key from `regions.js`), `ou` (where the foot of the drawing stands) and `nom`, `lieu`, `texte` in en/fr/ja.
  - The drawings are inline SVG in `legendes-dessins.js` (64 × 60, foot at y ≈ 56). Their colours and idle motions are in `legendes.css`. They were generated once by a throwaway script and are kept as literal SVG: edit them by hand.
  - Some legends belong to a place that has its own pin (Kashima-jingū, Kibitsu-jinja, Amanoiwato-jinja). They are offset by 6 to 12 km so the pin does not cover them.
- **Loading.** `app.js` imports the module 1.5 s after the map is ready (`chargerLegendes`). If it fails, the map simply has no legends.
- **Markers.** Each legend is an HTML `Marker`: a `button.legende` with `data-legende=<id>`. It is moved in the DOM to just after `#papier`, so the place pins stay in front of it.
  - Below `ZOOM_LEGENDES` (6.5) the container gets `.sans-legendes` and the legends are hidden: you have to zoom into a region to find them.
  - Only the legends inside the view get `.anime` (their idle loop), recomputed on `moveend`. Under reduced motion nothing moves.
- **The bubble.** A tap opens a MapLibre `Popup` (`.bulle-legende`). It shows the name, a second name (Japanese, or English in the Japanese UI), the place and the story. `garderVisible()` pans the map when the bubble would slide under the top buttons, which happened on phones.
- **Found legends.** They are kept in `localStorage` (`legendesTrouvees`, this browser only).
  - The first find reveals `#btn-legendes` with its count, and each find shows a toast.
  - The button opens `#panneau-legendes`. Found legends show their drawing; a tap flies there and opens the bubble. The others show "Not found yet" and their region, as a hint.
  - When the last one is found, a "Bravo" card with a red 伝説 seal appears.
- **Tests.** `(await import('/legendes.js')).ouvrirLegende('kitsune')` opens a bubble as a tap would, and counts the legend as found.
- **Texts.** The UI strings are in `TEXTES` (`legendes*`, `legendeTrouvee`, `legendeInconnue`, `legendeAria`, `bravo*`).

### Visit counter (`site/compteur.js`)

On 2026-10-01 the owner asked for a visitor count on the desktop map. They chose **GoatCounter** (free, cookie-free analytics with a dashboard) over an Apps Script counter or a keyless public counter, and chose to count **every visit**.
- `CONFIG.goatcounter` in `config.js` is the account code (`code` for `code.goatcounter.com`). While it is empty, nothing is loaded or shown.
- `brancherCompteur` (called first thing in `demarrer`) injects `gc.zgo.at/count.js` with `data-goatcounter`, so every page load counts, phones included. count.js skips localhost, so local tests never count.
- On desktop only, it fetches `https://<code>.goatcounter.com/counter/TOTAL.json`. That needs "Allow adding visitor counts on your website" ticked in the GoatCounter site settings; without it the request fails and the counter stays hidden.
  - `count` is a formatted string ("1 094 100"), so the code keeps the digits only. It counts GoatCounter "visitors", which are sessions: a reload soon after does not count again, a return visit later does.
  - GoatCounter caches that public total for up to 4 hours. So the counter rolls up from 0 to the total in 1.6 s, then adds the current visit (+1, with a small jump). It re-reads the total every 15 minutes while the tab is visible.
- The `#visites` box sits in the header, right of the title, behind an ink rule. It is hidden on phones. (Do not reuse `.compteur`/`#compteur`: they are the Categories count badge.)
- Texts: `visites(n)` and `visitesInfo` (the tooltip) in `TEXTES`.
- Tests: route `config.js` to set a fake code and fulfil `TOTAL.json` and `count.js` with Playwright (`ctx.route`).

### Random place (the dice)

The "Au hasard" button opens `#panneau-hasard`: a region `<select>` (all Japan, 8 regions with `optgroup`s, or one prefecture), a type `<select>` (categories) and a roll button.
- **Prefectures are not in the Sheet.** Each place's prefecture is computed in the browser from its GPS coordinates.
  - The outlines are in `site/data/prefectures.geojson`, generated by `outils/fabriquer_prefectures.py` from Natural Earth.
  - That script also prints the prefecture found for every place, which is how the results were checked.
- Coastal and small-island places can fall just outside the simplified outlines. For those, the code picks the prefecture whose nearest **edge** is closest. The nearest vertex is not enough: Uradome Coast came out in Hyōgo instead of Tottori.
- Region and prefecture names and the region grouping live in `site/regions.js`. The outlines are prefetched 3 s after start-up.
- A place opened by the dice sets `tirageActif`, which shows the `#fiche-autre` "Un autre !" re-roll button on the card.

### Icons

`site/icons.js` exports `ICONES` (hand-made 24×24 SVG paths) and `iconeHTML(nom)`. `iconeHTML` falls back to rendering the text as an emoji, so a Sheet can use 🍜 directly.

The same icon names are listed in `ICONES` in `outils/fabriquer_tableau.py`, and in the Sheet's `Icônes` tab, which feeds the Sheet's dropdown. Keep all three in sync when you add an icon, and give the new icon a 3D model in `site/modeles3d.js`. `site/icones.html` is a gallery page for the owner.

### The Sheet robot (`outils/robot-tableau.gs`)

The robot is a Google Apps Script. The owner pastes a TikTok link into an empty row of `Lieux` (in `Nom (EN)`, or in `Lien TikTok` with an empty name), and the robot fills the whole row.
- **Where it runs.** It is a *standalone* Apps Script project, "Robot carte" (`https://script.google.com/home/projects/1MXTOIbdJ85kVtWstryW6DnIrialyZOHZDgt5x0LnENphuMCl20Jit97q/edit`). It opens the Sheet by `ID_TABLEAU`. The repo file is only a reference copy.
- **Updating it.** Push the file, then load it into the editor:
  1. Get the raw GitHub URL at the commit sha. The pinned sha avoids raw's cache.
  2. In the editor tab, run `monaco.editor.getModels()[0].setValue(code)`.
  3. Click the "Enregistrer le projet dans Drive" button. Ctrl+S does not save.
  - If the Chrome window is minimized, dispatch mouse events on the aria-labelled buttons from JS.
- **Triggers.** `installerRobot()` creates two: `robotCarte` every 10 min, and an installable onEdit (`quandModifie`) for the Sheet.
  - `robotCarte` takes a script lock and handles at most 3 rows per pass.
  - Its status and doubts go in a `Robot` column: ⏳ = retry, ❌ = the robot waits until the owner erases the message.
- **Pipeline** (`preparerFiche_`):
  1. TikTok oEmbed gives the caption.
  2. **Before any AI**, it geocodes the caption's own place name with `Maps.newGeocoder()` (`nomDansLegende_`: "Ibuki Tree Art Sculpture | Kagawa 📍 #…" becomes "Ibuki Tree Art Sculpture, Kagawa").
     - The owner's names usually come from Google Maps, so this gives an exact POI (types `establishment`/`tourist_attraction`).
     - The resulting address is fed to call 1.
     - Without it, Gemini read "Ibuki" as the juniper tree and placed Ibuki Island's artwork 37 km away, in Manno.
  3. Gemini call 1 (`identifierLieu_`) returns the place name plus search queries. Compilations are moved to the `À trier` tab.
  4. It searches Wikipedia (en + ja) and runs a second geocode with call 1's Japanese query. All of these are free and keyless.
  5. Gemini call 2 (`redigerFiche_`) writes `nom_fr`, the category and the 3 descriptions, and picks a GPS source (`google_maps_legende`, `google_maps` or `wikipedia_*`).
  6. `choisirGPS_` prefers a precise Google Maps hit within 3 km. It flags `approx` when Maps only found an area, or when Wikipedia and precise Maps disagree.
  - An `approx` row gets `Afficher ? = Non`, so no wrong pin goes public.
  - **The EN/JA names always come from call 1, in code.** With the name left to call 2, Gemini (especially flash-lite) renamed Udo Inari Shrine to its famous neighbour Udo Jingū, because Wikipedia only covers the latter.
  - Because the names are locked to call 1, a kanji typo from it would stick (it wrote 七宝隆寺 for 七宝瀧寺). `corrigerNomJa_` fixes that case: it takes the title of a Wikipedia article located within 1 km of the chosen GPS when that title is the same length and differs by exactly one character. The 1 km check keeps 東大寺 and 西大寺 apart.
  - The free sources don't describe obscure places (for example the artwork 伊吹の樹 on Ibuki Island). The prompts forbid inventing details and made-up Japanese names, so expect short, general descriptions there.
- **AI.** It uses the free Gemini API tier (`CLE_GEMINI` in Script properties; the owner created that key and it must never pass through us). The Anthropic API was rejected because it is paid.
  - The free tier has no Google Search grounding on 3.x models.
  - `demanderGemini_` falls through the model list on 429, 404 or 5xx. `gemini-3.8-flash` often returns 503 "high demand", so flash-lite does much of the work.
  - `verifierCle()` lists which configured models exist.
- **Tests.** `testerSansIA()` and `testerAvecIA()` run on `LIENS_TEST` without writing to the Sheet. There are three test cases:
  - Udo Inari: a famous-neighbour trap;
  - Ibuki Tree Art Sculpture: its exact spot is 34.1302, 133.5345;
  - Shipporyu-ji: its correct Japanese name is 七宝瀧寺, and call 1 gets that kanji wrong.
  - A full run takes about 5 to 55 s per video. It is slower when `gemini-3.8-flash` answers 503.
  - To choose the function to run, use real clicks on the dropdown. Synthetic JS events do not select an option.
- Rows the robot fills get `Afficher ? = Oui`, `À vérifier = Oui` and a yellow background, so they are live on the map before the owner reviews them.

### `outils/` (one-off data pipeline)

These scripts built the initial Sheet:
- My Maps KML import (`importer_mymaps.py`);
- TikTok comparison (`comparer_tiktok.py`);
- geocoding (`geocoder.py`);
- `fabriquer_tableau.py` and `excel.py`: they generated the `.xlsx` that was uploaded as the Google Sheet.

**Do not re-run `fabriquer_tableau.py`.** It rewrites `site/data/secours-*.csv` from the old JSON sources, so it would overwrite the backup of the live Sheet with stale data. To refresh the backup, use `sauvegarder_tableau.py`.

## Gotchas

- Photos hosted by Google My Maps cannot be shown cross-site (CORP), so they are kept as local files in `site/photos/`.
- `color-relief` palette: many mobile GPUs read the filtered DEM texture as float16, so the sea (exactly 0 m) decodes to about −0.5 m. The palette stops are read exactly, though. So never put stops within about 1 m of 0: stops at ±0.02 m once turned the whole sea green on phones. Headless Edge screenshots (SwiftShader) cannot catch this, because they decode exactly.
- Noto Sans JP renders `ō`/`ū` with a misplaced macron. `--police` therefore lists `Noto Sans` first for Latin text. The display face Zen Antique (`--police-titre`) renders them correctly.
- Mapterhorn returns 404 for some open-ocean DEM tiles. That is expected: the sea colour comes from the background layer, so those areas still render.
- The live site is https://randomjapan.github.io/Random-Japan-Maps/ (repo `RandomJapan/Random-Japan-Maps`, Pages build type "workflow"). `og:url` and `og:image` in `index.html` are absolute URLs to that address: update them if the address changes.
- Commit as `RandomJapan <334664814+RandomJapan@users.noreply.github.com>` (already set in the repo's local git config) so the owner's personal email never lands in public history.
