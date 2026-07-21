/* ─────────────────────────────────────────────────────────
   Value resolver — turns one mapped, scanned field into a
   ResolvedApplicationValue (or an honest "unresolved"), using
   the strict source priority from AGENTS.md §5:

     1. explicit per-job approved answer
     2. verified candidate profile value
     3. previously approved reusable answer
     4. generated application-package answer
     5. deterministic derived value
     6. unresolved

   Pure function — no DOM access, no storage, no network. Every
   resolution carries its source and an explanation so the
   execution log/review-required detail can always say exactly
   where a value came from. This module never returns a
   fabricated fallback: if nothing on the priority list has a
   real answer, the field is unresolved, full stop.
   ───────────────────────────────────────────────────────── */

import type { ExtensionApplicationPayload } from "../../../app/lib/extension-payload/contracts";
import { missingInfoId } from "../../../app/lib/automation/missing-info";
import type { NormalizedFieldId } from "../../../app/lib/application-fields/contracts";
import type { NormalizedDetectedField } from "../shared/contracts";
import type { ResolvedValueConfidence, ResolvedValueSource, ValueResolution } from "./execution-types";

function unresolved(reason: string): ValueResolution {
  return { resolved: false, reason };
}

function resolved(
  value: string | boolean | string[],
  source: ResolvedValueSource,
  confidence: ResolvedValueConfidence,
  explanation: string
): ValueResolution {
  return { resolved: true, value, source, confidence, explanation };
}

/** Question-style lookup shared by both branches below: matches a raw
    field's resolved label against payload.resolvedAnswers (per-job) and
    payload.reusableAnswers (cross-job bank), both keyed by the same
    stable question-identity function used everywhere else in the product. */
function resolveFromAnswerBanks(
  rawLabel: string | null,
  payload: ExtensionApplicationPayload
): ValueResolution | null {
  if (!rawLabel) return null;
  const key = missingInfoId(rawLabel);

  // 1. Explicit per-job approved answer (user always wins over generated).
  const userAnswer = payload.resolvedAnswers.find((a) => a.id === key && a.source === "user");
  if (userAnswer) {
    return resolved(userAnswer.answer, "approved-answer", "approved", `Explicit answer approved for this application: "${userAnswer.question}"`);
  }

  // 3. Reusable answer bank (cross-job, explicitly approved by the user).
  const reusable = payload.reusableAnswers.find((a) => a.questionKey === key);
  if (reusable) {
    return resolved(reusable.answer, "reusable-answer", "approved", `Reusable answer approved on ${reusable.approvedAt}: "${reusable.question}"`);
  }

  // 4. Generated application-package answer.
  const generated = payload.resolvedAnswers.find((a) => a.id === key && a.source === "generated");
  if (generated) {
    return resolved(generated.answer, "application-package", "generated", `AI-generated answer from the application package: "${generated.question}"`);
  }

  return null;
}

/** Direct candidate-profile lookups for normalized fields that map
    cleanly onto ExtensionApplicationPayload.candidate.* — the SAFE_AUTO_FILL
    identity/contact/links majority of fields. */
function resolveFromProfile(
  mappedKey: NormalizedFieldId,
  payload: ExtensionApplicationPayload
): ValueResolution | null {
  const c = payload.candidate;
  const withSource = (value: string | boolean, field: string): ValueResolution | null =>
    value === "" || value === undefined
      ? null
      : resolved(value, "candidate-profile", "verified", `Verified candidate profile field: ${field}`);

  switch (mappedKey) {
    case "fullName": return withSource(c.identity.fullName, "full name");
    case "givenName": return withSource(c.identity.givenName, "given name");
    case "familyName": return withSource(c.identity.familyName, "family name");
    case "email": return withSource(c.contact.email, "email");
    case "phone": return withSource(c.contact.phone, "phone");
    case "city": return withSource(c.contact.city, "city");
    case "country": return withSource(c.contact.country, "country");
    case "linkedInUrl": return withSource(c.professionalLinks.linkedInUrl, "LinkedIn URL");
    case "gitHubUrl": return withSource(c.professionalLinks.gitHubUrl, "GitHub URL");
    case "portfolioUrl": return withSource(c.professionalLinks.portfolioUrl, "portfolio URL");
    case "willingToRelocate": return resolved(c.location.willingToRelocate, "candidate-profile", "verified", "Verified candidate profile field: willingness to relocate");
    case "remotePreference": return withSource(c.location.remotePreference, "remote preference");
    case "expectedSalary": return withSource(c.salaryAndAvailability.expectedSalary, "expected salary");
    case "noticePeriod": return withSource(c.salaryAndAvailability.noticePeriod, "notice period");
    case "earliestStartDate": return withSource(c.salaryAndAvailability.earliestStartDate, "earliest start date");
    case "institution": return withSource(c.education[0]?.institution ?? "", "institution");
    case "degree": return withSource(c.education[0]?.degree ?? "", "degree");
    case "currentCompany": return withSource(c.workExperience[0]?.company ?? "", "current company");
    case "currentTitle": return withSource(c.workExperience[0]?.role ?? "", "current title");
    case "coverLetterBody": return withSource(payload.generatedPackage?.coverLetterBody ?? "", "generated cover letter");
    case "recruiterMessage": return withSource(payload.generatedPackage?.recruiterMessage ?? "", "generated recruiter message");
    default:
      return null;
  }
}

/** Deterministic transformations of already-verified sources — never a
    subjective or legal answer, per AGENTS.md §5. */
function resolveDerived(
  mappedKey: NormalizedFieldId,
  payload: ExtensionApplicationPayload
): ValueResolution | null {
  if (mappedKey === "fullName") {
    const { givenName, familyName } = payload.candidate.identity;
    if (givenName && familyName) {
      return resolved(`${givenName} ${familyName}`, "derived", "verified", "Derived by joining verified given name and family name");
    }
  }
  return null;
}

/**
 * Resolve one mapped, scanned field to a value using the full priority
 * order. Never invents a value — an "unresolved" result must always be
 * respected by callers (form-validator marks it as a required gap, or
 * field-filler simply skips an optional one).
 */
export function resolveFieldValue(
  field: NormalizedDetectedField,
  payload: ExtensionApplicationPayload
): ValueResolution {
  const label = field.raw.label;

  // 1/3/4: question-style answer banks always take priority when the
  // field's own resolved label matches a stored question identity —
  // even for fields that also mapped to a normalizedField (a custom
  // per-job phrasing of an otherwise-standard question should use the
  // user's own words if they explicitly answered it).
  const fromBanks = resolveFromAnswerBanks(label, payload);
  if (fromBanks) return fromBanks;

  if (field.normalizedField) {
    // 2: verified candidate profile value.
    const fromProfile = resolveFromProfile(field.normalizedField, payload);
    if (fromProfile) return fromProfile;

    // 5: deterministic derived value.
    const derived = resolveDerived(field.normalizedField, payload);
    if (derived) return derived;
  }

  return unresolved(
    field.normalizedField
      ? `No verified value, approved answer, reusable answer, or generated answer exists for "${field.normalizedField}".`
      : "Field is unmapped and no answer bank entry matches its label."
  );
}
