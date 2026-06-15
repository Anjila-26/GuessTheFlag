# Geopro Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a home screen that routes to the existing flag game and a new "Geopro" mode that shows open-licensed street-level photos and asks which country they're from (4-option multiple choice).

**Architecture:** Static multi-page site. `index.html` becomes a home/mode picker; the flag game moves to `flags.html`; Geopro lives in `geo.html`. A dev-only Node build script uses a Mapillary token to download street-level images into `assets/geo/` and generate a static `geo-data.js`. Runtime is 100% static and keyless.

**Tech Stack:** Plain HTML/CSS/JS (no framework). Node 18+ (global `fetch`, ES modules) for the build script and `node:test` for build-side unit tests. Manual browser verification via Playwright for the UI (matches existing project practice).

**Key design refinement:** Mapillary thumbnail URLs are signed and expire, so the build script downloads image bytes into the repo and `geo-data.js` references **local paths**, not remote URLs.

---

## File Structure

```
index.html        HOME — mode picker (Flags / Geopro)          [rewritten]
flags.html        the current flag game                        [new = old index.html + back link]
geo.html          Geopro mode                                  [new]

styles.css        shared styles; + .home / .mode-card / .backlink / .geo  [modified]
countries.js      shared [code, name] list                     [unchanged]
app.js            flag game logic                              [unchanged]
geo.js            Geopro game logic                            [new]
geo-data.js       GENERATED: const GEO_DATA = {code: [{file,creator,license,id}]}  [new, placeholder first]

assets/geo/<code>/<id>.jpg   downloaded street images          [generated]

package.json      dev scripts + "type":"module"                [new]
tools/
  geo-coords.json   curated lat/lng per country                [new]
  build-geo-db.mjs  downloads images + writes geo-data.js       [new]
  geo-lib.mjs       pure helpers (bbox, record shaping)         [new]
  geo-lib.test.mjs  node:test unit tests for helpers            [new]
  validate-geo-data.mjs  asserts geo-data.js integrity          [new]

.env              MAPILLARY_TOKEN=...   (already set, gitignored)
.gitignore        already ignores .env, node_modules, .playwright-mcp
```

---

### Task 1: Move the flag game to flags.html

**Files:**
- Create: `flags.html`
- Reference: current `index.html` (its full contents become the basis of `flags.html`)

- [ ] **Step 1: Copy index.html to flags.html**

Run:
```bash
cd /Users/_moonbytes/Documents/Experiments/GuesstheFlag
cp index.html flags.html
```

- [ ] **Step 2: Add a back-to-home link inside flags.html**

In `flags.html`, find the opening of the main app block:
```html
  <main class="app">
    <div class="top">
```
Replace with (adds a Home link as the first child of `.app`):
```html
  <main class="app">
    <a class="backlink" href="index.html">← Home</a>
    <div class="top">
```

- [ ] **Step 3: Verify flags.html loads and plays**

Run:
```bash
python3 -m http.server 8765 >/tmp/flagger.log 2>&1 &
sleep 1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8765/flags.html
```
Expected: `200`. Then open `http://localhost:8765/flags.html` in the browser and confirm the flag game works and a "← Home" link shows at the top.

- [ ] **Step 4: Commit**

```bash
git add flags.html
git commit -m "Move flag game to flags.html with Home link"
```

---

### Task 2: Create the home page (index.html)

**Files:**
- Modify (rewrite): `index.html`

- [ ] **Step 1: Replace index.html with the home/mode picker**

