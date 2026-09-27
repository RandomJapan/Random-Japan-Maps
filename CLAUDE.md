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
- Terrain exaggeration and the pin scale (`--t` CSS var) change with zoom in `majSelonZoom`. The relief curve lives in `CONFIG.relief`.
- Only call `setTerrain` when `map.isStyleLoaded()` is true.
- Places are HTML `Marker`s with `opacityWhenCovered`. Hiding a category removes its markers from the map (`appliquerFiltres`).
- The start-up camera is different for desktop and phone (`CONFIG.camera`, with `estTelephone()` at ≤720px). A turntable rotation runs until the first user interaction.

### UI

- The categories menu is `construireMenu`. Each row has a checkbox (show/hide on the map) and a button that unfolds the list of its places. Unfolded state is kept on the category object (`c.deplie`), because the menu is rebuilt on every language change and filter change.
- Search results and sub-list items both go through `allerAuLieu()`.
- The place card (`ouvrirLieu` / `remplirFiche`) is a side panel on desktop and a bottom sheet on phones. `paddingFiche()` keeps the place in view: it accounts for the card, and for the categories menu when that is open on desktop.
- If the `Photo` cell is empty, the card uses the TikTok oEmbed thumbnail. The video is the TikTok `player/v1/{id}` iframe, loaded on demand.
- All UI strings are in `TEXTES` (en/fr/ja) in `config.js`. `config.js` is also the only settings file meant for hand editing.

### Icons

`site/icons.js` exports `ICONES` (hand-made 24×24 SVG paths) and `iconeHTML(nom)`. `iconeHTML` falls back to rendering the text as an emoji, so a Sheet can use 🍜 directly.

The same icon names are listed in `ICONES` in `outils/fabriquer_tableau.py`, and in the Sheet's `Icônes` tab, which feeds the Sheet's dropdown. Keep all three in sync when you add an icon. `site/icones.html` is a gallery page for the owner.

### `outils/` (one-off data pipeline)

These scripts built the initial Sheet:
- My Maps KML import (`importer_mymaps.py`);
- TikTok comparison (`comparer_tiktok.py`);
- geocoding (`geocoder.py`);
- `fabriquer_tableau.py` and `excel.py`: they generated the `.xlsx` that was uploaded as the Google Sheet.

**Do not re-run `fabriquer_tableau.py`.** It rewrites `site/data/secours-*.csv` from the old JSON sources, so it would overwrite the backup of the live Sheet with stale data. To refresh the backup, use `sauvegarder_tableau.py`.

## Gotchas

- Photos hosted by Google My Maps cannot be shown cross-site (CORP), so they are kept as local files in `site/photos/`.
- Noto Sans JP renders `ō`/`ū` with a misplaced macron. `--police` therefore lists `Noto Sans` first for Latin text.
- `og:image` must be an absolute URL for social previews. Set it once the GitHub Pages address is known.
