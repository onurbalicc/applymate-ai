/* ─────────────────────────────────────────────────────────
   Autonomous execution — shared contracts.

   These types describe the extension's OWN execution engine
   (browser-extension/src/execution/*), which consumes the
   ApplicationExecutionPayload (app/lib/extension-payload —
   the same contract as Part 1's read-only payload, extended
   with `authorization`/`reusableAnswers`/`demographicPolicy`)
   and drives a real ATS form to completion.

   Deliberately kept separate from the read-only scan contracts
   in shared/contracts.ts — a NormalizedDetectedField describes
   what was FOUND on the page; a ResolvedApplicationValue
   describes what ApplyMate is about to WRITE and why it's
   allowed to. Never conflate the two.
   ───────────────────────────────────────────────────────── */

import type { NormalizedFieldId, SensitivityCategory } from "../../../app/lib/application-fields/contracts";
import type { NormalizedDetectedField } from "../shared/contracts";

/* ── Value resolution (§5) ───────────────────────────────── */

export type ResolvedValueSource =
  | "approved-answer" // explicit per-job approved answer
  | "candidate-profile" // verified profile fact
  | "reusable-answer" // previously approved reusable answer bank
  | "application-package" // generated package answer
  | "derived" // deterministic transformation of another verified source
  | "demographic-policy"; // explicit decline / explicit stored demographic answer

export type ResolvedValueConfidence = "verified" | "approved" | "generated";

export interface ResolvedApplicationValue {
  value: string | boolean | string[];
  source: ResolvedValueSource;
  confidence: ResolvedValueConfidence;
  /** Human-readable trace for the execution log / review-required detail. */
  explanation: string;
}

/** Nothing could be resolved truthfully — the caller must never fabricate
    a fallback. Distinct from ResolvedApplicationValue so "unresolved" can
    never be accidentally treated as a value. */
export interface UnresolvedApplicationValue {
  resolved: false;
  reason: string;
}

export type ValueResolution =
  | ({ resolved: true } & ResolvedApplicationValue)
  | UnresolvedApplicationValue;

/* ── Field execution (§8) ────────────────────────────────── */

export type FieldExecutionStatus =
  | "filled"
  | "already-filled"
  | "skipped-optional"
  | "unresolved-required"
  | "blocked"
  | "failed";

export interface FieldExecutionResult {
  fieldId: string; // NormalizedDetectedField.raw.scanFieldId
  mappedKey?: NormalizedFieldId;
  status: FieldExecutionStatus;
  source?: ResolvedValueSource;
  /** Present when status is "blocked" — why autonomous fill was refused
      even though a value may have been resolvable (e.g. NEVER_AUTO_FILL
      with no explicit policy). */
  blockedReason?: string;
  error?: string;
}

/* ── Form readiness (§10) ────────────────────────────────── */

export interface FieldIssue {
  fieldId: string;
  label: string | null;
  reason: string;
}

export interface FormReadinessResult {
  ready: boolean;
  unresolvedRequired: FieldIssue[];
  validationErrors: FieldIssue[];
  optionalUnanswered: FieldIssue[];
}

/* ── Document upload (§9) ────────────────────────────────── */

export type DocumentKind = "resume" | "coverLetter";

export interface DocumentUploadResult {
  kind: DocumentKind;
  documentId?: string;
  fileName?: string;
  status:
    | "uploaded"
    | "already-present"
    | "rejected"
    | "missing-document"
    | "unsupported-widget"
    | "processing-timeout"
    | "failed"
    | "skipped-no-field";
  fieldId?: string;
  detectedFileName?: string;
  error?: string;
}

/* ── Submission + outcome (§11, §12) ─────────────────────── */

export interface SubmitAttempt {
  /** Idempotency key — see AutomationJob.executionAttemptId. A duplicate
      attempt with the same id is always rejected. */
  attemptId: string;
  authorizationId: string;
  authorizedApplyUrl: string;
  attemptedAt: string;
}

export type { SubmissionOutcome } from "../../../app/lib/automation/contracts";

export interface OutcomeDetectionResult {
  outcome: import("../../../app/lib/automation/contracts").SubmissionOutcome;
  evidence: string[];
}

/* ── Whole-execution result ──────────────────────────────── */

export type ExecutionStage =
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
  | "REVIEW_REQUIRED"
  | "FAILED";

export interface ExecutionLogEntry {
  stage: ExecutionStage;
  timestamp: string;
  message: string;
}

export interface ReviewRequiredDetail {
  kind:
    | "captcha-required"
    | "login-required"
    | "missing-required-answer"
    | "missing-verified-information"
    | "unresolved-legal-attestation"
    | "unresolved-demographic-question"
    | "unsupported-ats-interaction"
    | "document-upload-failed"
    | "resume-document-missing"
    | "resume-transfer-failed"
    | "resume-upload-rejected"
    | "resume-upload-timeout"
    | "cover-letter-required"
    | "document-store-unavailable"
    | "unclear-submit-control"
    | "unknown-submission-outcome"
    | "external-assessment-required"
    | "identity-verification-required"
    | "authorization-page-mismatch"
    | "execution-interrupted";
  description: string;
  requiredAction: string;
  question?: string;
}

export interface ExecutionResult {
  authorizationId: string;
  stage: ExecutionStage;
  fields: FieldExecutionResult[];
  documents: DocumentUploadResult[];
  readiness: FormReadinessResult | null;
  submissionOutcome: import("../../../app/lib/automation/contracts").SubmissionOutcome | null;
  reviewRequired: ReviewRequiredDetail | null;
  log: ExecutionLogEntry[];
  scan?: { fields: NormalizedDetectedField[]; formFound: boolean };
}

/** True for any sensitivity that requires an explicit source before an
    autonomous execution may write it — see answer-resolver.ts. Re-exported
    here so execution modules don't need to know classifier internals. */
export function requiresExplicitSource(sensitivity: SensitivityCategory): boolean {
  return sensitivity !== "SAFE_AUTO_FILL";
}
