# AI development workflow

This workflow keeps each development sprint focused and makes the repository—not old chat history—the source of truth.

## Recommended workflow

1. Use one ChatGPT conversation for planning or discussing one major sprint.
2. Use one Codex conversation to implement and validate that sprint.
3. Keep permanent rules and current architecture in repository files.
4. Start the Codex request from [`codex-sprint-template.md`](codex-sprint-template.md); do not repeat the full project history.
5. Let Codex inspect the relevant code, implement the scoped change, and run proportionate validation.
6. Review Codex's final report and the actual Git diff.
7. Run a separate pre-commit review using [`codex-review-template.md`](codex-review-template.md).
8. Perform the commit and push manually after the review is clear.
9. Start the next sprint from the new clean baseline commit.

## What to send to ChatGPT

- The sprint goal.
- The latest clean commit.
- The Codex final report.
- `git status` and the relevant diff when review is needed.
- Any UI issue you personally observed, including where and how to reproduce it.

## What not to paste repeatedly

- The full repository history.
- All old sprint prompts.
- Thousands of lines of successful test output.
- Complete unchanged architecture documentation.

Link to the repository sources instead. [`../AGENTS.md`](../AGENTS.md) owns permanent rules, [`project-context.md`](project-context.md) owns current state, and [`auto-apply-architecture.md`](auto-apply-architecture.md) owns the autonomous execution design.

## When to open a new chat

Open a new ChatGPT and Codex chat when:

- a sprint is committed;
- the goal changes materially;
- the old conversation contains large logs; or
- the current task is unrelated to the previous sprint.

Continue the same chat only for:

- fixing defects from the current sprint;
- completing missing validation gates; or
- reviewing the same uncommitted diff.

## Before committing

Confirm that the diff contains only intended files, validations are honest, no real employer submission occurred during ordinary testing, and no secrets or generated artifacts were added. The repository defaults to no staging, commit, or push by Codex unless explicitly requested.
