# ApplyMate AI — roadmap

**Product promise:** “Swipe right. ApplyMate handles the application.”
**Status basis:** baseline `ea921d6`

This file describes what is complete, partial, next, and later. Current implementation detail belongs in [`project-context.md`](project-context.md); execution design belongs in [`auto-apply-architecture.md`](auto-apply-architecture.md).

## Completed or largely completed

- Core responsive UI, navigation, localization, theme, dashboard, review queue, package review, Tracker, and inbox foundations.
- Typed candidate-profile foundation used by generation, ranking, and automation.
- Gemini-backed structured analysis and application-package generation with an honest labelled fallback when Gemini is unavailable.
- Greenhouse and Lever public-job discovery foundation plus normalized demo inputs.
- Deterministic job filtering, ranking, stable IDs, deduplication, match reasons, and caution reasons.
- Swipe-right authorization for one exact application.
- Background application-package orchestration with missing-information interruption, pause, cancel, resume, and retry states.
- Chrome Manifest V3 Greenhouse/Lever detection, form scanning, label resolution, normalized mapping, and popup diagnostics.
- Autonomous extension execution: value resolution, safety classification, framework-aware filling, validation, guarded submission, outcome detection, and Tracker synchronization.
- Duplicate-submission protection through stable authorization identity, fresh attempt IDs, prior-attempt tracking, URL matching, and reload-safe review routing.
- Persistent local PDF/DOCX pipeline: validation, IndexedDB bytes, metadata/checksums, defaults, authorization-time selection, attempt-scoped transfer, native upload, and cleanup.
- Controlled fixture submission including document upload, confirmed outcome, and exactly-once behavior.
- Real public Greenhouse and Lever résumé-upload validation in Chrome without employer submission.
- Tracker integration for preparation/execution progress, structured review reasons, upload metadata, and confirmed outcomes; detailed execution logs remain in extension execution records.

## Partially completed

- **Candidate profile:** typed model and document management exist; the UI does not edit every profile field.
- **Generated documents:** CV adaptation and cover-letter text exist; deterministic ATS-friendly PDF/DOCX generation does not.
- **ATS coverage:** Greenhouse and Lever foundations are implemented and validated on limited public variants; custom domains and other ATS platforms are unsupported.
- **Recovery and receipt UX:** interruptions and structured review states exist; guided recovery, screenshots, and durable confirmation receipts do not.
- **Production application evidence:** execution logs and upload metadata exist; durable tamper-resistant evidence does not.
- **Autopilot rules:** every right swipe uses hard safety gates; user-configurable thresholds, exclusions, and an autonomous/review-first preference are not implemented.
- **Discovery breadth:** configured Greenhouse/Lever sources work, but broad source coverage and production ingestion operations remain limited.

## Next

1. Generate ATS-friendly résumé and cover-letter PDFs from verified profile and package data, with deterministic layout, checksum integration, and browser-upload validation.
2. Complete the structured profile editor so users can safely maintain all facts and approved reusable answers used by automation.
3. Add durable submission receipt/evidence and clearer recovery UX before any ordinary real-employer use.
4. Run an explicitly authorized controlled real-employer pilot only after receipt and recovery gates are ready.
5. Extend ATS coverage incrementally, keeping Greenhouse/Lever fixtures and public no-submit checks as regression gates.

## Not yet production-ready / later production work

- Authentication and account recovery.
- Production user database.
- Encrypted cloud document storage, backup, and cross-device sync.
- GDPR export, deletion, retention, and consent tooling.
- Billing, subscriptions, and usage limits.
- Production observability, alerting, audit retention, and support tooling.
- Deployment hardening, secrets management, origin configuration, extension distribution, and security review.
- Broad web-app and browser end-to-end coverage across supported environments.
- More ATS adapters, localization-aware outcome detection, and custom-domain strategy.

## Permanent non-goals

- Unauthorized or bulk submission outside one exact right-swipe authorization.
- CAPTCHA solving, authentication bypass, identity-verification bypass, or anti-bot circumvention.
- Fabricated candidate facts or inferred legal, sponsorship, work-authorization, consent, or demographic answers.
- Marking an application submitted without a confirmed external success signal.
- Storing raw document bytes in ordinary JSON state, Tracker, logs, or extension persistent storage.
- Guaranteed interviews, acceptance, or volume-first claims.
