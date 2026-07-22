# Codex pre-commit review

Review the completed sprint against its goal, acceptance criteria, `AGENTS.md`, and relevant architecture. Do not change code unless explicitly asked.

1. Inspect `git status --short` and both staged and unstaged diffs.
2. Identify unexpected files or scope outside the sprint.
3. Check for secrets, personal files/data, screenshots, generated artifacts, build output, `dist`, and `node_modules` that should not be included.
4. Verify documentation describes the implementation that actually exists.
5. Distinguish production implementation from mocks, fixtures, or test-only behavior.
6. Check every validation and real-browser claim against available evidence; list untested claims explicitly.
7. Rerun focused tests only when needed to verify a risk or changed behavior.
8. Report correctness, safety, privacy, compatibility, dependency, and regression concerns with exact file references.
9. List exact blockers before commit and clearly separate them from optional improvements.
10. Finish with Git status and a recommendation: ready, ready with caveats, or not ready.

Never stage, commit, push, create a pull request, change remotes, or rewrite history during review.
