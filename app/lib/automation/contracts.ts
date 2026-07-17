import type { ApplicationPackage } from "../ai/contracts";

/* ─────────────────────────────────────────────────────────
   Application automation contracts.

   One AutomationJob per review-queue job. Created when the
   user swipes right ("Apply with ApplyMate"); the orchestrator
   then advances it through the pipeline automatically.

   Honesty invariants:
   - SUBMITTED is never set in this sprint — no external
     submission exists yet. The pipeline ends at
     FORM_AUTOMATION_PENDING.
   - isDemo is true whenever fallback (no GEMINI_API_KEY)
     content was used anywhere in the pipeline.
   ───────────────────────────────────────────────────────── */

export type AutomationStatus =
  // Pipeline steps (in order)
  | "QUEUED"
  | "ANALYZING_JOB"
  | "PREPARING_MASTER_CV"
  | "GENERATING_JOB_SPECIFIC_CV"
  | "GENERATING_COVER_LETTER"
  | "PREPARING_FORM_ANSWERS"
  | "CHECKING_MISSING_INFORMATION"
  | "PACKAGE_READY"
  | "FORM_AUTOMATION_PENDING"
  | "READY_TO_SUBMIT"
  | "SUBMITTED"
  // Interruptions
  | "NEEDS_USER_INPUT"
  | "FAILED"
  | "PAUSED"
  | "CANCELLED"
  | "MANUAL_ACTION_REQUIRED";

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
  "READY_TO_SUBMIT",
  "SUBMITTED",
  "NEEDS_USER_INPUT",
  "FAILED",
  "PAUSED",
  "CANCELLED",
  "MANUAL_ACTION_REQUIRED",
];

/** Ordered pipeline steps for progress checklists. */
export const PIPELINE_STEPS: { status: AutomationStatus; label: string; progress: number }[] = [
  { status: "ANALYZING_JOB",                 label: "Job analyzed",                          progress: 15 },
  { status: "PREPARING_MASTER_CV",           label: "Master CV prepared",                    progress: 30 },
  { status: "GENERATING_JOB_SPECIFIC_CV",    label: "Job-specific CV adaptation prepared",   progress: 50 },
  { status: "GENERATING_COVER_LETTER",       label: "Motivation letter written",             progress: 65 },
  { status: "PREPARING_FORM_ANSWERS",        label: "Application answers prepared",          progress: 78 },
  { status: "CHECKING_MISSING_INFORMATION",  label: "Missing information checked",           progress: 88 },
  { status: "PACKAGE_READY",                 label: "Application package ready",             progress: 95 },
  { status: "FORM_AUTOMATION_PENDING",       label: "External form automation (next step)",  progress: 100 },
];

export function stepIndex(status: AutomationStatus): number {
  return PIPELINE_STEPS.findIndex((s) => s.status === status);
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
  FORM_AUTOMATION_PENDING: "Waiting for form automation",
  READY_TO_SUBMIT: "Ready to submit",
  SUBMITTED: "Submitted",
  NEEDS_USER_INPUT: "Needs your input",
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

export type SimpleStatus = "preparing" | "needs_input" | "ready" | "paused" | "failed" | "cancelled";

export function toSimpleStatus(status: AutomationStatus): SimpleStatus {
  if (status === "PAUSED") return "paused";
  if (status === "CANCELLED") return "cancelled";
  if (status === "FAILED") return "failed";
  if (status === "NEEDS_USER_INPUT" || status === "MANUAL_ACTION_REQUIRED") return "needs_input";
  if (
    status === "PACKAGE_READY" ||
    status === "FORM_AUTOMATION_PENDING" ||
    status === "READY_TO_SUBMIT" ||
    status === "SUBMITTED"
  ) return "ready";
  return "preparing"; // QUEUED + all in-flight generation steps
}

export const SIMPLE_STATUS_LABELS: Record<SimpleStatus, string> = {
  preparing: "Preparing",
  needs_input: "Needs your input",
  ready: "Ready",
  paused: "Paused",
  failed: "Failed",
  cancelled: "Cancelled",
};

export interface SimpleStage {
  label: string;
  statuses: AutomationStatus[];
}

/** Four user-friendly stages the detailed pipeline collapses into. */
export const SIMPLE_STAGES: SimpleStage[] = [
  { label: "Checking job fit",              statuses: ["QUEUED", "ANALYZING_JOB"] },
  { label: "Preparing your documents",      statuses: ["PREPARING_MASTER_CV", "GENERATING_JOB_SPECIFIC_CV", "GENERATING_COVER_LETTER"] },
  { label: "Preparing application answers", statuses: ["PREPARING_FORM_ANSWERS", "CHECKING_MISSING_INFORMATION"] },
  { label: "Getting ready to apply",        statuses: ["PACKAGE_READY", "FORM_AUTOMATION_PENDING", "READY_TO_SUBMIT", "SUBMITTED"] },
];

export function simpleStageIndex(status: AutomationStatus): number {
  return SIMPLE_STAGES.findIndex((s) => s.statuses.includes(status));
}
