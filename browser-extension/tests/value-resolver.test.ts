import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveFieldValue } from "../src/execution/value-resolver";
import { makeExecutionPayload, makeMappedField } from "./execution-fixtures";

test("resolves a SAFE_AUTO_FILL field directly from the verified candidate profile", () => {
  const payload = makeExecutionPayload();
  const field = makeMappedField({ id: "email", normalizedField: "email", label: "Email" });
  const resolution = resolveFieldValue(field, payload);
  assert.equal(resolution.resolved, true);
  if (resolution.resolved) {
    assert.equal(resolution.value, "test@example.com");
    assert.equal(resolution.source, "candidate-profile");
    assert.equal(resolution.confidence, "verified");
  }
});

test("derives fullName from given + family name when not stored directly", () => {
  const payload = makeExecutionPayload({
    candidate: {
      identity: { fullName: "", givenName: "Ada", familyName: "Lovelace" },
      contact: { email: "", phone: "", city: "", country: "" },
      professionalLinks: { linkedInUrl: "", gitHubUrl: "", portfolioUrl: "" },
      location: { willingToRelocate: false, remotePreference: "" },
      education: [],
      workExperience: [],
      salaryAndAvailability: { expectedSalary: "", noticePeriod: "", earliestStartDate: "" },
      workAuthorization: { authorizationStatus: "", sponsorshipRequired: false },
    },
  });
  const field = makeMappedField({ id: "full_name", normalizedField: "fullName", label: "Full name" });
  const resolution = resolveFieldValue(field, payload);
  assert.equal(resolution.resolved, true);
  if (resolution.resolved) {
    assert.equal(resolution.value, "Ada Lovelace");
    assert.equal(resolution.source, "derived");
  }
});

test("an explicit per-job approved answer outranks everything else, even a profile value", () => {
  const payload = makeExecutionPayload({
    resolvedAnswers: [{ id: "mi-notice-period", question: "Notice period", answer: "Two weeks — my own words", source: "user", confidence: 1 }],
    candidate: {
      identity: { fullName: "T", givenName: "T", familyName: "" },
      contact: { email: "", phone: "", city: "", country: "" },
      professionalLinks: { linkedInUrl: "", gitHubUrl: "", portfolioUrl: "" },
      location: { willingToRelocate: false, remotePreference: "" },
      education: [],
      workExperience: [],
      salaryAndAvailability: { expectedSalary: "", noticePeriod: "Immediately (from profile)", earliestStartDate: "" },
      workAuthorization: { authorizationStatus: "", sponsorshipRequired: false },
    },
  });
  const field = makeMappedField({ id: "notice", normalizedField: "noticePeriod", label: "Notice period" });
  const resolution = resolveFieldValue(field, payload);
  assert.equal(resolution.resolved, true);
  if (resolution.resolved) {
    assert.equal(resolution.value, "Two weeks — my own words");
    assert.equal(resolution.source, "approved-answer");
  }
});

test("falls back to a reusable answer bank entry when no per-job answer or profile value exists", () => {
  const payload = makeExecutionPayload({
    reusableAnswers: [{ questionKey: "mi-why-do-you-want-this-role", question: "Why do you want this role?", answer: "Because of the mission.", approvedAt: "2026-06-01T00:00:00.000Z" }],
  });
  const field = makeMappedField({ id: "q1", label: "Why do you want this role?", normalizedField: null });
  const resolution = resolveFieldValue(field, payload);
  assert.equal(resolution.resolved, true);
  if (resolution.resolved) {
    assert.equal(resolution.value, "Because of the mission.");
    assert.equal(resolution.source, "reusable-answer");
  }
});

test("falls back to a generated application-package answer as the last resort before unresolved", () => {
  const payload = makeExecutionPayload({
    resolvedAnswers: [{ id: "mi-tell-us-about-a-project", question: "Tell us about a project", answer: "Built a data pipeline.", source: "generated", confidence: 0.8 }],
  });
  const field = makeMappedField({ id: "q2", label: "Tell us about a project", normalizedField: null });
  const resolution = resolveFieldValue(field, payload);
  assert.equal(resolution.resolved, true);
  if (resolution.resolved) {
    assert.equal(resolution.source, "application-package");
    assert.equal(resolution.confidence, "generated");
  }
});

test("never fabricates a value — unresolved when nothing matches any source", () => {
  const payload = makeExecutionPayload();
  const field = makeMappedField({ id: "q3", label: "What is your favorite programming paradigm?", normalizedField: null });
  const resolution = resolveFieldValue(field, payload);
  assert.equal(resolution.resolved, false);
});

test("work authorization is never resolved from the candidate profile directly, even though the profile has a stored value", () => {
  const payload = makeExecutionPayload({
    candidate: {
      identity: { fullName: "T", givenName: "T", familyName: "" },
      contact: { email: "", phone: "", city: "", country: "" },
      professionalLinks: { linkedInUrl: "", gitHubUrl: "", portfolioUrl: "" },
      location: { willingToRelocate: false, remotePreference: "" },
      education: [],
      workExperience: [],
      salaryAndAvailability: { expectedSalary: "", noticePeriod: "", earliestStartDate: "" },
      workAuthorization: { authorizationStatus: "EU citizen", sponsorshipRequired: false },
    },
  });
  const field = makeMappedField({ id: "auth", normalizedField: "authorizedInCountry", label: "Are you authorized to work in this country?" });
  const resolution = resolveFieldValue(field, payload);
  // Must NOT resolve from candidate.workAuthorization.authorizationStatus —
  // value-resolver.ts deliberately has no case for authorizedInCountry.
  assert.equal(resolution.resolved, false);
});
