import type { ApplicationPackage } from "../ai/contracts";

/* ─────────────────────────────────────────────────────────
   Application automation contracts.

   One AutomationJob per review-queue job. Created when the
   user swipes right ("Apply with ApplyMate"); the orchestrator
   then advances it through the preparation pipeline
   automatically, and — starting with Browser Extension MVP
   Part 2 — through autonomous execution in the browser
   extension once the package is ready.

   Two progress scales, deliberately kept separate:
   - `progress` (0–100) + PIPELINE_STEPS: PACKAGE PREPARATION
     only (job analysis → generated package). Unchanged from
     Part 1 — still ends at FORM_AUTOMATION_PENDING/100.
   - `executionProgress` (0–100, null until authorized) +
     EXECUTION_STEPS: the NEW autonomous browser-extension
     phase (opening the page → submitted/review-required).

   Authorization model: the right swipe that creates this job
   IS the one-time authorization for exactly this application.
   `job.key` (already a stable, non-hashed, natural identity —
   see lib/automation/store.ts) doubles as the authorization
   id; there is no separate authorization store to keep in
   sync. `authorizedAt`/`authorizedAction` are set once, at the
   moment the job first reaches FORM_AUTOMATION_PENDING and the
   extension is handed the execution payload.

   Honesty invariants:
   - SUBMITTED is only ever set after the outcome detector
     confirms a real success signal on the ATS page — never on
     "the submit button was clicked" alone. An indeterminate
     result is `REVIEW_REQUIRED` with `submissionOutcome:
     "unknown"`, never SUBMITTED.
   - isDemo is true whenever fallback (no GEMINI_API_KEY)
     content was used anywhere in the pipeline.
   - No demographic/legal answer is ever fabricated — see
     browser-extension/src/execution/answer-resolver.ts.
   ───────────────────────────────────────────────────────── */

export type AutomationStatus =
  // Pipeline steps (in order) — package preparation
  | "QUEUED"
  | "ANALYZING_JOB"
  | "PREPARING_MASTER_CV"
  | "GENERATING_JOB_SPECIFIC_CV"
  | "GENERATING_COVER_LETTER"
  | "PREPARING_FORM_ANSWERS"
  | "CHECKING_MISSING_INFORMATION"
  | "PACKAGE_READY"
  | "FORM_AUTOMATION_PENDING"
  // Autonomous execution (in order) — browser extension phase
  | "AUTHORIZED"
  | "OPENING_APPLICATION"
  | "SCANNING_FORM"
  | "FILLING_FORM"
  | "ANSWERING_QUESTIONS"
  | "UPLOADING_DOCUMENTS"
  | "VALIDATING_FORM"
  | "READY_TO_SUBMIT"
  | "SUBMITTING"
  | "SUBMITTED"
  // Interruptions
  | "NEEDS_USER_INPUT"
  | "REVIEW_REQUIRED"
  | "FAILED"
  | "PAUSED"
  | "CANCELLED"
  | "MANUAL_ACTION_REQUIRED";

/** Structured reason an execution stopped short of submission — always
    explains exactly what blocked automation, per the review-required
    fallback contract. Never a silent failure. */
export interface ReviewRequiredReason {
  kind:
    | "captcha-required"
    | "login-required"
    | "missing-required-answer"
    | "missing-verified-information"
    | "unresolved-legal-attestation"
    | "unresolved-demographic-question"
    | "unsupported-ats-interaction"
    | "document-upload-failed"
    | "unclear-submit-control"
    | "unknown-submission-outcome"
    | "external-assessment-required"
    | "identity-verification-required"
    | "authorization-page-mismatch"
    | "execution-interrupted";
  description: string;
  requiredAction: string;
  /** Present when kind is a missing-answer variant. */
  question?: string;
}

/** Reliable post-submission outcome — see outcome-detector.ts. Only
    "submitted" ever advances the job to SUBMITTED. */