Overwrite `index.html` with:
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>FLAGGER — Pick a Game</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="critter c1"><span class="eyes"><i></i><i></i></span></div>
  <div class="critter c2"><span class="eyes"><i></i><i></i></span></div>
  <div class="critter c3 sm"><span class="eyes"><i></i><i></i></span></div>
  <div class="critter c4"><span class="eyes"><i></i><i></i></span></div>
  <div class="critter c5 sm"><span class="eyes"><i></i><i></i></span></div>

  <main class="app home">
    <div class="brand">FLA<span class="o"></span>GER</div>
    <p class="home-tag">Two ways to test your geography</p>

    <a class="mode-card mode-flags" href="flags.html">
      <span class="mode-emoji">🏴</span>
      <span class="mode-text"><b>Flags</b><small>Guess the country from its flag</small></span>
    </a>

    <a class="mode-card mode-geo" href="geo.html">
      <span class="mode-emoji">🌍</span>
      <span class="mode-text"><b>Geopro</b><small>Guess the country from a street photo</small></span>
    </a>

    <div class="credit">Flags via flagcdn · Photos via Mapillary</div>
  </main>
</body>
</html>
```

- [ ] **Step 2: Verify the home page renders both cards**

Open `http://localhost:8765/index.html`. Expected: FLAGGER brand, two cards (Flags, Geopro). (Styling lands in Task 3; layout may look plain until then.)

- [ ] **Step 3: Verify navigation**

Click "Flags" → lands on `flags.html` and the game works. Use the "← Home" link to return. Click "Geopro" → 404/empty for now (page created in Task 4). That's expected.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Make index.html the home mode picker"
```

---

### Task 3: Style the home page and back link

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Append home + backlink styles**

Add to the end of `styles.css`:
```css
/* ── home / mode picker ── */
.home { gap: 0; }
.home .brand { font-size: 38px; margin-top: 8px; }
.home-tag {
  font-size: 13px; font-weight: 700; color: var(--ink); opacity: .55;
  text-transform: uppercase; letter-spacing: .08em; margin: 10px 0 26px;
}
.mode-card {
  width: 100%; display: flex; align-items: center; gap: 16px;
  text-decoration: none; color: var(--ink);
  border: 2.5px solid var(--ink); border-radius: 22px;
  padding: 20px 22px; margin-bottom: 14px; background: transparent;
  transition: transform .15s var(--ease), background .2s, color .2s;
}
.mode-card .mode-emoji { font-size: 38px; line-height: 1; flex: none; }
.mode-card .mode-text { display: flex; flex-direction: column; text-align: left; }
.mode-card .mode-text b {
  font-family: 'Archivo Black', sans-serif; font-size: 22px; text-transform: uppercase; letter-spacing: -.02em;
}
.mode-card .mode-text small { font-size: 13px; font-weight: 600; opacity: .6; margin-top: 2px; }
.mode-flags:hover, .mode-geo:hover { transform: translateY(-3px); }
@media (hover: hover) and (pointer: fine) {
  .mode-card:hover { background: var(--ink); color: var(--cream); }
}
.mode-card:active { transform: translateY(-1px) scale(.99); }

/* ── back link (in-game) ── */
.backlink {
  align-self: flex-start;
  font-family: 'Archivo Black', sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: .04em;
  color: var(--ink); opacity: .6; text-decoration: none; margin-bottom: 6px;
}
.backlink:hover { opacity: 1; }
```

- [ ] **Step 2: Verify home page styling**

Reload `http://localhost:8765/index.html`. Expected: two large bordered cards with emoji + title + subtitle, hover lift on desktop. Check the "← Home" link on `flags.html` looks like a small uppercase link.

- [ ] **Step 3: Verify mobile fit**

