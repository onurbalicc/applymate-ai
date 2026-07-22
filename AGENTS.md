# ApplyMate AI repository instructions

Read this file before working in the repository. For product work, also read
`docs/project-context.md` and only the architecture documents relevant to the task.
The repository and verified tests are authoritative; old prompts and historical docs are not.

## Project identity

- ApplyMate AI is an autonomous job application system.
- The user selects a job by swiping right. That action authorizes ApplyMate to complete and submit that exact application.
- ApplyMate is not merely an autofill assistant. Human review is the exception for unresolved, unsafe, or technically blocked cases.

## Product invariants

- Never fabricate candidate information.
- Never infer legal, work-authorization, sponsorship, demographic, identity, or consent answers.
- Use only verified profile data, explicit preferences, approved reusable answers, and job-specific generated content grounded in the candidate profile.
- One authorization applies to one exact job and application URL.
- Preserve idempotency and duplicate-submission protection across retries, reloads, and repeated messages.
- Mark an application `SUBMITTED` only after a confirmed external success signal. A click alone is not success.
- Never bypass CAPTCHA, authentication, identity verification, anti-bot controls, or access controls.
- Never send a real employer application during development or automated testing unless the user explicitly authorizes a controlled pilot.

## Architecture rules

- Reuse the existing architecture before introducing parallel stores, identifiers, or duplicate state.
- Use stable string IDs.
- Keep ordinary JSON state separate from binary document bytes.
- IndexedDB is the current MVP binary-document store.
- Never store raw document bytes or base64 in localStorage, Tracker state, ordinary application JSON, logs, or `chrome.storage.local`.
- Treat `docs/project-context.md` and the relevant architecture document as the current source of truth.
- Do not introduce production cloud infrastructure unless the sprint explicitly requests it.
- Prefer focused changes over broad redesigns.
- This repository uses Next.js 16 with breaking changes. Before changing Next.js behavior, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecations.

## Development workflow

- Audit the relevant existing flow before editing.
- Make small, reviewable changes and preserve unrelated user work.
- Add focused tests for behavior changed.
- Preserve backward compatibility unless the sprint explicitly changes it.
- Do not silently weaken safety checks to make tests pass.
- Fix root causes rather than fixture-only symptoms.
- Continue past isolated non-fatal field failures where partial execution is expected, but fail safely before submission if a required gate is unresolved.
- After a material product milestone, update `docs/project-context.md` and `docs/roadmap.md`.

## Browser validation

- Unit tests and jsdom are not sufficient evidence for browser-extension behavior.
- For meaningful extension changes, follow `browser-extension/MANUAL_TESTING.md` using Playwright, Chrome for Testing, and the unpacked extension.
- Use controlled local fixtures for real submit-event testing.
- Use public Greenhouse and Lever pages only in non-submitting dry-run validation.
- Distinguish fixture validation from real-site validation in reports.
- Do not claim real-browser validation unless it actually occurred.

## Required validation

Run checks proportionate to the files changed. The current authoritative commands are:

From the repository root:

```bash
npm test
npm run lint
npm run build
```

From `browser-extension/`:

```bash
npm run typecheck
npm test
npm run build
```

For every change:

```bash
git diff --check
```

Documentation-only work does not require unrelated builds or test suites. Verify referenced paths, links, and package scripts instead, and report exactly what was and was not run.

## Git restrictions

By default, do not:

- stage files;
- commit or push;
- create pull requests;
- change remotes; or
- rewrite Git history.

Perform those actions only when the user explicitly requests them.

## Final-report standard

Keep reports concise and include only what applies:

- architecture audit;
- implementation summary;
- files or modules changed;
- tests and exact results;
- real-browser validation performed;
- known limitations;
- security or privacy notes where relevant;
- dependencies added or modified;
- Git status; and
- recommendation.

Be explicit about incomplete or untested work. Do not force a large fixed-format report when a shorter one is clearer.

## Efficiency rules

- Read `AGENTS.md` first.
- Read only documentation and source files relevant to the task.
- Use targeted search before broad exploration; do not repeatedly scan the whole repository without a reason.
- Reuse existing tests, fixtures, contracts, and helpers.
- Do not restate the full project history in reports.
- Summarize large successful outputs; include failure details exactly.
- Do not duplicate documentation already maintained by another source-of-truth file.

Documentation ownership:

- `AGENTS.md`: permanent Codex rules.
- `docs/project-context.md`: current implemented state.
- `docs/auto-apply-architecture.md`: autonomous application architecture.
- `docs/roadmap.md`: completed, partial, next, and later work.
- `browser-extension/MANUAL_TESTING.md`: extension validation procedure and evidence.
- `docs/codex-sprint-template.md`: implementation request template.
- `docs/codex-review-template.md`: pre-commit review template.
- `docs/ai-development-workflow.md`: product-owner working guide.