export type SubmissionOutcome =
  | "submitted"
  | "validation-rejected"
  | "captcha-required"
  | "login-required"
  | "external-redirect"
  | "duplicate-application"
  | "rate-limited"
  | "unknown"
  | "failed";

export interface AutomationJob {
  id: string;
  /**
   * Stable identity key — the store's map key.
   * For mock jobs: String(reviewJobs index), e.g. "0".
   * For discovered jobs: the DiscoveredJob's own id, e.g. "demo:demo-004"
   * or "greenhouse:gitlab:8503792002". Never a derived/hashed value —
   * this is what makes the job resolvable after any reload.
   */
  key: string;
  /** The underlying job's own stable id (equal to `key` in all current cases). */
  sourceJobId: string;
  /** True when this automation job originated from job discovery, not the mock queue. */
  isFromDiscovery: boolean;
  /** Job metadata persisted directly on the automation job — never re-derived
      from a static array, so the job remains fully displayable after reload
      even if its source record is gone. */
  role: string;
  company: string;
  jobDescription: string;
  applyUrl: string | null;
  /** Technical source id: "mock", "demo", "greenhouse:<board>", "lever:<site>". */
  provider: string;
  /** Human-readable source label shown in the UI, e.g. "Demo", "Greenhouse — GitLab". */
  sourceLabel: string;

  status: AutomationStatus;
  /** Last pipeline step reached — kept when status is an interruption state. */
  currentStep: AutomationStatus;
  /** 0–100 */
  progress: number;
  startedAt: string;
  updatedAt: string;
  /** True when any fallback (no API key) content was used. */
  isDemo: boolean;
  requiresUserInput: boolean;
  missingInformation: string[];
  /**
   * Answers the user provided for missing information items.
   * `id` is the stable identity from missing-info.ts; optional
   * because legacy localStorage records predate it (those are
   * matched by question text, which derives the same id).
   */
  userProvidedAnswers: { id?: string; question: string; answer: string }[];
  error: string | null;
  /** The automatically generated package, once available. */
  package: ApplicationPackage | null;

  /* ── Autonomous execution (Part 2) — all optional/null until the job
     first reaches FORM_AUTOMATION_PENDING and is handed to the extension. */

  /** Set once, the moment this job is handed to the extension. `job.key`
      IS the authorization id — see the file header. Never re-set on retry. */
  authorizedAt: string | null;
  authorizedAction: "fill-and-submit" | null;
  /** 0–100, the autonomous-execution phase's own progress — independent of
      `progress` above, which tracks package preparation only. */
  executionProgress: number | null;
  /** Idempotency key for the current submission attempt. Regenerated only
      when the user explicitly retries; a stale/duplicate submit message
      carrying an old id is always rejected by the submit controller. */
  executionAttemptId: string | null;
  /** The exact URL the extension opened for this authorization — the
      submit controller refuses to act if the live tab's URL diverges. */
  authorizedApplyUrl: string | null;
  submittedAt: string | null;
  submissionOutcome: SubmissionOutcome | null;
  /** Present only when status is REVIEW_REQUIRED. */
  reviewRequiredReason: ReviewRequiredReason | null;
}

/** Data needed to create an automation job — independent of where the job came from. */
export interface AutomationJobSeed {
  key: string;
  sourceJobId: string;
  isFromDiscovery: boolean;
  role: string;
  company: string;
  jobDescription: string;
  applyUrl: string | null;
  provider: string;
  sourceLabel: string;
}

/** Statuses in which the pipeline is actively running. */
export const RUNNING_STATUSES: AutomationStatus[] = [
  "QUEUED",
  "ANALYZING_JOB",
  "PREPARING_MASTER_CV",
  "GENERATING_JOB_SPECIFIC_CV",
  "GENERATING_COVER_LETTER",
  "PREPARING_FORM_ANSWERS",
  "CHECKING_MISSING_INFORMATION",
];

