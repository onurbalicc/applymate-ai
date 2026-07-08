# ApplyMate AI

**ApplyMate AI is a quality-first, user-approved job application operating system.** It helps candidates build one strong profile, generate a Master CV foundation, review AI-prepared application packages, approve what moves forward, and track replies.

> **Core motto:** *"Let AI handle the applications. You focus on improving your profile, skills, and interviews."*

## ⚠️ Project status — frontend MVP demo

This is a **frontend-only MVP/demo**:

- **No real external applications are submitted.** Nothing leaves your browser.
- **No real AI API is connected yet.** All generated content (CVs, cover letters, replies) is realistic mock data.
- **Application state is demo-only**, persisted in `localStorage` (approve/decline/skip decisions, Master CV preview, language, theme).
- No accounts, no backend, no payments.

## Who it's for

Job seekers — initially students and juniors targeting **Germany / Europe** (working student, internship, entry-level roles) — who are tired of manual job-board grinding but don't want a bot spraying low-quality applications in their name.

## The problem

Job searching is a repetitive workflow done with scattered tools: searching five boards daily, saving links in tabs, rewriting the same cover letter, applying to unrealistic roles, and forgetting who replied. Mass auto-apply tools "solve" this by submitting hundreds of blind applications — trading quality and reputation for volume.

## The solution

ApplyMate treats the job search as one operated workflow:

**Scan → Match → Prepare → Approve → Track**

The AI scans trusted sources, hides low-fit roles below your match threshold, and prepares a complete **application package** per role (tailored cover letter, CV adaptation notes, recruiter message, risk analysis, interview prep). Then it stops and waits.

## Key differentiator

**Nothing is submitted without your approval. Ever.**

Unlike volume-first auto-apply tools (Auto/Hybrid modes, credits, "hundreds of applications daily"), ApplyMate runs in a single **review-first approval mode**: *AI prepares → You approve → 0 sent without review*. Fewer, better applications — approved by you.

## Current demo flow

```
Landing → Control Center → Profile Setup → Master CV Preview
        → Review Queue → Application Package → Approve → Tracker → Inbox
```

Try it: start at `/`, follow the **Getting started** checklist on the Control Center.

## Current features

- **Landing page** — positioning, workflow story, control-room previews, free-beta pricing preview with demo waitlist
- **Control Center** (`/dashboard`) — engine status (scan stats, job sources, match rules), approval trust metrics ("0 sent without review"), review-first mode panel, onboarding checklist, next actions, usage & plan preview, demo reset
- **Profile Setup** (`/profile`) — one profile, readiness score, impact preview, **Master CV Preview** (mock generation)
- **Review Queue** (`/review-queue`) — swipe-style approve / decline / skip with keyboard shortcuts
- **Application Package** (`/review?job=N`) — full package: cover letter, CV adaptation, recruiter message, quality score, risk & gap analysis, interview prep
- **Tracker** (`/tracker`) — pipeline board (Applied → Reply → Follow-up → Interview → Archived); approved packages land here with links back to their packages
- **Inbox** (`/inbox`) — mock reply center with contextual recommended steps and approval-gated draft replies
- **Demo state** — decisions persist across pages and refreshes via `localStorage`
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

- [Demo script (2 minutes)](docs/demo-script.md)
- [Roadmap](docs/roadmap.md)
- [Agent council workflow](docs/agent-workflow.md) — how product decisions are made

## Author

Onur Balic — M.Sc. Data Analytics, University of Hildesheim
GitHub: https://github.com/onurbalicc
