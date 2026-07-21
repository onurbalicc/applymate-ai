# ApplyMate AI — Automatic Application Architecture

**Status:** Architecture document — the in-app orchestration layer is implemented; external form automation is the next integration step
**Purpose:** Define how ApplyMate fills and submits real job application forms safely and within user-controlled boundaries.

---

## 1. Product Promise and Hard Constraints

ApplyMate's promise is:

> "Swipe right. ApplyMate handles the application."

Backed by three hard constraints:

> "Reduce or eliminate repetitive form filling. Never fabricate information. Never submit outside explicit user authorization."

Every architectural choice must honour these constraints. They are non-negotiable and must be enforced at the system level, not just the UI level.

## 1b. What Exists Today (in-app orchestration)

The swipe-right trigger and the background preparation pipeline are implemented in the
Next.js app (`app/lib/automation/`):

- **Trigger:** swipe right / "Apply with ApplyMate" in the Review Queue creates one
  `AutomationJob` per job (duplicate-safe).
- **Pipeline:** ANALYZING_JOB → PREPARING_MASTER_CV (cached and reused) →
  GENERATING_JOB_SPECIFIC_CV → GENERATING_COVER_LETTER → PREPARING_FORM_ANSWERS →
  CHECKING_MISSING_INFORMATION → PACKAGE_READY → **FORM_AUTOMATION_PENDING**.
- **Interruptions:** NEEDS_USER_INPUT (incomplete profile or unresolved package
  answers — nothing is invented), MANUAL_ACTION_REQUIRED (e.g. no job description),
  FAILED (retryable), PAUSED (including reload interruption), CANCELLED.
- **Honest stop:** the pipeline ends at FORM_AUTOMATION_PENDING. SUBMITTED is never
  set — no external submission capability exists yet. That capability is the worker /
  extension described below.

## 1c. Implemented Extension Foundation (in code, not just prose)

The following browser-extension prerequisites are now **implemented as real
TypeScript modules** — no extension, DOM automation, or ATS selectors exist yet,
but the data layer an extension will consume is in place:

### Unified Application Field Contract — `app/lib/application-fields/contracts.ts`
An ATS-independent field vocabulary: 13 categories (identity, contact,
professionalLinks, documents, location, workAuthorization, salary, education,
experience, generatedAnswers, legalDeclarations, demographicQuestions,
customQuestions) and ~50 normalized field ids (givenName … captcha), each field
candidate carrying value, source, input type, confidence, sensitivity,
review-requirement, fill status, and required flag. Strict TypeScript unions
throughout; dependency-free so a future extension can share it directly.

### Deterministic Sensitive-Question Classifier — `app/lib/application-fields/classifier.ts`
No LLM involved. Classifies a normalized field and/or raw label into exactly one of:

| Category | Behavior |
|---|---|
| `SAFE_AUTO_FILL` | Objective facts (name, email, phone, links, education/experience facts) — fill without pausing |
| `NEEDS_CONFIRMATION` | Known but high-stakes (salary, notice period, start date, relocation, all AI-generated content, ambiguous/unknown labels) — pre-fill allowed, blocked until the user confirms |
| `NEVER_AUTO_FILL` | Work authorization, sponsorship, visa status, criminal history, gender, race/ethnicity, veteran status, disability, pronouns, legal certifications, consent checkboxes, background checks, CAPTCHA — never touched automatically, even when the profile stores a value |

Safety rules enforced in code and covered by unit tests: label evidence can only
**escalate** severity, never reduce it; unknown fields default to
NEEDS_CONFIRMATION, never SAFE; sensitive answers are never inferred from
indirect data (the classifier produces no values at all).

### Strict Missing-Information Enforcement — `app/lib/automation/missing-info.ts`
The previous flaw (a job could advance with partially-answered missing
information) is fixed at the domain level: every required item must have a
non-whitespace answer, matched by a stable derived id (with legacy
question-text matching for old localStorage records), before the orchestrator
allows PACKAGE_READY / FORM_AUTOMATION_PENDING. Partial submissions keep the
job in NEEDS_USER_INPUT and narrow the visible list to exactly what remains.
Previously saved answers are never discarded.

