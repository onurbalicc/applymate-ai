# Sprint title

## Baseline

- Commit: `<clean baseline commit>`
- Read `AGENTS.md`.
- Read only the relevant project docs and source files.

## Goal

State the outcome in one or two sentences.

## Scope

- Specific work included.

## Out of scope

- Specific work excluded.

## Requirements

- Focused implementation requirement.
- Safety or compatibility requirement specific to this sprint.

## Acceptance criteria

- Observable condition proving completion.
- Observable failure/safety behavior where relevant.

## Validation

- Sprint-specific focused checks.
- Run the standard applicable commands from `AGENTS.md`.

## Restrictions

All standard `AGENTS.md` restrictions apply.

## Final report

Keep it concise: what changed, tests, browser validation, known limitations, Git status, and recommendation.

---

# Example: Generated ATS-friendly résumé and cover-letter PDFs

## Baseline

- Commit: `ea921d6`
- Read `AGENTS.md`, `docs/project-context.md`, and the document sections of `docs/auto-apply-architecture.md`.

## Goal

Generate deterministic ATS-friendly résumé and cover-letter PDFs from verified profile and job-package content so they can enter the existing document-selection and extension-upload pipeline.

## Scope

- PDF generation, metadata/checksum persistence, selection integration, focused UI status, and controlled upload validation.

## Out of scope

- DOCX generation, cloud storage, new ATS adapters, visual résumé templates, or real-employer submission.

## Requirements

- Never invent candidate facts; keep generated binary bytes in IndexedDB.
- Reuse stable document IDs, frozen selection, checksums, and the existing attempt-scoped transfer.
- Produce a simple text-first PDF that remains parseable by ATS software.

## Acceptance criteria

- A generated résumé and optional cover letter persist, reload, freeze into authorization, transfer with valid checksums, and upload on controlled Greenhouse/Lever fixtures.
- Missing or failed generation blocks safely and does not masquerade as a file.

## Validation

- Add focused generation, persistence, selection, transfer, and fixture-upload tests.
- Run applicable standard commands from `AGENTS.md`; use real ATS pages only for non-submit validation.

## Restrictions

All standard `AGENTS.md` restrictions apply. Do not submit to a real employer.

## Final report

Report what changed, tests, browser validation, known limitations, Git status, and recommendation.