In the browser devtools (or Playwright resize to 375×600), confirm the home page fits and the navbar/cards aren't clipped (the `align-items: flex-start` on body already handles short screens).

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "Style home mode picker and back link"
```

---

### Task 4: Geopro page + placeholder data + core game loop

**Files:**
- Create: `geo-data.js` (placeholder, replaced by build in Task 7)
- Create: `geo.html`
- Create: `geo.js`
- Modify: `styles.css` (Geopro-specific bits)

- [ ] **Step 1: Create a placeholder geo-data.js**

Create `geo-data.js`. Uses two well-known flag images as stand-ins so the loop is testable before the real build. (These remote URLs are temporary placeholders only.)
```js
// GENERATED FILE — placeholder until tools/build-geo-db.mjs runs.
// Shape: { "<iso2>": [ { file, creator, license, id }, ... ] }
const GEO_DATA = {
  "fr": [ { file: "https://flagcdn.com/w640/fr.png", creator: "placeholder", license: "CC BY-SA 4.0", id: "p1" } ],
  "jp": [ { file: "https://flagcdn.com/w640/jp.png", creator: "placeholder", license: "CC BY-SA 4.0", id: "p2" } ],
  "br": [ { file: "https://flagcdn.com/w640/br.png", creator: "placeholder", license: "CC BY-SA 4.0", id: "p3" } ],
  "ke": [ { file: "https://flagcdn.com/w640/ke.png", creator: "placeholder", license: "CC BY-SA 4.0", id: "p4" } ],
  "ca": [ { file: "https://flagcdn.com/w640/ca.png", creator: "placeholder", license: "CC BY-SA 4.0", id: "p5" } ]
};
```

- [ ] **Step 2: Create geo.html**

Create `geo.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>Geopro — Guess the Country</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="critter c1"><span class="eyes"><i></i><i></i></span></div>
  <div class="critter c2"><span class="eyes"><i></i><i></i></span></div>
  <div class="critter c3 sm"><span class="eyes"><i></i><i></i></span></div>
  <div class="critter c4"><span class="eyes"><i></i><i></i></span></div>
  <div class="critter c5 sm"><span class="eyes"><i></i><i></i></span></div>

  <div class="toast" id="toast"><span class="star">★</span><span id="toastMsg">New best streak</span></div>
  <div class="confetti" id="confetti"></div>

  <main class="app">
    <a class="backlink" href="index.html">← Home</a>
    <div class="top">
      <div class="brand">GEOPR<span class="o"></span></div>
      <div class="best">BEST <b id="bestVal">0</b></div>
    </div>

    <div class="streak" id="streakStrip">
      <span class="label">Streak</span>
      <span class="count" id="streakVal">0</span>
    </div>

    <div class="stage">
      <div class="photo-wrap" id="photoWrap">
        <div class="photo-shape"><img id="photoImg" alt="Street scene to guess" /></div>
      </div>
    </div>
    <div class="attribution" id="attribution"></div>

    <div class="prompt">
      <h2 id="promptSub">Tap your answer</h2>
    </div>

    <div class="options" id="options"></div>

    <div class="footer">
      <button class="next" id="nextBtn" hidden>Next →</button>
    </div>

    <div class="empty" id="emptyState" hidden>No photos yet — check back soon.</div>
  </main>

  <script src="countries.js" defer></script>
  <script src="geo-data.js" defer></script>
  <script src="geo.js" defer></script>
</body>
</html>
```

- [ ] **Step 3: Create geo.js**

Create `geo.js`:
```js
// Geopro logic. Depends on COUNTRIES (countries.js) and GEO_DATA (geo-data.js).
const NAME = Object.fromEntries(COUNTRIES.map(c => [c[0], c[1]]));
const POOL = Object.keys(GEO_DATA).filter(code => GEO_DATA[code] && GEO_DATA[code].length && NAME[code]);

let streak = 0;
let best = parseInt(localStorage.getItem('geo_best') || '0', 10);
let answer = null, locked = false, recent = [];

const el = id => document.getElementById(id);
const optionsEl = el('options'), photoImg = el('photoImg'), photoWrap = el('photoWrap');
const streakVal = el('streakVal'), bestVal = el('bestVal'), promptSub = el('promptSub');
const nextBtn = el('nextBtn'), streakStrip = el('streakStrip'), attributionEl = el('attribution');
bestVal.textContent = best;

function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function pickCode(){
  let code; do { code = POOL[Math.floor(Math.random()*POOL.length)]; } while (POOL.length > 6 && recent.includes(code));
  recent.push(code); if (recent.length > 12) recent.shift(); return code;
}