/** Terminal or resting statuses — no work in flight. */
export const SETTLED_STATUSES: AutomationStatus[] = [
  "PACKAGE_READY",
  "FORM_AUTOMATION_PENDING",
  "SUBMITTED",
  "NEEDS_USER_INPUT",
  "REVIEW_REQUIRED",
  "FAILED",
  "PAUSED",
  "CANCELLED",
  "MANUAL_ACTION_REQUIRED",
];

/** Execution statuses actively in flight in the browser extension —
    normalized to REVIEW_REQUIRED (not silently restarted) if a reload
    interrupts them, same rationale as RUNNING_STATUSES for prep steps. */
export const RUNNING_EXECUTION_STATUSES: AutomationStatus[] = [
  "AUTHORIZED",
  "OPENING_APPLICATION",
  "SCANNING_FORM",
  "FILLING_FORM",
  "ANSWERING_QUESTIONS",
  "UPLOADING_DOCUMENTS",
  "VALIDATING_FORM",
  "READY_TO_SUBMIT",
  "SUBMITTING",
];

/** Ordered pipeline steps for progress checklists — PACKAGE PREPARATION
    only (0–100 on `job.progress`). See EXECUTION_STEPS for the separate
    autonomous-execution phase. */
export const PIPELINE_STEPS: { status: AutomationStatus; label: string; progress: number }[] = [
  { status: "ANALYZING_JOB",                 label: "Job analyzed",                          progress: 15 },
  { status: "PREPARING_MASTER_CV",           label: "Master CV prepared",                    progress: 30 },
  { status: "GENERATING_JOB_SPECIFIC_CV",    label: "Job-specific CV adaptation prepared",   progress: 50 },
  { status: "GENERATING_COVER_LETTER",       label: "Motivation letter written",             progress: 65 },
  { status: "PREPARING_FORM_ANSWERS",        label: "Application answers prepared",          progress: 78 },
  { status: "CHECKING_MISSING_INFORMATION",  label: "Missing information checked",           progress: 88 },
  { status: "PACKAGE_READY",                 label: "Application package ready",             progress: 95 },
  { status: "FORM_AUTOMATION_PENDING",       label: "Handed to the browser extension",        progress: 100 },
];

export function stepIndex(status: AutomationStatus): number {
  return PIPELINE_STEPS.findIndex((s) => s.status === status);
}

/** Ordered execution steps for the autonomous-application checklist —
    drives `job.executionProgress` (0–100), independent of `progress`. */
export const EXECUTION_STEPS: { status: AutomationStatus; label: string; progress: number }[] = [
  { status: "AUTHORIZED",           label: "Application authorized",         progress: 5 },
  { status: "OPENING_APPLICATION",  label: "Opening application page",       progress: 15 },
  { status: "SCANNING_FORM",        label: "Scanning application form",      progress: 25 },
  { status: "FILLING_FORM",         label: "Filling verified information",   progress: 45 },
  { status: "ANSWERING_QUESTIONS",  label: "Answering application questions", progress: 60 },
  { status: "UPLOADING_DOCUMENTS",  label: "Uploading résumé and cover letter", progress: 75 },
  { status: "VALIDATING_FORM",      label: "Validating required fields",     progress: 85 },
  { status: "READY_TO_SUBMIT",      label: "Ready to submit",                progress: 90 },
  { status: "SUBMITTING",           label: "Submitting application",         progress: 97 },
  { status: "SUBMITTED",            label: "Application submitted",          progress: 100 },
];

export function executionStepIndex(status: AutomationStatus): number {
  return EXECUTION_STEPS.findIndex((s) => s.status === status);
}

