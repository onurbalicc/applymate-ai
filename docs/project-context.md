# ApplyMate AI — Current Project Context

**Last reconciled:** 2026-07-21  
**Purpose:** Give future Codex sessions a short, durable handoff without requiring old ChatGPT prompts to be copied manually.

## Product direction

ApplyMate is an autonomous, safety-constrained job application system for students and junior candidates targeting Germany and Europe.

The intended core flow is:

`Discover → Rank → Swipe right to authorize one application → Prepare truthful materials → Fill and submit when safe → Stop for review when blocked → Track the verified outcome`

A right swipe is the one-time authorization for that exact job. It is not permission for unrelated or bulk submissions. ApplyMate must stop when required information is missing, a sensitive answer lacks explicit approval, a CAPTCHA appears, the live page does not match the authorized application, or submission success cannot be verified.

The implementation and `docs/roadmap.md` are newer than the frontend-demo language still present in parts of `README.md`, `docs/ai-architecture.md`, and `docs/demo-script.md`. Until those documents are reconciled, do not infer current product behavior from their older “frontend-only” or “review-first” statements.

## Verified implementation state

- Next.js web app with profile, discovery, review queue, package generation, automation progress, tracker, and inbox surfaces.
- Gemini-backed structured generation with an explicitly labelled mock fallback when no API key is configured.
- Live public-job ingestion adapters for configured Greenhouse boards and Lever sites, plus demo data.
- Chrome Manifest V3 extension for Greenhouse and Lever detection, field mapping, value resolution, safe filling, document handling, validation, idempotent submission, and outcome detection.
- Web app to extension bridge and Tracker status synchronization.
- Sensitive-field controls that refuse fabrication and require exact approved answers where applicable.
- Local fixture end-to-end submission verified; no real-employer end-to-end submission has been completed.
- Client state and candidate data are still stored in `localStorage`; authentication, database storage, and secure document storage do not exist yet.

## Completed handoff

The shared ChatGPT handoff titled **“Handoff ve Sprint Planı”** corresponds to commit `49081a9` (`feat: add autonomous application execution`). The file list and scope in that handoff match the commit: background service worker, execution engine, web-to-extension bridge, Tracker automation states, ATS fixtures/tests, and architecture documentation.

Source: https://chatgpt.com/share/6a5fb3f9-e49c-83eb-9325-933ba312ec07

## Current primary blocker

ApplyMate has no real résumé or cover-letter file pipeline. `resumeFileAvailable` and `coverLetterFileAvailable` remain `false`, so a real ATS requiring a résumé upload correctly stops at review-required. This is the main blocker to a real-employer end-to-end pilot.

## Recommended next milestone

Build the document pipeline before expanding ATS coverage or adding payments:

1. Decide the document trust boundary and storage model; do not place résumé binaries or sensitive document contents in ordinary `localStorage`.
2. Add résumé upload/import with type, size, and integrity validation.
3. Define a versioned document record and explicit per-application document selection.
4. Pass an authorized document reference through the web-to-extension contract.
5. Implement extension-side retrieval/upload without fabricating file availability.
6. Add unit, integration, and browser-fixture tests for success, missing document, stale reference, wrong file, retry, and cancellation paths.
7. Run a dry-run pilot, then one explicitly authorized real-employer application with a submission receipt and audit trail.

Profile editing, authentication/database work, GDPR controls, and stale documentation reconciliation remain important follow-up milestones. The document pipeline comes first because it is the narrowest blocker to proving the existing autonomous vertical slice.

## Working agreement for future Codex sessions

- The repository is the source of truth; old chat prompts are historical context, not executable specifications.
- The user can describe outcomes naturally. Codex should inspect current code, translate the request into an implementation plan, make scoped changes, run proportionate verification, and report the result.
- Do not ask the user to manufacture sprint prompts or manually relay terminal output that Codex can inspect itself.
- Preserve the safety invariants in `docs/auto-apply-architecture.md`.
- After a material milestone, update this file and `docs/roadmap.md` so the next session starts from verified state.
