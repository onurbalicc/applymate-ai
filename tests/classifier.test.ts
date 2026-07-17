import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifySensitivity,
  classifyLabel,
  guessNormalizedFieldFromLabel,
} from "../app/lib/application-fields/classifier";

/* ── Safe fields ─────────────────────────────────────────── */

test("objective profile facts classify as SAFE_AUTO_FILL", () => {
  assert.equal(classifySensitivity({ normalizedField: "email" }), "SAFE_AUTO_FILL");
  assert.equal(classifySensitivity({ normalizedField: "givenName" }), "SAFE_AUTO_FILL");
  assert.equal(classifySensitivity({ normalizedField: "phone" }), "SAFE_AUTO_FILL");
  assert.equal(classifySensitivity({ normalizedField: "linkedInUrl" }), "SAFE_AUTO_FILL");
  assert.equal(classifySensitivity({ normalizedField: "institution" }), "SAFE_AUTO_FILL");
  assert.equal(classifySensitivity({ normalizedField: "currentCompany" }), "SAFE_AUTO_FILL");
});

test("safe label patterns classify raw labels as SAFE_AUTO_FILL", () => {
  assert.equal(classifyLabel("First Name"), "SAFE_AUTO_FILL");
  assert.equal(classifyLabel("Email address"), "SAFE_AUTO_FILL");
  assert.equal(classifyLabel("LinkedIn profile URL"), "SAFE_AUTO_FILL");
});

/* ── Needs-confirmation fields ───────────────────────────── */

test("high-stakes but known values classify as NEEDS_CONFIRMATION", () => {
  assert.equal(classifySensitivity({ normalizedField: "expectedSalary" }), "NEEDS_CONFIRMATION");
  assert.equal(classifySensitivity({ normalizedField: "noticePeriod" }), "NEEDS_CONFIRMATION");
  assert.equal(classifySensitivity({ normalizedField: "earliestStartDate" }), "NEEDS_CONFIRMATION");
  assert.equal(classifySensitivity({ normalizedField: "willingToRelocate" }), "NEEDS_CONFIRMATION");
  assert.equal(classifySensitivity({ normalizedField: "coverLetterBody" }), "NEEDS_CONFIRMATION");
  assert.equal(classifySensitivity({ normalizedField: "customQuestionAnswer" }), "NEEDS_CONFIRMATION");
});

test("unknown/ambiguous labels default to NEEDS_CONFIRMATION, never SAFE", () => {
  assert.equal(classifyLabel("Favorite programming paradigm?"), "NEEDS_CONFIRMATION");
  assert.equal(classifyLabel("How did you hear about us?"), "NEEDS_CONFIRMATION");
  assert.equal(classifySensitivity({ label: "Tell us something interesting" }), "NEEDS_CONFIRMATION");
  assert.equal(classifySensitivity({}), "NEEDS_CONFIRMATION");
});

/* ── Never-auto-fill fields ──────────────────────────────── */

test("work authorization is NEVER_AUTO_FILL even though profile stores a value", () => {
  assert.equal(classifySensitivity({ normalizedField: "authorizedInCountry" }), "NEVER_AUTO_FILL");
  assert.equal(classifySensitivity({ normalizedField: "sponsorshipRequired" }), "NEVER_AUTO_FILL");
  assert.equal(classifySensitivity({ normalizedField: "visaStatus" }), "NEVER_AUTO_FILL");
});

test("demographic and legal fields are NEVER_AUTO_FILL", () => {
  for (const field of [
    "criminalHistory",
    "gender",
    "raceOrEthnicity",
    "veteranStatus",
    "disabilityStatus",
    "certifyTrueAndAccurate",
    "consentToDataProcessing",
    "backgroundCheckConsent",
    "captcha",
    "preferredPronouns",
  ] as const) {
    assert.equal(classifySensitivity({ normalizedField: field }), "NEVER_AUTO_FILL", field);
  }
});

test("risky raw labels classify as NEVER_AUTO_FILL", () => {
  assert.equal(classifyLabel("Are you authorized to work in the United States?"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("Will you require visa sponsorship?"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("Do you have a work permit?"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("Have you ever been convicted of a felony?"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("Gender identity"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("Race/Ethnicity (voluntary)"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("Veteran status"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("Disability self-identification"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("I certify that the information above is true and accurate"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("I consent to the processing of my personal data"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("Background check authorization"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("Complete the CAPTCHA to continue"), "NEVER_AUTO_FILL");
  assert.equal(classifyLabel("Human verification required"), "NEVER_AUTO_FILL");
});

/* ── Escalation: labels can raise severity, never lower it ── */

test("risky label escalates a known field to NEVER_AUTO_FILL", () => {
  assert.equal(
    classifySensitivity({ normalizedField: "customQuestionAnswer", label: "Current visa status?" }),
    "NEVER_AUTO_FILL"
  );
  assert.equal(
    classifySensitivity({ normalizedField: "fullName", label: "Full name (I certify this is accurate)" }),
    "NEVER_AUTO_FILL"
  );
});

test("safe-looking label never downgrades a sensitive field", () => {
  assert.equal(
    classifySensitivity({ normalizedField: "authorizedInCountry", label: "First name" }),
    "NEVER_AUTO_FILL"
  );
});

/* ── Label → normalized field guessing ───────────────────── */

test("guessNormalizedFieldFromLabel maps common questions", () => {
  assert.equal(guessNormalizedFieldFromLabel("Do you require sponsorship?"), "sponsorshipRequired");
  assert.equal(guessNormalizedFieldFromLabel("Work authorization status for this location"), "authorizedInCountry");
  assert.equal(guessNormalizedFieldFromLabel("Salary expectation (if required)"), "expectedSalary");
  assert.equal(guessNormalizedFieldFromLabel("What is your notice period?"), "noticePeriod");
  assert.equal(guessNormalizedFieldFromLabel("Something entirely unrelated"), null);
});
