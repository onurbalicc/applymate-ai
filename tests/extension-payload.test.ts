import { test } from "node:test";
import assert from "node:assert/strict";
import { buildExtensionApplicationPayload } from "../app/lib/extension-payload/builder";
import type { ApplicationPackage, CandidateProfile } from "../app/lib/ai/contracts";
import type { AutomationJob } from "../app/lib/automation/contracts";

/* ── Fixtures ────────────────────────────────────────────── */

function makeProfile(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    fullName: "Test Candidate",
    email: "test@example.com",
    phone: "+49 123 456789",
    city: "Berlin",
    country: "Germany",
    linkedIn: "https://linkedin.com/in/test",
    gitHub: "",
    portfolio: "",
    headline: "Test Headline",
    professionalSummary: "Test summary.",
    workExperience: [
      { id: "exp-1", role: "Analyst", company: "TestCorp", period: "2022–2024", bullets: ["Did things"] },
    ],
    education: [
      { id: "edu-1", degree: "B.Sc. Testing", institution: "Test University", period: "2018–2022" },
    ],
    projects: [],
    technicalSkills: ["Python"],
    languages: [{ language: "English", level: "C1" }],
    certifications: [],
    targetJobTitles: ["Analyst"],
    preferredLocations: ["Germany"],
    remotePreference: "hybrid",
    employmentTypes: ["Junior"],
    salaryExpectation: "",
    noticePeriod: "Immediately",
    earliestStartDate: "",
    workAuthorization: "EU citizen",
    visaSponsorshipRequired: false,
    willingToRelocate: false,
    preferredApplicationLanguage: "English",
    excludedKeywords: [],
    minMatchScore: 60,
    whyInterestedInRoleTemplate: "",
    availabilityNote: "",
    ...overrides,
  };
}

function makePackage(overrides: Partial<ApplicationPackage> = {}): ApplicationPackage {
  return {
    matchScore: 80,
    decision: "Possible fit",
    fitSummary: "Fits reasonably.",
    strengths: ["Python"],
    gaps: [],
    risks: [],
    cvAdaptation: {
      headline: "Adapted headline",
      summary: "Adapted summary",
      skillsToPrioritize: ["Python"],
      bulletSuggestions: [],
      keywords: ["Python"],
    },
    coverLetter: { subject: "Application — Analyst", body: "Dear team, ..." },
    recruiterMessage: "Hi, I'm interested.",
    applicationAnswers: [],
    missingInformation: [],
    recommendedNextStep: "Review and apply.",
    ...overrides,
  };
}

function makeJob(overrides: Partial<AutomationJob> = {}): AutomationJob {
  return {
    id: "auto-test-1",
    key: "greenhouse:testco:123",
    sourceJobId: "greenhouse:testco:123",
    isFromDiscovery: true,
    role: "Analyst",
    company: "TestCo",
    jobDescription: "A job description.",
    applyUrl: "https://boards.greenhouse.io/testco/jobs/123",
    provider: "greenhouse:testco",
    sourceLabel: "Greenhouse — TestCo",
    status: "FORM_AUTOMATION_PENDING",
    currentStep: "FORM_AUTOMATION_PENDING",
    progress: 100,
    startedAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:05:00.000Z",
    isDemo: false,
    requiresUserInput: false,
    missingInformation: [],
    userProvidedAnswers: [],
    error: null,
    package: makePackage(),
    ...overrides,
  };
}

/* ── Readiness states ────────────────────────────────────── */

test("complete job with no unresolved items → READY_FOR_TEXT_FIELD_ASSISTANCE", () => {
  const payload = buildExtensionApplicationPayload(makeJob(), makeProfile());
  assert.equal(payload.readiness.state, "READY_FOR_TEXT_FIELD_ASSISTANCE");
  assert.equal(payload.readiness.isReady, true);
  assert.equal(payload.readiness.blockingReasons.length, 0);
});

test("résumé file absence is a manual step, not a blocker — and stated honestly", () => {
  const payload = buildExtensionApplicationPayload(makeJob(), makeProfile());
  assert.equal(payload.documents.resumeFileAvailable, false);
  assert.equal(payload.documents.coverLetterFileAvailable, false);
  assert.equal(payload.documents.coverLetterTextAvailable, true);
  assert.ok(payload.readiness.manualSteps.some((s) => s.toLowerCase().includes("résumé") || s.toLowerCase().includes("resume")));
  assert.equal(payload.readiness.isReady, true); // still ready — manual step only
});

test("unanswered required questions → NEEDS_USER_INPUT with exact blockers", () => {
  const job = makeJob({
    status: "NEEDS_USER_INPUT",
    missingInformation: ["Work authorization status for this location", "Salary expectation"],
    package: makePackage({ missingInformation: ["Work authorization status for this location", "Salary expectation"] }),
  });
  const payload = buildExtensionApplicationPayload(job, makeProfile());
  assert.equal(payload.readiness.state, "NEEDS_USER_INPUT");
  assert.equal(payload.readiness.isReady, false);
  assert.equal(
    payload.unresolvedRequirements.blocking.filter((b) => b.kind === "unanswered-required-question").length,
    2
  );
});

