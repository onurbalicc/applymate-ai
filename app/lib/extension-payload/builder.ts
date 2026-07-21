/* ─────────────────────────────────────────────────────────
   Extension payload builder.

   buildExtensionApplicationPayload(job, profile) assembles the
   complete Browser Extension Application Data Contract for one
   AutomationJob. Pure function:

   - no storage access (callers pass the domain objects in)
   - no React
   - no AI calls or inference — factual values are copied
     verbatim, never rephrased or guessed
   - never mutates its inputs (the ApplicationPackage and
     answer arrays are copied, not modified)

   Precedence rule for answers: a user-provided answer always
   overrides a generated answer for the same question identity.
   ───────────────────────────────────────────────────────── */

import type { CandidateProfile } from "../ai/contracts";
import type { AutomationJob } from "../automation/contracts";
import {
  getUnresolvedMissingInfo,
  isValidAnswer,
  missingInfoId,
} from "../automation/missing-info";
import {
  FIELD_CATEGORY,
  type ApplicationFieldCandidate,
  type FieldInputType,
  type FieldValueSource,
  type NormalizedFieldId,
} from "../application-fields/contracts";
import { classifySensitivity } from "../application-fields/classifier";
import {
  EXTENSION_PAYLOAD_SCHEMA_VERSION,
  type ExpectedAts,
  type ExtensionApplicationPayload,
  type ExtensionReadinessState,
  type UnresolvedRequirement,
} from "./contracts";

/* ── Helpers ─────────────────────────────────────────────── */

function detectExpectedAts(job: AutomationJob): ExpectedAts {
  if (job.provider.startsWith("greenhouse")) return "greenhouse";
  if (job.provider.startsWith("lever")) return "lever";
  const url = job.applyUrl ?? "";
  if (url.includes("greenhouse.io")) return "greenhouse";
  if (url.includes("lever.co")) return "lever";
  return "unknown";
}

/** Naive split of a full name — flagged with a warning when ambiguous. */
function splitFullName(fullName: string): { givenName: string; familyName: string; ambiguous: boolean } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { givenName: "", familyName: "", ambiguous: false };
  if (parts.length === 1) return { givenName: parts[0], familyName: "", ambiguous: true };
  return {
    givenName: parts.slice(0, -1).join(" "),
    familyName: parts[parts.length - 1],
    ambiguous: parts.length > 2,
  };
}

function answerConfidence(confidence: "high" | "medium" | "needs-user-input"): number {
  if (confidence === "high") return 0.9;
  if (confidence === "medium") return 0.6;
  return 0;
}

/** Build one field candidate with classification applied consistently. */
function candidate(input: {
  field: NormalizedFieldId;
  value: string | boolean | null;
  source: FieldValueSource;
  inputType?: FieldInputType;
  confidence?: number;
  required?: boolean;
  detectedLabel?: string | null;
  note?: string;
}): ApplicationFieldCandidate {
  const sensitivity = classifySensitivity({
    normalizedField: input.field,
    label: input.detectedLabel ?? null,
  });
  const hasValue =
    input.value !== null && input.value !== undefined && String(input.value).trim() !== "";
  return {
    normalizedField: input.field,
    category: FIELD_CATEGORY[input.field],
    detectedLabel: input.detectedLabel ?? null,
    inputType: input.inputType ?? "text",
    source: input.source,
    value: input.value,
    confidence: input.confidence ?? (input.source === "profile" || input.source === "userAnswer" ? 1 : 0.8),
    sensitivity,
    requiresUserReview: sensitivity !== "SAFE_AUTO_FILL",
    fillStatus:
      input.source === "unavailable" || !hasValue
        ? "unavailable"
        : "unfilled",
    required: input.required ?? false,
    ...(input.note ? { note: input.note } : {}),
  };
}

/* ── Builder ─────────────────────────────────────────────── */

