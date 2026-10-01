---
name: Random Japan Place
description: Every place from the TikToks, on a 3D relief map of Japan drawn like an antique engraved map
colors:
  aged-turquoise-sea: "#8fbab2"
  water-line: "#3d6b64"
  island-shadow: "#2c4a43"
  water-name-ink: "#1c4744"
  parchment-sky: "#e9dcbd"
  pale-horizon: "#d3d6c0"
  sea-haze: "#c4d6cc"
  sand-lowland: "#e3d0a7"
  coast-ink: "#4e3822"
  parchment: "#efe4c8"
  parchment-fresh: "#f6eedb"
  parchment-worn: "#e4d5b1"
  ink-rule: "#8a6b45"
  sepia-ink: "#35251a"
  sepia-ink-soft: "#5b432d"
  sepia-ink-quiet: "#6e533a"
  cartographer-red: "#a8321f"
  cartographer-red-deep: "#8f2716"
  teal-ink: "#1d5652"
typography:
  display:
    fontFamily: "Zen Antique, Noto Serif JP, Georgia, serif"
    fontSize: "27px"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: "Zen Antique, Noto Serif JP, Georgia, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.15
  map-lettering:
    fontFamily: "IM Fell English, Zen Antique, Georgia, serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.2em"
  body:
    fontFamily: "Noto Sans, Noto Sans JP, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Noto Sans, Noto Sans JP, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  paper: "2px"
  sheet: "3px"
  crest: "50%"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.cartographer-red}"
    textColor: "{colors.parchment-fresh}"
    rounded: "{rounded.paper}"
    padding: "8px 12px"
  button-primary-hover:
    backgroundColor: "{colors.cartographer-red-deep}"
  button-secondary:
    backgroundColor: "{colors.parchment-fresh}"
    textColor: "{colors.sepia-ink}"
    rounded: "{rounded.paper}"
    padding: "8px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.parchment-worn}"
  panel:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.sepia-ink}"
    rounded: "{rounded.paper}"
  place-card:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.sepia-ink}"
    rounded: "{rounded.sheet}"
  cartouche:
    backgroundColor: "{colors.parchment-fresh}"
    textColor: "{colors.sepia-ink}"
    rounded: "0"
    padding: "12px 8px 10px"
  map-label:
    backgroundColor: "{colors.parchment-fresh}"
    textColor: "{colors.sepia-ink}"
    rounded: "{rounded.paper}"
    padding: "4px 9px"
  input:
    backgroundColor: "{colors.parchment-fresh}"
    textColor: "{colors.sepia-ink}"
    rounded: "{rounded.paper}"
    padding: "10px 12px"
---

# Design System: Random Japan Place

## Overview

**Creative North Star: "The old relief map on the table"**

The map is an antique relief map of Japan, the kind engraved and hand-tinted for a study wall.
- **The land.** The islands are a shaded sepia model: pale sand on the coasts, ochre-tan hills, umber mountains and bone-white peaks, under a strong umber hillshade lit from the north-west.
- **The sea.** It is an aged, slightly faded turquoise. Engraved water-lines hug every coast, and the islands cast a soft shadow onto it, so they stand up from the sheet. Lakes and the big rivers are washed in the same turquoise, edged with a fine water-line.
- **The living sea.** Seen from afar, the sea moves a little, the way an old map would if it came alive. The water-lines roll slowly in toward the shore as a swell. Now and then a small 3D Edo trading ship (bezaisen) appears far out at sea, sails toward a port of the period and fades before the coast. A whale blows from time to time, and more rarely a sea serpent rises, as on antique charts. The open sea stays sparse, so the map reads first.
- **The hidden legends.** Zoom into a region and small ink-and-watercolour vignettes of Japanese legends appear where they happen: the nine-tailed fox on its split stone at Nasu, the kappa of Tōno, the tengu of Kurama, the eight-headed serpent of Izumo. There are twenty-two of them, to be found like easter eggs. A tap tells the legend in a parchment bubble.
- **The paper.** A grain, faint foxing and burnt edges lie over the whole sheet.
- **The lettering.** The seas are named in 17th-century italic copperplate. Zoom in and the big regions appear in widely spaced letterpress capitals, then the prefectures in small italics.
- **The borders.** Like a hand-coloured atlas, the borders between the big regions are a dash-dot ink line edged on each side with a soft watercolour band in that region's colour. Prefecture borders are fine ink dashes that appear as you zoom in.
- **The ornaments.** A compass rose turns with the map, and a rolled title scroll reads Japan · 日本 · Japon.
- **The interface.** It is made of parchment plates ruled in sepia ink. Cartographer's red marks what the visitor can do.

