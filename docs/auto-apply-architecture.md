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

## 2. Approval Modes

### 2.1 Review-First (default, always available)

Every application package waits for explicit individual user approval before any form is touched. This is the only mode available until Approved Autopilot is explicitly enabled by the user.

### 2.2 Approved Autopilot (opt-in, strict conditions)

The user explicitly enables this mode and configures strict rules. Before enabling it, the system requires:

- All reusable profile answers are complete and confirmed.
- Work authorization status is explicitly set.
- No unresolved "needs-user-input" answers in the profile.
- Minimum match score threshold is configured.
- Explicitly excluded company types or job categories are listed.

Autopilot must **not submit** when any of the following conditions are true:
- A form contains a CAPTCHA or unusual bot-detection.
- A form contains a sensitive legal declaration not pre-reviewed.
- A form has fields with confidence < configured threshold.
- A form asks demographic, disability, or other sensitive questions not pre-approved.
- The application has already been submitted (duplicate detection).
- The automation worker encounters an error in the form.

Full audit log is mandatory for every autopilot submission.

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
