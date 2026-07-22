# ApplyMate AI

**ApplyMate AI is a safety-constrained autonomous job application system.** Candidates build one verified profile, discover suitable jobs, and swipe right to authorize ApplyMate to prepare, fill, and submit one exact application. Human review is the exception when truthful or technically safe execution cannot continue.

> **Core motto:** *"Let AI handle the applications. You focus on improving your profile, skills, and interviews."*

## Project status — local autonomous MVP

The repository currently includes:

- a Next.js web app with Gemini-backed structured package generation and a labelled fallback;
- Greenhouse and Lever discovery, ranking, swipe authorization, and Tracker orchestration;
- a Chrome extension that detects, fills, validates, uploads documents, submits when every safety gate passes, and verifies outcomes; and
- a persistent local PDF/DOCX store in IndexedDB with checksum-verified attempt-scoped transfer.

The autonomous path is validated end to end on controlled fixtures. Public Greenhouse and Lever upload controls have been validated without submission. No real-employer application has been submitted during development. Authentication, a production database, encrypted cloud document storage, generated PDF output, durable receipts, and production deployment hardening are not implemented.

## Who it's for

Job seekers — initially students and juniors targeting **Germany / Europe** (working student, internship, entry-level roles) — who are tired of manual job-board grinding but don't want a bot spraying low-quality applications in their name.

## The problem

Job searching is a repetitive workflow done with scattered tools: searching five boards daily, saving links in tabs, rewriting the same cover letter, applying to unrealistic roles, and forgetting who replied. Mass auto-apply tools "solve" this by submitting hundreds of blind applications — trading quality and reputation for volume.

## The solution

ApplyMate treats the job search as one operated workflow:

**Discover → Match → Swipe right → Prepare → Fill and submit when safe → Track**

The system scans configured sources, hides low-fit roles below the candidate's threshold, prepares a grounded application package, and hands the exact authorized application to the extension. Missing, sensitive, blocked, or uncertain cases stop for review.

## Key differentiator

**One right swipe authorizes one exact application.**

Unlike volume-first auto-apply tools, ApplyMate binds authorization to the job and application URL, refuses fabricated or inferred sensitive answers, prevents duplicate submission, and records `SUBMITTED` only after a confirmed ATS success signal.

## Current demo flow

```
Profile → Job discovery → Review Queue → Swipe right
        → Package preparation → Browser extension → Tracker
```

Try it: start at `/`, follow the **Getting started** checklist on the Control Center.

## Current features

- **Landing page** — positioning, workflow story, control-room previews, free-beta pricing preview with demo waitlist
- **Control Center** (`/dashboard`) — engine status, discovery health, onboarding, navigation, and demo surfaces
- **Profile Setup** (`/profile`) — structured profile foundation, Master CV generation, and persistent default résumé/cover-letter management
- **Review Queue** (`/review-queue`) — swipe-style authorize / decline / skip flow with keyboard shortcuts
- **Application Package** (`/review?job=N`) — full package: cover letter, CV adaptation, recruiter message, quality score, risk & gap analysis, interview prep
- **Tracker** (`/tracker`) — package-preparation and autonomous-execution progress, review-required reasons, upload metadata, and confirmed outcomes
- **Inbox** (`/inbox`) — mock reply center with contextual recommended steps and approval-gated draft replies
- **Local state** — ordinary JSON state persists in `localStorage`; candidate document bytes persist separately in IndexedDB
- **i18n** — EN / TR / DE with a typed, dependency-free dictionary (English-first development)
- **Dark / light theme**
- Internal tool: `/analyze` (manual CV/job analyzer, not in navigation)

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS 4** + custom design tokens (dark/light)
- Custom lightweight i18n and state stores built on `useSyncExternalStore` + `localStorage` — **zero runtime dependencies beyond Next/React**

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Docs

- [Permanent Codex instructions](AGENTS.md)
- [Current project context](docs/project-context.md)
- [AI development workflow](docs/ai-development-workflow.md)
- [Codex sprint template](docs/codex-sprint-template.md)
- [Autonomous application architecture](docs/auto-apply-architecture.md)
- [Browser-extension manual validation](browser-extension/MANUAL_TESTING.md)
- [Demo script (2 minutes)](docs/demo-script.md)
- [Roadmap](docs/roadmap.md)
- [Historical agent council workflow](docs/agent-workflow.md)

## Author

Onur Balic — M.Sc. Data Analytics, University of Hildesheim
GitHub: https://github.com/onurbalicc
