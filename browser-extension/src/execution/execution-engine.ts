/* ─────────────────────────────────────────────────────────
   Execution engine — orchestrates the full autonomous
   application lifecycle (§4):

     1. confirm the page matches the authorization
     2. detect ATS
     3. scan fields (reuses content/scanner.ts — the SAME code
        Part 1's read-only scan uses)
     4. resolve + decide + fill each field
     5. answer supported questions (part of the same fill pass —
        a "question" is just a field mapped or unmapped whose
        value comes from the answer banks; there is no separate
        code path from "filling")
     6. upload documents
     7. validate required fields
     8. locate + (dry-run or real) attempt the final submit
     9. detect success or failure
     10. return a complete ExecutionResult for the caller
         (content script) to report back to the web app

   Every step is logged. Nothing here ever fabricates a value —
   see answer-resolver.ts for the enforcement layer.
   ───────────────────────────────────────────────────────── */

import type { ExtensionApplicationPayload } from "../../../app/lib/extension-payload/contracts";
import type { NormalizedDetectedField } from "../shared/contracts";
import { detectAts } from "../ats/detect";
import { mapFields } from "../shared/mapper";
import { resolveFieldValue } from "./value-resolver";
import { decideFieldAction } from "./answer-resolver";
import { fillTextLikeField, fillCheckboxField, fillGroupField, type FillOptions } from "./field-filler";
import { uploadDocument } from "./document-uploader";
import { validateForm } from "./form-validator";
import { attemptSubmit, pageMatchesAuthorization, type SubmitControllerResult } from "./submit-controller";
import { detectOutcome } from "./outcome-detector";
import type {
  DocumentUploadResult,
  ExecutionLogEntry,
  ExecutionResult,
  ExecutionStage,
  FieldExecutionResult,
  ReviewRequiredDetail,
} from "./execution-types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fill dispatch by input shape — the answer-resolver has already decided
    THAT the field may be filled and WITH what; this only decides HOW to
    write it to the specific control type. */
async function fillDecidedField(
  field: NormalizedDetectedField,
  value: string | boolean | string[],
  source: FieldExecutionResult["source"],
  doc: Document,
  options: FillOptions
): Promise<FieldExecutionResult> {
  if (field.raw.inputType === "checkbox" && typeof value === "boolean") {
    return fillCheckboxField(field, value, source, doc, options);
  }
  if (field.raw.inputType === "radio-group" || field.raw.inputType === "checkbox-group") {
    return fillGroupField(field, value as string | boolean, source, doc, options);
  }
  if (field.raw.inputType === "file") {
    // Documents are handled separately in the upload pass — never as a
    // text write, even if a value happened to resolve for this field.
    return { fieldId: field.raw.scanFieldId, mappedKey: field.normalizedField ?? undefined, status: "skipped-optional", source };
  }
  return fillTextLikeField(field, String(value), source, doc, options);
}

function reviewRequired(kind: ReviewRequiredDetail["kind"], description: string, requiredAction: string, question?: string): ReviewRequiredDetail {
  return { kind, description, requiredAction, question };
}

function outcomeToReviewReason(outcome: SubmitControllerResult | { outcome: string; evidence: string[] }): ReviewRequiredDetail | null {
  if ("evidence" in outcome) {
    const ev = outcome.evidence.join(" ");
    switch (outcome.outcome) {
      case "submitted":
        return null;
      case "captcha-required":
        return reviewRequired("captcha-required", `A CAPTCHA appeared after submitting. ${ev}`, "Complete the CAPTCHA and submit this application yourself.");
      case "login-required":
        return reviewRequired("login-required", `A login/account prompt appeared after submitting. ${ev}`, "Sign in and submit this application yourself.");
      case "validation-rejected":
        return reviewRequired("unclear-submit-control", `The form appears to have rejected the submission. ${ev}`, "Open the application and check for validation errors.");
      case "external-redirect":
        return reviewRequired("unsupported-ats-interaction", `Submission redirected to an external site. ${ev}`, "Complete the application on the external site yourself.");
      default:
        return reviewRequired("unknown-submission-outcome", `Could not confirm the application was submitted. ${ev}`, "Open the application to check whether it actually went through before retrying.");
    }
  }
  // Blocked before ever clicking submit.
  const reason = outcome.reason ?? "Submission was blocked.";
  if (/captcha/i.test(reason)) return reviewRequired("captcha-required", reason, "Complete the CAPTCHA and submit this application yourself.");
  if (/does not match/i.test(reason)) return reviewRequired("authorization-page-mismatch", reason, "Re-open the application from ApplyMate and try again.");
  if (/duplicate/i.test(reason)) return reviewRequired("unclear-submit-control", reason, "This application may already have been submitted — check the Tracker before retrying.");
  if (/submit control/i.test(reason)) return reviewRequired("unclear-submit-control", reason, "Submit this application yourself — ApplyMate could not confidently identify the submit button.");
  return reviewRequired("unclear-submit-control", reason, "Review this application manually.");
}

