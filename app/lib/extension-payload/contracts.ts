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

import type { ApplicationPackage, DemographicAnswerPolicy, DemographicAnswers } from "../ai/contracts";
import type { AutomationStatus } from "../automation/contracts";
import type { ApplicationFieldCandidate } from "../application-fields/contracts";
import type { SelectedApplicationDocument } from "../documents/contracts";

/** v2 (Browser Extension MVP Part 2): added `authorization` (the right
    swipe's one-time authorization for this exact application — see
    docs/auto-apply-architecture.md §1f), `reusableAnswers`, and
    `demographicPolicy`. Additive only; every v1 field is unchanged. */
export const EXTENSION_PAYLOAD_SCHEMA_VERSION = 3;

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

  /**
   * The one-time authorization the right swipe granted for exactly this
   * application. `authorizationId` is always `automationJobKey` — job.key
   * already is a stable, non-hashed identity (see lib/automation/store.ts),
   * so there is no separate authorization id or store to keep in sync.
   * The execution engine must refuse to act if the live page it's running
   * on doesn't match `authorizedApplyUrl`.
   */
  authorization: {
    authorizationId: string;
    /** Added in schema v3. Legacy payloads may omit it; the background
        worker generates a defensive fallback attempt id. */
    attemptId?: string;
    authorizedAction: "fill-and-submit";
    authorizedAt: string; // ISO 8601
    authorizedApplyUrl: string;
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
    /** Frozen references only; byte content crosses in a separate,
        short-lived authorized transfer message. */
    resume?: SelectedApplicationDocument;
    coverLetter?: SelectedApplicationDocument;
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

  /**
   * Explicit, user-approved answers reusable across applications — see
   * CandidateProfile.reusableAnswers. The ONLY legitimate source for a
   * NEEDS_CONFIRMATION or NEVER_AUTO_FILL answer during autonomous
   * execution besides an explicit demographic policy below.
   */
  reusableAnswers: { questionKey: string; question: string; answer: string; approvedAt: string }[];

  /** The user's standing policy for demographic self-identification
      questions — see CandidateProfile.demographicAnswerPolicy. Defaults to
      "not-set", which always routes a required demographic question to
      review-required; never treated as an implicit decline. */
  demographicPolicy: {
    policy: DemographicAnswerPolicy;
    answers: DemographicAnswers;
  };

  /** Execution-behavior preferences. `overwriteExistingValues` always
      defaults to false — the execution engine never overwrites a value
      the user (or an earlier ApplyMate run) already put in a field unless
      this is explicitly true. Not user-configurable yet; always false. */
  preferences: {
    overwriteExistingValues: boolean;
  };

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