function newRound(){
  locked = false;
  const code = pickCode();
  answer = [code, NAME[code]];
  const shots = GEO_DATA[code];
  const shot = shots[Math.floor(Math.random()*shots.length)];

  photoWrap.classList.add('swap');
  const img = new Image();
  const done = () => { photoImg.src = img.src; photoWrap.classList.remove('swap'); };
  img.onload = done;
  img.onerror = () => { photoWrap.classList.remove('swap'); newRound(); }; // skip dead image
  img.src = shot.file;
  photoImg.alt = 'Street scene to guess';
  attributionEl.textContent = shot.creator ? `📷 ${shot.creator} · Mapillary · ${shot.license}` : '';

  // 3 distractors from the full country list
  const distractors = shuffle(COUNTRIES.filter(c => c[0] !== code)).slice(0, 3);
  const choices = shuffle([answer, ...distractors]);

  optionsEl.innerHTML = '';
  choices.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.innerHTML = `<span class="key">${i+1}</span><span class="name">${c[1]}</span>`;
    b.onclick = () => choose(b, c);
    b.dataset.code = c[0];
    optionsEl.appendChild(b);
  });

  promptSub.textContent = 'Which country is this?';
  nextBtn.hidden = true;
}

function choose(btn, country){
  if (locked) return;
  locked = true;
  const buttons = [...optionsEl.children];
  buttons.forEach(b => b.disabled = true);
  const correct = country[0] === answer[0];

  if (correct){
    btn.classList.add('correct');
    streak++;
    bumpStreak();
    promptSub.textContent = niceCorrect();
    if (streak > best){ best = streak; localStorage.setItem('geo_best', best); bestVal.textContent = best; celebrate(); }
    nextBtn.hidden = false;
    clearTimeout(window.__adv);
    window.__adv = setTimeout(newRound, 1150);
  } else {
    btn.classList.add('wrong');
    buttons.forEach(b => {
      if (b.dataset.code === answer[0]) b.classList.add('correct');
      else if (b !== btn) b.classList.add('dim');
    });
    streak = 0;
    nextBtn.hidden = false;
  }
  streakVal.textContent = streak;
}

function niceCorrect(){
  const m = ['Nice one','Correct','Spot on','You got it','Sharp eye','Exactly'];
  return m[Math.floor(Math.random()*m.length)];
}
function bumpStreak(){
  streakVal.textContent = streak;
  streakStrip.classList.remove('bump'); void streakStrip.offsetWidth; streakStrip.classList.add('bump');
}

let toastTimer;
function showToast(msg){
  const t = el('toast'); el('toastMsg').textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}
function celebrate(){
  showToast(`New best · ${best}`);
  const c = el('confetti');
  const colors = ['#f5402c','#ff6a1a','#f364a2','#5b3df0','#1aae66','#74d4bf','#ffc01e'];
  for (let i=0;i<80;i++){
    const p = document.createElement('i');
    p.style.left = Math.random()*100 + 'vw';
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
    p.style.animationDuration = (1.6 + Math.random()*1.4) + 's';
    p.style.animationDelay = (Math.random()*.3) + 's';
    c.appendChild(p);
    setTimeout(()=>p.remove(), 3200);
  }
}

nextBtn.onclick = () => { clearTimeout(window.__adv); newRound(); };
document.addEventListener('keydown', e => {
  if (e.key >= '1' && e.key <= '4'){ const b = optionsEl.children[+e.key - 1]; if (b && !locked) b.click(); }
  else if ((e.key === 'Enter' || e.key === ' ') && !nextBtn.hidden){ e.preventDefault(); nextBtn.click(); }
});