export interface RunExecutionOptions {
  /** Never actually click submit — used for every real, public
      Greenhouse/Lever page during development validation. Only false
      against the local test fixture. */
  dryRun: boolean;
  previousAttemptIds: string[];
  attemptId: string;
}

export async function runExecution(
  payload: ExtensionApplicationPayload,
  doc: Document,
  location: Location,
  options: RunExecutionOptions
): Promise<ExecutionResult> {
  const log: ExecutionLogEntry[] = [];
  const record = (stage: ExecutionStage, message: string) => log.push({ stage, timestamp: new Date().toISOString(), message });

  const authorizationId = payload.authorization.authorizationId;

  /* 1. Confirm the page matches the authorization. */
  if (!pageMatchesAuthorization(location, payload.authorization.authorizedApplyUrl)) {
    record("REVIEW_REQUIRED", "Live page does not match the authorized application URL.");
    return {
      authorizationId,
      stage: "REVIEW_REQUIRED",
      fields: [],
      documents: [],
      readiness: null,
      submissionOutcome: null,
      reviewRequired: reviewRequired(
        "authorization-page-mismatch",
        `This tab (${location.href}) does not match the authorized application (${payload.authorization.authorizedApplyUrl}).`,
        "Re-open the application from ApplyMate."
      ),
      log,
    };
  }

  /* 2–3. Detect ATS + scan fields — reuses the exact Part 1 scanner. */
  record("SCANNING_FORM", "Detecting ATS and scanning the application form.");
  const { detection, adapter } = detectAts(doc, location);
  if (!adapter) {
    return terminal(authorizationId, "REVIEW_REQUIRED", log, reviewRequired(
      "unsupported-ats-interaction",
      `This page was not recognized as a supported ATS (detection: ${detection.platform}).`,
      "Complete this application manually."
    ));
  }
  const root = adapter.findApplicationRoot(doc);
  if (!root) {
    return terminal(authorizationId, "REVIEW_REQUIRED", log, reviewRequired(
      "unsupported-ats-interaction",
      "Could not locate the application form on this page.",
      "Complete this application manually."
    ));
  }
  const rawFields = adapter.discoverFields(root, doc);
  const scannedFields = mapFields(rawFields);
  record("SCANNING_FORM", `Found ${scannedFields.length} field(s).`);

  /* 4–5. Resolve + decide + fill every non-file field. */
  record("FILLING_FORM", "Resolving and filling verified fields.");
  const fillOptions: FillOptions = { filledByApplyMate: new Set(), overwriteExistingValues: payload.preferences?.overwriteExistingValues ?? false };
  const fieldResults: FieldExecutionResult[] = [];

  for (const field of scannedFields) {
    if (field.raw.inputType === "file") continue; // handled in the upload pass
    const resolution = resolveFieldValue(field, payload);
    const decision = decideFieldAction(field, resolution, payload);

    if (decision.action === "fill") {
      fieldResults.push(await fillDecidedField(field, decision.value, decision.source, doc, fillOptions));
    } else if (decision.action === "skip-optional") {
      fieldResults.push({ fieldId: field.raw.scanFieldId, mappedKey: field.normalizedField ?? undefined, status: "skipped-optional" });
    } else {
      fieldResults.push({
        fieldId: field.raw.scanFieldId,
        mappedKey: field.normalizedField ?? undefined,
        status: field.raw.required ? "unresolved-required" : "blocked",
        blockedReason: decision.reason,
      });
    }
  }
  record("ANSWERING_QUESTIONS", "Application questions resolved as part of the same fill pass.");

  /* 6. Documents. */
  record("UPLOADING_DOCUMENTS", "Resolving résumé/cover letter uploads.");
  const resumeField = scannedFields.find((f) => f.normalizedField === "resumeFile") ?? null;
  const coverLetterField = scannedFields.find((f) => f.normalizedField === "coverLetterFile") ?? null;
  const documentResults: DocumentUploadResult[] = [
    uploadDocument(resumeField, "resume", payload, doc),
    uploadDocument(coverLetterField, "coverLetter", payload, doc),
  ].filter((r) => r.status !== "skipped-no-field" || false); // keep all — "skipped-no-field" means no upload field exists, not a blocker

  const requiredDocumentIssues = documentResults.filter(
    (r) => r.status !== "skipped-no-field" && (r.status === "not-available" || r.status === "failed") &&
      ((r.kind === "resume" && resumeField?.raw.required) || (r.kind === "coverLetter" && coverLetterField?.raw.required))
  );

  /* 7. Validate readiness. */
  record("VALIDATING_FORM", "Validating required fields.");
  const readiness = validateForm(scannedFields, fieldResults, requiredDocumentIssues, doc);

  if (!readiness.ready) {
    const firstIssue = readiness.unresolvedRequired[0] ?? readiness.validationErrors[0];
    const isDemographic = scannedFields.some(
      (f) => f.category === "demographicQuestions" && fieldResults.some((r) => r.fieldId === f.raw.scanFieldId && (r.status === "unresolved-required" || r.status === "blocked"))
    );
    const kind: ReviewRequiredDetail["kind"] = requiredDocumentIssues.length > 0
      ? "document-upload-failed"
      : isDemographic
        ? "unresolved-demographic-question"
        : "missing-required-answer";
    return terminal(authorizationId, "REVIEW_REQUIRED", log, reviewRequired(
      kind,
      `${readiness.unresolvedRequired.length} required field(s) unresolved. ${firstIssue ? `First: "${firstIssue.label ?? firstIssue.fieldId}" — ${firstIssue.reason}` : ""}`,
      "Save the missing information (a reusable answer, profile field, or demographic policy) in ApplyMate, then retry.",
      firstIssue?.label ?? undefined
    ), fieldResults, documentResults, readiness);
  }

  record("READY_TO_SUBMIT", "All required fields resolved and valid.");

  /* 8. Submit (or dry-run). */
  record(options.dryRun ? "READY_TO_SUBMIT" : "SUBMITTING", options.dryRun ? "Dry run — identifying the submit control without clicking it." : "Submitting the application.");
  const urlBeforeSubmit = location.href;
  const submitResult = attemptSubmit({
    root,
    doc,
    location,
    authorizedApplyUrl: payload.authorization.authorizedApplyUrl,
    readiness,
    attempt: { attemptId: options.attemptId, authorizationId, authorizedApplyUrl: payload.authorization.authorizedApplyUrl, attemptedAt: new Date().toISOString() },
    previousAttempts: options.previousAttemptIds.map((id) => ({ attemptId: id, authorizationId, authorizedApplyUrl: payload.authorization.authorizedApplyUrl, attemptedAt: "" })),
    dryRun: options.dryRun,
  });

  if (options.dryRun) {
    record("READY_TO_SUBMIT", `Dry run complete. ${submitResult.submitControlFound ? `Would click: "${submitResult.submitControlText}"` : "No submit control identified."}`);
    return terminal(authorizationId, "READY_TO_SUBMIT", log, null, fieldResults, documentResults, readiness);
  }

  if (submitResult.outcome === "blocked") {
    return terminal(authorizationId, "REVIEW_REQUIRED", log, outcomeToReviewReason(submitResult), fieldResults, documentResults, readiness);
  }

  /* 9. Detect outcome. */
  record("SUBMITTING", "Submit control clicked — waiting to detect the outcome.");
  await delay(2500);
  const outcomeResult = detectOutcome({ doc, location, urlBeforeSubmit, formRoot: root });
  record("SUBMITTED", `Outcome detected: ${outcomeResult.outcome}. ${outcomeResult.evidence.join(" ")}`);

  if (outcomeResult.outcome === "submitted") {
    return {
      authorizationId,
      stage: "SUBMITTED",
      fields: fieldResults,
      documents: documentResults,
      readiness,
      submissionOutcome: "submitted",
      reviewRequired: null,
      log,
    };
  }

  return {
    authorizationId,
    stage: "REVIEW_REQUIRED",
    fields: fieldResults,
    documents: documentResults,
    readiness,
    submissionOutcome: outcomeResult.outcome,
    reviewRequired: outcomeToReviewReason(outcomeResult),
    log,
  };
}

function terminal(
  authorizationId: string,
  stage: ExecutionStage,
  log: ExecutionLogEntry[],
  reviewRequiredDetail: ReviewRequiredDetail | null,
  fields: FieldExecutionResult[] = [],
  documents: DocumentUploadResult[] = [],
  readiness: ExecutionResult["readiness"] = null
): ExecutionResult {
  return {
    authorizationId,
    stage,
    fields,
    documents,
    readiness,
    submissionOutcome: null,
    reviewRequired: reviewRequiredDetail,
    log,
  };
}
