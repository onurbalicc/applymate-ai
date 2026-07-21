/* ─────────────────────────────────────────────────────────
   Answer resolver — the safety-critical decision layer that
   turns a ValueResolution into a concrete action, per the
   field execution policy in AGENTS.md §6:

     SAFE_AUTO_FILL      → fill whenever a value resolves
     NEEDS_CONFIRMATION  → fill only from an explicit or
                           approved source (candidate profile
                           preference / approved answer /
                           reusable answer / generated content)
     NEVER_AUTO_FILL     → fill ONLY from an explicit
                           per-question approved answer
                           (approved-answer / reusable-answer),
                           or — for demographic questions
                           specifically — the user's explicit
                           standing decline/explicit-answer
                           policy. Never from the candidate
                           profile, never derived, never
                           AI-generated, regardless of what
                           value-resolver.ts may have found.

   This module is the second, independent safety gate — even
   if value-resolver.ts ever resolved a NEVER_AUTO_FILL field
   from an unsafe source, decideFieldAction() refuses to act on
   it. Defense in depth, matching the rest of the product's
   "label evidence can only escalate, sensitivity is enforced
   everywhere" philosophy (see application-fields/classifier.ts).
   ───────────────────────────────────────────────────────── */

import type { DemographicAnswers } from "../../../app/lib/ai/contracts";
import type { ExtensionApplicationPayload } from "../../../app/lib/extension-payload/contracts";
import type { NormalizedDetectedField } from "../shared/contracts";
import type { ResolvedApplicationValue, ValueResolution } from "./execution-types";

export type FieldActionDecision =
  | ({ action: "fill" } & ResolvedApplicationValue)
  | { action: "skip-optional"; reason: string }
  | { action: "block-required"; reason: string };

const DECLINE_OPTION_PATTERN = /decline|prefer not|do not wish|self-identif|rather not/i;

/** Only the sources an explicit, per-question human decision could have
    produced — never a source that could have been silently inferred. */
const NEVER_AUTO_FILL_ALLOWED_SOURCES = new Set(["approved-answer", "reusable-answer", "demographic-policy"]);

function resolveDemographicPolicy(
  field: NormalizedDetectedField,
  payload: ExtensionApplicationPayload
): FieldActionDecision | null {
  const { policy, answers } = payload.demographicPolicy;

  if (policy === "not-set") return null;

  if (policy === "decline") {
    const declineOption = field.raw.options.find((o) => DECLINE_OPTION_PATTERN.test(o.label));
    if (!declineOption) return null; // no decline option on this ATS — fall through
    return {
      action: "fill",
      value: declineOption.value,
      source: "demographic-policy",
      confidence: "approved",
      explanation: "User's standing policy: decline to self-identify.",
    };
  }

  if (policy === "use-explicit-profile-answer") {
    const key = field.normalizedField as keyof DemographicAnswers | null;
    const value = key ? answers[key] : undefined;
    if (!value) return null;
    return {
      action: "fill",
      value,
      source: "demographic-policy",
      confidence: "approved",
      explanation: `User's explicit stored demographic answer for "${key}".`,
    };
  }

  return null;
}

/**
 * Decide what the execution engine may actually do with a mapped,
 * scanned field, given what value-resolver.ts found for it. This is the
 * single choke point every field must pass through before field-filler.ts
 * ever touches the DOM.
 */
export function decideFieldAction(
  field: NormalizedDetectedField,
  resolution: ValueResolution,
  payload: ExtensionApplicationPayload
): FieldActionDecision {
  const required = field.raw.required;

  if (field.sensitivity === "NEVER_AUTO_FILL") {
    if (field.category === "demographicQuestions") {
      const policyDecision = resolveDemographicPolicy(field, payload);
      if (policyDecision) return policyDecision;
    }

    if (resolution.resolved && NEVER_AUTO_FILL_ALLOWED_SOURCES.has(resolution.source)) {
      return { action: "fill", ...resolution };
    }

    // Any other source — even one that DID resolve a value — is refused.
    // This is the defense-in-depth check: value-resolver.ts should never
    // hand back a profile/derived/generated source for a NEVER_AUTO_FILL
    // field in the first place, but we never trust that alone.
    const reason = field.category === "demographicQuestions"
      ? `Demographic question with no standing policy set ("${field.normalizedField ?? field.raw.label}"). Set a policy in Candidate Profile to answer automatically.`
      : `Sensitive/legal field with no explicit approved answer ("${field.normalizedField ?? field.raw.label}"). Save a reusable answer to answer automatically.`;
    return required ? { action: "block-required", reason } : { action: "skip-optional", reason };
  }

  // SAFE_AUTO_FILL / NEEDS_CONFIRMATION: any properly-sourced resolution
  // is acceptable — the distinction between the two categories is which
  // fields are classified this way, not a different resolution algorithm.
  if (resolution.resolved) {
    return { action: "fill", ...resolution };
  }
  return required
    ? { action: "block-required", reason: resolution.reason }
    : { action: "skip-optional", reason: resolution.reason };
}
