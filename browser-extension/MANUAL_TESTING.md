# Manual Testing — ApplyMate Browser Extension

**Part 1** (detection + field mapping) shipped read-only. **Part 2** (this
update) adds autonomous execution: once a job is authorized via a right
swipe in the ApplyMate web app, the extension opens the application, fills
and answers what it can verify or has an explicit approved answer for, and
submits — no further per-field or per-submit confirmation. Sections 1–8
below cover the original Part 1 read-only scanner (still exactly as
described — the popup's own scan/"Scan again" flow is unchanged). Part 2's
own validation is documented in its own section further down.

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
- (Part 1 scope) No automatic form filling, clicking, or submission existed
  in this sprint — see the Part 2 section below for what changed and how it
  was validated.

---

# Part 2: Autonomous Execution — Manual Testing

## 9. Build and load (same as Part 1, with two additions)

`npm run build` now also bundles `dist/background.js` (the new background
service worker — see `docs/auto-apply-architecture.md` §1f). Load exactly as
in §2 above. Two things changed in `manifest.json`:

- **A pinned `key`** — the extension's id is now stable across reloads
  (`bhmjneikkldlmlkcgkkbpacnfgijnkac` for this repo's checked-in key). This
  matters because the web app's `NEXT_PUBLIC_APPLYMATE_EXTENSION_ID`
  (`app/lib/automation/extension-bridge.ts`) needs a fixed id to send
  messages to — without the pinned key, every reload during development
  would generate a new id and silently break the bridge.
- **`externally_connectable`** matching `http://localhost/*` and
  `http://localhost:3000/*` — this is what lets the ApplyMate web app (or
  any test harness page on those origins) call
  `chrome.runtime.sendMessage(EXTENSION_ID, ...)` at all. A production
  deployment must add its real origin here.

## 10. Triggering autonomous execution

In the real product, this happens automatically: swipe right on a job in
`/review-queue` → the orchestrator reaches `FORM_AUTOMATION_PENDING` →
`handOffToExtension()` authorizes and messages the extension → the extension
opens the tab itself. You do not need to open the popup for this to start.

To trigger it directly without the full app (useful for isolated testing),
send the extension an `AUTHORIZE_EXECUTION` message from any page on an
`externally_connectable`-matched origin:

```js
chrome.runtime.sendMessage(
  "bhmjneikkldlmlkcgkkbpacnfgijnkac",
  { type: "AUTHORIZE_EXECUTION", payload: /* ExtensionApplicationPayload */, dryRun: true },
  (response) => console.log(response)
);
```

Poll status the same way the web app does:

```js
chrome.runtime.sendMessage(
  "bhmjneikkldlmlkcgkkbpacnfgijnkac",
  { type: "GET_EXECUTION_STATUS", authorizationId: "..." },
  (response) => console.log(response.record)
);
```

**Always pass `dryRun: true` against any real ATS page.** `dryRun: false`
should only ever be used against `tests/fixtures/local-ats-fixture.html`
(see §12) — never against a real employer's application.

## 11. What was actually validated (real loaded extension, Playwright + Chrome for Testing)

Same loading method as Part 1 (§2's "scripted alternative" — two-phase
launch to get Developer mode enabled before `--load-extension` is honored).
Three scenarios were run against a real, loaded extension — not code
injection:

1. **Local fixture, `dryRun: true`.** Authorized against
   `local-ats-fixture.html` served over `http://localhost:8000`. Confirmed:
   tab opened automatically, execution reached `READY_TO_SUBMIT`, the real
   form was left completely intact (no click), and fields were correctly
   filled (verified by reading `.value` directly from the live page).
2. **Local fixture, `dryRun: false`.** Same fixture, real run: filled every
   field, validated, **actually clicked the real submit button**, and
   correctly detected `"submitted"` from the fixture's own confirmation
   text/DOM change. A second attempt reusing the same idempotency key was
   correctly refused before touching the page at all.
3. **Real Greenhouse posting, `dryRun: true`** (the same EarnIn posting used
   in Part 1's validation). Confirmed: 20 fields scanned (matches Part 1's
   count exactly), `first_name`/`email`/`phone`/`country` correctly filled
   with real values on the live page, the work-authorization field
   (`NEVER_AUTO_FILL`) confirmed still empty throughout, execution correctly
   stopped at `REVIEW_REQUIRED` (6 unresolved required fields, résumé
   unavailable) **before ever reaching the submit gate**, and the real popup
   correctly rendered this state end-to-end.

Two real defects were found and fixed during this pass (full detail in
`docs/auto-apply-architecture.md` §1g) — a message-delivery race between tab
load and content-script readiness, and a stale-DOM-reference bug in fill
verification that made `first_name` silently fail to fill while `email` on
the same page succeeded. Both were only reproducible against a real page's
real load/hydration timing — neither surfaced in the jsdom test suite.

**What was not done, and why:** a real submit was never attempted against
any real employer ATS. This is intentional — see AGENTS.md's explicit
instruction never to submit a real application during development testing.
Real-ATS validation stopped at the dry-run/review-required boundary by
design.

## 12. The local ATS fixture

`browser-extension/tests/fixtures/local-ats-fixture.html` is a minimal,
self-contained HTML page (no résumé field, so it never blocks on the
known résumé-file gap) whose inline script simulates a same-page SPA
success response on submit — no real network request anywhere. It's used
both by the automated end-to-end test (`tests/execution-engine.test.ts`,
via jsdom with `runScripts: "dangerously"` — the only fixture that needs
its script to actually execute) and by real-browser validation (served over
plain HTTP, e.g. `python3 -m http.server 8000` from
`browser-extension/tests/fixtures/`). This is the only page real
(non-dry-run) submission was ever exercised against.

## 13. Known limitations at the Part 2 milestone

- The Part 2 milestone had no résumé/cover-letter byte source and therefore
  stopped at `review-required` on required uploads. Part 3 below supersedes
  that limitation with the local IndexedDB document pipeline.
- Fill verification retries up to 3 times (150ms/400ms/900ms) — a page that
  takes longer than ~1.5s to settle after a write could still report a
  false failure. Not observed in testing, but not proven impossible either.
- The submit-control finder (`findSubmitControl`) is generic + text-pattern
  based, not ATS-specific selectors — validated against Greenhouse's
  and the local fixture's standard button markup; an unusual ATS theme
  could defeat it (it fails safe to `unclear-submit-control`, never guesses).
- Outcome detection's success-text patterns are generic English phrases;
  non-English confirmation pages would likely fall through to `"unknown"`
  (safe — routes to review-required — but not a true submission failure).
- The web app ↔ extension bridge assumes the pinned extension id above; a
  Chrome Web Store–published build would get a different, store-assigned id
  requiring `NEXT_PUBLIC_APPLYMATE_EXTENSION_ID` to be reconfigured.
- No submission receipt (screenshot, persisted confirmation artifact) is
  captured — only the structured execution log.
- Only one real employer ATS page (the same EarnIn Greenhouse posting from
  Part 1) was used for Part 2's real-page validation — an initial pass, not
  broad coverage.

---

# Part 3: Real Document Pipeline — Manual Testing

## 14. Prepare documents in ApplyMate

1. Run the web app and open `/profile`.
2. Under **Application documents**, upload a real PDF or DOCX résumé of 5 MB
   or less. Optionally upload a default cover letter.
3. Confirm filename, type, size and upload date appear. Reload the page and
   confirm the same metadata remains visible.
4. Exercise **Replace** and **Remove**. Invalid extensions, empty files,
   mismatched signatures and oversized files must show a clear error.

These files are stored in this browser's IndexedDB. They are not cloud-backed;
clearing site storage may delete them.

## 15. Document authorization and transfer boundary

For a real job, a right swipe freezes the selected document metadata into the
application authorization. The schema-v3 JSON payload contains IDs, filename,
MIME type, size and checksum only. A second message transfers base64 bytes for
that exact attempt; the background worker verifies origin, authorization ID,
attempt ID, document set, metadata, byte length and checksum. It retains bytes
only in memory. Inspect `chrome.storage.local` and the Tracker: neither may
contain document contents or base64.

After a terminal result, Stop, or tab close, retrying must require a fresh
transfer while keeping the same application authorization and a new attempt ID.
Removing a Profile document must remove its IndexedDB bytes but must not expose
or mutate unrelated documents.

## 16. Controlled document fixture

Use `tests/fixtures/document-ats-fixture.html` for the full execution flow,
plus `greenhouse-document.html` and `lever-document.html` for platform-shaped
native/hidden upload controls. They contain a required résumé, optional cover
letter, simulated success/rejection status and submit counters. A
non-dry-run test is safe only here: the document should be reconstructed as a
`File`, accepted by the live input, pass readiness validation, submit once and
show the fixture's success state. Reusing the same attempt ID must not create a
second submission. The automated execution-engine suite covers this path.

## 17. Real Greenhouse and Lever dry-run checklist

Never submit a real employer application. Use the loaded unpacked extension and
`dryRun: true`:

- Greenhouse: confirm the actual résumé input is mapped, the authorized test
  file is assigned, the filename/success state appears, and sensitive fields
  remain untouched.
- Lever: confirm the styled widget's hidden native input receives the exact
  file, status text does not pollute its field label, and the file is not
  uploaded twice.
- In both cases, close the tab afterward and confirm temporary bytes are gone.

If a public ATS, browser policy or anti-automation control prevents interaction,
record the exact limitation and rely only on the controlled fixture result. Do
not describe that as real-site validation.

## 18. Current document-pipeline limitations

- Generated résumé and cover-letter content is text only; PDF generation is not
  implemented and the product never pretends the text is an uploaded file.
- Local IndexedDB is an MVP boundary, not production encrypted storage or
  backup. There is no cross-device sync.
- The manifest requests no new broad host permission and still excludes
  `<all_urls>`. The development web bridge accepts configured localhost origins;
  a production origin must be added explicitly before release.
- Automated controlled fixtures cover Greenhouse-like and Lever-like native and
  hidden inputs. The current public controls were last checked on 2026-07-22;
  repeat the no-submit gate whenever either ATS changes its upload markup.

## 19. Dated public document-upload validation — 2026-07-22

Two synthetic, one-page PDFs containing no real candidate data were used.
Nothing was submitted to either employer.

**Profile / IndexedDB:** upload A showed the exact filename, PDF type and 2 KB
size. After reload, IndexedDB held 2,102 bytes with checksum
`63d22a60…cafa` and signature bytes `[37,80,68,70,45]` (`%PDF-`). Replacing
with B showed the new filename; after reload it held 2,113 bytes with checksum
`36fe5a0f…664` and the same valid signature. The first pass exposed an orphan:
the prior default's bytes survived replacement and remained hidden after the
visible default was removed. `DocumentManager` now deletes the previous
default after the replacement is safely stored. Repeating the full sequence
left only B after replacement and an empty IndexedDB document list after
Remove + reload.

**Greenhouse:**
`https://job-boards.greenhouse.io/earnin/jobs/8001075` (EarnIn, “Staff
Analytics, Product & Marketing”) accepted PDF A through its actual résumé
chooser. Greenhouse re-rendered the input and displayed the exact filename
plus `Remove file`. Work authorization, immigration/sponsorship, pronoun,
gender/ethnicity, veteran and disability controls were empty before and after
the upload. `Submit application` was never activated.

**Lever:**
`https://jobs.lever.co/voltus/f13d367c-97c1-4af3-8e8b-06827017fee2/apply`
(Voltus, “Software Engineer”) accepted PDF B through the styled control backed
by hidden `#resume-upload-input`. The widget displayed the exact filename and
visible `Success!`; failure and processing states remained hidden. Lever's own
resume parser populated the harmless synthetic name `Alex Example`, but all
work-authorization/sponsorship radios, pronoun checkboxes and gender/race/
veteran selects remained untouched. The form was not submitted.

The captured 21 KB post-upload Lever form was run through production
`runScan`: detection `lever/high`, 18 total fields (15 mapped, 1 ambiguous,
2 unmapped, 0 unsupported). The résumé field mapped to `resumeFile` at high
confidence with raw label `Resume/CV ✱`; none of `Analyzing resume...`,
`Success!`, upload failure or oversize text polluted its mapping.
