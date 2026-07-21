# ApplyMate AI — Roadmap

**Product promise:** "Swipe right. ApplyMate handles the application."
**Motto:** "Let AI handle the applications. You focus on improving your profile, skills, and interviews."

ApplyMate is an **autonomous application system**, not an autofill assistant. The user completes
their profile once; a single swipe-right is the one-time authorization for ApplyMate to prepare,
fill, and submit exactly that application without further per-field or per-submit confirmation.
Human review is the exception path — used only when an application cannot be completed truthfully
or technically (see `docs/auto-apply-architecture.md` §1g) — not the default. The product stays
honest: no application is ever marked submitted without a real, detected external submission
signal, no legal or demographic answer is ever fabricated, and nothing acts on a page that doesn't
match the exact application the user authorized.

Status key: ✅ Done · 🚧 In progress · ⬜ Planned

---

## Phase 1 — MVP Demo ✅

- Landing page with review-first positioning (EN/TR/DE)
- Control Center, Review Queue, Application Package viewer, Tracker, Inbox (mock data)
- Typed dependency-free i18n (EN first, TR/DE), dark/light themes
- Approve / decline / skip demo state (localStorage)

## Phase 2 — Real AI Analyzer + Shared AI Foundation ✅

- `/analyze`: paste CV + JD → real AI match analysis (`POST /api/analyze`)
- Shared Gemini provider (`app/lib/ai/provider.ts`), contracts, prompt builders
- Honest demo fallback labelling when `GEMINI_API_KEY` is not configured

## Phase 3 — Automation-First Vertical Slice 🚧

The core interaction: **swipe right → ApplyMate prepares the application automatically.**

- Structured `CandidateProfile` model (one-time profile as the only substantial user task) ✅
- Swipe-right / "Apply with ApplyMate" trigger in the Review Queue (touch + button + keyboard) ✅
- Background automation orchestrator (`app/lib/automation/`) with the full status lifecycle
  (QUEUED → … → PACKAGE_READY → FORM_AUTOMATION_PENDING) ✅
- Automatic Master CV preparation (cached, reused across applications; regeneration is a
  secondary action, not the main flow) ✅
- Automatic Application Package generation (job-specific CV adaptation, motivation letter,
  recruiter message, application answers) ✅
- Missing-information interruption (NEEDS_USER_INPUT with compact answer request; nothing
  is ever invented) ✅
- Automation progress UI in Tracker and on `/review` (pause / cancel / resume / retry) ✅
- Profile editing UI (form fields for the structured profile) ⬜
- Honest end state: pipeline stops at FORM_AUTOMATION_PENDING — no external submission exists yet ✅

## Phase 4 — Job Discovery ⬜

- Real job-source ingestion (compliant sources only)
- Match scoring against the candidate profile before jobs enter the queue
- Queue populated by discovery instead of mock data

## Phase 5 — Database + Authentication + Secure Document Storage ⬜

- User accounts; replace localStorage demo persistence
- Encrypted profile and document storage; CV/letter file uploads
- GDPR-compliant deletion

## Phase 6 — Browser Extension / Automation Worker Prototype 🚧

Foundation implemented (see `docs/auto-apply-architecture.md` §1c):

- Unified ATS-independent application field contract (`app/lib/application-fields/`) ✅
- Deterministic sensitive-question classifier (SAFE / NEEDS_CONFIRMATION / NEVER_AUTO_FILL), unit-tested ✅
- Strict missing-information enforcement at the domain level ✅
- Browser-extension application data contract + payload builder with honest readiness states ✅

**Browser Extension MVP Part 1: Detection and Field Mapping** ✅ (see `docs/auto-apply-architecture.md` §1d, `browser-extension/`)
- Chrome Manifest V3 extension package (Greenhouse + Lever), read-only ✅
- ATS detection (hostname + DOM markers, fails safe to "unsupported") ✅
- Form field discovery + label resolution + stable locator generation ✅
- Deterministic field mapping into the existing Unified Field Contract, reusing the real classifier ✅
- Read-only popup panel (detected ATS, field counts, per-field mapping/confidence/safety) ✅
- Automatic + manual ("Scan again") scan lifecycle, debounced MutationObserver ✅

