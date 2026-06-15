# Geopro Mode — Design Spec

**Date:** 2026-06-15
**Status:** Approved (brainstorming complete)
**Project:** FLAGGER (guesstheflag.anjicodes.co)

## Summary

Add a second game mode, **Geopro**, alongside the existing flag game. The user
lands on a **home screen** and chooses between **Flags** and **Geopro**. Geopro
shows an open-licensed street-level photograph (signs, poles, roads, storefronts)
and asks *"Which country is this?"* with four multiple-choice options — mirroring
the flag game's mechanics and visual style.

"Geopro" is an original name chosen deliberately to avoid the "GeoGuessr"
trademark on a public site.

## Goals

- A home page that routes to two game modes.
- A Geopro mode that plays like the flag game (4-option MCQ, streak, best score).
- Street-level imagery sourced legitimately (Mapillary, CC-BY-SA) with attribution.
- ~100 countries of coverage.
- Runtime remains 100% static with no API keys (same as the flag game).

## Non-Goals (explicitly out of scope for this MVP)

- Difficulty tiers for Geopro (the flag game keeps its Easy/Hard; Geopro is a
  single pool for now).
- More than one image per round.
- Typed/autocomplete answers or map-pin distance scoring.
- Hints / "meta" educational tips.
- Scraping GeoGuessr-helper sites or using Google Street View (copyright/ToS).

## Imagery & Licensing

- **Source:** Mapillary (Meta), crowdsourced street-level imagery, **CC-BY-SA 4.0**.
- **How:** A **build-time** Node script pulls image metadata using the developer's
  Mapillary access token (`MAPILLARY_TOKEN`, stored in `.env`, gitignored). The
  token is used only during development and is **never shipped** to players.
- **Output:** A static `geo-data.js` committed to the repo. At play time the
  browser reads this file and loads images directly from Mapillary's public CDN —
  no key, no live API call required.
- **Attribution (required):** Every round displays a credit line under the image,
  e.g. `📷 {creator} · Mapillary · CC BY-SA`. This is mandatory for CC-BY-SA
  compliance and is a hard requirement of the feature, not optional polish.

## File Structure

```
index.html        HOME — mode picker (Flags / Geopro)
flags.html        the current flag game (moved from index.html) + "← Home" link
geo.html          Geopro mode + "← Home" link

styles.css        shared; gains .home and .geo sections
countries.js      shared [code, name] list (both games use it for option labels)
app.js            flag game logic (loaded by flags.html)
geo.js            Geopro game logic (loaded by geo.html)
geo-data.js       GENERATED database: { "<code>": [ {url, creator, license}, ... ] }

tools/                       (dev-only, never shipped, gitignored deps)
  geo-coords.json   curated lat/lng coordinates per country (well-covered cities)
  build-geo-db.mjs  Node script: coords + MAPILLARY_TOKEN -> geo-data.js

.env              MAPILLARY_TOKEN=... (gitignored)
.gitignore        ignores .env, .env.*, node_modules, .playwright-mcp
```

Rationale: `index.html` stays the main entry point (now the home screen). The flag
game moves to `flags.html` unchanged in behavior. Shared chrome (paper grain,
decorative critters, brand, color tokens) lives in `styles.css` and is reused
across all three pages.

## Components

### Home (index.html)
- Brand header (FLAGGER) reused.
- Two large tappable cards: **Flags** (🏴) → `flags.html`, **Geopro** (🌍) →
  `geo.html`.
- Same decorative critters / paper-grain background as the games.
- Pure links/navigation; no game logic.

### Flag game (flags.html + app.js)
- Behaviorally identical to today's game (Easy/Hard tiers, per-tier best, etc.).
- Only change: add a "← Home" affordance linking back to `index.html`.

### Geopro game (geo.html + geo.js)
- Loads `countries.js` (for names/options) and `geo-data.js` (the image DB).
- Pool = only countries present in `geo-data.js` with ≥1 image (no broken rounds).
- Round flow (mirrors `app.js`):
  1. Pick a country from the pool (avoid recent repeats).
  2. Pick one image for that country; preload it into the existing rounded frame.
  3. Show attribution credit under the image.
  4. Render 4 options: the answer + 3 random distractors from `countries.js`.
  5. On tap: correct → green + streak++ + advance; wrong → red + reveal answer +
     reset streak. New best → confetti + toast (reuse existing).
- State: `streak`, `best` (localStorage key `geo_best`), `recent[]`, `locked`.
- Keyboard: 1–4 to answer, Enter/Space for Next (reuse existing handler pattern).
- "← Home" affordance linking back to `index.html`.

### Build script (tools/build-geo-db.mjs)
- Reads `geo-coords.json` (≥1 coordinate per target country).
- For each coordinate: calls Mapillary image search (radius) with the token from
  `process.env.MAPILLARY_TOKEN`; selects a few images; records
  `{ url: thumb_2048_url, creator: <username>, license: "CC BY-SA" }`.
- Writes `geo-data.js` as a committed static file.
- Skips and logs countries with no usable coverage.
- Developer spot-checks output and prunes weak/ambiguous images.

### Data validator (dev check)
- A small script (or inline node check) asserts every `geo-data.js` entry has a
  non-empty `url`, an attribution `creator`, and a `code` that exists in
  `countries.js`. Logs any country with zero images.

## Data Flow

```
BUILD TIME (developer machine, once / on demand):
  geo-coords.json + MAPILLARY_TOKEN
        -> build-geo-db.mjs -> Mapillary Graph API (read)
        -> geo-data.js  (committed)

RUN TIME (player browser, keyless):
  geo.html -> loads countries.js + geo-data.js + geo.js
           -> images fetched from Mapillary public CDN URLs
```

## Error Handling

- **Dead image URL at runtime:** `img.onerror` advances to the next round (or shows
  a neutral placeholder) so a broken URL never blocks play.
- **Empty pool / missing geo-data.js:** Geopro shows a friendly "coming soon" /
  empty state instead of throwing.
- **Build script:** missing token → clear error and abort; country with no
  coverage → skip + log, never write an empty entry.

## Testing & Verification

- No automated test suite exists in this project; verification is manual via the
  browser (Playwright), consistent with prior work.
- Verify: home picker navigates to both pages; flag game still works + back link;
  Geopro renders an image + 4 options, scoring/streak/best/confetti work,
  attribution shows, keyboard works, layout fits mobile (short-viewport check),
  no console errors.
- Run the data validator over `geo-data.js`.

## Open Dependency

- Real data generation requires the developer's `MAPILLARY_TOKEN` (already set in
  `.env`). All code (pages, `geo.js`, build script) can be written and tested
  against a small placeholder `geo-data.js` before the full ~100-country build is
  run.

## Risks

- **Coverage/quality uneven:** Mapillary is dense in Europe/US/Japan, sparse
  elsewhere; some countries may yield ambiguous images. Mitigation: curated
  coordinate list + manual spot-check + skip-and-log for no-coverage countries.
- **Image hotlinking:** relies on Mapillary CDN URL stability; `onerror` skip
  mitigates breakage. Could re-run the build to refresh URLs if needed.
