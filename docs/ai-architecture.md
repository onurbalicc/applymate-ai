# ApplyMate AI — AI Architecture Plan

**Status:** Draft v1  
**Purpose:** Define how ApplyMate moves from frontend mock outputs to real AI-generated application packages. This document is the contract between the product and the engineering/AI layer.

---

## 1. Purpose

ApplyMate's current frontend demo uses carefully crafted mock data to simulate AI-generated outputs. This document defines:

- Which product surfaces will have real AI behind them
- What inputs each AI surface requires
- What structured outputs each surface must produce
- How to roll out AI incrementally without sacrificing quality or cost control
- How to preserve the core invariant: **nothing is submitted without user approval**

---

## 2. Core AI Surfaces

Each surface maps to an existing product screen.

| AI Surface | Product Screen | Priority |
|---|---|---|
| Master CV Profile generation | `/profile` — Master CV Preview | Phase 3 |
| Job match scoring | `/review-queue`, `/dashboard` | Phase 3 |
| Application package generation | `/review` — Application Package | Phase 4 |
| CV adaptation notes | `/review` — Master CV Connection panel | Phase 4 |
| Cover letter draft | `/review` — Prepared Materials | Phase 4 |
| Recruiter message draft | `/review` — Prepared Materials | Phase 4 |
| Risk and gap analysis | `/review` — Risk & Gap Analysis | Phase 4 |
| Interview prep questions | `/review` — Interview Prep section | Phase 4 |
| Inbox reply / follow-up drafts | `/inbox` — Suggested Action panel | Phase 5 |

---

## 3. Input Contracts

### 3.1 User Profile (base input for all surfaces)

```json
{
  "name": "string",
  "headline": "string",
  "bio": "string",
  "skills": ["string"],
  "target_roles": ["string"],
  "location": "string",
  "work_auth": "string",
  "language_levels": { "English": "C1", "German": "B2" },
  "preferences": {
    "work_type": ["working student", "internship", "junior"],
    "min_match_score": 75,
    "remote_preference": "hybrid",
    "tone": "professional",
    "cover_letter": "full",
    "recruiter_message": "short",
    "approval_mode": "review-first"
  },
  "dealbreakers": ["string"]
}
```

### 3.2 Master CV / Profile Foundation

```json
{
  "summary": "string",
  "experience": [{ "role": "string", "company": "string", "period": "string", "bullets": ["string"] }],
  "education": [{ "degree": "string", "institution": "string", "period": "string" }],
  "projects": [{ "name": "string", "stack": ["string"], "description": "string" }],
  "skills_grouped": { "languages": [], "frameworks": [], "tools": [], "soft": [] }
}
```

### 3.3 Job Description

```json
{
  "raw_text": "string",
  "parsed": {
    "role": "string",
    "company": "string",
    "location": "string",
    "work_type": "string",
    "required_skills": ["string"],
    "preferred_skills": ["string"],
    "language_requirements": ["string"],
    "salary_range": "string | null",
    "source": "string",
    "url": "string"
  }
}
```

### 3.4 Inbox Message Context (for reply drafts)

```json
{
  "message_type": "interview | reply | follow-up | rejection | new",
  "from": "string",
  "subject": "string",
  "body": "string",
  "related_application_package_id": "string | null"
}
```

---

## 4. Output Contracts

### 4.1 Master CV Preview

```json
{
  "headline": "string",
  "summary": "string",
  "key_strengths": ["string"],
  "experience": [...],
  "education": [...],
  "skills_grouped": {...},
  "quality_score": 0-100,
  "completeness_flags": ["missing_work_auth", "short_bio", ...]
}
```

### 4.2 Job Match Result

```json
{
  "job_id": "string",
  "match_score": 0-100,
  "quality_score": 0-100,
  "quality_label": "Strong Match | Good Fit | Needs Work",
  "why_fits": ["string"],
  "gaps": ["string"],
  "risk_level": "Low | Medium | High",
  "skip_generation": false
}
```

> `skip_generation: true` when `match_score < min_match_score`. No package is created.

### 4.3 Application Package

```json
{
  "job_id": "string",
  "generated_at": "ISO8601",
  "cv_adaptation_note": "string",
  "cv_improvements": ["string"],
  "cover_letter": "string",
  "recruiter_message": "string | null",
  "interview_questions": ["string"],
  "risks": [{ "label": "string", "severity": "High | Medium | Low" }],
  "recommendation": "string",
  "quality_breakdown": [{ "dimension": "string", "score": 0-100 }]
}
```

