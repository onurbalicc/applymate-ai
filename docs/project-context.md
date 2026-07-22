# ApplyMate AI — Current Project Context

**Last reconciled:** 2026-07-22
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
- Chrome Manifest V3 extension for Greenhouse and Lever detection, field mapping, value resolution, safe filling, real PDF/DOCX upload through native file inputs, validation, idempotent submission, and outcome detection.
- Web app to extension bridge and Tracker status synchronization.
- Sensitive-field controls that refuse fabrication and require exact approved answers where applicable.
- Default résumé and optional cover-letter management on Profile, with validated binary files persisted in IndexedDB and metadata kept out of ordinary application JSON.
- Authorization-time document selection and a checksum-verified, attempt-scoped web-to-extension transfer. Raw bytes are never persisted in Tracker or `chrome.storage.local`.
- Local document fixture end-to-end upload, validation and exactly-once submission verified; no real-employer end-to-end submission has been completed.
- Dated Chrome validation on 2026-07-22 verified Profile PDF upload/reload/replace/delete against real IndexedDB bytes, plus no-submit uploads on current public EarnIn Greenhouse and Voltus Lever forms. Lever's captured live form rescanned with production `runScan` mapped the résumé cleanly without upload-status text leaking into the label.
- Client state and candidate data are still stored locally in the browser. Authentication, a production database, encrypted cloud document storage, cross-device sync and recovery do not exist yet.

## Completed handoff

The shared ChatGPT handoff titled **“Handoff ve Sprint Planı”** corresponds to commit `49081a9` (`feat: add autonomous application execution`). The file list and scope in that handoff match the commit: background service worker, execution engine, web-to-extension bridge, Tracker automation states, ATS fixtures/tests, and architecture documentation.

Source: https://chatgpt.com/share/6a5fb3f9-e49c-83eb-9325-933ba312ec07

## Current primary blocker

The local MVP document pipeline is implemented; automated fixtures prove selection → transfer → native upload → validation → exactly-once submission, and dated Chrome checks now prove Profile binary persistence plus current public Greenhouse/Lever upload-widget compatibility without submission. The remaining high-risk gate is an explicitly authorized controlled pilot with durable receipt evidence. Generated résumé/cover-letter text is still not rendered into PDF; users must upload real PDF/DOCX files for now.

## Recommended next milestone

Run one explicitly authorized controlled pilot and add a durable submission receipt. Keep the current Greenhouse/Lever no-submit checks as regression gates whenever ATS markup changes. Generated PDF export, profile editing, authentication/database work, encrypted cloud storage, GDPR controls and broader ATS coverage remain follow-up milestones.

## Working agreement for future Codex sessions

- The repository is the source of truth; old chat prompts are historical context, not executable specifications.
- The user can describe outcomes naturally. Codex should inspect current code, translate the request into an implementation plan, make scoped changes, run proportionate verification, and report the result.
- Do not ask the user to manufacture sprint prompts or manually relay terminal output that Codex can inspect itself.
- Preserve the safety invariants in `docs/auto-apply-architecture.md`.
- After a material milestone, update this file and `docs/roadmap.md` so the next session starts from verified state.