if (POOL.length === 0){
  el('emptyState').hidden = false;
  el('streakStrip').style.display = 'none';
  el('options').style.display = 'none';
} else {
  newRound();
}
```

- [ ] **Step 4: Add Geopro photo + attribution + empty styles to styles.css**

Append to `styles.css`:
```css
/* ── geopro photo ── */
.photo-wrap { width: 300px; max-width: 100%; display: grid; place-items: center; }
.photo-shape {
  width: 100%; aspect-ratio: 4 / 3; border-radius: 14px; overflow: hidden; background: #e3e7da;
}
.photo-shape img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: opacity .45s ease, transform .7s var(--ease);
}
.photo-wrap.swap .photo-shape img { opacity: 0; transform: scale(1.05); }
.attribution {
  margin-top: 8px; font-size: 10px; font-weight: 700; color: var(--ink);
  opacity: .45; letter-spacing: .03em; text-transform: uppercase; min-height: 12px;
}
.empty {
  margin-top: 30px; font-family: 'Archivo Black', sans-serif; font-size: 15px;
  text-transform: uppercase; letter-spacing: -.01em; opacity: .6;
}
.empty[hidden] { display: none; }
```

Note: Geopro uses `object-fit: cover` (street photos benefit from filling the frame; unlike flags they have no canonical aspect ratio and need no whole-image guarantee).

- [ ] **Step 5: Verify the Geopro loop with placeholder data**

Open `http://localhost:8765/geo.html`. Expected: an image (placeholder flag stand-in) shows, prompt "Which country is this?", 4 options, attribution line `📷 placeholder · Mapillary · CC BY-SA 4.0`. Tap correct → green + streak increments + auto-advance; tap wrong → red + reveal + Next. Confirm keyboard 1–4 and Enter work, and no console errors.

- [ ] **Step 6: Commit**

```bash
git add geo.html geo.js geo-data.js styles.css
git commit -m "Add Geopro page, game loop, and placeholder data"
```

---

### Task 5: Build tooling — coordinates, pure helpers, and tests

**Files:**
- Create: `package.json`
- Create: `tools/geo-coords.json`
- Create: `tools/geo-lib.mjs`
- Create: `tools/geo-lib.test.mjs`

- [ ] **Step 1: Create package.json**

Create `package.json`:
```json
{
  "name": "guesstheflag",
  "private": true,
  "type": "module",
  "scripts": {
    "build:geo": "node tools/build-geo-db.mjs",
    "validate:geo": "node tools/validate-geo-data.mjs",
    "test": "node --test tools/"
  }
}
```

- [ ] **Step 2: Create tools/geo-coords.json (curated, high-coverage starter)**

Create `tools/geo-coords.json`. Each country lists one or more `[lng, lat]` points in well-covered urban areas. This is the initial set; expand later by adding entries.
```json
{
  "fr": [[2.3522, 48.8566]],
  "gb": [[-0.1276, 51.5074]],
  "de": [[13.4050, 52.5200]],
  "es": [[-3.7038, 40.4168]],
  "it": [[12.4964, 41.9028]],
  "nl": [[4.9041, 52.3676]],
  "be": [[4.3517, 50.8503]],
  "ch": [[8.5417, 47.3769]],
  "at": [[16.3738, 48.2082]],
  "se": [[18.0686, 59.3293]],
  "no": [[10.7522, 59.9139]],
  "dk": [[12.5683, 55.6761]],
  "fi": [[24.9384, 60.1699]],
  "pl": [[21.0122, 52.2297]],
  "cz": [[14.4378, 50.0755]],
  "pt": [[-9.1393, 38.7223]],
  "ie": [[-6.2603, 53.3498]],
  "us": [[-73.9857, 40.7484]],
  "ca": [[-79.3832, 43.6532]],
  "br": [[-46.6333, -23.5505]],
  "jp": [[139.6917, 35.6895]],
  "kr": [[126.9780, 37.5665]],
  "au": [[151.2093, -33.8688]],
  "nz": [[174.7633, -36.8485]],
  "za": [[18.4241, -33.9249]],
  "mx": [[-99.1332, 19.4326]],
  "tr": [[28.9784, 41.0082]],
  "th": [[100.5018, 13.7563]],
  "in": [[72.8777, 19.0760]],
  "id": [[106.8456, -6.2088]],
  "ke": [[36.8219, -1.2921]]
}
```

- [ ] **Step 3: Create the pure helper module tools/geo-lib.mjs**

