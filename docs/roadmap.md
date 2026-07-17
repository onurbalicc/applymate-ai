# ApplyMate AI — Roadmap

**Product promise:** "Swipe right. ApplyMate handles the application."
**Motto:** "Let AI handle the applications. You focus on improving your profile, skills, and interviews."

ApplyMate is an **automation-first** product: the user completes their profile once, then a single
swipe-right starts the complete background application pipeline. The product stays honest:
no application is ever marked submitted without a real external submission, and nothing is
submitted outside the user's explicit authorization and configured rules.

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

Foundation implemented (see `docs/auto-apply-architecture.md` §1c) — the extension itself does not exist yet:

- Unified ATS-independent application field contract (`app/lib/application-fields/`) ✅
- Deterministic sensitive-question classifier (SAFE / NEEDS_CONFIRMATION / NEVER_AUTO_FILL), unit-tested ✅
- Strict missing-information enforcement at the domain level ✅
- Browser-extension application data contract + payload builder with honest readiness states ✅
- Form field detection and DOM mapping on real ATS pages ⬜
- The extension itself (manifest, content scripts, review sidebar) ⬜
- Résumé file generation/upload (no CV file exists anywhere yet) ⬜
- Initial ATS targets: Greenhouse, Lever, Workable ⬜

## Phase 7 — One ATS End-to-End Application Pilot ⬜

- Full flow through real external form filling and submission (review-first mode)
- Submission receipts: screenshot, timestamp, field mapping
- Duplicate prevention; audit trail in Tracker

## Phase 8 — Approved Autopilot ⬜

- Explicit opt-in with strict user-configured rules
- Submission only when all conditions pass (no missing info, no low-confidence fields,
  no sensitive questions, no CAPTCHA)
- Real-time pause/resume; full audit log

## Phase 9 — Payments and Usage Limits ⬜

- Application packages per month as the billing unit; Free / Pro tiers
- No paywall before real submission value is live

---

## Non-Goals (permanent)

- Silent or unauthorized submission — SUBMITTED requires a real external submission receipt
- CAPTCHA solving or anti-bot circumvention
- Fabricated answers, invented experience, or inferred sensitive data
- Fake urgency, fake testimonials, invented user counts, volume-based growth metrics
