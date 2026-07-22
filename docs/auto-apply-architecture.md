# ApplyMate AI — autonomous application architecture

**Status:** Current architecture at baseline `ea921d6`
**Purpose:** Explain how one right-swipe authorization becomes a guarded ATS submission attempt.

Permanent safety and workflow rules live in [`../AGENTS.md`](../AGENTS.md). Current feature status lives in [`project-context.md`](project-context.md). Manual browser validation lives in [`../browser-extension/MANUAL_TESTING.md`](../browser-extension/MANUAL_TESTING.md).

## Product contract

ApplyMate's promise is: **“Swipe right. ApplyMate handles the application.”**

The swipe authorizes autonomous fill and submission for one exact job and application URL. It is not approval for unrelated jobs, bulk submission, guessed answers, access-control bypass, or an uncertain re-submission. Human review is the exception when truthful or technically safe execution cannot continue.

## Canonical flow

```text
job discovery
→ user right swipe
→ automation authorization
→ package preparation
→ document selection frozen at authorization
→ extension handoff
→ ATS detection and scanning
→ value resolution
→ document transfer
→ field filling
→ document upload
→ validation
→ submission
→ outcome detection
→ Tracker synchronization
```

### 1. Discovery and selection

Provider adapters normalize Greenhouse, Lever, and demo jobs to stable string IDs. Ranking and user preferences determine which jobs reach the review queue. A right swipe creates or reuses the single `AutomationJob` keyed by that job ID.

### 2. Authorization and package preparation

The right swipe is the one-time authorization to `fill-and-submit` the exact job. The web orchestrator prepares the application package from verified profile data and grounded generated content. Missing required information stops the pipeline; it is never invented.

For a real job, the handoff records:

- `authorizationId`: the stable automation job key;
- `authorizedAt`;
- `authorizedApplyUrl`;
- a fresh `executionAttemptId`; and
- immutable document references selected for that authorization.

Demo jobs or jobs without a real `applyUrl` stop at `FORM_AUTOMATION_PENDING`.

### 3. Document selection and transfer

Selection order is deterministic and independent for résumé and cover letter: matching job-specific generated file, matching explicitly selected job file, then default file. A document associated with another job or package is rejected.

The authorization freezes metadata including stable document ID, type, filename, MIME type, byte size, checksum, and selection reason. Changing defaults afterward does not change an authorized attempt. A retry may fill a previously missing slot but does not silently replace an already frozen selection.

The schema-v3 JSON payload contains references only. The web app separately reads the exact files from IndexedDB and sends an attempt-scoped transfer. The background worker accepts it only when origin, authorization ID, attempt ID, expected document set, metadata, byte length, and SHA-256 checksum match.

### 4. Extension handoff and ATS scanning

The web app sends the authorized payload through the extension's externally connectable bridge. The Manifest V3 background worker persists JSON execution state, opens or focuses the authorized URL, and retries delivery until the content script is ready.

The content script detects Greenhouse or Lever from host, URL, and DOM evidence. Unsupported or low-confidence interaction fails safely. Scanning discovers controls, resolves labels, groups radio/checkbox options, creates locators, and maps fields into the shared normalized field vocabulary without reading or logging entered values.

### 5. Value resolution and sensitive fields

Normal value resolution uses this precedence:

1. explicit job-specific user answer;
2. verified candidate-profile value;
3. explicitly approved reusable answer;
4. grounded generated package answer;
5. deterministic derivation from verified facts; or
6. unresolved.

The sensitivity gate is independent from value resolution:

- `SAFE_AUTO_FILL`: may fill from an allowed verified source.
- `NEEDS_CONFIRMATION`: may fill only when the source and current policy permit it; ambiguity remains review-required.
- `NEVER_AUTO_FILL`: requires an exact explicitly approved answer or exact demographic policy for that field. A profile value, related field, or generated guess is insufficient.

Legal attestations, work authorization, sponsorship, criminal history, identity verification, consent, and demographic questions are never inferred. Required unresolved fields block submission; optional unresolved fields are skipped and recorded.

### 6. Filling and document upload

Text and choice controls are filled through native setters plus browser events. The engine re-locates and verifies controls after framework rerenders, with bounded retries. Existing values are preserved by default.

For documents, the content script receives only the files for the active attempt, reconstructs a browser `File`, assigns it through `DataTransfer` to the mapped native or hidden input, dispatches events, then re-locates the control. Upload success requires the expected file plus accepted visible/native state and no rejection or processing timeout.