Create `tools/geo-lib.mjs`:
```js
// Pure helpers for the Geopro build script (no I/O, easily unit-tested).

// Build a small bounding box [minLon,minLat,maxLon,maxLat] around a [lng,lat] point.
// delta is in degrees (~0.01 deg ≈ 1.1 km).
export function bbox([lng, lat], delta = 0.012) {
  return [lng - delta, lat - delta, lng + delta, lat + delta];
}

// Turn a raw Mapillary image object into our stored record shape.
// Returns null if the image lacks a usable thumbnail.
export function toRecord(img, code) {
  const url = img.thumb_1024_url || img.thumb_2048_url;
  if (!url) return null;
  const creator = (img.creator && img.creator.username) ? img.creator.username : 'Mapillary contributor';
  return { id: String(img.id), code, url, creator, license: 'CC BY-SA 4.0' };
}

// Validate one stored geo-data record (post-download shape, with `file`).
export function isValidStored(rec, knownCodes) {
  return !!rec
    && typeof rec.file === 'string' && rec.file.length > 0
    && typeof rec.creator === 'string' && rec.creator.length > 0
    && typeof rec.license === 'string' && rec.license.length > 0
    && knownCodes.has(rec.code);
}
```

- [ ] **Step 4: Write failing tests for the helpers**

Create `tools/geo-lib.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bbox, toRecord, isValidStored } from './geo-lib.mjs';

test('bbox builds a centered box', () => {
  const [minLon, minLat, maxLon, maxLat] = bbox([10, 20], 0.01);
  assert.ok(Math.abs(minLon - 9.99) < 1e-9);
  assert.ok(Math.abs(maxLon - 10.01) < 1e-9);
  assert.ok(Math.abs(minLat - 19.99) < 1e-9);
  assert.ok(Math.abs(maxLat - 20.01) < 1e-9);
});

test('toRecord maps a Mapillary image', () => {
  const rec = toRecord({ id: 42, thumb_1024_url: 'http://x/y.jpg', creator: { username: 'alice' } }, 'fr');
  assert.deepEqual(rec, { id: '42', code: 'fr', url: 'http://x/y.jpg', creator: 'alice', license: 'CC BY-SA 4.0' });
});

test('toRecord returns null without a thumbnail', () => {
  assert.equal(toRecord({ id: 1, creator: { username: 'bob' } }, 'fr'), null);
});

test('toRecord falls back when creator is missing', () => {
  const rec = toRecord({ id: 7, thumb_1024_url: 'http://x/z.jpg' }, 'de');
  assert.equal(rec.creator, 'Mapillary contributor');
});

test('isValidStored accepts a good record and rejects bad ones', () => {
  const codes = new Set(['fr']);
  assert.equal(isValidStored({ file: 'assets/geo/fr/1.jpg', creator: 'a', license: 'CC BY-SA 4.0', code: 'fr' }, codes), true);
  assert.equal(isValidStored({ file: '', creator: 'a', license: 'x', code: 'fr' }, codes), false);
  assert.equal(isValidStored({ file: 'f', creator: 'a', license: 'x', code: 'zz' }, codes), false);
});
```

- [ ] **Step 5: Run the tests and verify they pass**

Run:
```bash
cd /Users/_moonbytes/Documents/Experiments/GuesstheFlag
node --test tools/
```
Expected: all tests pass (`# pass 5`, `# fail 0`). (TDD note: helpers and tests are written together here because the helpers are tiny and pure; if a test fails, fix `geo-lib.mjs` until green.)

- [ ] **Step 6: Commit**

```bash
git add package.json tools/geo-coords.json tools/geo-lib.mjs tools/geo-lib.test.mjs
git commit -m "Add Geopro build tooling: coords, pure helpers, and tests"
```

---

### Task 6: Build script + data validator

**Files:**
- Create: `tools/build-geo-db.mjs`
- Create: `tools/validate-geo-data.mjs`

- [ ] **Step 1: Create the build script**