### Browser Extension Data Contract + Builder — `app/lib/extension-payload/`
`buildExtensionApplicationPayload(job, profile)` produces one validated,
self-contained payload per AutomationJob (schemaVersion 1) with: metadata
(including expected ATS detection), form-relevant candidate facts only,
**honest document availability** (`resumeFileAvailable: false` — no résumé file
generation exists anywhere yet), the generated package, resolved answers with
user-over-generated precedence, pre-classified normalized field candidates, and
an explicit readiness verdict:

`READY_FOR_TEXT_FIELD_ASSISTANCE` · `NEEDS_USER_INPUT` · `PACKAGE_NOT_READY` · `INVALID_APPLICATION_STATE`

plus blockingReasons / manualSteps / warnings. The name of the ready state is
deliberate: only **text-field assistance** is in scope — final submission
always remains a manual user action, and nothing in this foundation fills or
submits any external form today.

## 1d. Browser Extension MVP Part 1: Detection and Field Mapping (implemented)

The extension itself now exists — `browser-extension/` — as a standalone
Chrome Manifest V3 package (its own `package.json`/`tsconfig.json`, built
with `esbuild`, no framework). It is **read-only**: it detects the ATS,
discovers form fields, and maps them into ApplyMate's Unified Application
Field Contract, but never fills in, changes, or submits anything. Automatic
form filling is the next sprint (Part 2), not this one.

**Scan lifecycle:**
1. A content script (`src/content/index.ts`) is injected on
   `*.greenhouse.io`, `*.grnh.se`, and `*.lever.co` pages only
   (`manifest.json` → `content_scripts`), and runs a delayed (800 ms) initial
   scan so client-side-rendered questions have time to appear.
2. A debounced (1000 ms) `MutationObserver` on `document.body` triggers
   re-scans on meaningful DOM changes (e.g. async question lists) — never on
   every mutation, and the scanner performs no writes, so it cannot trigger
   itself in a loop.
3. The popup panel (`src/panel/panel.ts`, no background service worker)
   messages the content script directly (`GET_SCAN_RESULT` / `SCAN_PAGE`)
   and renders the latest `PageScanResult`.