An optional cover letter may be absent. A required résumé or cover letter cannot be bypassed. Upload failures become precise review-required reasons.

### 7. Validation and submission

Before any submit click, the controller checks in order:

1. the attempt/idempotency key is not stale or previously used;
2. the current page matches the authorized application URL;
3. the detected form and required fields are ready;
4. no CAPTCHA, login, identity verification, or external assessment blocks execution; and
5. one unambiguous submit control exists inside the detected form.

`dryRun: true` exercises gates without activating submit and is mandatory on real public ATS pages during ordinary development. `dryRun: false` is confined to controlled fixtures unless the user explicitly authorizes a controlled real-employer pilot.

### 8. Outcome and Tracker synchronization

Clicking submit does not equal success. `SUBMITTED` requires a confirmed signal such as explicit confirmation content, a confirmation-like URL transition, or a corroborated form removal/navigation change.

Validation rejection, CAPTCHA, login, external redirect, duplicate application, rate limiting, failure, and unknown outcomes remain non-submitted. Unknown or interrupted outcomes route to review rather than retrying silently.

The background record and execution log are polled by the web app and merged into the existing `AutomationJob` store used by Tracker. Tracker receives progress, upload-result metadata, outcome, timestamps, and structured review-required detail. Receipt screenshots and durable confirmation artifacts are not implemented.

## Trust boundaries

### Web application

Owns the candidate profile, job discovery records, application package, authorization, frozen document references, and canonical Tracker automation record. It may read candidate bytes from its own IndexedDB only for the exact active authorization.

### IndexedDB document store

Stores validated candidate document metadata and binary bytes under stable IDs in `applymate-documents`. It is local to the web-app origin and is the current MVP binary store, not encrypted cloud backup.

### Extension background worker

Validates externally connected origins and authorization/attempt messages, opens the exact URL, persists byte-free execution state in `chrome.storage.local`, and holds verified document bytes only in an in-memory attempt vault.

### Content script

Runs on supported ATS hosts, scans and modifies the live form for the authorized attempt, and receives only its attempt's documents. It cannot enumerate the IndexedDB store or request arbitrary files.

### External ATS page

Is untrusted, mutable third-party DOM and network behavior. Detection, locators, framework state, upload widgets, validation, submission controls, and outcome signals must all be re-verified at runtime.

## Identity, idempotency, and URL rules

- Job IDs, document IDs, authorization IDs, and attempt IDs are strings.
- One automation job exists per stable job key; no parallel authorization store is introduced.
- The authorization ID remains stable for the job. Each explicit retry receives a fresh attempt ID.
- Previous attempt IDs are retained so repeated or delayed messages cannot submit again.
- A page must match the authorized application URL before filling/submission. Redirects to login, assessment, unrelated paths, or ambiguous pages stop execution.
- Reload-interrupted execution becomes review-required; it never resumes submission automatically.

## Document integrity and cleanup

- Candidate files are validated by extension, MIME type, size limit, and byte signature before IndexedDB persistence.
- SHA-256 binds the frozen reference to the transferred bytes.
- Raw bytes and base64 never enter localStorage, Tracker, payload JSON, logs, or `chrome.storage.local`.
- The background vault is cleared on terminal result, explicit stop, tab close, or service-worker loss.
- A retry requires a fresh transfer. Cleanup never deletes the user's persistent IndexedDB copy.

## Review-required behavior

Execution stops with a structured kind, description, and required action for cases including:

- missing verified or explicitly approved answers;
- unresolved legal or demographic fields;
- missing, rejected, timed-out, or unavailable documents;
- unsupported ATS behavior or unclear submit control;
- CAPTCHA, login, identity verification, or external assessment;
- authorization/page mismatch;
- unknown submission outcome; and
- interrupted execution.

Review-required is a safe terminal/resting state, not evidence of submission and not permission to weaken a gate.

## Current scope and deferred production architecture

Current ATS support is Greenhouse and Lever on explicitly permitted hosts. The local storage and browser-extension design proves the MVP flow without production accounts or cloud infrastructure.

Deferred work includes generated résumé/cover-letter files, complete profile editing, more ATS adapters, durable receipt evidence, production authentication/database, encrypted cloud document storage, GDPR tooling, cross-device recovery, billing, observability, and hardened deployment. See [`roadmap.md`](roadmap.md).