**Browser Extension MVP Part 2: Autonomous Application Execution** ✅ (see `docs/auto-apply-architecture.md` §1e–§1g, `browser-extension/src/execution/`)
- Right swipe is the one-time application authorization; `job.key` doubles as the authorization id — no separate authorization store ✅
- Full execution engine: scan → resolve values → decide per-field action → fill → upload documents → validate → submit → detect outcome, with a structured execution log at every stage ✅
- Strict source-priority value resolution (approved answer → verified profile → reusable answer → generated package → deterministic derivation → unresolved), never fabricated ✅
- Independent, defense-in-depth sensitivity gate (`answer-resolver.ts`): NEVER_AUTO_FILL fields fill ONLY from an explicit per-question approved answer or an explicit demographic policy — refused even if a value happened to resolve from an unsafe source ✅
- Real DOM filling via the native-setter + dispatched-event technique, with re-locate-and-verify retries — found necessary against a real, still-hydrating React ATS page during live validation ✅
- Submission controller: idempotent (attempt-id based), page-match-verified, CAPTCHA-refusing, dry-run-capable; outcome detector never marks SUBMITTED without a real confirmed signal ✅
- Extension ↔ web app bridge via a background service worker (`externally_connectable` + `chrome.storage.local`), a pinned manifest key for a stable extension id, and Tracker polling sync ✅
- Review-required fallback with a structured, specific reason for every stop-short case ✅
- **Known gap:** no résumé/cover-letter FILE exists anywhere in ApplyMate yet (`resumeFileAvailable` is always `false`) — any real ATS form requiring a résumé upload will currently always land in `review-required`, honestly, rather than skip or fabricate the upload. This is the primary blocker to true end-to-end autonomous submission on a real form today.
- Initial ATS targets remain Greenhouse, Lever; Workable considered afterward ⬜

## Phase 7 — One ATS End-to-End Application Pilot 🚧

- Full flow through real external form filling and submission (review-first mode) — **achieved against a controlled local ATS fixture** (genuine fill → validate → click submit → detect a real success signal, verified via a real loaded extension); **not yet achieved against a real employer ATS**, blocked specifically on the résumé-file gap above (every real form tested stopped at review-required before reaching submission, correctly)
- Submission receipts: screenshot, timestamp, field mapping ⬜
- Duplicate prevention (idempotency key, `previousAttemptIds`) ✅; audit trail in Tracker (execution log synced, no screenshot/receipt persistence yet) 🚧

## Phase 8 — Configurable Autopilot Rules 🚧

The core "submit without asking again" behavior described here is now the Phase 6 baseline — every
right swipe already only submits when all conditions pass (no missing info, no unresolved sensitive
question, no CAPTCHA) and stops otherwise, with pause/stop and a full execution log ✅. What remains
is user-configurable RULES layered on top of that baseline:

- Per-user thresholds beyond match score (e.g. auto-submit only above a higher bar than the review-queue's own minimum)
- Explicit company/keyword exclusion rules scoped to autonomous execution specifically
- A visible, user-facing on/off switch for autonomous execution vs. review-first-always, if requested

## Phase 9 — Payments and Usage Limits ⬜

- Application packages per month as the billing unit; Free / Pro tiers
- No paywall before real submission value is live

---

## Non-Goals (permanent)

- Silent or unauthorized submission — SUBMITTED requires a real external submission receipt
- CAPTCHA solving or anti-bot circumvention
- Fabricated answers, invented experience, or inferred sensitive data
- Fake urgency, fake testimonials, invented user counts, volume-based growth metrics