Create `tools/build-geo-db.mjs`:
```js
// Dev-only. Downloads Mapillary street images into assets/geo/<code>/ and writes geo-data.js.
// Requires MAPILLARY_TOKEN in the environment (loaded from .env below).
import fs from 'node:fs/promises';
import path from 'node:path';
import { bbox, toRecord } from './geo-lib.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PER_COUNTRY = 3;     // images to keep per country
const FIELDS = 'id,thumb_1024_url,creator';

async function loadToken() {
  if (process.env.MAPILLARY_TOKEN) return process.env.MAPILLARY_TOKEN;
  try {
    const env = await fs.readFile(path.join(ROOT, '.env'), 'utf8');
    const m = env.match(/^MAPILLARY_TOKEN=(.+)$/m);
    if (m) return m[1].trim();
  } catch {}
  throw new Error('MAPILLARY_TOKEN not set (env or .env)');
}

async function searchImages(token, point) {
  const [minLon, minLat, maxLon, maxLat] = bbox(point);
  const url = `https://graph.mapillary.com/images?fields=${FIELDS}&bbox=${minLon},${minLat},${maxLon},${maxLat}&limit=30`;
  const res = await fetch(url, { headers: { Authorization: `OAuth ${token}` } });
  if (!res.ok) throw new Error(`Mapillary ${res.status} for ${point}`);
  const json = await res.json();
  return json.data || [];
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