The owner chose this world on 2026-09-30 from three reference images: a parchment map with a scroll and a compass rose, a shaded beige relief on a turquoise sea, and an old geological relief map. It replaced the "Estampe" woodblock-print world (dark indigo). The map always leads; the interface stays small, square-cornered and flat.

**Key Characteristics:**
- Aged turquoise sea with engraved water-lines and island shadows (far view only)
- Sepia shaded relief; parchment sky and haze at the horizon
- Aged-paper overlay (grain, foxing, vignette) between the relief and the places
- Parchment plates with a double ink rule; 2px corners
- Italic copperplate sea names lying on the water; vertical Japanese names in the Japanese UI
- A compass rose that turns with the map, and a Japan · 日本 · Japon scroll bottom-left
- Up close, every place is a small painted low-poly model of its category, standing on a base in the category colour
- From afar, a living sea: swell rolling to the shore, a few 3D Edo ships far out at sea, a whale or a sea serpent now and then
- Zoomed in, twenty-two hidden legend vignettes to find, each telling its story in a parchment bubble

## Colors

The palette is a hand-tinted engraving: one watercolour wash for the sea, sepia inks for the land and the lettering, and a single red ink for actions.

### Primary
- **Cartographer's Red** (#a8321f): primary actions (Watch on TikTok, Roll the dice, "Another one"), the active language, checked boxes and the selected crest ring. Parchment text on it reads at 5.8:1. Hover goes deeper (#8f2716), never lighter.