test("no package → PACKAGE_NOT_READY", () => {
  const job = makeJob({ status: "PREPARING_MASTER_CV", package: null, progress: 30 });
  const payload = buildExtensionApplicationPayload(job, makeProfile());
  assert.equal(payload.readiness.state, "PACKAGE_NOT_READY");
  assert.equal(payload.readiness.isReady, false);
  assert.equal(payload.generatedPackage, null);
});

test("cancelled job → INVALID_APPLICATION_STATE", () => {
  const payload = buildExtensionApplicationPayload(makeJob({ status: "CANCELLED" }), makeProfile());
  assert.equal(payload.readiness.state, "INVALID_APPLICATION_STATE");
  assert.equal(payload.readiness.isReady, false);
});

/* ── Answer precedence ───────────────────────────────────── */

test("user-provided answer overrides generated answer for the same question", () => {
  const question = "Why do you want this role?";
  const pkg = makePackage({
    applicationAnswers: [{ question, answer: "generated text", confidence: "medium" }],
  });
  const job = makeJob({
    package: pkg,
    userProvidedAnswers: [{ question, answer: "my own words" }],
  });
  const payload = buildExtensionApplicationPayload(job, makeProfile());

  const resolved = payload.resolvedAnswers.find((a) => a.question === question);
  assert.ok(resolved);
  assert.equal(resolved.answer, "my own words");
  assert.equal(resolved.source, "user");
  assert.equal(resolved.confidence, 1);

  // Original package must not be mutated by the merge.
  assert.equal(pkg.applicationAnswers[0].answer, "generated text");
});

test("needs-user-input generated answer without a user override is blocking", () => {
  const job = makeJob({
    package: makePackage({
      applicationAnswers: [{ question: "Visa status?", answer: "", confidence: "needs-user-input" }],
    }),
  });
  const payload = buildExtensionApplicationPayload(job, makeProfile());
  assert.equal(payload.readiness.state, "NEEDS_USER_INPUT");
  assert.ok(
    payload.unresolvedRequirements.blocking.some((b) => b.kind === "low-confidence-answer-unresolved")
  );
});

/* ── Sensitivity in candidates ───────────────────────────── */

test("work-authorization candidates are NEVER_AUTO_FILL even with stored profile values", () => {
  const payload = buildExtensionApplicationPayload(makeJob(), makeProfile({ workAuthorization: "EU citizen" }));
  const auth = payload.normalizedFields.find((f) => f.normalizedField === "authorizedInCountry");
  assert.ok(auth);
  assert.equal(auth.sensitivity, "NEVER_AUTO_FILL");
  assert.equal(auth.requiresUserReview, true);
  assert.equal(auth.value, "EU citizen"); // value surfaced, action still manual
});

test("identity/contact candidates are SAFE_AUTO_FILL; documents are unavailable", () => {
  const payload = buildExtensionApplicationPayload(makeJob(), makeProfile());
  const email = payload.normalizedFields.find((f) => f.normalizedField === "email");
  assert.equal(email?.sensitivity, "SAFE_AUTO_FILL");
  const resume = payload.normalizedFields.find((f) => f.normalizedField === "resumeFile");
  assert.equal(resume?.fillStatus, "unavailable");
  assert.equal(resume?.source, "unavailable");
});

/* ── Backward compatibility & profile gaps ───────────────── */

test("legacy user answers without ids still resolve and merge into the payload", () => {
  const question = "Salary expectation";
  const job = makeJob({
    missingInformation: [],
    package: makePackage({ missingInformation: [question] }),
    userProvidedAnswers: [{ question, answer: "€45k" }], // no id — legacy shape
  });
  const payload = buildExtensionApplicationPayload(job, makeProfile());
  assert.equal(payload.readiness.state, "READY_FOR_TEXT_FIELD_ASSISTANCE");
  const resolved = payload.resolvedAnswers.find((a) => a.question === question);
  assert.equal(resolved?.answer, "€45k");
  assert.equal(resolved?.source, "user");
});

test("missing phone number becomes an honest manual step", () => {
  const payload = buildExtensionApplicationPayload(makeJob(), makeProfile({ phone: "" }));
  assert.ok(payload.readiness.manualSteps.some((s) => s.toLowerCase().includes("phone")));
});

test("demo package produces a demo warning; ATS is detected from provider", () => {
  const payload = buildExtensionApplicationPayload(makeJob({ isDemo: true }), makeProfile());
  assert.ok(payload.readiness.warnings.some((w) => w.toLowerCase().includes("demo")));
  assert.equal(payload.metadata.expectedAts, "greenhouse");
});
