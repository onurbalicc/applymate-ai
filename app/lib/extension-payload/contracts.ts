/* ─────────────────────────────────────────────────────────
   Browser Extension Application Data Contract.

   The complete, self-contained payload a future browser
   extension receives for ONE application. Deliberately
   independent of ApplyMate's internal localStorage layout —
   the extension never needs to know store keys, schema
   versions of internal stores, or React state shapes.

   Honesty invariants carried into the contract itself:
   - Document availability is stated explicitly; the payload
     never pretends a résumé PDF exists (none can be generated
     yet anywhere in the product).
   - Sensitive fields (work authorization, sponsorship, legal
     declarations, demographics) are always marked
     NEVER_AUTO_FILL regardless of stored values.
   - Readiness names exactly what is possible today:
     text-field assistance — never submission.
   ───────────────────────────────────────────────────────── */

import type { ApplicationPackage } from "../ai/contracts";
import type { AutomationStatus } from "../automation/contracts";
import type { ApplicationFieldCandidate } from "../application-fields/contracts";

export const EXTENSION_PAYLOAD_SCHEMA_VERSION = 1;

/** ATS the extension should expect at the apply URL, when known. */
export type ExpectedAts = "greenhouse" | "lever" | "unknown";

export type ExtensionReadinessState =
  /** Package generated, nothing unresolved — the extension could assist with text fields. */
  | "READY_FOR_TEXT_FIELD_ASSISTANCE"
  /** Required questions remain unanswered — user must answer in ApplyMate first. */
  | "NEEDS_USER_INPUT"
  /** No generated package exists yet (pipeline not finished, paused early, or profile incomplete). */
  | "PACKAGE_NOT_READY"
  /** Job is cancelled/failed or in a state assistance must not act on. */
  | "INVALID_APPLICATION_STATE";

/** One requirement standing between this payload and a ready session. */
export interface UnresolvedRequirement {
  id: string;
  kind:
    | "unanswered-required-question"
    | "low-confidence-answer-unresolved"
    | "package-not-generated"
    | "invalid-application-state"
    | "missing-resume-file"
    | "missing-profile-field"
    | "manual-sensitive-action";
  description: string;
}

export interface ExtensionApplicationPayload {
  metadata: {
    schemaVersion: number;
    generatedAt: string; // ISO 8601
    automationJobKey: string;
    jobTitle: string;
    company: string;
    applyUrl: string | null;
    provider: string;
    sourceLabel: string;
    expectedAts: ExpectedAts;
    applicationState: AutomationStatus;
  };

  /** Form-relevant, factual profile data only — no internal
      preference fields (minMatchScore, excludedKeywords, …). */
  candidate: {
    identity: {
      fullName: string;
      /** Naive split of fullName — verify before relying on it. */
      givenName: string;
      familyName: string;
    };
    contact: {
      email: string;
      phone: string;
      city: string;
      country: string;
    };
    professionalLinks: {
      linkedInUrl: string;
      gitHubUrl: string;
      portfolioUrl: string;
    };
    location: {
      willingToRelocate: boolean;
      remotePreference: string;
    };
    education: { institution: string; degree: string; period: string }[];
    workExperience: { company: string; role: string; period: string }[];
    /** Explicitly-provided values only — empty string means "not provided",
        and the corresponding field is never inferred or guessed. */
    salaryAndAvailability: {
      expectedSalary: string;
      noticePeriod: string;
      earliestStartDate: string;
    };
    workAuthorization: {
      /** User's stored statement, verbatim; "" when never provided. */
      authorizationStatus: string;
      sponsorshipRequired: boolean;
    };
  };

  /** Explicit availability — no pretending files exist. */
  documents: {
    resumeFileAvailable: boolean;
    coverLetterFileAvailable: boolean;
    /** The generated cover letter exists as TEXT, not as a file. */
    coverLetterTextAvailable: boolean;
  };

  /** The AI-generated package for this job, or null when not generated. */
  generatedPackage: {
    coverLetterSubject: string;
    coverLetterBody: string;
    recruiterMessage: string;
    applicationAnswers: ApplicationPackage["applicationAnswers"];
    missingInformation: string[];
    matchScore: number;
    decision: ApplicationPackage["decision"];
    fitSummary: string;
    isDemo: boolean;
  } | null;

  /**
   * Generated + user answers merged with clear precedence:
   * a user-provided answer ALWAYS overrides a generated answer
   * for the same question. Sources are labeled so the extension
   * can display provenance.
   */
  resolvedAnswers: {
    id: string;
    question: string;
    answer: string;
    source: "generated" | "user";
    /** 0–1; user answers are 1. */
    confidence: number;
  }[];

  /** Pre-classified fill candidates in the Unified Field Contract.
      detectedLabel is null throughout — no live form has been read. */
  normalizedFields: ApplicationFieldCandidate[];

  unresolvedRequirements: {
    /** Must be resolved before assistance can be considered ready. */
    blocking: UnresolvedRequirement[];
    /** Honest manual steps the user will do themselves (e.g. attach résumé). */
    manualSteps: UnresolvedRequirement[];
  };

  readiness: {
    state: ExtensionReadinessState;
    isReady: boolean;
    blockingReasons: string[];
    manualSteps: string[];
    warnings: string[];
  };
}