### Secondary
- **Teal Ink** (#1d5652): keyboard focus rings, text selection, the "More info" link and the English name under the title in the Japanese UI.

### Neutral
- **Parchment** (#efe4c8): every panel and the place card, overlaid with the paper grain.
- **Fresh Parchment** (#f6eedb): fields, secondary buttons, map labels, the cartouche, the hint, crest rings and text on red.
- **Worn Parchment** (#e4d5b1): hover rows, the count badge and the photo ground.
- **Ink Rule** (#8a6b45): panel borders and the inner line of the double rule.
- **Sepia Ink** (#35251a), with its softer (#5b432d) and quiet (#6e533a) steps: text. The quiet step still reads at 4.9:1 on worn parchment. Never use neutral grey.

### Map inks
- **Aged Turquoise Sea** (#8fbab2): the sea (the map background, seen through the transparent sea stops of the relief) and the mask over neighbouring countries.
- **Water-line** (#3d6b64): the engraved swell lines along the coasts (three fixed lines when motion is reduced), the creatures' ripples, and the fine edge of lakes and rivers.
- **Lakes and rivers**: Aged Turquoise Sea with a Water-line edge, painted over the relief. Rivers widen with the zoom and with their size; only the longest show from afar.
- **Sea life**:
  - the bezaisen (`modeles3d.js`): a timber hull (#7a5232) with high light-wood bulwarks and a dark rail, a sail in alternating parchment strips (#f4ecd8 / #e3d3ae) with the owner's crest, and a red pennant;
  - in `style.css`: a slate whale (#4d6266) with a parchment spout, and a green serpent (#5f8358) with a red crest.
- **Legend vignettes** (`legendes.css`): the same hand as the creatures. Sepia ink outlines (#35251a, 0.8 units), muted washes (moss #7aa05a, straw #cdb06a, indigo #3e5a74, slate #a39f92, ochre #e3b86c), skin #e6bf98, and a brick red (#b23a26) used as a pigment.
- **Island Shadow** (#2c4a43): the blurred shadow cast south-east of every coast.
- **Water-name Ink** (#1c4744): the sea names, with a pale sea halo.
- **Relief ramp** (`app.js`), from Sand Lowland (#e3d0a7) at the coast through ochre, tan and umber to bone white (#efe7d6) at 3500 m, with umber hillshade shadows and paper-white lights.
- **Sky** (#e9dcbd, Parchment Sky), **Horizon** (#d3d6c0) and **Haze** (#c4d6cc): past the horizon the map fades into paper.
- **Coast Ink** (#4e3822): a thin coastline over the relief in the far view.
- **Borders**: Sepia Ink (#35251a). Region borders are dash-dot, prefecture borders short dashes over a pale paper underlay (#f6eedb at 50%).
- **Region washes** (`LAVIS_REGIONS`, 60% and blurred, along region borders only): moss #7f9f5c (Tōhoku, Chūgoku), ochre #cf9c45 (Kantō, Shikoku), rose #c47f72 (Chūbu), indigo #5f7f9e (Kansai), lilac #9a86a8 (Hokkaidō, Kyūshū). Neighbouring regions never share a wash.

**The Red Ink Is a Verb Rule.** Cartographer's red marks only what the visitor can do or has chosen. It has two ornamental uses, both ones a cartographer would make: the north point of the rose (which is itself a button), and the 日本 seal on the title scroll. Drawings (the sea creatures, the legend vignettes and the 伝説 seal of the legends' bravo) may use reds as pigments: the rule is about the interface.

**The Sheet Owns the Hues Rule.** Category colours come from the owner's Google Sheet. The site ages each one toward sepia (`color-mix(in oklab, <colour> 78%, #4a3521)`) so any colour the owner picks sits in the engraving. Do not hard-code category colours.

## Typography

**Display Font:** Zen Antique (with Noto Serif JP, Georgia)
**Map Lettering:** IM Fell English, italic (with Zen Antique for Japanese)
**Body Font:** Noto Sans (with Noto Sans JP, system-ui)

**Character:**
- **Zen Antique** is Meiji letterpress: the old printed voice of names and titles.
- **IM Fell English** is the Fell types of 17th-century English printers: the italic of antique maps.
- **Noto Sans** carries every piece of UI and reading text. It comes first in the stack because Noto Sans JP misplaces the macron on ō and ū.

### Hierarchy
- **Display** (400, 27px desktop / 24px phone, 1.2, balanced): the place name on the card.
- **Title** (400, 19px desktop / 15px phone): the site name in the header and the dice panel title (18px).
- **Map lettering**:
  - Sea names: italic, 22px on desktop and 15px on phone (16px and 12.5px for the minor seas), tracked 0.12–0.2em, lying on the water.
  - Japanese sea names: Zen Antique set vertically, tracked 0.4em.
  - Region names: Zen Antique capitals, 26px (19px on phone), tracked 0.36em, in sepia ink with a paper halo. Japanese: 26px, tracked 0.6em.
  - Prefecture names: IM Fell English italic 18px (15px on phone). Japanese: Zen Antique 16px, tracked 0.2em.
  - The title scroll: IM Fell italic 19px beside a 24px Zen Antique 日本.
- **Cartouche** (Zen Antique 20px, vertical, 0.14em tracking): the Japanese name on the photo. It drops to 16, 14 and 12px for names longer than 6, 8 and 10 characters.
- **Body** (400, 15px, 1.7, max 65ch): place descriptions.
- **Label** (500, 13–14px, sentence case): buttons, menu rows, form labels.

**The Map Lettering Rule.** IM Fell English appears only on the map itself: sea names and the title scroll. Names and titles in the interface are Zen Antique. Buttons, labels, counts and reading text are always Noto Sans.

## Layout

The map fills the screen; the interface floats in the corners with a 12px gutter (plus safe areas).
- **Header.** Top left (logo, name, and a subtitle on desktop only), with the language switch top right. On desktop, the visit counter sits at its right end, behind a 1px ink rule: the number in Zen Antique 19px (tabular figures) over "visits" in 12px soft sepia. On phones it is one line: 30px logo, 15px title, and no counter.
- **Filters.** The Categories and Random buttons sit under the header, and their panels drop below them.
- **Right column.** From top to bottom: the compass rose (58px, 50px on phone), then Reset view, then zoom + and − on desktop only.
- **Bottom left.** The title scroll (240 × 72px, scaled to 0.76 on phone). The attribution sits to its right and wraps onto two lines on phone rather than running under the Reset button.
- **Place card.** A 400px side sheet on desktop. At ≤720px it becomes a bottom sheet: 64dvh by default, dragged up to nearly full height.
- **Card order.** Photo (with cartouche, share and close), then the name, then category · prefecture, then two actions on one line, then the description, then the "More info" link.
- **Phone camera.** It starts rotated (bearing 38°) so the archipelago stands upright.

**The Far View Rule.** The coast ink, water-lines, island shadow and sea names belong to the whole-archipelago view.
- The line layers fade out between zoom 6.5 and 8.5, because the Natural Earth coastline is too coarse to match the relief close up.
- The sea names hide at zoom 6.2 and above, together with the switch from dots to crests.

## Elevation & Depth

Depth comes from the relief: the exaggerated terrain, the hillshade, and the islands' shadow on the sea. The interface stays flat, with one warm ambient shadow so the plates read above the map.

### Shadow Vocabulary
- **Plate** (`box-shadow: 0 4px 14px rgba(52, 36, 18, 0.28)`): every floating panel and button, and the rose.
- **Card** (`box-shadow: 0 16px 44px rgba(52, 36, 18, 0.4)`): the place card, together with the double rule.
- **Crest** (`box-shadow: 0 3px 7px rgba(40, 26, 12, 0.4)`): place markers.

**The Paper Under the Pins Rule.** The aged-paper overlay is inserted right after the map canvas: above the relief, but under the places and sea names, which stay crisp. It is one static image (a gradient plus two SVG turbulence textures) with normal alpha, and nothing in it recomputes while the map moves.

**The No Glass Rule.** No `backdrop-filter` and no `mix-blend-mode` over the map. Both are recomputed every frame while the map moves, and made phones stutter.

## Shapes

- **Corners.** Plates are nearly square: 2px for panels, buttons, fields, labels, the hint and the language segments. The card is 3px, or 8px at the top on phones.
- **Double rule.** Menus, the dice panel and the card carry a double ink rule: the 1px border plus an inset line 3px inside.
- **Circles.** Only crests, far-view dots, the compass rose and the logo are round.
- **Cartouche.** It has square corners and an inner ink frame line (1px, inset 4px).

## Components

### Buttons
- **Shape:** paper corners (2px), 8px × 12px padding (11px on phone), with a 16px icon before the label.
- **Primary:** cartographer's red with parchment text, weight 600. Hover goes a deeper red.
- **Secondary:** fresh parchment with an ink-rule border and sepia text. Hover turns worn parchment with a darker border.
- **Icon buttons** (share and close, 36px): fresh parchment at 92% over the photo, with an ink-rule border and sepia icons.

### Place crests (map markers)
- **Near (zoom ≥ 6.2):** a 32px disc (scaled 0.7–1 with zoom) in the aged category colour, with a 2px fresh-parchment ring, a 1px sepia outline, a parchment icon and a small sepia ink pointer below. On hover it scales to 1.1, and the name appears on a parchment label with an ink rule.
- **Far (zoom < 6.2):** an 11px dot of the same colour with a parchment ring and an ink outline. The touch area extends 10px around it.
- **Selected:** a red ring with a soft red halo, and a red pointer.

### Place models (3D)
- **Content:** one standard low-poly model per category icon (a torii for every shrine, a pagoda for every pagoda…), built from simple faceted shapes with flat painted colours. Examples: vermilion torii, charcoal tile roofs, white castle walls, bronze Buddha, pink cherry tree. Emojis and unknown icons get a stone stele.
- **Base:** a round game-piece base in the category colour, aged toward sepia like the crests.
- **Scale:** the models grow out of the ground between zoom 8.6 and 9.6, then keep a readable size on screen (62px tall at zoom 10.5, growing slowly, 170px at most).
- **Light:** a warm hemisphere light plus a sun from the viewer's upper left, so the side you look at is always lit.
- **Marker:** the crest floats just above its model and points down at it. Tapping the model opens the place, like the crest.

### Living sea (far view)
- **Swell:** the coast water-lines, redrawn by a custom GPU layer (`mer.js`) from a distance-to-coast image. Lines about 9px apart roll in toward the shore at about 2.4px/s, fade in about 32px out and fade away at the coast. They waver slightly, like hand-cut lines, and fade out between zoom 6.5 and 8.5 like the old fixed lines.
- **Ships:** small low-poly 3D bezaisen, lit like the place models. They are 22px tall at zoom 5 (18px on the phone start view) and grow as you zoom in, more slowly than the map (×1.5 per zoom level, about 41px at zoom 6.5), so they stay in proportion with the pins and the legend vignettes. They fade out between zoom 6.6 and 7.2.
  - At most two sail at once. Each appears far out at sea (at least about 90 km from any coast), grows in, sails straight toward an Edo-period port (or away from one) at a steady speed on the map (3px/s at zoom 5), and fades away before getting within about 60 km of a coast.
  - They rock gently and face their heading in 3D.
- **Creatures:** a whale (9s scene: back rises, spout, tail, dive) about every 30–55s at real whale-watching spots. A sea serpent (11s scene: two coils and a crested head) about every 80–130s, far out at sea. Each picks a spot that is on screen, clear of the sea names and not hidden behind mountains.
- **Restraint:** offshore wavelets and coast-hugging ship routes were tried and removed at the owner's request: they made the map harder to read. Do not add more sea ornaments without asking.
- **Bounds:** everything hides at zoom 7.2 and above, where the place models take over. The clock runs at 15 frames per second and stops when the page is hidden. Under reduced motion nothing moves: the fixed water-lines return, and no ship or creature appears.
- **Open-sea mask:** everything farther than about 70 km from Japan (or nearer a neighbour) is painted the sea colour. The thousands of tiny foreign islets that Natural Earth misses would otherwise twinkle as sand specks.

### Hidden legends (zoomed in)
- **Vignettes:** 68px tall (58px on phones), the foot standing on the legend's place, with a soft ink drop shadow. They hide below zoom 6.5 and sit under the place pins. Only the ones on screen play their small idle loop (tails swaying, a fan waving, a catfish making the ground shake). Hover or an open bubble lifts a vignette by 10%.
- **Bubble:** a parchment popup with the ink rule. The title is Zen Antique 19px, the second name is teal Zen Antique, the place is IM Fell English italic (Zen Antique in the Japanese UI), and the story is Noto Sans 13.5px.
- **Counter:** a "Legends n/22" button with a red lantern joins the Categories / Random row after the first find. It opens a parchment list: found legends with their vignette (tap to fly there), unknown ones as a dashed "?" circle with their region as a hint. The count turns red when all are found.
- **Bravo:** a centred parchment card with a red double-ruled 伝説 seal that stamps in, shown when the last legend is found.

### Regions and prefectures (zoomed in)
- **Region names** show between zoom 5.5 and 7.4, placed in the heart of each region and clear of the legend vignettes. Kyūshū and Okinawa each get their own name.
- **Prefecture names** take over between zoom 7.4 and 10.5, at the point farthest from each prefecture's edges, moved by hand where a legend stood.
- Both lie on the land like the sea names, under the aged paper, the legends and the pins, and cross-fade in 0.6s.

### Compass rose (signature)
- **Drawing:** an eight-point rose on a parchment disc. Each point's clockwise half is inked; the north point is red, under a red "N".
- **Behaviour:** it rotates live with the map bearing, including during the start-up turntable. Tapping it stops the turntable and eases north back up.

### Title scroll
- **Drawing:** a parchment band with rolled ends and an inner ink rule, bottom-left. It reads Japan · 日本 · Japon, with 日本 in red Zen Antique.
- **Behaviour:** it is decorative (`aria-hidden`) and does not catch taps.

### Sea names
- **Seas:** Sea of Japan, Pacific Ocean, East China Sea and Sea of Okhotsk, in the visitor's language.
- **Placement:** each is an HTML marker pitched with the map, so it lies on the water, but kept upright to the screen.

### Title cartouche
- **Content:** the place's Japanese name, set vertically on fresh parchment in sepia ink at the photo's top right.
- **Motion:** it unrolls downward (clip-path, 0.6s, `cubic-bezier(0.16, 1, 0.3, 1)`) when the card opens, and appears without motion under reduced motion.

### Panels (menus, dice)
- **Style:** parchment with the double rule. Rows highlight in worn parchment.
- **Checkboxes:** they turn red when checked. Category crests follow the marker style.

### Inputs / Fields
- **Style:** fresh parchment with an ink-rule border and 2px corners.
- **Focus:** a teal-ink border plus a 1px teal ring, and a red caret.

### First-visit hint
A fresh-parchment label with an ink rule at the bottom centre ("Tap a place to watch its video"). It shows on the first visit only.

### Loader
A parchment ground printed with a faint seigaiha wave pattern (the sea motif of old Japanese maps), with the logo in a double ink ring.

## Do's and Don'ts

### Do:
- **Do** keep panels Parchment (#efe4c8) with a 1px Ink Rule (#8a6b45) border and 2px corners, and give the large ones (menus, dice panel, card) the double rule.
- **Do** set interface names and titles in Zen Antique, map lettering in IM Fell English italic, and everything else in Noto Sans.
- **Do** write in Sepia Ink (#35251a) on parchment, using its softer steps for secondary text, never grey.
- **Do** keep the relief's sea stops transparent and paint the sea with the background, so the water-lines and island shadows show beneath.
- **Do** use Cartographer's Red (#a8321f) only for actions and chosen states (plus the rose's north point and the 日本 seal).

### Don't:
- **Don't** use `backdrop-filter`, glass, blur or `mix-blend-mode` over the map.
- **Don't** use pill shapes or corners above 3px on plates (circles are only for crests, dots, the rose and the logo).
- **Don't** put colour-relief stops within about 1 m of 0 m: many phone GPUs read the sea as about −0.5 m.
- **Don't** show unsoftened Sheet colours: always pass them through the sepia mix.
- **Don't** draw a decorative border around the screen: the owner chose the scroll, rose, sea names and aged paper, and left the frame out.
- **Don't** put a category label or kicker above a heading.
- **Don't** show the legend vignettes in the far view: they are meant to be found by zooming in, and the whole-Japan view stays clean.
- **Don't** animate map layers by changing their paint each frame. With terrain, every line, fill and relief layer is baked into tile textures, and a paint change re-bakes them all. Animate in a custom GPU layer (like the swell and the ships) or in HTML markers (like the whale).
