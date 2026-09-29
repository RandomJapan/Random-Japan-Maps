# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Viewers of the TikTok account @random_japan_place (about 4,400 followers):
- They arrive from the TikTok bio link or from a link under a video.
- Most are on a phone, often in the evening while scrolling.
- They want to find where the place in a video is, watch the video again, and get their next trip idea.

A secondary audience is the owner, who shares links to single places (`#place-slug`).

## Product Purpose

An interactive 3D relief map of Japan that shows every place featured in the account's TikToks.

Success means three things:
- a visitor finds the place from a video within seconds;
- they watch its video without leaving the map;
- they keep exploring, through categories, search and the random dice.

## Positioning

The owner filmed and posted every place on the map, and each place opens its own TikTok. The exaggerated 3D relief (the "model on a turntable" effect) is the signature.

## Operating Context

- **Data.** Places live in a Google Sheet that the owner edits. A Google Apps Script robot fills a row from a pasted TikTok link. The site reads the Sheet on every page load.
- **Hosting.** It is a static site on GitHub Pages, with no build step and libraries loaded from CDNs.
- **Languages.** Every text exists in English, French and Japanese.

## Capabilities and Constraints

- **Features.** Category filters, search, a random place filtered by region, prefecture or type, a deep link for each place, and a place card with photo, TikTok video, directions and share.
- **Phone performance.** The site must stay smooth on mid-range phones, because terrain rendering is heavy. Avoid effects that are recomputed every frame (backdrop blur, per-frame marker restyling).
- **Owner-controlled data.** Category names, icons and colours come from the Sheet, and the owner can change them at any time.
- **Cost.** Free services only.

## Brand Commitments

- **Name and logo.** The name is "Random Japan Place". The owner's logo is a paper-cut diorama of Japan (`site/img/`).
- **Visual world.** On 2026-09-29 the owner chose an ukiyo-e woodblock print world, in the spirit of Hiroshige's "famous places" (meisho) series, over the previous generic dark map UI.

## Evidence on Hand

- **Places.** 125 real places, each with a photo or TikTok thumbnail, a video and descriptions in three languages.
- **What does not exist.** There are no testimonials, statistics or press coverage, so do not invent any.

## Product Principles

1. The map leads: the relief and the places come before interface chrome.
2. Phone first: TikTok visitors are on phones.
3. A visitor is one tap away from a place's video.
4. The owner runs everything from the Sheet, without code.

## Accessibility & Inclusion

- Three languages.
- Readable text on dark surfaces.
- Reduced-motion users get no rotation and no decorative motion.
