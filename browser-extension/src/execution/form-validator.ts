/* ─────────────────────────────────────────────────────────
   Form validator — the readiness pass before submission (§10).

   Pure aggregation over what field-filler.ts / document-
   uploader.ts already produced, plus a live-DOM pass for
   browser-native validity (required/pattern/type mismatches)
   and any ATS-rendered inline validation text the scanner
   already captured. Never proceeds past `ready: true` with any
   unresolved required field or file — the submit controller
   refuses to act unless this says ready.
   ───────────────────────────────────────────────────────── */

import type { NormalizedDetectedField } from "../shared/contracts";
import { locateElement } from "./field-filler";
import type {
  DocumentUploadResult,
  FieldExecutionResult,
  FieldIssue,
  FormReadinessResult,
} from "./execution-types";

function labelOf(field: NormalizedDetectedField): string | null {
  return field.raw.label;
}

export function validateForm(
  fields: NormalizedDetectedField[],
  fieldResults: FieldExecutionResult[],
  documentResults: DocumentUploadResult[],
  doc: Document
): FormReadinessResult {
  const unresolvedRequired: FieldIssue[] = [];
  const validationErrors: FieldIssue[] = [];
  const optionalUnanswered: FieldIssue[] = [];

  const resultByFieldId = new Map(fieldResults.map((r) => [r.fieldId, r]));

  for (const field of fields) {
    const result = resultByFieldId.get(field.raw.scanFieldId);
    const label = labelOf(field);

    if (field.raw.required) {
      if (!result || result.status === "unresolved-required" || result.status === "blocked" || result.status === "failed") {
        unresolvedRequired.push({
          fieldId: field.raw.scanFieldId,
          label,
          reason: result?.error ?? result?.blockedReason ?? "Required field has no resolved value.",
        });
        continue;
      }
    } else if (result?.status === "skipped-optional") {
      optionalUnanswered.push({ fieldId: field.raw.scanFieldId, label, reason: result.error ?? "Left unanswered — optional." });
    }

    // Live-DOM validity + ATS-rendered inline error text, for whatever we
    // did fill (or that already had a value before we started).
    if (result?.status === "filled" || result?.status === "already-filled") {
      const el = locateElement(field, doc);
      if (el && "validity" in el) {
        const validity = (el as HTMLInputElement).validity;
        if (validity && !validity.valid) {
          validationErrors.push({ fieldId: field.raw.scanFieldId, label, reason: describeValidity(validity) });
        }
      }
      if (field.raw.validationText) {
        validationErrors.push({ fieldId: field.raw.scanFieldId, label, reason: field.raw.validationText });
      }
    }
  }

  for (const doc_ of documentResults) {
    if (doc_.status === "not-available" || doc_.status === "failed") {
      // Only a hard blocker if a matching field exists and is required —
      // the caller passes documentResults already scoped to required
      // upload fields it attempted.
      unresolvedRequired.push({
        fieldId: doc_.fieldId ?? `document-${doc_.kind}`,
        label: doc_.kind === "resume" ? "Résumé" : "Cover letter",
        reason: doc_.error ?? `No ${doc_.kind === "resume" ? "résumé" : "cover letter"} file is available to upload.`,
      });
    }
  }

  return {
    ready: unresolvedRequired.length === 0 && validationErrors.length === 0,
    unresolvedRequired,
    validationErrors,
    optionalUnanswered,
  };
}

function describeValidity(validity: ValidityState): string {
  if (validity.valueMissing) return "Required value is missing.";
  if (validity.typeMismatch) return "Value doesn't match the expected type (e.g. a valid email or URL).";
  if (validity.patternMismatch) return "Value doesn't match the field's required pattern.";
  if (validity.tooShort) return "Value is shorter than the minimum length.";
  if (validity.tooLong) return "Value exceeds the maximum length.";
  if (validity.rangeUnderflow || validity.rangeOverflow) return "Value is out of the allowed range.";
  return "Value failed browser-native validation.";
}
