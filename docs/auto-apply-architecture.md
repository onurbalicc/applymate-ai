# ApplyMate AI — Automatic Application Architecture

**Status:** Architecture document — the in-app orchestration layer is implemented; external form automation is the next integration step
**Purpose:** Define how ApplyMate fills and submits real job application forms safely and within user-controlled boundaries.

---

## 1. Product Promise and Hard Constraints

ApplyMate's promise is:

> "Swipe right. ApplyMate handles the application."

Backed by three hard constraints:

> "Reduce or eliminate repetitive form filling. Never fabricate information. Never submit outside explicit user authorization."

Every architectural choice must honour these constraints. They are non-negotiable and must be enforced at the system level, not just the UI level.

## 1b. What Exists Today (in-app orchestration)

The swipe-right trigger and the background preparation pipeline are implemented in the
Next.js app (`app/lib/automation/`):

- **Trigger:** swipe right / "Apply with ApplyMate" in the Review Queue creates one
  `AutomationJob` per job (duplicate-safe).
- **Pipeline:** ANALYZING_JOB → PREPARING_MASTER_CV (cached and reused) →
  GENERATING_JOB_SPECIFIC_CV → GENERATING_COVER_LETTER → PREPARING_FORM_ANSWERS →
  CHECKING_MISSING_INFORMATION → PACKAGE_READY → **FORM_AUTOMATION_PENDING**.
- **Interruptions:** NEEDS_USER_INPUT (incomplete profile or unresolved package
  answers — nothing is invented), MANUAL_ACTION_REQUIRED (e.g. no job description),
  FAILED (retryable), PAUSED (including reload interruption), CANCELLED.
- **Honest stop:** the pipeline ends at FORM_AUTOMATION_PENDING. SUBMITTED is never
  set — no external submission capability exists yet. That capability is the worker /
  extension described below.

---

## 2. Approval Modes

### 2.1 Review-First (default, always available)

Every application package waits for explicit individual user approval before any form is touched. This is the only mode available until Approved Autopilot is explicitly enabled by the user.

### 2.2 Approved Autopilot (opt-in, strict conditions)

The user explicitly enables this mode and configures strict rules. Before enabling it, the system requires:

- All reusable profile answers are complete and confirmed.
- Work authorization status is explicitly set.
- No unresolved "needs-user-input" answers in the profile.
- Minimum match score threshold is configured.
- Explicitly excluded company types or job categories are listed.

Autopilot must **not submit** when any of the following conditions are true:
- A form contains a CAPTCHA or unusual bot-detection.
- A form contains a sensitive legal declaration not pre-reviewed.
- A form has fields with confidence < configured threshold.
- A form asks demographic, disability, or other sensitive questions not pre-approved.
- The application has already been submitted (duplicate detection).
- The automation worker encounters an error in the form.

Full audit log is mandatory for every autopilot submission.

---

## 3. System Architecture

The complete auto-apply system requires three separate layers:

### 3.1 Next.js Web Application (already being built)

Responsibilities:
- Candidate profile management.
- Job queue and application package generation.
- Approval rules configuration.
- Approval UI (review-first and autopilot settings).
- Application tracker.
- Submission receipts and audit trail display.
- Encrypted profile data export to the automation layer.

### 3.2 Automation Worker / Browser Extension (Phase 6+)

Responsible for the actual form interaction. Two viable implementation approaches:

**A. Browser Extension**
- Runs in the user's own browser session.
- The user navigates to the job application page.
- Extension detects form fields and maps them to profile data.
- Extension shows a sidebar with proposed field fills.
- User reviews mapped fields before any submit action.
- No third-party servers see the user's browser session or credentials.
- Works with most ATS platforms by design (in the user's authenticated session).

*Pros:* Privacy (no server session needed), works with MFA, no server costs, compliant with most TOS (user-initiated action in their own browser).  
*Cons:* Requires browser extension install, manual page navigation for review-first mode, complex to auto-navigate in autopilot mode.

**B. Playwright Automation Worker (server or local)**
- A controlled browser instance managed by a local or server-side process.
- Navigates to application URLs automatically.
- Better for autopilot mode where hands-free navigation is desired.
- Requires handling login sessions securely (credentials must never leave the user's device in plaintext).

*Pros:* Fully automated navigation, works for autopilot.  
*Cons:* More complex credential management, higher risk of ATS detection, server-side variant requires encrypted credential storage.

**Recommended approach for Phase 6 prototype:** Browser extension for review-first mode, with a local Playwright agent as a later autopilot option.

### 3.3 Backend Job System (Phase 7+)

Responsibilities:
- Encrypted user data store.
- Application job queue and status tracking.
- Automation status (DISCOVERED → SUBMITTED lifecycle).
- Retry policy and failure handling.
- Audit trail, screenshots, and submission receipts.
- Duplicate application prevention.

---

## 4. Evaluated Approaches

| Approach | Feasibility | Risk | Notes |
|---|---|---|---|
| Browser extension | High | Low | User's own session; compliant with most TOS |
| Local Playwright agent | Medium | Medium | Good for autopilot; needs local install |
| Server Playwright worker | Medium | High | Credential storage risk; TOS concerns |
| ATS-specific API integrations | Low (limited) | Low | Few public APIs available |
| Supported public application APIs | Low | Low | Rare; mostly enterprise ATS |

---

## 5. Application Form Field Mapping Contract

When a form is detected, each field is mapped using this contract:

```json
{
  "fieldLabel": "string",
  "fieldType": "text | textarea | select | radio | checkbox | file | date",
  "normalizedField": "email | phone | fullName | salary | workAuthorization | linkedIn | coverLetter | resumeFile | custom",
  "value": "string | boolean | null",
  "confidence": 0.0,
  "requiresUserReview": true,
  "sensitiveField": false
}
```

**Field confidence thresholds:**
- `>= 0.9`: Auto-fill allowed in autopilot mode if `sensitiveField = false`.
- `0.7 – 0.9`: Flag for user review even in autopilot mode.
- `< 0.7`: Always require user confirmation.

**Fields always requiring user review (regardless of confidence or mode):**
- Salary and compensation
- Work authorization and visa status
- Disability, demographic, gender, ethnicity questions
- Legal declarations ("I confirm I am eligible to work…")
- Any field not mapped to a known `normalizedField`

---

## 6. Application Lifecycle

```
DISCOVERED          — Job found in queue; package not yet generated
→ ANALYZED          — Match score computed; above/below threshold determined
→ PACKAGE_PREPARED  — Cover letter, CV adaptation, answers generated
→ WAITING_FOR_APPROVAL — User must review (review-first) or threshold check (autopilot)
→ APPROVED          — User approved or autopilot rules passed
→ FORM_OPENED       — Browser navigated to application page
→ FIELDS_MAPPED     — Form fields detected and matched to profile
→ MISSING_INFORMATION — One or more required fields cannot be filled; user notified
→ READY_TO_SUBMIT   — All required fields filled; user confirmation pending (review-first)
                      OR autopilot conditions all met
→ SUBMITTED         — Form submitted
→ FAILED            — Error during submission
→ MANUAL_ACTION_REQUIRED — CAPTCHA, unusual declaration, or unresolvable field
```

States `MISSING_INFORMATION` and `MANUAL_ACTION_REQUIRED` always block submission and surface to the user, regardless of approval mode.

---

## 7. Realistic First ATS Targets

The following ATS platforms are candidates for Phase 6 integration. None of them is guaranteed to work reliably — page structure changes frequently.

| ATS | Notes |
|---|---|
| Greenhouse | Structured forms, relatively stable DOM |
| Lever | Similar to Greenhouse; well-structured |
| Workable | Common in European startups |
| SmartRecruiters | Used by many mid-large companies |
| Personio | Common in German-speaking market |
| Direct company forms | Highly variable; lowest reliability |
| LinkedIn Easy Apply | Possible via extension in user's own session |

**Important:** Not every website can be supported reliably. ATS providers update their interfaces, add bot detection, and change field structures. The system must handle failures gracefully and route them to `MANUAL_ACTION_REQUIRED` rather than failing silently.

---

## 8. Security and Compliance Requirements

| Requirement | Implementation |
|---|---|
| No plaintext credential storage | Credentials managed in user's own session; server never sees passwords |
| Sensitive data encryption | Profile data encrypted at rest in Phase 7 backend |
| No CAPTCHA bypass | Any CAPTCHA → `MANUAL_ACTION_REQUIRED` immediately |
| No anti-bot circumvention | No user-agent spoofing, no rate circumvention, no TOS bypass |
| ATS TOS compliance | User-initiated actions only; no mass crawling |
| Duplicate prevention | Application hash stored; re-submission blocked |
| Audit trail | Every submission: timestamp, form URL, screenshot, field mapping, decision |
| User data deletion | Full profile and submission data deletion on request |
| Submission evidence | Screenshot of confirmation page retained for 90 days |
| No fabricated answers | All answers must trace back to profile or be marked needs-user-input |
| Autopilot pause | User can pause or disable autopilot at any time with immediate effect |

---

## 9. Non-Goals for Auto-Apply Architecture

- Mass application submission without per-job packages.
- Bypassing login screens (the user must be authenticated in their own session).
- Solving CAPTCHAs or circumventing bot detection.
- Storing user passwords on any server.
- Answering sensitive demographic questions automatically.
- Fabricating availability, salary, or work authorization.
- Applying to jobs with match scores below the user's configured threshold.
- Guaranteeing application acceptance or interview callbacks.

---

*This document is the architectural specification for Phase 6+. Implementation begins after Phase 5 (database + authentication + secure storage) is complete.*