async function main() {
  const token = await loadToken();
  const coords = JSON.parse(await fs.readFile(path.join(ROOT, 'tools/geo-coords.json'), 'utf8'));
  const db = {};
  const skipped = [];

  for (const [code, points] of Object.entries(coords)) {
    const records = [];
    for (const point of points) {
      if (records.length >= PER_COUNTRY) break;
      let imgs = [];
      try { imgs = await searchImages(token, point); }
      catch (e) { console.warn(`  ${code} ${point}: ${e.message}`); continue; }
      for (const img of imgs) {
        if (records.length >= PER_COUNTRY) break;
        const rec = toRecord(img, code);
        if (!rec) continue;
        const rel = `assets/geo/${code}/${rec.id}.jpg`;
        try { await download(rec.url, path.join(ROOT, rel)); }
        catch (e) { console.warn(`  ${code} dl ${rec.id}: ${e.message}`); continue; }
        records.push({ file: rel, creator: rec.creator, license: rec.license, id: rec.id });
      }
    }
    if (records.length) { db[code] = records; console.log(`✓ ${code}: ${records.length}`); }
    else { skipped.push(code); console.log(`✗ ${code}: no coverage`); }
  }

  const header = '// GENERATED by tools/build-geo-db.mjs — do not edit by hand.\n';
  const body = `const GEO_DATA = ${JSON.stringify(db, null, 2)};\n`;
  await fs.writeFile(path.join(ROOT, 'geo-data.js'), header + body);
  console.log(`\nWrote geo-data.js with ${Object.keys(db).length} countries. Skipped: ${skipped.join(', ') || 'none'}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
```

- [ ] **Step 2: Create the data validator**

Create `tools/validate-geo-data.mjs`:
```js
// Validates the generated geo-data.js against countries.js and the local image files.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { isValidStored } from './geo-lib.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

async function evalGlobal(file, name) {
  const code = await fs.readFile(path.join(ROOT, file), 'utf8');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code + `\n;globalThis.__x = ${name};`, ctx);
  return ctx.__x;
}

async function main() {
  const COUNTRIES = await evalGlobal('countries.js', 'COUNTRY_TIERS.easy.concat(COUNTRY_TIERS.hard)');
  const GEO_DATA = await evalGlobal('geo-data.js', 'GEO_DATA');
  const known = new Set(COUNTRIES.map(c => c[0]));

  let errors = 0;
  for (const [code, recs] of Object.entries(GEO_DATA)) {
    if (!known.has(code)) { console.error(`unknown code: ${code}`); errors++; continue; }
    for (const rec of recs) {
      const stored = { ...rec, code };
      if (!isValidStored(stored, known)) { console.error(`bad record in ${code}: ${JSON.stringify(rec)}`); errors++; continue; }
      if (!rec.file.startsWith('http')) {
        try { await fs.access(path.join(ROOT, rec.file)); }
        catch { console.error(`missing image file: ${rec.file}`); errors++; }
      }
    }
  }
  const n = Object.keys(GEO_DATA).length;
  if (errors) { console.error(`\n${errors} error(s) across ${n} countries`); process.exit(1); }
  console.log(`OK — ${n} countries, all records valid.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
```

- [ ] **Step 3: Validate the current (placeholder) geo-data.js**

Run:
```bash
cd /Users/_moonbytes/Documents/Experiments/GuesstheFlag
node tools/validate-geo-data.mjs
```
Expected: `OK — 5 countries, all records valid.` (placeholder records use `http` URLs, so the file-existence check is skipped for them). If it errors, fix the validator or placeholder shape until green.

- [ ] **Step 4: Commit**

```bash
git add tools/build-geo-db.mjs tools/validate-geo-data.mjs
git commit -m "Add Geopro build script and data validator"
```

---

### Task 7: Generate the real database and verify end-to-end

**Files:**
- Modify (regenerate): `geo-data.js`
- Create: `assets/geo/**` (downloaded images)

- [ ] **Step 1: Run the build**

Run (token is read from `.env` automatically):
```bash
cd /Users/_moonbytes/Documents/Experiments/GuesstheFlag
node tools/build-geo-db.mjs
```
Expected: per-country `✓`/`✗` lines and a final summary. `geo-data.js` is overwritten with real local file paths; images land under `assets/geo/<code>/`.

- [ ] **Step 2: Validate the generated data**

Run:
```bash
node tools/validate-geo-data.mjs
```
Expected: `OK — N countries, all records valid.` Fix any missing-file/unknown-code errors (e.g. re-run build for failed countries, or remove bad entries).

- [ ] **Step 3: Spot-check image quality**

Open several images under `assets/geo/` and confirm they're street-level scenes (not blank/indoor/uninformative). Remove weak images from `geo-data.js` and delete their files if they're ambiguous. Re-run the validator after edits.

- [ ] **Step 4: Browser verification of Geopro with real data**

With the server running, open `http://localhost:8765/geo.html`. Confirm:
- A real street photo loads in the frame.
- Attribution shows the real contributor: `📷 <username> · Mapillary · CC BY-SA 4.0`.
- 4 options; correct/wrong/streak/best/confetti all work.
- Keyboard 1–4 and Enter work; no console errors.
- Resize to 375×600: navbar visible, layout fits/scrolls (no clipping).

- [ ] **Step 5: Full navigation smoke test**

From `index.html`: click Flags → play one round → ← Home → click Geopro → play one round → ← Home. Confirm both best scores persist independently (`flagger_best_*` vs `geo_best`).

- [ ] **Step 6: Commit**

```bash
git add geo-data.js assets/geo
git commit -m "Generate Geopro image database from Mapillary"
```

- [ ] **Step 7: Push (optional, when ready)**

```bash
git push origin master
```

---

## Notes for the implementer

- **Token safety:** never echo `MAPILLARY_TOKEN`; never commit `.env`. It's already gitignored. The shipped site contains no token.
- **Expanding coverage:** to add more countries, append `[lng,lat]` points to `tools/geo-coords.json` and re-run `node tools/build-geo-db.mjs` (it overwrites `geo-data.js`). Aim toward the spec's ~100 countries by adding well-covered cities; skip-and-log handles gaps.
- **Repo size:** images are 1024px JPEGs (~80–150KB each). At 3/country × ~100 countries that's ~30MB. If too large, drop `PER_COUNTRY` to 2 or switch the build to `thumb_256_url`/downscale.
- **Why `cover` for photos but `contain` for flags:** flags have canonical shapes that must show whole; street photos don't, and look better filling the frame.