### 4.4 Inbox Reply Draft

```json
{
  "message_id": "string",
  "draft_type": "reply | follow-up",
  "subject_prefix": "Re: | Follow-up:",
  "body": "string",
  "tone": "professional | friendly",
  "generated_at": "ISO8601"
}
```

---

## 5. Model Strategy

ApplyMate uses a **tiered model approach** to balance cost and output quality.

| Task | Model Tier | Rationale |
|---|---|---|
| Job classification, filtering | Cheap (e.g. GPT-4o-mini, Gemini Flash) | High volume, low complexity |
| Match scoring, gap analysis | Cheap to mid-tier | Structured extraction, no long-form |
| CV adaptation note | Mid-tier | Short but needs reasoning |
| Cover letter draft | Strong (e.g. GPT-4o, Claude Sonnet) | Quality-critical, user-facing |
| Recruiter message draft | Strong | Short but high-stakes |
| Interview prep questions | Mid-tier | Structured, job-specific |
| Inbox reply draft | Mid-tier | Context-aware, short-form |

A future **quality check step** (optional pass with a strong model) can validate cover letters for hallucinations and tone consistency before surfacing to the user.

---

## 6. Cost-Control Strategy

AI generation runs only when the value justifies it.

1. **Filter first** — Job must pass a cheap scoring step (`match_score ≥ min_match_score`) before a package is generated.
2. **One package per job** — Never regenerate unless the user's profile, preferences, or the job description change.
3. **Caching** — Packages are stored server-side (keyed by `user_id + job_id + profile_version`). If the cache is valid, no AI call is made.
4. **Usage unit = one application package** — Billing and rate limits track full package generations, not individual model calls.
5. **Cheap models for volume tasks** — Scoring and classification use the cheapest capable model.
6. **No speculative generation** — Packages are only generated for jobs the user sees in their queue, not in bulk for all discovered jobs.

---

## 7. Quality-Control Strategy

Quality is a core product promise. Every generated output must:

1. **Use structured outputs** — All AI calls use JSON mode or function calling. Free-form prose is validated against expected structure before being surfaced.
2. **Include quality scores** — Every application package carries a `quality_score` and `quality_breakdown`. Low-quality packages are flagged for user awareness.
3. **Check for risk flags** — Risks (skill gaps, language barriers, contract type mismatch) are explicitly surfaced, never hidden.
4. **No fake claims** — No generated text may claim experience, results, or skills the user profile does not support.
5. **No hallucinations of company data** — Company details come from the parsed job description. AI must not invent company context.
6. **User approval preserved** — AI generates, user approves. The system must never imply or simulate submission without explicit user action.
7. **No guaranteed outcomes** — No copy implies "guaranteed interview" or "100% success rate".

---

## 8. Phased Rollout

| Phase | Focus | Scope |
|---|---|---|
| **Phase 1** | AI architecture doc + prompt contracts | ✅ This document |
| **Phase 2** | Real AI for internal Analyzer tool (`/analyze`) | Dev-only endpoint, manual testing |
| **Phase 3** | Master CV generation | Profile-based, single AI call |
| **Phase 4** | Application Package generation | Full pipeline: scoring → generation |
| **Phase 5** | Inbox reply draft generation | Context-aware, message-type-specific |
| **Phase 6** | Job source ingestion | Job discovery from LinkedIn, StepStone, etc. |
| **Phase 7** | Subscription and billing | Only after real value is proven |

Each phase ships behind a feature flag. Nothing in a later phase blocks an earlier one.

---

## 9. Non-Goals

The following are explicitly **out of scope** for ApplyMate's AI architecture:

- ❌ **Auto-submit without user approval** — Every application package requires explicit user action to proceed.
- ❌ **Scraping-first architecture** — Job ingestion happens through official APIs and platforms, not raw scraping.
- ❌ **Unrestricted free AI usage** — All AI calls are rate-limited, cached, and tied to usage units.
- ❌ **Fake success metrics** — No testimonials or statistics that cannot be verified.
- ❌ **Payment before value** — No subscription gate until Phase 4 or later when real packages are being generated.
- ❌ **Auto mode / hybrid mode** — ApplyMate does not offer an auto-submit mode. The approval step is permanent, not optional.

---

*This document should be updated before Phase 2 begins with final prompt contracts and API integration details.*
