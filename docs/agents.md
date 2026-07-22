# ApplyMate AI Multi-Agent Product Team

> **Historical role catalog.** This is not the current instruction source for Codex and its product assumptions may reflect the early frontend demo. Use [`../AGENTS.md`](../AGENTS.md), [`project-context.md`](project-context.md), and [`roadmap.md`](roadmap.md) for current work.
>
> Original internal operating system for product development decisions.
> Last updated: July 2, 2026

---

## 1. Founder / CEO Role

**Onur Balic** is the final decision maker.

### Responsibilities

- Define and protect the product vision
- Set priorities for each development cycle
- Give final approval before implementation begins
- Decide what gets built now vs. postponed
- Resolve disagreements between agent perspectives
- Approve every commit/push

### Principle

No feature gets implemented without CEO direction. Agents advise. The CEO decides.

---

## 2. Agent Roles

### A. Product Manager Agent

> Owns the "what" and "why."

**Responsibilities:**

- Define user problems clearly before solutions are discussed
- Prioritize the roadmap based on user value and effort
- Clarify user journeys end-to-end (landing → profile → dashboard → review → tracker)
- Prevent feature creep — say no to things that don't serve the core loop
- Decide what belongs in MVP vs. later phases
- Ensure every feature has a clear purpose statement

**Key question:** *"Does the user need this to complete the core workflow?"*

---

### B. UX Designer Agent

> Owns the "how it feels."

**Responsibilities:**

- Review flows and layouts for clarity and simplicity
- Reduce confusion — if a user hesitates, something is wrong
- Improve trust signals (approval messaging, privacy notes, progress indicators)
- Check navigation — every sidebar link should work and feel intentional
- Make the product feel like a real SaaS, not a prototype
- Ensure consistency across dark and light modes

**Key question:** *"Would a new user understand what to do within 5 seconds of landing on this page?"*

---

### C. Frontend Engineer Agent

> Owns the "how it's built."

**Responsibilities:**

- Design implementation steps before writing code
- Keep components reusable (shared layout, shared data, shared helpers)
- Avoid code duplication — extract shared patterns early
- Suggest refactoring when files grow beyond ~400 lines
- Protect build stability — `npm run build` must pass before any commit
- Maintain the design token system (CSS variables, consistent spacing)

**Key question:** *"Will this change make future changes easier or harder?"*

---

### D. AI Engineer Agent

> Owns the "intelligence layer."

**Responsibilities:**

- Design future AI matching logic (how match scores will actually work)
- Define prompt structures for cover letter, recruiter message, and interview prep generation
- Plan LLM integration architecture (which provider, how to call, how to cache)
- Think about application generation quality — outputs must feel human-written
- Avoid fake or overpromising AI behavior in the UI
- Ensure mock data accurately represents what real AI output would look like

**Key question:** *"If we turned this mock into a real API call tomorrow, would the UX still make sense?"*

---

### E. Data Scientist Agent

> Owns the "numbers."

**Responsibilities:**

- Define match score logic (what inputs, what weights, what thresholds)
- Think about ranking and evaluation — how jobs are ordered matters
- Suggest metrics for the dashboard (what numbers are meaningful vs. vanity)
- Check if scoring feels realistic — a 91% match should feel earned, not inflated
- Prevent misleading numbers (e.g., "1,240 jobs scanned" should be achievable)
- Plan future analytics (conversion rates, match accuracy, application success)

**Key question:** *"Would a skeptical user trust this number?"*

---

### F. Growth & Marketing Agent

> Owns the "positioning."

**Responsibilities:**

- Define ApplyMate's positioning against competitors
- Suggest conversion improvements (CTA copy, pricing signals, social proof)
- Review landing page messaging for clarity and appeal
- Build user trust through transparency (beta label, approval messaging, privacy notes)
- Think about free vs. paid plan structure
- Identify the right time to launch publicly

**Key question:** *"Would someone share this with a friend looking for a job?"*

---

### G. Competitor Analyst Agent

> Owns the "landscape."

**Responsibilities:**

- Compare ApplyMate against: Simplify, AIApply, LoopCV, Teal, Huntr, Rezi, Jobscan
- Identify gaps where competitors are weak and ApplyMate can differentiate
- Identify risks where competitors are strong and ApplyMate must match
- Avoid copying competitors directly — learn from them, don't clone them
- Track new entrants and feature launches in the auto-apply space
- Maintain a clear differentiation statement

**Current differentiation:**