export function buildExtensionApplicationPayload(
  job: AutomationJob,
  profile: CandidateProfile
): ExtensionApplicationPayload {
  const generatedAt = new Date().toISOString();
  const pkg = job.package;
  const userAnswers = job.userProvidedAnswers ?? [];

  /* ── Candidate (form-relevant facts only) ── */
  const nameSplit = splitFullName(profile.fullName);
  const candidateSection: ExtensionApplicationPayload["candidate"] = {
    identity: {
      fullName: profile.fullName,
      givenName: nameSplit.givenName,
      familyName: nameSplit.familyName,
    },
    contact: {
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
      country: profile.country,
    },
    professionalLinks: {
      linkedInUrl: profile.linkedIn,
      gitHubUrl: profile.gitHub,
      portfolioUrl: profile.portfolio,
    },
    location: {
      willingToRelocate: profile.willingToRelocate,
      remotePreference: profile.remotePreference,
    },
    education: profile.education.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      period: e.period,
    })),
    workExperience: profile.workExperience.map((w) => ({
      company: w.company,
      role: w.role,
      period: w.period,
    })),
    salaryAndAvailability: {
      expectedSalary: profile.salaryExpectation,
      noticePeriod: profile.noticePeriod,
      earliestStartDate: profile.earliestStartDate,
    },
    workAuthorization: {
      authorizationStatus: profile.workAuthorization,
      sponsorshipRequired: profile.visaSponsorshipRequired,
    },
  };

  /* ── Documents — stated honestly; no résumé file exists anywhere ── */
  const documents: ExtensionApplicationPayload["documents"] = {
    resumeFileAvailable: false,
    coverLetterFileAvailable: false,
    coverLetterTextAvailable: !!pkg?.coverLetter?.body,
  };

  /* ── Resolved answers (user overrides generated) ── */
  const resolvedMap = new Map<string, ExtensionApplicationPayload["resolvedAnswers"][number]>();
  for (const qa of pkg?.applicationAnswers ?? []) {
    if (!isValidAnswer(qa.answer)) continue;
    const id = missingInfoId(qa.question);
    resolvedMap.set(id, {
      id,
      question: qa.question,
      answer: qa.answer,
      source: "generated",
      confidence: answerConfidence(qa.confidence),
    });
  }
  for (const ua of userAnswers) {
    if (!isValidAnswer(ua.answer)) continue;
    const id = ua.id ?? missingInfoId(ua.question);
    resolvedMap.set(id, {
      id,
      question: ua.question,
      answer: ua.answer,
      source: "user",
      confidence: 1,
    });
  }
  const resolvedAnswers = [...resolvedMap.values()];

  /* ── Normalized field candidates ── */
  const normalizedFields: ApplicationFieldCandidate[] = [];

  // Identity + contact + links — safe profile facts
  normalizedFields.push(
    candidate({ field: "fullName", value: profile.fullName, source: "profile", required: true }),
    candidate({
      field: "givenName",
      value: nameSplit.givenName,
      source: "profile",
      required: true,
      ...(nameSplit.ambiguous
        ? { note: "Derived by splitting the full name — verify before use." }
        : {}),
    }),
    candidate({
      field: "familyName",
      value: nameSplit.familyName,
      source: "profile",
      required: true,
      ...(nameSplit.ambiguous
        ? { note: "Derived by splitting the full name — verify before use." }
        : {}),
    }),
    candidate({ field: "email", value: profile.email, source: "profile", required: true }),
    candidate({ field: "phone", value: profile.phone, source: "profile", required: true }),
    candidate({ field: "city", value: profile.city, source: "profile" }),
    candidate({ field: "country", value: profile.country, source: "profile" }),
    candidate({ field: "linkedInUrl", value: profile.linkedIn, source: "profile" }),
    candidate({ field: "gitHubUrl", value: profile.gitHub, source: "profile" }),
    candidate({ field: "portfolioUrl", value: profile.portfolio, source: "profile" })
  );

  // Location preferences — confirm before use
  normalizedFields.push(
    candidate({
      field: "willingToRelocate",
      value: profile.willingToRelocate,
      source: "profile",
      inputType: "checkbox",
    }),
    candidate({ field: "remotePreference", value: profile.remotePreference, source: "profile", inputType: "select" })
  );

  // Salary & availability — confirm every time; empty means "never provided"
  normalizedFields.push(
    candidate({ field: "expectedSalary", value: profile.salaryExpectation, source: "profile" }),
    candidate({ field: "noticePeriod", value: profile.noticePeriod, source: "profile" }),
    candidate({ field: "earliestStartDate", value: profile.earliestStartDate, source: "profile", inputType: "date" })
  );

  // Work authorization — values surfaced, but NEVER_AUTO_FILL by classifier
  normalizedFields.push(
    candidate({
      field: "authorizedInCountry",
      value: profile.workAuthorization,
      source: "profile",
      inputType: "select",
      note: "Stored value shown for reference only — must be answered manually on any real form.",
    }),
    candidate({
      field: "sponsorshipRequired",
      value: profile.visaSponsorshipRequired,
      source: "profile",
      inputType: "radio",
      note: "Stored value shown for reference only — must be answered manually on any real form.",
    })
  );

  // Education / experience — first entries as singular fill candidates
  const firstEdu = profile.education[0];
  if (firstEdu) {
    normalizedFields.push(
      candidate({ field: "institution", value: firstEdu.institution, source: "profile" }),
      candidate({ field: "degree", value: firstEdu.degree, source: "profile" })
    );
  }
  const firstExp = profile.workExperience[0];
  if (firstExp) {
    normalizedFields.push(
      candidate({ field: "currentCompany", value: firstExp.company, source: "profile" }),
      candidate({ field: "currentTitle", value: firstExp.role, source: "profile" })
    );
  }

  // Documents — honestly unavailable
  normalizedFields.push(
    candidate({
      field: "resumeFile",
      value: null,
      source: "unavailable",
      inputType: "file",
      note: "No résumé file exists in ApplyMate yet — attach your own file manually.",
    }),
    candidate({
      field: "coverLetterFile",
      value: null,
      source: "unavailable",
      inputType: "file",
      note: "Cover letter exists as text only — paste it, or attach your own file.",
    })
  );

  // Generated content
  if (pkg) {
    normalizedFields.push(
      candidate({
        field: "coverLetterBody",
        value: pkg.coverLetter.body,
        source: "generatedPackage",
        inputType: "textarea",
        confidence: 0.8,
      }),
      candidate({
        field: "recruiterMessage",
        value: pkg.recruiterMessage,
        source: "generatedPackage",
        inputType: "textarea",
        confidence: 0.8,
      })
    );
    for (const answer of resolvedAnswers) {
      normalizedFields.push(
        candidate({
          field: "customQuestionAnswer",
          value: answer.answer,
          source: answer.source === "user" ? "userAnswer" : "generatedPackage",
          inputType: "textarea",
          confidence: answer.confidence,
          detectedLabel: answer.question,
        })
      );
    }
  }

  /* ── Unresolved requirements ── */
  const blocking: UnresolvedRequirement[] = [];
  const manualSteps: UnresolvedRequirement[] = [];
  const warnings: string[] = [];

  const unresolvedMissing = getUnresolvedMissingInfo(job);
  for (const item of unresolvedMissing) {
    blocking.push({
      id: item.id,
      kind: "unanswered-required-question",
      description: `Required question not yet answered: ${item.question}`,
    });
  }

  // Generated answers the AI flagged as needs-user-input with no user override
  for (const qa of pkg?.applicationAnswers ?? []) {
    if (qa.confidence !== "needs-user-input") continue;
    const id = missingInfoId(qa.question);
    const resolvedByUser = resolvedAnswers.some((r) => r.id === id && r.source === "user");
    const alreadyBlocked = blocking.some((b) => b.id === id);
    if (!resolvedByUser && !alreadyBlocked) {
      blocking.push({
        id,
        kind: "low-confidence-answer-unresolved",
        description: `Answer needs your input: ${qa.question}`,
      });
    }
  }

  // Manual steps (honest, non-blocking for payload generation)
  manualSteps.push({
    id: "manual-resume-file",
    kind: "missing-resume-file",
    description: "No résumé file exists in ApplyMate — you will attach your own file on the form.",
  });
  manualSteps.push({
    id: "manual-work-authorization",
    kind: "manual-sensitive-action",
    description: "Work authorization and sponsorship questions must always be answered by you on the form.",
  });
  if (!profile.phone.trim()) {
    manualSteps.push({
      id: "manual-phone-missing",
      kind: "missing-profile-field",
      description: "Phone number is missing from your profile — most application forms require one.",
    });
  }

  if (job.isDemo) {
    warnings.push("Package content is demo fallback — add GEMINI_API_KEY for real AI generation.");
  }
  if (nameSplit.ambiguous) {
    warnings.push("Given/family name were derived by splitting the full name — verify before use.");
  }
  if (detectExpectedAts(job) === "unknown") {
    warnings.push("The target ATS could not be identified from this job's source.");
  }

  /* ── Readiness ── */
  let state: ExtensionReadinessState;
  const status = job.status;
  if (status === "CANCELLED" || status === "FAILED" || status === "SUBMITTED") {
    // SUBMITTED is unreachable today (no submission exists) — treated as
    // invalid defensively rather than pretending assistance applies.
    state = "INVALID_APPLICATION_STATE";
    blocking.push({
      id: "invalid-state",
      kind: "invalid-application-state",
      description: `Application is in state ${status} — form assistance does not apply.`,
    });
  } else if (!pkg) {
    state = "PACKAGE_NOT_READY";
    blocking.push({
      id: "package-not-generated",
      kind: "package-not-generated",
      description: "The application package has not been generated yet.",
    });
  } else if (blocking.length > 0) {
    state = "NEEDS_USER_INPUT";
  } else if (
    status === "PACKAGE_READY" ||
    status === "FORM_AUTOMATION_PENDING" ||
    status === "READY_TO_SUBMIT"
  ) {
    state = "READY_FOR_TEXT_FIELD_ASSISTANCE";
  } else {
    // Package exists but the pipeline hasn't settled (running/paused mid-flight).
    state = "PACKAGE_NOT_READY";
    warnings.push("Preparation has not finished — resume or wait for it to complete.");
  }

  return {
    metadata: {
      schemaVersion: EXTENSION_PAYLOAD_SCHEMA_VERSION,
      generatedAt,
      automationJobKey: job.key,
      jobTitle: job.role,
      company: job.company,
      applyUrl: job.applyUrl,
      provider: job.provider,
      sourceLabel: job.sourceLabel,
      expectedAts: detectExpectedAts(job),
      applicationState: job.status,
    },
    // job.key IS the authorization id (see contracts.ts doc comment) — no
    // separate authorization store. Placeholder values before the job is
    // actually authorized are informational only (e.g. the dev payload
    // preview); the extension is never sent a payload before authorization.
    authorization: {
      authorizationId: job.key,
      authorizedAction: "fill-and-submit",
      authorizedAt: job.authorizedAt ?? "",
      authorizedApplyUrl: job.authorizedApplyUrl ?? job.applyUrl ?? "",
    },
    candidate: candidateSection,
    documents,
    generatedPackage: pkg
      ? {
          coverLetterSubject: pkg.coverLetter.subject,
          coverLetterBody: pkg.coverLetter.body,
          recruiterMessage: pkg.recruiterMessage,
          applicationAnswers: pkg.applicationAnswers.map((a) => ({ ...a })),
          missingInformation: [...pkg.missingInformation],
          matchScore: pkg.matchScore,
          decision: pkg.decision,
          fitSummary: pkg.fitSummary,
          isDemo: job.isDemo,
        }
      : null,
    resolvedAnswers,
    normalizedFields,
    reusableAnswers: profile.reusableAnswers.map((a) => ({ ...a })),
    demographicPolicy: {
      policy: profile.demographicAnswerPolicy,
      answers: { ...profile.demographicAnswers },
    },
    preferences: { overwriteExistingValues: false },
    unresolvedRequirements: { blocking, manualSteps },
    readiness: {
      state,
      isReady: state === "READY_FOR_TEXT_FIELD_ASSISTANCE",
      blockingReasons: blocking.map((b) => b.description),
      manualSteps: manualSteps.map((m) => m.description),
      warnings,
    },
  };
}
