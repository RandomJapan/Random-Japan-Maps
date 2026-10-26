# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This is an interactive 3D relief map of Japan showing every place featured on the TikTok account @random_japan_place. It is a static site in `site/`, hosted on GitHub Pages. The owner is French and not a developer: talk to them in simple French. Code identifiers and comments are in French too, so keep that convention.

The **source of truth for places is a Google Sheet**, not the repo. The owner adds or edits rows there, and the site reads the sheet on every page load. So adding a place never needs a code change or redeploy. `LISEZMOI.md` is the owner-facing guide.

## Which instructions to read

The owner asked on 2026-10-26 to split the instructions by subject, so a session reads only what its subject needs. The details are in three files in `instructions/`, which are **not** loaded automatically. When the owner's request is about one subject, read that subject's file first, in full (`Read` with `allow_large`), and only that one; open another only when the task really crosses into it (and then only the sections it needs).

| The owner talks about… | Read |
|---|---|
| **the map**: the site in `site/` (everything but `site/balade/`), the Google Sheet and its robot, the data scripts in `outils/`, the game server `serveur/`, place pages, big cities, the game and the daily challenge, the map's events (Halloween…), the map's smoothness | [`instructions/carte.md`](instructions/carte.md) |
| **the 3D walk** (`site/balade/`): a place (Itsukushima, Aogashima, Gokayama, Himeji, Takachiho, a new one), its scenery and 3D models, characters, companions, animals, stamps, secrets, Bunbuku and his shop, outfits, the walk's sounds and music, its smoothness | [`instructions/balade.md`](instructions/balade.md) |
| **TikTok promotion and videos**: motion design, Remotion, editing the owner's footage, voice-overs, rushes shot in the map, the promo films (`outils/video/`, `videos/`) | [`instructions/videos.md`](instructions/videos.md) |

- `instructions/carte.md` also has a short summary of the walk (how the map opens it, what it shares with the map, the owner's rules for a new place); the full walk is in `instructions/balade.md`.
- The section on the 3D model workshop (`site/modeles3d.js`, « 3D place models ») is in both `carte.md` and `balade.md`: the map's models and the walk's scenery are built with it. Change both copies together.
- Write what you learn into the file of its subject, never back here: this file keeps only what every subject needs (the project, the local server, deploying, testing in headless Edge, measuring smoothness, the site's address and the commit author).

## Commands

There is no build step, bundler, package.json, linter or test suite. The site is plain ES modules, and its libraries come from CDNs.

```bash
python -m http.server 8123 --directory site
```
This serves the site locally. It is also the `carte-japon` entry in `.claude/launch.json`, for the Browser pane via `preview_start`. The page must be served over HTTP: ES modules do not load from `file://`.

- Deploying means `git push` to `main`. `.github/workflows/mise-en-ligne.yml` publishes `site/` to GitHub Pages. The same workflow also runs nightly and on manual dispatch; in those runs it first commits refreshed `site/data/secours-*.csv`, new TikTok covers, new game photos and the outlines of cities the robot added (`fabriquer_villes.py --nouvelles`). Every run then builds the place pages before uploading `site/`.

The other commands are in the subject files: the map's data, Sheet and server scripts in `instructions/carte.md`, the video scripts in `instructions/videos.md`.

On this Windows machine, the shell is PowerShell 5.1. After a winget install, refresh PATH before using `git` or `gh`:
`$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`

### Visual verification

The Browser pane can be hidden, and then `requestAnimationFrame` pauses and the map never renders. In that case, take screenshots with Playwright (Python) and headless Edge:
- Launch with `channel="msedge"` and args `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- Wait for `window.carte && document.getElementById('chargement').classList.contains('fini')`.
- `window.carte` is the MapLibre map, exposed for debugging.

The TikTok embedded player shows "Player error" in headless Edge (codec issue). That is expected.

### Measuring smoothness (phones)

The owner asked on 2026-10-02 for smoother zooming on phones. The method that found the causes:
- Headless Edge can use this PC's real GPU: args `--enable-gpu --use-angle=d3d11 --ignore-gpu-blocklist`. Use a phone context (390×844, `device_scale_factor=2`, `is_mobile`), and slow the main thread with CDP `Emulation.setCPUThrottlingRate` (rate 4 ≈ a mid-range Android).
- Script a series of `easeTo` zooms (far view → zoom 12.5 → back to 6). Count frame intervals with a `requestAnimationFrame` loop, and read `Performance.getMetrics` (`ScriptDuration`, `RecalcStyleDuration`) before and after. Do a warm-up pass and reload first, so tiles come from the HTTP cache.
- For JS hotspots, take a CDP `Profiler` profile with `maplibre-gl.mjs` routed to `maplibre-gl-dev.mjs` (readable names). For style recalcs, trace with `disabled-by-default-devtools.timeline.invalidationTracking`: `UpdateLayoutTree` gives the element count, and the invalidation events give the JS stack that caused them.
- SwiftShader is far too slow to judge a phone GPU, so it can't be used for that.
- Results: 6.5 → about 68 frames/s at rate 4 (desktop: about 174).
- For the dive, `plongeon_mesure`-style runs record per frame the zoom, `getCenterElevation()`, the exaggeration and `map.project(place)`. A visible jump shows as the place's screen speed changing sharply between two frames. Resource Timing entries for `tiles.mapterhorn.com` tell which tiles were fetched before the flight and which during it.
- **This PC's GPU hides GPU costs.** It is an AMD Radeon RX 7900 GRE (CPU i5-14600KF): 20 to 50 times a 500 € laptop's integrated chip (Intel UHD/Iris, AMD Radeon 610M…). A frame costs it about 0.7 ms of GPU, so headless runs are always CPU-bound. On 2026-10-19 the owner saw the map stutter on such a laptop. To see GPU costs, time each frame with `EXT_disjoint_timer_query_webgl2` (available in headless Edge): wrap `map.painter.render` with `beginQuery(TIME_ELAPSED_EXT)`/`endQuery`, and wrap `painter.drawFunctions.terrainDepth`, `painter.renderToTexture.renderLayer` (terrain textures + mesh) and `drawFunctions.custom` (per custom layer) with sequential queries; read results a few frames later. Use a laptop context: viewport 1536 × 730, `device_scale_factor=1.25` (a 15.6" 1080p screen at 125 %), CPU rate 2–3. Compare variants by GPU ms per frame, and check each one on magnified screenshots.

## Gotchas

- The live site is https://map.randomjapanplace.com/ (repo `RandomJapan/Random-Japan-Maps`, Pages build type "workflow"). The old https://randomjapan.github.io/Random-Japan-Maps/ redirects there. These hold absolute URLs to that address, to update if the address changes: the canonical link, `og:url` and `og:image` in `index.html`; `ADRESSE` in `outils/fabriquer_pages.py`; and the three share pages `site/legendes/{en,fr,ja}.html`. All other paths in `site/` are relative, so the site works under any path.
- The domain randomjapanplace.com was bought by the owner at OVH on 2026-10-02 (renewal every October, no payment method on file: they pay OVH's invoice). Its OVH DNS zone holds `map` CNAME `randomjapan.github.io.` and a root TXT `google-site-verification=…` (Search Console Domain property). The custom domain is set in the repo's Pages settings (`gh api -X PUT repos/RandomJapan/Random-Japan-Maps/pages -f cname=…`): with workflow builds, a `CNAME` file is ignored. The root domain is kept for the planned Shopify shop.
- Commit as `RandomJapan <334664814+RandomJapan@users.noreply.github.com>` (already set in the repo's local git config) so the owner's personal email never lands in public history.
