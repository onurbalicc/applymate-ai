import { test } from "node:test";
import assert from "node:assert/strict";
import { decideFieldAction } from "../src/execution/answer-resolver";
import { resolveFieldValue } from "../src/execution/value-resolver";
import { makeExecutionPayload, makeMappedField } from "./execution-fixtures";

/* ── SAFE_AUTO_FILL ───────────────────────────────────────── */

test("SAFE_AUTO_FILL field fills from a resolved profile value", () => {
  const payload = makeExecutionPayload();
  const field = makeMappedField({ id: "email", normalizedField: "email", label: "Email" });
  const decision = decideFieldAction(field, resolveFieldValue(field, payload), payload);
  assert.equal(decision.action, "fill");
});

test("unresolved optional SAFE_AUTO_FILL field is skipped, not blocked", () => {
  const payload = makeExecutionPayload();
  const field = makeMappedField({ id: "gh", normalizedField: "gitHubUrl", label: "GitHub", required: false });
  const decision = decideFieldAction(field, resolveFieldValue(field, payload), payload);
  assert.equal(decision.action, "skip-optional");
});

test("unresolved required SAFE_AUTO_FILL field blocks the application", () => {
  const payload = makeExecutionPayload();
  const field = makeMappedField({ id: "gh", normalizedField: "gitHubUrl", label: "GitHub", required: true });
  const decision = decideFieldAction(field, resolveFieldValue(field, payload), payload);
  assert.equal(decision.action, "block-required");
});

/* ── NEVER_AUTO_FILL — the safety-critical core ──────────── */

test("NEVER_AUTO_FILL field is refused even when value-resolver somehow found a value from an unsafe source", () => {
  const payload = makeExecutionPayload();
  const field = makeMappedField({ id: "auth", normalizedField: "authorizedInCountry", label: "Work authorization", required: true });
  // Simulate a hypothetical bug in value-resolver.ts that resolved this
  // from the candidate profile — answer-resolver.ts must refuse it anyway.
  const unsafeResolution = {
    resolved: true as const,
    value: "EU citizen",
    source: "candidate-profile" as const,
    confidence: "verified" as const,
    explanation: "should never be used for a NEVER_AUTO_FILL field",
  };
  const decision = decideFieldAction(field, unsafeResolution, payload);
  assert.equal(decision.action, "block-required");
});

test("NEVER_AUTO_FILL field fills from an explicit approved-answer for that exact question", () => {
  const payload = makeExecutionPayload({
    resolvedAnswers: [{ id: "mi-are-you-authorized-to-work-in-this-country", question: "Are you authorized to work in this country?", answer: "Yes", source: "user", confidence: 1 }],
  });
  const field = makeMappedField({ id: "auth", normalizedField: "authorizedInCountry", label: "Are you authorized to work in this country?", required: true });
  const decision = decideFieldAction(field, resolveFieldValue(field, payload), payload);
  assert.equal(decision.action, "fill");
  if (decision.action === "fill") assert.equal(decision.source, "approved-answer");
});

test("required NEVER_AUTO_FILL field with no explicit answer routes to block-required, never a guess", () => {
  const payload = makeExecutionPayload();
  const field = makeMappedField({ id: "sponsor", normalizedField: "sponsorshipRequired", label: "Do you require visa sponsorship?", required: true });
  const decision = decideFieldAction(field, resolveFieldValue(field, payload), payload);
  assert.equal(decision.action, "block-required");
});

test("optional NEVER_AUTO_FILL field with no explicit answer is left unanswered, not skipped silently as if resolved", () => {
  const payload = makeExecutionPayload();
  const field = makeMappedField({ id: "sponsor", normalizedField: "sponsorshipRequired", label: "Do you require visa sponsorship?", required: false });
  const decision = decideFieldAction(field, resolveFieldValue(field, payload), payload);
  assert.equal(decision.action, "skip-optional");
});

/* ── Demographic policy ──────────────────────────────────── */

