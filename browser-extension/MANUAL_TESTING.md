# Manual Testing — ApplyMate Form Scanner (Browser Extension MVP Part 1)

This extension is **read-only**: it detects Greenhouse/Lever application forms
and shows how their fields map to ApplyMate's field vocabulary. It never
fills in, changes, or submits anything on the page.

## 1. Build

```bash
cd browser-extension
npm install     # first time only
npm run build    # bundles dist/content.js and dist/panel.js
```

`npm run watch` rebuilds automatically on source changes (useful while
iterating — reload the extension in Chrome after each rebuild).

Build output lives in `browser-extension/dist/`.

## 2. Load as an unpacked extension

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `browser-extension/` folder (the one containing `manifest.json`
   — not `dist/`).
5. The "ApplyMate — Application Form Scanner" extension should appear with no
   errors. Pin it to the toolbar for convenience.

After any `npm run build`, click the refresh icon on the extension's card in
`chrome://extensions` to pick up the new bundle, then reload the page you're
testing on.

**Scripted alternative (no UI needed):** Chrome honors
`--load-extension=<path>`/`--disable-extensions-except=<path>` launch flags,
but only once Developer mode is already enabled in the launch profile —
flags alone are silently ignored on a fresh profile. A Playwright-driven
two-phase launch works: first launch the profile with no extension flags,
click the Developer-mode toggle on `chrome://extensions`, and close (this
persists the pref to the profile's `Preferences` file); then relaunch the
same `userDataDir` with the extension flags. This is how this sprint's live
validation ran without ever opening `chrome://extensions` by hand — see
"How this was loaded without `chrome://extensions`" further down.

## 3. Test a Greenhouse application page

1. Navigate to any live Greenhouse job posting, e.g.
   `https://boards.greenhouse.io/<company>/jobs/<id>`.
2. Wait a moment for the page to finish rendering the form.
3. Click the extension icon.

**What success looks like:**
- Header shows "Greenhouse" with a confidence badge (usually "high").
- Subtitle reads "Application form detected".
- Four count tiles (Mapped / Ambiguous / Unmapped / Unsupported) show
  non-zero totals matching a real form (name, email, phone, resume upload,
  custom questions, etc.).
- The field list shows each detected field with its ApplyMate mapping,
  confidence, and safety classification (`safe` / `confirm` / `never-auto`).
- Any work-authorization/visa/sponsorship/demographic question shows
  `safety: never-auto` regardless of how well it mapped.
- The evidence list under the header explains why the page was classified as
  Greenhouse (hostname, DOM markers, etc.).

## 4. Test a Lever application page

1. Navigate to a live Lever posting, e.g.
   `https://jobs.lever.co/<company>/<posting-id>/apply`.
2. Click the extension icon.

Same expectations as Greenhouse, with the header showing "Lever".

## 5. Trigger "Scan again"

Click **Scan again** in the panel at any time — e.g. after answering a
question on the page yourself, or if the form loaded async questions after
the initial scan. The panel re-runs the scan and re-renders with the latest
result. This never modifies the page; it only re-reads it.

## 6. Test an unsupported page

Navigate to any non-Greenhouse/Lever page (e.g. a plain contact form, or a
Workday/SmartRecruiters posting) and open the popup.

**What to expect:** "This tab isn't a supported application page" — the
extension fails safe rather than guessing an ATS platform. No content script
runs at all on hosts outside `*.greenhouse.io`, `*.grnh.se`, `*.lever.co`
(see `manifest.json` → `content_scripts.matches`), so the popup falls back to
this message via its own error handling.

## 7. Inspecting extension errors

- **Popup errors:** open the popup, right-click inside it → **Inspect**, and
  check the Console tab of the resulting DevTools window.
- **Content script errors:** open DevTools on the actual job page (F12) →
  Console. Look for messages prefixed by the extension's origin, or scan
  errors surfaced in `chrome.runtime.lastError`.
- **Extension load errors:** `chrome://extensions` → the extension card shows
  an "Errors" button if the manifest or a script failed to load.

## 8. Confirming the read-only guarantee while testing

- Nothing you see in the popup should ever appear pre-filled on the actual
  page — the scanner never writes to `.value`, never checks a checkbox,
  never clicks anything, and never calls `.submit()`.
- You can safely leave the extension active on a real application and
  continue filling it in by hand; scanning and typing do not interact.

## Live validation performed (initial results — not exhaustive)

The extension was validated two ways:

1. **Scanning logic**, by injecting the built `runScan`/`detectAts`/adapter/
   mapper code directly into live pages and calling it with the real
   `document`/`location` — the exact code path `dist/content.js` runs.
2. **The full extension, actually loaded**, via a scripted Chromium launch
   (Playwright + `--load-extension`/`--disable-extensions-except`, with
   Developer mode enabled in the profile first — see "How this was loaded
   without `chrome://extensions`" below): the real manifest-loaded content
   script, the real popup HTML/JS at `chrome-extension://<id>/dist/panel.html`,
   and the real `chrome.tabs.sendMessage` round-trip, including a live
   "Scan again" click. Extension ID for that session:
   `ldfgpjeldipkiioogmbjnlpepbahjjfe` (regenerated per launch — not stable
   across sessions for an unpacked/unsigned extension).

Results:

**Greenhouse** — `job-boards.greenhouse.io/earnin/jobs/8001075` (EarnIn,
"Staff Analytics, Product & Marketing") and
`job-boards.greenhouse.io/tastytrade/jobs/6110855004` (tastytrade, "Head of
Fraud Risk"): both detected `platform: "greenhouse", confidence: "high"`,
form found, 20 and 30 fields respectively. All work-authorization,
sponsorship, gender, race/ethnicity, sexual-orientation, transgender, and
veteran/disability questions correctly classified `NEVER_AUTO_FILL`.

**Lever** — `jobs.lever.co/voltus/f13d367c-97c1-4af3-8e8b-06827017fee2/apply`
(Voltus, "Software Engineer"): detected `platform: "lever", confidence:
"high"`, 15 fields, including `urls[LinkedIn]`/`urls[GitHub]`/`urls[Portfolio]`
and `eeo[gender]`/`eeo[race]`/`eeo[veteran]` — all EEO fields correctly
`NEVER_AUTO_FILL`.

**Unsupported page** — a real Workday posting
(`redhat.wd5.myworkdayjobs.com/.../Software-Engineer_R-057954`): correctly
classified `unsupported`, no Greenhouse/Lever markers matched, no guess made.

**Real popup, actually loaded** (same three pages): the popup rendered
identical results through the genuine `chrome.tabs.sendMessage` round-trip
— Greenhouse "high" confidence / 14 mapped / 2 ambiguous / 4 unmapped / 0
unsupported; Lever "high" / 13 / 1 / 2 / 0; the Workday page correctly
showed "This page isn't a supported application form." **"Scan again"**
was exercised for real: a harmless extra field
(`<input id="applymate-test-injected-field">`) was injected into the live
Greenhouse DOM, the popup's actual "Scan again" button was clicked, and the
unmapped count moved from 4 → 5, confirming the button re-reads the live
page rather than replaying a cached result. No extension-related console
errors occurred on any page (the only console errors seen were pre-existing
Greenhouse site errors — a React hydration warning and a 401 from Google's
own auth script — both originating from `job-boards.cdn.greenhouse.io`/
`apis.google.com`, unrelated to the extension). After every check, all
`<input>`/`<textarea>`/`<select>` values on the live Greenhouse page were
confirmed still empty.

This pass (across both validation rounds) surfaced and fixed 6 real defects
(see `docs/auto-apply-architecture.md` §1d for the full list): a genuine
**safety gap** where "sexual orientation," "transgender," and
"racial/ethnic background" phrasing wasn't triggering `NEVER_AUTO_FILL`;
duplicate phantom fields from react-select/intl-tel-input internals; a
hidden `type="file"` input being incorrectly dropped by the fix for the
previous issue (résumé/cover-letter uploads are legitimately hidden behind
styled buttons); an underscore-separated id (`cover_letter`) not matching
its signal pattern; unrelated dynamic status text ("Analyzing
resume...Success!", found on Lever with class `resume-upload-label` —
generic enough that it needed its own selector, `[class*="upload"]`, beyond
the original status/loading patterns) leaking into resolved labels; and
required fields marked only via a trailing `*`/`✱` in the label, not the
HTML `required` attribute. All six are covered by regression tests
(`tests/fixtures/greenhouse-live-quirks.html`, `tests/fixtures/lever.html`,
`tests/scan.test.ts`).

### How this was loaded without `chrome://extensions`

`chrome://` navigation and a native "Load unpacked" file-picker dialog were
never available in this environment. What did work: Playwright driving a
real, locally-cached "Chrome for Testing" build (`playwright install
chromium`) via `chromium.launchPersistentContext(userDataDir, { args:
["--disable-extensions-except=<path>", "--load-extension=<path>"] })`.

The one real subtlety: modern Chrome silently ignores `--load-extension`
unless **Developer mode** is already enabled in the profile *before*
launch — command-line flags alone are not enough. The fix was a two-phase
launch against the same `userDataDir`: (1) launch once with no extension
flags, open `chrome://extensions`, click the Developer-mode toggle, close
— this persists the pref to the profile's `Preferences` file on disk; (2)
relaunch the same profile with the `--load-extension` flags, which then
loads successfully. (Pre-seeding the `Preferences` JSON file directly,
without a real toggle click, did *not* work — Chrome appears to
validate/regenerate certain prefs on first run of a fresh profile.)

Getting the real popup's `chrome.tabs.query({active:true,
currentWindow:true})` to resolve to the right tab required care too:
navigating a new Playwright page directly to
`chrome-extension://<id>/dist/panel.html` makes *that* page the active tab
(unlike a real toolbar-icon click, which opens the popup without changing
tab focus) — so the target job-posting tab had to be brought to the front
as the last step before navigating the popup tab, and left focused (not
re-focused afterward) before triggering "Scan again".

## Current limitations

- Custom-domain Greenhouse/Lever deployments (e.g. `careers.company.com`
  proxying a Greenhouse board) are not matched by the extension's host
  permissions — only `*.greenhouse.io`, `*.grnh.se`, and `*.lever.co` are
  covered. Broadening this would require `<all_urls>`, which was
  deliberately avoided (see `docs/auto-apply-architecture.md`).
- Label resolution and field mapping are heuristic; unusual page layouts
  (heavily custom CSS, non-standard question widgets) may produce
  `ambiguous` or `unmapped` results rather than a clean mapping — this is
  intentional (the mapper never force-guesses) but means some legitimate
  fields will need manual review. Confirmed live: e.g. "Location (City)"
  and questions naming both "visa" and "sponsorship" in one sentence stay
  ambiguous rather than guessing.
- Real-extension validation covered 2 Greenhouse companies (EarnIn,
  tastytrade) and 1 Lever company (Voltus) — an initial pass, not exhaustive
  coverage of every ATS theme variant. Different companies' custom question
  sets, EEO wording, and CSS frameworks may surface further edge cases.
- npm audit (browser-extension): `esbuild <=0.24.2` has a moderate advisory
  about its **dev server** (GHSA-67mh-4wv8-2f99) accepting requests from any
  origin. This build never calls `esbuild`'s `serve()` (only `build()`/
  `context().watch()`, confirmed by grepping `build.mjs`), esbuild is a
  devDependency never shipped in `dist/`, and the fix requires a breaking
  0.28.1 upgrade — left as-is; no practical exposure with the current
  script. (Root repo has a separate, pre-existing `postcss`/`next` advisory,
  unrelated to this sprint and not touched.)
- No automatic form filling, clicking, or submission exists — by design, per
  this sprint's scope.
