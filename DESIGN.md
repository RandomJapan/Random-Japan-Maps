---
name: Random Japan Place
description: Every place from the TikToks, on a 3D relief map of Japan drawn like a woodblock print
colors:
  prussian-sea: "#15355a"
  indigo-sky: "#0e2140"
  ochre-horizon: "#d9c59c"
  aizome-indigo: "#16243d"
  aizome-indigo-raised: "#21345a"
  aizome-thread: "#33486e"
  kinari-paper: "#f1e8d6"
  indigo-mist-text: "#b9c3d6"
  indigo-mist-quiet: "#8d9bb6"
  sumi-ink: "#1d1a1c"
  shu-vermilion: "#b83523"
  shu-vermilion-deep: "#a42d1d"
  yamabuki-gold: "#e3b04b"
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
  cloth: "4px"
  sheet: "6px"
  crest: "50%"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "22px"
components:
  button-primary:
    backgroundColor: "{colors.shu-vermilion}"
    textColor: "{colors.kinari-paper}"
    rounded: "{rounded.cloth}"
    padding: "8px 12px"
  button-primary-hover:
    backgroundColor: "{colors.shu-vermilion-deep}"
  button-secondary:
    backgroundColor: "{colors.aizome-indigo-raised}"
    textColor: "{colors.kinari-paper}"
    rounded: "{rounded.cloth}"
    padding: "8px 12px"
  panel:
    backgroundColor: "{colors.aizome-indigo}"
    textColor: "{colors.kinari-paper}"
    rounded: "{rounded.cloth}"
  cartouche:
    backgroundColor: "{colors.kinari-paper}"
    textColor: "{colors.sumi-ink}"
    rounded: "0"
    padding: "12px 8px 10px"
  map-label:
    backgroundColor: "{colors.kinari-paper}"
    textColor: "{colors.sumi-ink}"
    rounded: "{rounded.paper}"
    padding: "4px 9px"
  input:
    backgroundColor: "{colors.aizome-indigo-raised}"
    textColor: "{colors.kinari-paper}"
    rounded: "{rounded.cloth}"
    padding: "10px 12px"
---

# Design System: Random Japan Place

## Overview

**Creative North Star: "Meisho: the famous views"**

The map is a woodblock print of Japan, in the spirit of Hiroshige's series of "famous places" (meisho). Every place from the TikToks is one of those views.
- **The map.** The sea is Prussian blue. The land is inked in the pigments of a print (sage, ochre, brown, white peaks) with indigo shadows, and the sky fades from deep indigo to a pale ochre horizon.
- **The interface.** It is cloth and paper: panels of indigo-dyed cotton (aizome), labels and title cartouches of ecru paper in sumi ink. Vermilion (shu) is reserved for the things you do.

The owner chose this world on 2026-09-29, replacing a generic dark web-map look with glass panels and teardrop pins. The map always leads, and the interface stays small, square-cornered and flat.

**Key Characteristics:**
- Prussian-blue sea, print-pigment relief, bokashi sky and a bokashi band at the top of the screen
- Flat indigo panels, no blur or glass
- Near-square corners (2–6px): paper and cloth, not pills
- Places drawn as kamon-like crests; from far away, small coloured dots
- The place title shown as a vertical Japanese cartouche on the photo

## Colors

The palette is a woodblock printer's: a few flat, saturated inks on dark indigo.