/** Human-readable status labels for badges (used behind "See details"). */
export const STATUS_LABELS: Record<AutomationStatus, string> = {
  QUEUED: "Queued",
  ANALYZING_JOB: "Analyzing job",
  PREPARING_MASTER_CV: "Preparing Master CV",
  GENERATING_JOB_SPECIFIC_CV: "Adapting CV for this job",
  GENERATING_COVER_LETTER: "Writing motivation letter",
  PREPARING_FORM_ANSWERS: "Preparing application answers",
  CHECKING_MISSING_INFORMATION: "Checking missing information",
  PACKAGE_READY: "Package ready",
  FORM_AUTOMATION_PENDING: "Handing off to the browser extension",
  AUTHORIZED: "Application authorized",
  OPENING_APPLICATION: "Opening application page",
  SCANNING_FORM: "Scanning application form",
  FILLING_FORM: "Filling verified information",
  ANSWERING_QUESTIONS: "Answering application questions",
  UPLOADING_DOCUMENTS: "Uploading documents",
  VALIDATING_FORM: "Validating required fields",
  READY_TO_SUBMIT: "Ready to submit",
  SUBMITTING: "Submitting application",
  SUBMITTED: "Submitted",
  NEEDS_USER_INPUT: "Needs your input",
  REVIEW_REQUIRED: "Review required",
  FAILED: "Failed",
  PAUSED: "Paused",
  CANCELLED: "Cancelled",
  MANUAL_ACTION_REQUIRED: "Manual action required",
};

/* ─────────────────────────────────────────────────────────
   User-facing simplification layer.

   The detailed AutomationStatus model above stays exactly as
   is — this is a presentation-only mapping so the UI never
   shows raw engineering states like ANALYZING_JOB or
   FORM_AUTOMATION_PENDING to the user.
   ───────────────────────────────────────────────────────── */

export type SimpleStatus =
  | "preparing"
  | "needs_input"
  | "ready"
  | "applying"
  | "applied"
  | "review_required"
  | "paused"
  | "failed"
  | "cancelled";

export function toSimpleStatus(status: AutomationStatus): SimpleStatus {
  if (status === "PAUSED") return "paused";
  if (status === "CANCELLED") return "cancelled";
  if (status === "FAILED") return "failed";
  if (status === "REVIEW_REQUIRED") return "review_required";
  if (status === "NEEDS_USER_INPUT" || status === "MANUAL_ACTION_REQUIRED") return "needs_input";
  if (status === "SUBMITTED") return "applied";
  if (RUNNING_EXECUTION_STATUSES.includes(status)) return "applying";
  if (status === "PACKAGE_READY" || status === "FORM_AUTOMATION_PENDING") return "ready";
  return "preparing"; // QUEUED + all in-flight generation steps
}

export const SIMPLE_STATUS_LABELS: Record<SimpleStatus, string> = {
  preparing: "Preparing",
  needs_input: "Needs your input",
  ready: "Ready",
  applying: "Applying",
  applied: "Applied",
  review_required: "Review required",
  paused: "Paused",
  failed: "Failed",
  cancelled: "Cancelled",
};

export interface SimpleStage {
  label: string;
  statuses: AutomationStatus[];
}

/** User-friendly stages the detailed pipeline collapses into. The last two
    stages are the Part 2 autonomous-execution phase — kept separate from
    "Getting ready to apply" (package preparation) since they represent a
    genuinely different phase with its own progress scale. */
export const SIMPLE_STAGES: SimpleStage[] = [
  { label: "Checking job fit",              statuses: ["QUEUED", "ANALYZING_JOB"] },
  { label: "Preparing your documents",      statuses: ["PREPARING_MASTER_CV", "GENERATING_JOB_SPECIFIC_CV", "GENERATING_COVER_LETTER"] },
  { label: "Preparing application answers", statuses: ["PREPARING_FORM_ANSWERS", "CHECKING_MISSING_INFORMATION"] },
  { label: "Getting ready to apply",        statuses: ["PACKAGE_READY", "FORM_AUTOMATION_PENDING"] },
  { label: "Applying automatically",        statuses: [...RUNNING_EXECUTION_STATUSES] },
  { label: "Applied",                       statuses: ["SUBMITTED"] },
];

export function simpleStageIndex(status: AutomationStatus): number {
  return SIMPLE_STAGES.findIndex((s) => s.statuses.includes(status));
}