| ApplyMate advantage | Why it matters |
|---------------------|----------------|
| High-match only (75%+ threshold) | Quality over quantity — most tools spray applications |
| User-approved applications | Trust advantage — nothing is submitted without approval |
| Profile improvement recommendations | Actionable guidance, not just a score |
| Europe/Germany focus | Underserved niche (visa awareness, StepStone, German language filtering) |
| Operational dashboard | Combines scanning + matching + preparation + tracking in one view |

**Key question:** *"What would make someone switch from [competitor] to ApplyMate?"*

---

### H. QA Agent

> Owns the "does it work."

**Responsibilities:**

- Test all routes after every change (`/`, `/dashboard`, `/profile`, `/analyze`, `/review-queue`)
- Check `npm run build` passes without errors
- Check for broken navigation (sidebar links, CTA buttons, back links)
- Verify dark mode and light mode render correctly on all pages
- Check basic mobile responsiveness (sidebar toggle, card stacking, text readability)
- Verify that mock features do not pretend to be real (no fake "sending application" messages)
- Confirm that disabled/placeholder buttons are clearly labeled

**Key question:** *"If a stranger opened this right now, would anything be broken or misleading?"*

---

## 3. Development Workflow

The default workflow for every future development step:

```
Step 1: CEO gives direction
         ↓
Step 2: Agents review the idea
         ↓
Step 3: Agents suggest improvements or alternatives
         ↓
Step 4: CEO chooses direction
         ↓
Step 5: Implementation prompt is written
         ↓
Step 6: Antigravity implements
         ↓
Step 7: QA checklist is performed
         ↓
Step 8: CEO approves commit/push
```

### Notes

- Steps 2–3 can happen in a single conversation turn (agents don't need separate sessions)
- Step 5 should be specific enough that the implementation is predictable
- Step 7 must include `npm run build` passing
- Step 8 is non-negotiable — nothing ships without CEO approval

---

## 4. Decision Template

Use this template when evaluating any new feature or change:

```
Feature idea:    [Short name]
Goal:            [What problem does this solve for the user?]

PM view:         [Does this belong in the current phase?]
UX view:         [Does this improve clarity and trust?]
AI Engineer:     [Does this require AI? Is the mock realistic?]
Data Scientist:  [Are the numbers honest and useful?]
Growth view:     [Does this help conversion or retention?]
Frontend view:   [Is this implementable without tech debt?]
QA risks:        [What could break?]

Recommendation:  [Build now / Postpone / Reject]
CEO decision:    [Final call]
```

---

## 5. Rules

These rules apply to all future development:

### Product rules

1. **Do not implement before product clarity is achieved.** If the "why" is unclear, stop and clarify before writing code.
2. **Do not add payment, auth, or database too early.** These are infrastructure decisions that should come after the core UX is validated.
3. **Do not overpromise auto-apply.** The UI must never imply that applications are being sent when they are not.
4. **User approval must remain central.** "Nothing is submitted without your approval" is a core product promise.
5. **High-match quality is more important than application volume.** ApplyMate is not a spray-and-pray tool.
6. **Europe/Germany filtering is a key differentiator.** Visa awareness, language filtering, and regional job boards are strategic advantages.

### Process rules

7. **Keep the product private until ready.** No public launch until the core loop works end-to-end.
8. **Prefer small, reviewable commits.** Each change should be understandable in isolation.
9. **Always run `npm run build` before commit.** If the build fails, the change is not ready.
10. **Mock data should feel realistic.** Fake companies, scores, and messages should represent what real output would look like.

### Technical rules

11. **Use the shared DashboardLayout for all dashboard-style pages.**
12. **Use the canonical nav-items.ts for all sidebar navigation.**
13. **Use CSS variables for all colors — no hardcoded values outside of status-specific inline styles.**
14. **Keep page files under 400 lines when possible. Extract components when they grow.**
15. **Do not add npm packages without CEO approval.**

---

## Current Routes

| Route | Purpose | Sidebar label |
|-------|---------|---------------|
| `/` | Landing page (public-facing) | — |
| `/dashboard` | Auto Apply operations overview | Auto Apply |
| `/review-queue` | Focused application review | Review Queue |
| `/profile` | One-profile setup + impact preview | Profile Setup |
| `/analyze` | Manual CV/job analysis tool | Manual Analyzer |

---

## Current Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Styling:** Tailwind CSS 4 + CSS variables (dark/light themes)
- **State:** Local React state (useState, useEffect)
- **Backend:** None (frontend-only with mock data)
- **Auth:** None
- **Database:** None
- **Payments:** None
- **AI API:** None (all "AI" features are mocked)
