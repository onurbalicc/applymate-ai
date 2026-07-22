# ApplyMate AI — current project context

**Baseline:** `ea921d6`

**Reconciled:** 2026-07-22
**Purpose:** Concise answer to “What exists right now?”

Permanent implementation and safety rules live in [`../AGENTS.md`](../AGENTS.md). The deeper execution design lives in [`auto-apply-architecture.md`](auto-apply-architecture.md).

## Product vision

ApplyMate is a safety-constrained autonomous job application system for students and junior candidates, initially focused on Germany and Europe. A right swipe authorizes ApplyMate to prepare, fill, and submit one exact application. Human review is an exception when the system cannot proceed truthfully or safely.

## Current user flow

`Profile → Discover and rank jobs → Swipe right → Prepare application package → Freeze documents → Hand off to extension → Fill and submit if every gate passes → Synchronize outcome to Tracker`

The user can pause, stop, retry, or resolve a structured review-required state. Demo jobs without a real application URL stop honestly before extension execution.

## Web application

- Next.js 16 App Router application with landing, dashboard, profile, analyzer, review queue, application-package review, Tracker, and inbox surfaces.
- Client-side stores use `localStorage` for candidate profile, discovered jobs, decisions, generated package state, and automation records.
- `/api/analyze` and the package pipeline use Gemini structured generation when configured and clearly labelled mock fallback data otherwise.
- The web app sends one authorized execution payload to the extension and polls execution status back into the existing automation record used by Tracker.

## Candidate profile

- A typed `CandidateProfile` is the factual source for AI generation and form-value resolution.
- It includes identity/contact information, experience, education, projects, skills, languages, job preferences, reusable approved answers, and demographic-answer policy.
- The current Profile UI manages application documents and Master CV generation, but is not yet a complete editor for every structured profile field.
- Sensitive answers remain unset unless explicitly provided or approved; defaults are not treated as evidence.

## Job discovery

- Server-side provider adapters ingest configured public Greenhouse boards and Lever sites; demo data remains available as fallback/input.
- Jobs are normalized to stable string IDs, deduplicated, filtered by exclusions, and persisted locally with provider and decision metadata.
- Discovery health distinguishes successful, partial-error, and failed runs.

## Matching and ranking

- Deterministic ranking compares normalized jobs with profile roles, skills, locations, work mode, employment type, and exclusions.
- Jobs below the configured minimum score do not enter the visible queue.
- Match reasons and caution reasons are retained; scoring is not evidence that a sensitive application answer is known.

## Automation orchestration

- Swipe right creates one duplicate-safe `AutomationJob` and is the authorization for that exact job/application URL.
- The package pipeline analyzes the job, prepares/reuses a Master CV basis, generates job-specific CV adaptation text, cover-letter text, recruiter content and form answers, and checks missing information.
- Real jobs then receive an authorization timestamp, frozen document selection, and fresh execution attempt ID before extension handoff.
- Reloaded in-flight execution never resumes silently; it becomes review-required to avoid duplicate or uncertain submission.

## Browser extension

- A Chrome Manifest V3 extension supports Greenhouse and Lever detection, scanning, deterministic field mapping, value resolution, filling, document upload, validation, guarded submission, and outcome detection.
- The background service worker accepts authorized messages from configured ApplyMate origins, opens/focuses the exact application tab, stores JSON execution state in `chrome.storage.local`, and keeps transferred document bytes only in memory.
- The execution engine does not overwrite existing values by default and routes unsupported, missing, sensitive, authentication, CAPTCHA, upload, page-match, or outcome uncertainty to structured review-required states.

## Greenhouse support

- Host and DOM detection, form discovery, label resolution, field mapping, framework-aware filling, hidden/native file upload, validation, submit-control identification, and outcome detection exist.
- Public EarnIn Greenhouse upload behavior was validated in Chrome on 2026-07-22 with a synthetic PDF and no submission. Sensitive controls remained untouched.

## Lever support

- Host and DOM detection, styled-widget discovery, label cleanup, field mapping, filling, hidden native file upload, validation, submit-control identification, and outcome detection exist.
- Public Voltus Lever upload behavior was validated in Chrome on 2026-07-22 with a synthetic PDF and no submission. The production scanner mapped the résumé input without upload-status text polluting its label.

## Document pipeline

- Real PDF and DOCX files up to 5 MB are validated by name, MIME type, size, and byte signature.
- Metadata uses stable string IDs and SHA-256 checksums; bytes persist in the versioned `applymate-documents` IndexedDB database.
- Default résumé and optional cover-letter upload, reload persistence, replacement, and deletion exist in Profile.
- Document choice is deterministic and frozen at authorization. References travel in payload JSON; bytes use a separate checksum-verified, attempt-scoped transfer.
- Generated résumé and cover-letter content is still text only. ATS-friendly PDF generation is not implemented.

## Tracker

- Tracker reads the existing local automation store, including preparation and extension-execution states, progress, upload metadata, outcome, and structured review-required reasons.
- `SUBMITTED` is recorded only after the extension reports a confirmed success signal.
- Execution logs exist, but durable screenshots, confirmation-page captures, and receipt persistence do not.

## Storage model

- Ordinary application/profile/discovery/automation JSON: browser `localStorage`.
- Extension execution records without document bytes: `chrome.storage.local`.
- Candidate document metadata and bytes: IndexedDB in the web-app origin.
- Transferred document bytes: temporary in-memory extension vault scoped to one authorization attempt.
- Production authentication, user database, encrypted cloud storage, backup, cross-device sync, and recovery are not implemented.

## Test status

- Root tests cover the sensitive-field classifier, missing-information enforcement, extension payload construction, IndexedDB document persistence, and document selection.
- Extension tests cover ATS scanning/mapping, value and answer resolution, field filling, document transfer/upload, form validation, submission guards, execution flow, cancellation, outcomes, and exactly-once fixture submission.
- Loaded-extension Chrome validation has covered controlled fixtures and non-submitting public Greenhouse/Lever checks. No real-employer application has been submitted.
- Detailed reproducible evidence is in [`../browser-extension/MANUAL_TESTING.md`](../browser-extension/MANUAL_TESTING.md).

## Current known limitations

- No complete profile editor for all profile fields.
- No generated résumé or cover-letter PDF/DOCX renderer.
- ATS execution coverage is limited to Greenhouse and Lever host patterns and tested variants.
- No durable submission receipt or screenshot evidence.
- No production auth, database, encrypted cloud document storage, GDPR tooling, cross-device sync, billing, observability, or hardened deployment.
- Broad web-application end-to-end coverage is not in place.

## Immediate likely roadmap areas

1. Generate deterministic ATS-friendly résumé and cover-letter PDFs from verified profile/package data.
2. Complete the structured profile editor and document-selection UX.
3. Add durable receipt/evidence and recovery UX, then consider an explicitly authorized real-employer pilot.
4. Expand ATS coverage only after Greenhouse/Lever regression gates remain stable.

See [`roadmap.md`](roadmap.md) for prioritization rather than implementation history.