test("demographic question with policy not-set routes to block-required when required", () => {
  const payload = makeExecutionPayload({ demographicPolicy: { policy: "not-set", answers: {} } });
  const field = makeMappedField({ id: "gender", normalizedField: "gender", label: "Gender", required: true, category: "demographicQuestions" });
  const decision = decideFieldAction(field, resolveFieldValue(field, payload), payload);
  assert.equal(decision.action, "block-required");
});

test("demographic question with 'decline' policy selects the ATS's own decline option", () => {
  const payload = makeExecutionPayload({ demographicPolicy: { policy: "decline", answers: {} } });
  const field = makeMappedField({
    id: "gender",
    normalizedField: "gender",
    label: "Gender",
    required: true,
    category: "demographicQuestions",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "decline", label: "Decline to self-identify" },
    ],
  });
  const decision = decideFieldAction(field, resolveFieldValue(field, payload), payload);
  assert.equal(decision.action, "fill");
  if (decision.action === "fill") {
    assert.equal(decision.value, "decline");
    assert.equal(decision.source, "demographic-policy");
  }
});

test("'decline' policy with no decline option on the ATS falls through to block-required, never picks a real answer instead", () => {
  const payload = makeExecutionPayload({ demographicPolicy: { policy: "decline", answers: {} } });
  const field = makeMappedField({
    id: "gender",
    normalizedField: "gender",
    label: "Gender",
    required: true,
    category: "demographicQuestions",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
    ],
  });
  const decision = decideFieldAction(field, resolveFieldValue(field, payload), payload);
  assert.equal(decision.action, "block-required");
});

test("'use-explicit-profile-answer' policy fills only the exact stored demographic key, never a related one", () => {
  const payload = makeExecutionPayload({
    demographicPolicy: { policy: "use-explicit-profile-answer", answers: { veteranStatus: "Not a veteran" } },
  });
  const genderField = makeMappedField({ id: "gender", normalizedField: "gender", label: "Gender", required: true, category: "demographicQuestions" });
  const genderDecision = decideFieldAction(genderField, resolveFieldValue(genderField, payload), payload);
  // No stored "gender" answer — must NOT borrow the veteranStatus value.
  assert.equal(genderDecision.action, "block-required");

  const veteranField = makeMappedField({ id: "vet", normalizedField: "veteranStatus", label: "Veteran status", required: true, category: "demographicQuestions" });
  const veteranDecision = decideFieldAction(veteranField, resolveFieldValue(veteranField, payload), payload);
  assert.equal(veteranDecision.action, "fill");
  if (veteranDecision.action === "fill") assert.equal(veteranDecision.value, "Not a veteran");
});

test("sexual orientation and transgender status fields are NEVER_AUTO_FILL and follow the same demographic policy gate", () => {
  const payload = makeExecutionPayload({ demographicPolicy: { policy: "not-set", answers: {} } });
  for (const normalizedField of ["sexualOrientation", "transgenderStatus"] as const) {
    const field = makeMappedField({ id: normalizedField, normalizedField, label: normalizedField, required: true, category: "demographicQuestions" });
    const decision = decideFieldAction(field, resolveFieldValue(field, payload), payload);
    assert.equal(decision.action, "block-required", `expected block-required for ${normalizedField}`);
  }
});

test("a legal attestation (NEVER_AUTO_FILL, not demographic) is never filled from a generated package answer", () => {
  const payload = makeExecutionPayload({
    resolvedAnswers: [{ id: "mi-i-certify-that-all-information-is-true-and-accurate", question: "I certify that all information is true and accurate", answer: "Yes", source: "generated", confidence: 0.9 }],
  });
  const field = makeMappedField({ id: "certify", normalizedField: "certifyTrueAndAccurate", label: "I certify that all information is true and accurate", required: true });
  const decision = decideFieldAction(field, resolveFieldValue(field, payload), payload);
  // resolveFieldValue would find the "generated" answer via the answer bank,
  // but answer-resolver.ts must refuse a generated source for NEVER_AUTO_FILL.
  assert.equal(decision.action, "block-required");
});