### Primary
- **Shu Vermilion** (#b83523): primary actions only (Watch on TikTok, Roll the dice, "Another one", active language, checked boxes). It is dark enough for ecru text (4.8:1). Hover goes deeper (#a42d1d), never lighter.

### Secondary
- **Yamabuki Gold** (#e3b04b): the selected place (crest ring), keyboard focus rings, the "More info" link and the English name in the Japanese UI. It is never used for fills.

### Neutral
- **Aizome Indigo** (#16243d): every panel, the card, the loader ground.
- **Raised Indigo** (#21345a): fields, hover rows, secondary buttons.
- **Indigo Thread** (#33486e): panel borders and dividers.
- **Kinari Paper** (#f1e8d6): main text, crest rings, map labels, cartouches and the first-visit hint.
- **Indigo Mist** (#b9c3d6), and its quieter step (#8d9bb6): secondary and tertiary text. They are tinted from the indigo, never neutral grey.
- **Sumi Ink** (#1d1a1c): text on paper (labels, cartouche, toast).

### Map inks
- **Prussian Sea** (#15355a): the sea and the mask over neighbouring countries.
- **Sky** (#0e2140): the zenith.
- **Horizon** (#d9c59c): the pale ochre where sky meets land.
- **Relief ramp** (`app.js`): sage #78966a at the coast, ochre #c9a057 at 600 m, brown #7e5c45 at 1600 m, gofun white #f3eee2 at 3500 m.
- **Hillshade**: indigo shadows and paper-coloured lights.

**The Vermilion Is a Verb Rule.** Vermilion only marks something the visitor can do or has chosen. Never use it as decoration.

**The Sheet Owns the Hues Rule.** Category colours come from the owner's Google Sheet. The site softens each one toward indigo (`color-mix(in oklab, <colour> 82%, #1b2238)`) so any colour the owner picks sits in the print. Do not hard-code category colours.

## Typography

**Display Font:** Zen Antique (with Noto Serif JP, Georgia)
**Body Font:** Noto Sans (with Noto Sans JP, system-ui)

**Character:** Zen Antique is Meiji-era Japanese letterpress, in Latin and Japanese alike: the voice of old printed titles. Noto Sans carries every piece of UI and reading text. Noto Sans comes first in the stack because Noto Sans JP misplaces the macron on ō and ū; Zen Antique renders them correctly.

### Hierarchy
- **Display** (400, 27px desktop / 24px phone, 1.2, balanced): the place name on the card.
- **Title** (400, 19px desktop / 15px phone): the site name in the header, and the dice panel title (18px).
- **Cartouche** (Zen Antique, 20px, vertical, 0.14em tracking): the Japanese name on the photo. It drops to 16/14/12px for names longer than 6/8/10 characters.
- **Body** (400, 15px, 1.7, max 65ch): place descriptions.
- **Label** (500, 13–14px): buttons, menu rows, form labels. They stay in sentence case: no uppercase or tracked labels.

**The Letterpress Is for Names Rule.** Zen Antique only sets names and titles. Buttons, labels, counts and reading text are always Noto Sans.

## Layout

The map fills the screen; the interface floats in the corners with a 12px gutter (plus safe areas).
- **Header.** Top left (logo, name, and a subtitle on desktop only), with the language switch top right. On phones it is one line: 30px logo, 15px title.
- **Filters.** The Categories and Random buttons sit under the header, and their panels drop below them.
- **Place card.** A 400px side sheet on desktop. At ≤720px it becomes a bottom sheet: 64dvh by default, dragged up to nearly full height.
- **Card order.** Photo (with cartouche, share and close), then the name, then category · prefecture, then two actions on one line, then the description, then the "More info" link.
- **Phone camera.** It starts rotated (bearing 38°) so the archipelago stands upright and fills the tall screen.

## Elevation & Depth

Depth comes from the 3D relief itself. The interface stays flat, with one soft ambient shadow so panels read above the map.

### Shadow Vocabulary
- **Panel** (`box-shadow: 0 6px 18px rgba(4, 10, 24, 0.45)`): every floating panel and button.
- **Sheet** (`box-shadow: 0 18px 50px rgba(4, 10, 24, 0.6)`): the place card.
- **Crest** (`box-shadow: 0 3px 8px rgba(4, 10, 24, 0.5)`): place markers.

**The No Glass Rule.** No `backdrop-filter` anywhere. It is recomputed every frame while the map moves and made phones stutter; panels are solid indigo cloth.

## Shapes

- **Corners.** Paper is almost square (2px: labels, hint, toast, language segments). Cloth is slightly soft (4px: panels, buttons, fields). The card is 6px, or 10px at the top on phones.
- **Circles.** Only crests, the logo and the far-view dots are round.
- **Cartouche.** It has square corners and an inner sumi frame line (1px, inset 4px), like the title block on a print.

## Components

### Buttons
- **Shape:** cloth corners (4px), 8px × 12px padding (11px on phone), 16px icon before the label.
- **Primary:** vermilion fill with ecru text, weight 600. Hover goes a deeper vermilion.
- **Secondary:** raised indigo with an indigo-thread border and ecru text. Hover lightens the border.
- **Icon buttons** (share, close; 36px): translucent indigo with a thin paper border, on top of the photo.

### Place crests (map markers)
- **Near (zoom ≥ 6.2):** a 32px disc (scaled 0.7–1 with zoom) in the softened category colour, with a 2px ecru ring, an ecru icon and a small ecru pointer below. On hover it scales to 1.1, and the name appears on a paper label above.
- **Far (zoom < 6.2):** an 11px dot of the same colour with a paper ring, which keeps the relief visible. The touch area extends 10px around it.
- **Selected:** a yamabuki ring and pointer.

### Title cartouche (signature)
- **Content:** the place's Japanese name, set vertically on ecru paper in sumi ink at the photo's top right, under the icon buttons.
- **Motion:** it unrolls downward (clip-path, 0.6s, `cubic-bezier(0.16, 1, 0.3, 1)`) when the card opens, and appears without motion under reduced motion.
- **Behaviour:** it does not catch taps, so tapping it still plays the video.

### Panels (menus, dice)
- **Style:** aizome indigo with an indigo-thread border. Rows highlight in raised indigo.
- **Checkboxes and category crests:** checkboxes turn vermilion when checked; category crests use the same style as the markers.

### Inputs / Fields
- **Style:** raised indigo fill, indigo-thread border, 4px corners.
- **Focus:** a quiet mist border on the search box, a gold border on selects, and a gold caret.

### First-visit hint
A paper cartouche at the bottom centre ("Tap a place to watch its video"). It shows on the first visit only, then disappears after 10 seconds or at the first touch.

### Loader
An aizome ground printed with a faint seigaiha wave pattern, with the logo in an ecru ring.

## Do's and Don'ts

### Do:
- **Do** keep panels solid Aizome Indigo (#16243d) with a 1px Indigo Thread border.
- **Do** set place names and titles in Zen Antique, and everything else in Noto Sans.
- **Do** put text on paper (#f1e8d6) in Sumi Ink (#1d1a1c).
- **Do** use Shu Vermilion (#b83523) only for actions and chosen states.
- **Do** show category and prefecture on a line under the place name.

### Don't:
- **Don't** use `backdrop-filter`, glass or blur on panels.
- **Don't** put a category label or kicker above a heading.
- **Don't** use pill shapes (999px radius) or uppercase tracked labels.
- **Don't** use teardrop map pins.
- **Don't** use bright saturated category colours unsoftened; always pass them through the indigo mix.
