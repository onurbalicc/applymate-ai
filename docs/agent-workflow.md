# ApplyMate AI Agent Council Workflow

> Mandatory decision process for all meaningful product updates.
> Reference: [docs/agents.md](file:///Users/onurbalic/applymate-ai/docs/agents.md)
> Last updated: July 2, 2026

---

## 1. Purpose

ApplyMate AI should be developed like a small AI-powered product company — not a random collection of features added one after another.

Before each major update, the **Agent Council** must:

- Review the current product state (routes, user flow, known issues)
- Evaluate possible next steps (what could be built next)
- Identify the highest-impact update (not the most exciting one — the most important one)
- Define implementation scope (what is included, what is explicitly excluded)
- Prevent random feature creep (say no to things that don't serve the current phase)
- Produce a clear implementation prompt (specific enough for predictable results)
- Keep the **Founder / CEO as the final decision maker** (agents advise, CEO decides)

The Agent Council is not a formality. It is the mechanism that prevents the product from becoming a pile of disconnected features.

---

## 2. When to Run the Agent Council

### Mandatory

The Agent Council **must** run before:

- Adding a new route or page
- Redesigning an existing page
- Adding a major interaction or workflow
- Changing the user journey or navigation structure
- Adding AI-related logic (even mock versions)
- Adding pricing, conversion, or paywall elements
- Refactoring shared components (layout, nav, design tokens)
- Deploying the product publicly

### Optional

The Agent Council is **optional** for:

- Typo fixes and small copy edits
- Minor CSS fixes (spacing, color adjustments)
- Dependency updates and build fixes
- Bug fixes that don't change product behavior

---

## 3. Required Agent Roles

Every Agent Council run must include opinions from all defined agents. See [docs/agents.md](file:///Users/onurbalic/applymate-ai/docs/agents.md) for full role definitions.

| Agent | Core question |
|-------|---------------|
| **Founder / CEO** | "Is this the right thing to build right now?" |
| **Product Manager** | "Does the user need this to complete the core workflow?" |
| **UX Designer** | "Would a new user understand what to do within 5 seconds?" |
| **Frontend Engineer** | "Will this change make future changes easier or harder?" |
| **AI Engineer** | "If we turned this mock into a real API call tomorrow, would the UX still make sense?" |
| **Data Scientist** | "Would a skeptical user trust this number?" |
| **Growth & Marketing** | "Would someone share this with a friend looking for a job?" |
| **Competitor Analyst** | "What would make someone switch from a competitor to ApplyMate?" |
| **QA Agent** | "If a stranger opened this right now, would anything be broken or misleading?" |

---

## 4. Agent Council Output Format

Every Agent Council run must produce a structured report with the following sections:

### A. Current Product State

Summarize:
- All current routes and their purpose
- The current user flow (landing → profile → dashboard → review-queue → review → tracker)
- The latest known issue, limitation, or gap
- Current tech stack constraints (frontend-only, no auth, no database, mock data)

### B. Candidate Next Steps

List **3 to 5** possible next updates. Examples:

- Inbox page
- Premium landing page redesign
- Real AI matching API preparation
- Pricing / Pro preview
- Tracker detail page
- Onboarding flow
- Mobile responsiveness pass
- Public deployment preparation

Each candidate must include a one-line description of what it would add.

### C. Agent Opinions

Each agent must provide:

| Field | Description |
|-------|-------------|
| **Recommendation** | What the agent thinks should be built (may differ between agents) |
| **Reasoning** | Why this is the right priority from their perspective |
| **Risk** | What could go wrong if this is built now or built poorly |
| **What to avoid** | What should explicitly NOT be done in this step |

Format each agent's opinion as a short paragraph, not a long essay.

### D. Priority Ranking

Rank the candidate next steps by these criteria:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **User value** | High | Does this directly help the user complete the core workflow? |
| **Product clarity** | High | Does this make the product easier to understand? |
| **Implementation effort** | Medium | How much work is required? Prefer small, reviewable changes. |
| **Monetization potential** | Low | Does this lay groundwork for future revenue? (Not urgent yet.) |
| **Technical risk** | Medium | Could this break existing functionality or create tech debt? |

Present the ranking as a table:

```
| Rank | Candidate              | User Value | Clarity | Effort | Monetization | Risk |
|------|------------------------|------------|---------|--------|--------------|------|
| 1    | [Best candidate]       | High       | High    | Medium | Low          | Low  |
| 2    | ...                    | ...        | ...     | ...    | ...          | ...  |
```

### E. Final Recommendation

Choose **one** next step and explain:
- Why this candidate was ranked highest
- What user problem it solves
- How it connects to the existing product flow
- Why the other candidates should wait

### F. Implementation Scope

Define precisely:

**Include:**
- Exact route or page to create/modify
- Key sections and components
- Mock data requirements
- Design direction

**Exclude:**
- What should NOT be part of this step
- What should be saved for a later update
- What backend/AI/auth logic to avoid

### G. QA Checklist

Define what must be tested after implementation:

- [ ] All existing routes still work (`/`, `/dashboard`, `/review-queue`, `/review`, `/profile`, `/analyze`)
- [ ] New route renders correctly in dark mode
- [ ] New route renders correctly in light mode
- [ ] Sidebar navigation works (active state, links)
- [ ] Mobile sidebar toggle works
- [ ] No broken links or dead buttons
- [ ] `npm run build` passes without errors
- [ ] Mock features are clearly labeled as demos
- [ ] No misleading "real" functionality implied

### H. CEO Approval

Every Agent Council report must end with:

> **⏸ Waiting for CEO approval before implementation.**
>
> No code will be written until Onur approves the recommendation, scope, and QA checklist.

---

## 5. Agent Council Prompt Template

Copy this prompt into Antigravity before any new feature to trigger the Agent Council:

```
Run the ApplyMate AI Agent Council before implementation.

Read:
- docs/agents.md
- docs/agent-workflow.md
- current relevant app files

Current CEO direction:
[WRITE THE IDEA OR PROBLEM HERE]

Important:
- Do not implement yet.
- Do not edit files yet.
- First produce the Agent Council report.

The report must include:
A. Current product state
B. Candidate next steps (3–5 options)
C. Agent opinions (all 9 agents)
D. Priority ranking (table)
E. Final recommendation (one choice with reasoning)
F. Implementation scope (include / exclude)
G. QA checklist
H. CEO approval needed
```

---

## 6. Implementation Prompt Rule

After the CEO approves the Agent Council recommendation — and **only then** — an implementation prompt should be written.

The implementation prompt must include:

| Field | Description |
|-------|-------------|
| **Goal** | What this update accomplishes |
| **Product context** | How it fits into the current product flow |
| **Exact files/routes** | Which files to create, modify, or delete |
| **What NOT to implement** | Explicit exclusions (no auth, no payments, no backend, etc.) |
| **Design requirements** | Visual style, dark/light mode, card structure, etc. |
| **QA checklist** | What must be tested after changes |
| **Build requirement** | `npm run build` must pass |
| **Commit suggestion** | Short commit message for the change |

### Implementation prompt template:

```
Step [N]: [Feature name]

Goal:
[What this update accomplishes]

Product context:
[How it fits into the current product flow]

Routes to create/modify:
- [route] — [description]

Important:
- Do not add backend logic.
- Do not add real AI API.
- Do not add auth, database, Supabase, Stripe, or payments.
- Keep everything frontend-only with mock/static data.
- Use the existing shared DashboardLayout.
- Keep dark/light mode working.
- Run npm run build after changes.
- Do not proceed further.

[Detailed page requirements...]

QA checklist:
- [ ] All routes work
- [ ] Dark/light mode works
- [ ] npm run build passes
- [ ] No broken navigation

Commit suggestion:
"feat: add [feature name]"
```

---

## 7. Example Agent Council Run

### CEO Direction

> "Users like the dashboard and review queue, but we need to decide whether to build Inbox, Application Review Detail, or Premium Landing Page next."

### A. Current Product State

| Route | Purpose |
|-------|---------|
| `/` | Landing page (public-facing) |
| `/dashboard` | Auto Apply operations overview |
| `/review-queue` | Focused application decision queue |
| `/profile` | One-profile setup + impact preview |
| `/analyze` | Manual CV/job analysis tool |

**Current flow:** Landing → Profile → Dashboard → Review Queue → (missing detail review) → Tracker
**Gap:** The "Review application →" button has no destination. Users cannot inspect the full application before approving.

### B. Candidate Next Steps

1. **Application Review Detail Page** — Show the full prepared application package before approval
2. **Inbox Page** — Dedicated page for recruiter replies, interview invitations, follow-ups
3. **Premium Landing Page Redesign** — Polish the public-facing page for conversion
4. **Tracker Detail Page** — Expand each tracked application into a detail view
5. **Real AI Matching API Preparation** — Define the architecture for actual LLM integration

### C. Agent Opinions (abbreviated)

**Product Manager:** Build Application Review first. It completes the core approval flow. Without it, the "Review application" button is a dead end — that's a broken user journey.

**UX Designer:** Agree with Review Detail. The flow from Review Queue → (nothing) → Approve feels incomplete. Users need to see what they're approving before clicking "Approve & Apply."

**Frontend Engineer:** Application Review is well-scoped. One new route, uses existing DashboardLayout, no shared component changes needed. Low tech risk.

**AI Engineer:** Review Detail is critical because it sets the template for what real AI-generated materials will look like. Getting the UX right now means fewer redesigns when we integrate real LLMs.

**Data Scientist:** The quality score breakdown (job fit, CV alignment, cover letter quality) in the review page will be important for calibrating real scores later. Build it now with realistic mock data.

**Growth & Marketing:** Landing page polish is tempting but premature. The core product flow needs to work end-to-end before we optimize conversion. Review Detail first.

**Competitor Analyst:** Most competitors (Simplify, AIApply) don't show transparent application previews. The Review Detail page is a trust differentiator — users see exactly what gets sent.

**QA Agent:** The "Review application" button currently does nothing. That's a critical UX bug. Fixing it with a real destination is the minimum acceptable next step.

### D. Priority Ranking

| Rank | Candidate | User Value | Clarity | Effort | Monetization | Risk |
|------|-----------|------------|---------|--------|--------------|------|
| 1 | Application Review Detail | High | High | Medium | Low | Low |
| 2 | Inbox Page | Medium | Medium | Medium | Low | Low |
| 3 | Premium Landing Redesign | Medium | High | High | Medium | Low |
| 4 | Tracker Detail Page | Low | Medium | Medium | Low | Low |
| 5 | Real AI Matching API | High | Low | High | Medium | High |

### E. Final Recommendation

**Build the Application Review Detail Page.**

It completes the core application approval flow (Dashboard → Review Queue → **Review Detail** → Approve), fixes a broken interaction (dead "Review application" button), and sets the template for real AI-generated materials. All other candidates depend on the core flow working first.

### F. Implementation Scope

**Include:** `/review` route, job summary card, workflow status, quality score, risk analysis, cover letter draft, recruiter message, CV improvements, interview prep, action buttons, back-to-queue navigation.

**Exclude:** Real AI generation, database persistence, user auth, payment gates.

### G. QA Checklist

- [ ] All 6 routes render correctly
- [ ] "Review application →" in review-queue links to /review
- [ ] "Back to Review Queue" in /review links back
- [ ] Dark and light mode both work
- [ ] `npm run build` passes

### H. CEO Approval

> **⏸ Waiting for CEO approval before implementation.**

*(In this example, the CEO approved and the Application Review Detail Page was built as Step 10.)*

---

## 8. Rules

These rules govern every Agent Council run:

### Decision rules

1. **Agents are advisory, not autonomous.** They provide opinions. They do not make decisions.
2. **The Founder / CEO always makes the final decision.** No agent may override the CEO.
3. **No agent may approve implementation alone.** All recommendations require CEO sign-off.
4. **No code should be written during the Agent Council step.** The Council produces a report, not a pull request.

### Product rules

5. **Avoid building flashy features before the core user flow is clear.** The flow is: Profile → Dashboard → Review Queue → Review → Approve → Track. Complete this before adding extras.
6. **Avoid adding payment, auth, or database too early.** These are infrastructure decisions that come after the core UX is validated.
7. **User approval and application quality are central product principles.** "Nothing is submitted without your approval" is non-negotiable.
8. **The product should not become a spammy mass-apply tool.** High-match quality matters more than application volume.

### Process rules

9. **Keep changes small enough to review.** One route, one feature, one Agent Council run.
10. **Build must pass before commit.** `npm run build` is the minimum quality bar.
11. **Mock features must be clearly labeled.** Users should never think a mock feature is real.
12. **Every Agent Council report must be stored or summarized.** Decisions should be traceable.