**Detection (`src/ats/detect.ts` + `src/ats/{greenhouse,lever}.ts`):**
Each adapter scores hostname, URL path, and DOM markers (e.g. Greenhouse's
`job_application[...]` field naming; Lever's `.application-question` cards)
into a `high` / `medium` / `low` confidence `AtsDetectionResult`. A page that
matches neither adapter is always `unsupported` — the detector never
guesses a platform for an unrecognized site.

**Field discovery (`src/shared/dom-utils.ts`):** ATS-agnostic. Discovers
every interactive control, resolves a label per the priority order
`for=` → wrapping `<label>` → `aria-labelledby` → `aria-label` →
ATS-specific container → nearby question text → placeholder → name/id,
collapses radio/checkbox groups sharing a `name` into one logical field
(and — because a group's representative input often carries its own
option-level `for` label like "Yes"/"No" — skips the direct-association
steps for grouped fields so the real question text is found instead), and
derives a locator (id → name → stable data attribute → label association →
scoped CSS selector → structural fallback, each flagged `fragile: true` when
it depends on DOM position). No sensitive values are ever read — only
whether a field currently has one (`hasValue: boolean`).

**Mapping (`src/shared/mapper.ts` + `src/shared/field-signals.ts`):**
Deterministic, scoring-based — no LLM. Combines label/name/id/placeholder/
aria-label/option-text signals against a table of patterns for every
`NormalizedFieldId`, with input-type corroboration bonuses. A field is
`mapped` only when one candidate clearly wins; tied or close candidates stay
`ambiguous` (with `alternativeFields` listed); no signal match is `unmapped`;
an unrecognized input type (e.g. a slider) is `unsupported`. Sensitivity is
computed by the **existing** `classifySensitivity()` from
`app/lib/application-fields/classifier.ts` — imported directly, not
reimplemented — so a field that maps ambiguously between, say,
`sponsorshipRequired` and `visaStatus` is still correctly surfaced as
`NEVER_AUTO_FILL` from the raw label alone, even with no confirmed
`normalizedField`.

**Privacy:** the extension requests only `activeTab` plus host permissions
scoped to the three supported domains (no `<all_urls>`); it never sends page
data anywhere (no network calls at all); it never logs a field's actual
value, only whether one is present; and — confirmed by grepping the source
for any `.value =`, `.checked =`, `.click(`, or `.submit(` call — it performs
no writes to the page whatsoever.

**Known limitation:** custom-domain Greenhouse/Lever deployments (e.g. a
company's own `careers.` subdomain proxying a Greenhouse board) are not
matched by the current host permissions; broadening to `<all_urls>` was
deliberately avoided in favor of this narrower, safer default. See
`browser-extension/MANUAL_TESTING.md` for the full limitations list and
manual verification steps.

## 1e. Live-browser validation findings (initial pass)

The extension was validated two ways against real, public Greenhouse and
Lever job postings — see `browser-extension/MANUAL_TESTING.md` for URLs,
method, and the CLI-loading recipe: first by running the production
scanning logic (`runScan` and everything it calls) directly in-page, then
by actually loading the unpacked extension into a real Chromium instance
(Playwright + `--load-extension`, with Developer mode enabled in the
profile first — `chrome://extensions`'s own UI was never opened by hand)
and exercising the real content script, the real popup at
`chrome-extension://<id>/dist/panel.html`, and a real `chrome.tabs.sendMessage`
"Scan again" round-trip (verified by injecting a harmless extra field into
the live DOM and confirming the popup's unmapped count updated). Six real
defects were found and fixed:

1. **Safety gap (most important — shared `classifier.ts`):** real EEO
   question phrasing — "sexual orientation," "transgender," "racial/ethnic
   background" — was not matching `NEVER_LABEL_PATTERNS` (only bare
   "gender"/"race"/"ethnicity" were covered), so these fell through to
   `NEEDS_CONFIRMATION` instead of `NEVER_AUTO_FILL`. Patterns broadened to
   `/\bsex(ual)?\b/`, `/sexual\s+orientation/`, `/transgender/`, `/\blgbtq/`,
   `/\brac(e|ial)\b/`, `/ethnic/` — an escalation-only change (can only add
   `NEVER_AUTO_FILL` matches, never remove them), covered by new tests.
2. **Duplicate phantom fields:** react-select/intl-tel-input libraries
   inject invisible native shadow `<input>`s (validation targets, internal
   search boxes) alongside the real styled combobox — these were being
   reported as confusing duplicate/near-duplicate entries. `discoverFieldsGeneric`
   now skips invisible elements — **except `type="file"`**, since hiding
   the native file input behind a styled "Attach" button is the near-
   universal accessible upload pattern (confirmed live on Lever; the first
   version of this fix incorrectly dropped the résumé field entirely).
3. **Underscore-separated ids not matching signal patterns:** Greenhouse's
   cover-letter upload (`id="cover_letter"`, no distinguishing label) missed
   `/cover\s*letter/` because of the underscore. The mapper now humanizes
   `name`/`id` (`_`/`-` → spaces) before matching.
4. **Unrelated page text leaking into labels:** a label container can also
   wrap dynamic widget state ("Analyzing resume...Success!", full EEO
   option descriptions) — `resolveLabel` now strips
   `[role="status"]`/`[class*="loading"]`/`[class*="description"]`-style
   descendants before reading text, plus a 200-char cap as a final
   safeguard, directly satisfying "avoid collecting unrelated page text."
5. **Required-field detection:** many custom-styled forms mark a field
   required only visually (a trailing `*`/`✱` in the label), with the HTML
   `required` attribute living on a hidden shadow input instead. `required`
   is now also true when the resolved label ends in `*`/`✱`.
6. **Upload-status noise the first noise selector missed:** Lever's résumé
   widget uses class `resume-upload-label` for its status text ("Couldn't
   auto-read resume.", "Analyzing resume...", "Success!") — no "status" or
   "loading" substring, so fix #4's selector missed it initially. Found via
   the real loaded popup (not the in-page injection pass, which happened
   before this class name was known); `[class*="upload"]` added to the
   noise selector.

All six are escalation-only or purely additive fixes, covered by regression
tests (`browser-extension/tests/fixtures/greenhouse-live-quirks.html`,
`browser-extension/tests/fixtures/lever.html`,
`browser-extension/tests/scan.test.ts`).

---

## 1f. Browser Extension MVP Part 2: Autonomous Application Execution (implemented)

The extension is no longer a read-only scanner. The right swipe that creates an `AutomationJob`
(unchanged from Phase 3) is now also the **one-time authorization** for ApplyMate to autonomously
fill and submit that exact application — no further per-field or per-submit confirmation. `job.key`
doubles as the authorization id (`ExtensionApplicationPayload.authorization.authorizationId`); there
is deliberately no separate authorization store, per the "don't create a second disconnected
application state" constraint this sprint was built under.

**Lifecycle** (`app/lib/automation/orchestrator.ts` → `browser-extension/src/execution/`):

1. `runPipeline()` reaches `FORM_AUTOMATION_PENDING` exactly as before, then (for any job with a
   real `applyUrl` — mock/demo jobs honestly stop here, same as Part 1) immediately calls
   `handOffToExtension()`: sets `authorizedAt`/`authorizedApplyUrl`/`executionAttemptId`, builds the
   `ExtensionApplicationPayload` (`app/lib/extension-payload/builder.ts`, schema v2 — additive over
   Part 1's v1: `authorization`, `reusableAnswers`, `demographicPolicy`, `preferences`), and sends it
   to the extension via `chrome.runtime.sendMessage(EXTENSION_ID, ...)`.
2. The extension's background service worker (`src/background/index.ts` — Part 2's only new
   background script; Part 1 deliberately had none) receives it via `onMessageExternal`, persists it
   to `chrome.storage.local` keyed by authorization id, and opens (or focuses) the application tab
   itself — the user never has to open the popup.
3. Once the tab finishes loading, the background worker sends `RUN_EXECUTION` to that tab's content
   script, which runs `execution-engine.ts`'s `runExecution()`: detect ATS + scan (reusing Part 1's
   exact `runScan`/adapters/mapper) → resolve each field's value → decide the field action → fill →
   upload documents → validate → submit (or dry-run) → detect the outcome. Every stage is logged and
   relayed back to the background worker, which the web app polls (`useAutomationExecutionSync()`,
   ~3s interval) to keep the Tracker's `AutomationJob` in sync — the single source of truth Tracker
   already read from stays the single source of truth.

**Value resolution** (`value-resolver.ts`) — strict priority, never fabricated:
explicit per-job approved answer → verified candidate profile value → previously-approved reusable
answer (`CandidateProfile.reusableAnswers`, matched via the same `missingInfoId` stable-question-key
function used everywhere else in the product) → generated application-package answer → deterministic
derivation (e.g. full name from given+family name) → unresolved. An unresolved field is never
guessed; it becomes `unresolved-required` (blocks) or `skipped-optional`.

**Sensitivity enforcement — the safety-critical layer** (`answer-resolver.ts`), a second, independent
gate that never trusts value-resolver.ts's source alone:
- `SAFE_AUTO_FILL` / `NEEDS_CONFIRMATION`: any properly-sourced resolution fills.
- `NEVER_AUTO_FILL`: fills **only** from an explicit per-question approved/reusable answer — refused
  even if value-resolver.ts somehow resolved a value from the candidate profile or generated content
  (tested directly: `answer-resolver.test.ts`'s "refused even when value-resolver somehow found a
  value from an unsafe source"). For the `demographicQuestions` category specifically, a new
  `CandidateProfile.demographicAnswerPolicy` (`"not-set"` by default | `"decline"` |
  `"use-explicit-profile-answer"`) additionally allows selecting the ATS's own decline option or an
  explicit stored answer for that *exact* field — never inferred, never borrowed from a related
  field. Two new `NormalizedFieldId`s (`sexualOrientation`, `transgenderStatus`) were added to close
  a mapping gap Part 1's live validation had already found but not fully closed.

**Form filling** (`field-filler.ts`): native-setter + dispatched input/change/blur events — the
standard technique for framework-controlled inputs. **Live validation finding:** against a real,
still-hydrating Greenhouse React page, a synchronous "it didn't throw" success was not enough
evidence a write actually persisted — the framework's own render can silently discard it moments
later, or replace the DOM node entirely. Every fill now re-locates the element fresh and verifies the
value stuck, retrying up to 3 times with increasing delay (150ms/400ms/900ms) before reporting
failure; re-locating (not reusing the original element reference) was the fix that mattered — a
detached, stale reference always "verifies successfully" against itself even when the live page never
received the write.

**Document upload** (`document-uploader.ts`): the real technique (`DataTransfer` + a native file
input) is implemented and tested, but `resolveDocumentSource()` always returns `null` today —
`resumeFileAvailable`/`coverLetterFileAvailable` are always `false` (no résumé/cover-letter FILE
exists anywhere in ApplyMate yet, unchanged from Part 1). This is stated honestly rather than
skipped or faked: any required upload field routes the whole application to review-required with
kind `document-upload-failed`.

**Submission controller** (`submit-controller.ts`) — every gate checked before any click, in order:
duplicate idempotency-key rejection → authorized-URL page match → form readiness → CAPTCHA absence →
confident submit-control identification (scoped to the detected form root; refuses ambiguous or
external-auth-looking buttons). `dryRun: true` runs every gate and identifies the exact control that
*would* be clicked without clicking it — the mode used for all real, public Greenhouse/Lever
validation below; `dryRun: false` was only ever exercised against the controlled local fixture.

**Outcome detection** (`outcome-detector.ts`): SUBMITTED requires a real signal (confirmation text,
URL transition to a confirmation-looking path, or form removal + URL change) — never "the button was
clicked." CAPTCHA/login/validation-rejected/external-redirect are detected explicitly; anything
inconclusive is `"unknown"`, which becomes review-required, never SUBMITTED.

**Review-required fallback**: a structured `ReviewRequiredDetail { kind, description, requiredAction,
question? }` for every stop-short case (13 `kind` values covering CAPTCHA, login, missing
answers/verification, unresolved legal/demographic questions, unsupported ATS interaction, upload
failure, unclear submit control, unknown outcome, page mismatch, and reload interruption) — never a
silent failure.

**Web app side**: `AutomationStatus` gained the execution-phase states (`AUTHORIZED` →
`OPENING_APPLICATION` → `SCANNING_FORM` → `FILLING_FORM` → `ANSWERING_QUESTIONS` →
`UPLOADING_DOCUMENTS` → `VALIDATING_FORM` → `READY_TO_SUBMIT` → `SUBMITTING` → `SUBMITTED` |
`REVIEW_REQUIRED`), with their own `executionProgress`/`EXECUTION_STEPS` scale kept deliberately
separate from the existing `progress`/`PIPELINE_STEPS` (package-preparation) scale so neither phase's
meaning gets diluted. `AutomationProgress.tsx` renders the execution checklist, a review-required
detail panel with an "Open application" link, and Stop/Retry controls — no mandatory "Confirm Fill"
or "Confirm Submit" step exists anywhere; the right swipe is the confirmation, per this sprint's
explicit design constraint.

**Extension ↔ web app bridge**: `chrome.runtime.sendMessage(EXTENSION_ID, ...)`, which Chrome exposes
to any page matching the extension's `externally_connectable.matches` manifest entry
(`http://localhost/*`, `http://localhost:3000/*` today — a production deployment would add its real
origin). `EXTENSION_ID` is stable across reloads because `manifest.json` now pins a `key` (an RSA
public key whose SHA-256 hash Chrome uses to derive the id deterministically) — without it, an
unpacked extension's id regenerates every reload, which would break the bridge constantly during
development. `chrome.storage.local` (not the web page's own `localStorage`, which a content script on
a different origin can't reach anyway) is the persistence layer — it survives popup reload, web page
reload, and extension reload, satisfying the recovery requirement.

**Permissions added**: `storage` (chrome.storage.local), `tabs` (reading a tab's URL to match against
an authorization, and `chrome.tabs.create`/`onUpdated`), and the `externally_connectable` entry above.
`host_permissions` are unchanged from Part 1 — still scoped to the three ATS domains, no `<all_urls>`.

---

## 1g. Part 2 live-browser validation findings

Validated via the same Playwright + Chrome for Testing approach as Part 1 (see
`browser-extension/MANUAL_TESTING.md`), extended with: (a) a controlled local ATS fixture
(`browser-extension/tests/fixtures/local-ats-fixture.html`, served over `http://localhost`) for
genuine end-to-end fill → submit → outcome-detection testing without ever touching a real employer,
and (b) `dryRun: true` runs against the same real Greenhouse posting used in Part 1's validation, to
confirm real-page field filling and the review-required stop **without ever clicking submit**.

**Local fixture, real (non-dry-run) execution**: genuinely filled every field, validated, clicked the
real submit button, and correctly detected `"submitted"` from the fixture's own confirmation text —
proof the full pipeline works end-to-end in an actually-loaded extension, not just in jsdom. A
second attempt with the same idempotency key was correctly refused before touching the DOM.

**Real Greenhouse posting, dry-run**: correctly scanned 20 fields (matching Part 1's count exactly),
correctly stopped at `REVIEW_REQUIRED` before ever reaching the submit gate (6 required fields
unresolved, résumé upload unavailable), and — critically — the work-authorization field
(`NEVER_AUTO_FILL`) was confirmed still empty on the live page throughout.

Two real defects were found and fixed during this pass, both invisible to jsdom testing by
construction (jsdom has no real page-load timing or hydration):

1. **Message-delivery race**: the very first `RUN_EXECUTION` sent to a freshly-created tab was
   silently dropped — `chrome.tabs.onUpdated`'s `"complete"` status is not the same event as "the
   content script's `onMessage` listener is registered." Fixed with a retry loop keyed off
   `chrome.runtime.lastError` (up to 10 attempts, 400ms apart) rather than a guessed fixed delay.
2. **Stale element reference in fill verification**: the first fix attempt (verify-after-write) still
   failed for `first_name` specifically, while `email` on the same page succeeded — because the
   verification re-read the *same* captured element reference rather than re-querying the live DOM.
   A framework can swap the node out entirely, not just reset its value; a detached reference always
   "verifies successfully" against itself. Fixed by re-locating fresh on every attempt. After the
   fix, `first_name`, `email`, `phone`, and `country` all confirmed correctly filled on the real page
   in a follow-up run, with the work-authorization field still confirmed empty.

Both fixes are structural (they change how filling/messaging is verified, not a one-off patch) and
are exactly the kind of finding that only running the real, loaded extension against real page
timing can surface — reinforcing why this validation step is not optional for a feature this
consequential.

---

## 2. Approval Model

**Superseded by Part 2's implementation** (§1f) — recorded below for history, then reconciled with
what actually shipped.

This section originally proposed two modes: "Review-First" (every package waits for individual
approval before any form is touched) as the default, and an opt-in "Approved Autopilot" with its own
enable flow and rule set. What was actually built, per this sprint's explicit product-intent
constraint ("the default behavior is autonomous completion and submission... human review is an
exception used only when the application cannot be completed truthfully or technically"), is closer
to a single model:

- **The right swipe is the one-time authorization** for exactly one application — there is no
  separate "enable autopilot" step, toggle, or second confirmation. This is a deliberate reversal of
  this document's original "final submission always remains a manual user action" framing; see the
  roadmap for the product-direction note.
- Every one of the old "Autopilot must not submit when..." conditions is enforced as a hard gate in
  the shipped code, not a configurable rule a user could loosen: CAPTCHA presence
  (`submit-controller.ts`), sensitive/legal declarations and demographic questions with no explicit
  approved answer (`answer-resolver.ts`), unresolved required fields (`form-validator.ts`), and
  duplicate submission (idempotency keys in `submit-controller.ts`).
- What was **not** built: a distinct minimum-match-score-for-autonomous-execution setting, an
  explicit company/category exclusion list scoped to execution (the review queue's own match-score
  filtering still applies before a job is ever swiped on), and a visible on/off toggle for
  autonomous-vs-manual behavior. These remain real, honest gaps — see `docs/roadmap.md` Phase 8.
- Full execution log is captured for every run (`ExecutionResult.log`, synced into the Tracker) —
  the "full audit log" requirement is met at the field/stage level; a submission *receipt*
  (screenshot, persisted confirmation artifact) is not yet implemented (`docs/roadmap.md` Phase 7).

---

## 3. System Architecture

The complete auto-apply system requires three separate layers:

### 3.1 Next.js Web Application (already being built)

Responsibilities:
- Candidate profile management.
- Job queue and application package generation.
- Approval rules configuration.
- Approval UI (review-first and autopilot settings).
- Application tracker.
- Submission receipts and audit trail display.
- Encrypted profile data export to the automation layer.

### 3.2 Automation Worker / Browser Extension (Phase 6+)

Responsible for the actual form interaction. Two viable implementation approaches:

**A. Browser Extension**
- Runs in the user's own browser session.
- The user navigates to the job application page.
- Extension detects form fields and maps them to profile data.
- Extension shows a sidebar with proposed field fills.
- User reviews mapped fields before any submit action.
- No third-party servers see the user's browser session or credentials.
- Works with most ATS platforms by design (in the user's authenticated session).

*Pros:* Privacy (no server session needed), works with MFA, no server costs, compliant with most TOS (user-initiated action in their own browser).  
*Cons:* Requires browser extension install, manual page navigation for review-first mode, complex to auto-navigate in autopilot mode.

**B. Playwright Automation Worker (server or local)**
- A controlled browser instance managed by a local or server-side process.
- Navigates to application URLs automatically.
- Better for autopilot mode where hands-free navigation is desired.
- Requires handling login sessions securely (credentials must never leave the user's device in plaintext).

*Pros:* Fully automated navigation, works for autopilot.  
*Cons:* More complex credential management, higher risk of ATS detection, server-side variant requires encrypted credential storage.

**Recommended approach for Phase 6 prototype:** Browser extension for review-first mode, with a local Playwright agent as a later autopilot option.

### 3.3 Backend Job System (Phase 7+)

Responsibilities:
- Encrypted user data store.
- Application job queue and status tracking.
- Automation status (DISCOVERED → SUBMITTED lifecycle).
- Retry policy and failure handling.
- Audit trail, screenshots, and submission receipts.
- Duplicate application prevention.

---

## 4. Evaluated Approaches

| Approach | Feasibility | Risk | Notes |
|---|---|---|---|
| Browser extension | High | Low | User's own session; compliant with most TOS |
| Local Playwright agent | Medium | Medium | Good for autopilot; needs local install |
| Server Playwright worker | Medium | High | Credential storage risk; TOS concerns |
| ATS-specific API integrations | Low (limited) | Low | Few public APIs available |
| Supported public application APIs | Low | Low | Rare; mostly enterprise ATS |

---

## 5. Application Form Field Mapping Contract

When a form is detected, each field is mapped using this contract:

```json
{
  "fieldLabel": "string",
  "fieldType": "text | textarea | select | radio | checkbox | file | date",
  "normalizedField": "email | phone | fullName | salary | workAuthorization | linkedIn | coverLetter | resumeFile | custom",
  "value": "string | boolean | null",
  "confidence": 0.0,
  "requiresUserReview": true,
  "sensitiveField": false
}
```

**Field confidence thresholds:**
- `>= 0.9`: Auto-fill allowed in autopilot mode if `sensitiveField = false`.
- `0.7 – 0.9`: Flag for user review even in autopilot mode.
- `< 0.7`: Always require user confirmation.

**Fields always requiring user review (regardless of confidence or mode):**
- Salary and compensation
- Work authorization and visa status
- Disability, demographic, gender, ethnicity questions
- Legal declarations ("I confirm I am eligible to work…")
- Any field not mapped to a known `normalizedField`

---

## 6. Application Lifecycle

```
DISCOVERED          — Job found in queue; package not yet generated
→ ANALYZED          — Match score computed; above/below threshold determined
→ PACKAGE_PREPARED  — Cover letter, CV adaptation, answers generated
→ WAITING_FOR_APPROVAL — User must review (review-first) or threshold check (autopilot)
→ APPROVED          — User approved or autopilot rules passed
→ FORM_OPENED       — Browser navigated to application page
→ FIELDS_MAPPED     — Form fields detected and matched to profile
→ MISSING_INFORMATION — One or more required fields cannot be filled; user notified
→ READY_TO_SUBMIT   — All required fields filled; user confirmation pending (review-first)
                      OR autopilot conditions all met
→ SUBMITTED         — Form submitted
→ FAILED            — Error during submission
→ MANUAL_ACTION_REQUIRED — CAPTCHA, unusual declaration, or unresolvable field
```

States `MISSING_INFORMATION` and `MANUAL_ACTION_REQUIRED` always block submission and surface to the user, regardless of approval mode.

---

## 7. Realistic First ATS Targets

The following ATS platforms are candidates for Phase 6 integration. None of them is guaranteed to work reliably — page structure changes frequently.

| ATS | Notes |
|---|---|
| Greenhouse | Structured forms, relatively stable DOM |
| Lever | Similar to Greenhouse; well-structured |
| Workable | Common in European startups |
| SmartRecruiters | Used by many mid-large companies |
| Personio | Common in German-speaking market |
| Direct company forms | Highly variable; lowest reliability |
| LinkedIn Easy Apply | Possible via extension in user's own session |

**Important:** Not every website can be supported reliably. ATS providers update their interfaces, add bot detection, and change field structures. The system must handle failures gracefully and route them to `MANUAL_ACTION_REQUIRED` rather than failing silently.

---

## 8. Security and Compliance Requirements

| Requirement | Implementation |
|---|---|
| No plaintext credential storage | Credentials managed in user's own session; server never sees passwords |
| Sensitive data encryption | Profile data encrypted at rest in Phase 7 backend |
| No CAPTCHA bypass | Any CAPTCHA → `MANUAL_ACTION_REQUIRED` immediately |
| No anti-bot circumvention | No user-agent spoofing, no rate circumvention, no TOS bypass |
| ATS TOS compliance | User-initiated actions only; no mass crawling |
| Duplicate prevention | Application hash stored; re-submission blocked |
| Audit trail | Every submission: timestamp, form URL, screenshot, field mapping, decision |
| User data deletion | Full profile and submission data deletion on request |
| Submission evidence | Screenshot of confirmation page retained for 90 days |
| No fabricated answers | All answers must trace back to profile or be marked needs-user-input |
| Autopilot pause | User can pause or disable autopilot at any time with immediate effect |

---

## 9. Non-Goals for Auto-Apply Architecture

- Mass application submission without per-job packages.
- Bypassing login screens (the user must be authenticated in their own session).
- Solving CAPTCHAs or circumventing bot detection.
- Storing user passwords on any server.
- Answering sensitive demographic questions automatically.
- Fabricating availability, salary, or work authorization.
- Applying to jobs with match scores below the user's configured threshold.
- Guaranteeing application acceptance or interview callbacks.

---

*This document is the architectural specification for Phase 6+. Implementation begins after Phase 5 (database + authentication + secure storage) is complete.*
