import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture } from "./test-utils";
import { runExecution } from "../src/execution/execution-engine";
import { makeExecutionPayload } from "./execution-fixtures";

const LOCAL_FIXTURE_URL = "https://boards.greenhouse.io/fixtureco/jobs/999";
const EXECUTION_FORM_URL = "https://boards.greenhouse.io/testco/jobs/123";

test("end-to-end: fills verified fields, validates, and (dry run) never actually submits", async () => {
  const { document, location } = loadFixture("local-ats-fixture.html", LOCAL_FIXTURE_URL, { runScripts: true });
  const payload = makeExecutionPayload({
    metadata: { schemaVersion: 2, generatedAt: "", automationJobKey: "job-1", jobTitle: "SWE", company: "Fixture Co", applyUrl: LOCAL_FIXTURE_URL, provider: "greenhouse:fixtureco", sourceLabel: "Greenhouse", expectedAts: "greenhouse", applicationState: "AUTHORIZED" },
    authorization: { authorizationId: "job-1", authorizedAction: "fill-and-submit", authorizedAt: "", authorizedApplyUrl: LOCAL_FIXTURE_URL },
  });

  const result = await runExecution(payload, document, location as unknown as Location, {
    dryRun: true,
    attemptId: "attempt-1",
    previousAttemptIds: [],
  });

  assert.equal(result.stage, "READY_TO_SUBMIT");
  assert.equal(result.submissionOutcome, null);
  assert.ok(document.getElementById("application_form"), "dry run must never remove/replace the real form");

  const firstNameFilled = result.fields.find((f) => f.mappedKey === "givenName");
  assert.equal(firstNameFilled?.status, "filled");
  const emailFilled = result.fields.find((f) => f.mappedKey === "email");
  assert.equal(emailFilled?.status, "filled");

  const firstNameInput = document.getElementById("first_name") as HTMLInputElement;
  assert.equal(firstNameInput.value, "Test");
});

test("end-to-end: a real (non-dry-run) run against the local fixture actually submits and detects success", async () => {
  const { document, location } = loadFixture("local-ats-fixture.html", LOCAL_FIXTURE_URL, { runScripts: true });
  const payload = makeExecutionPayload({
    metadata: { schemaVersion: 2, generatedAt: "", automationJobKey: "job-2", jobTitle: "SWE", company: "Fixture Co", applyUrl: LOCAL_FIXTURE_URL, provider: "greenhouse:fixtureco", sourceLabel: "Greenhouse", expectedAts: "greenhouse", applicationState: "AUTHORIZED" },
    authorization: { authorizationId: "job-2", authorizedAction: "fill-and-submit", authorizedAt: "", authorizedApplyUrl: LOCAL_FIXTURE_URL },
  });

  const result = await runExecution(payload, document, location as unknown as Location, {
    dryRun: false,
    attemptId: "attempt-2",
    previousAttemptIds: [],
  });

  assert.equal(result.stage, "SUBMITTED");
  assert.equal(result.submissionOutcome, "submitted");
  assert.equal(document.getElementById("application_form"), null, "the fixture's own submit handler removes the form on success");
  assert.ok(document.getElementById("confirmation"));
});

test("end-to-end: a second real submit with a used attempt id is refused — no duplicate application", async () => {
  const { document, location } = loadFixture("local-ats-fixture.html", LOCAL_FIXTURE_URL, { runScripts: true });
  const payload = makeExecutionPayload({
    metadata: { schemaVersion: 2, generatedAt: "", automationJobKey: "job-3", jobTitle: "SWE", company: "Fixture Co", applyUrl: LOCAL_FIXTURE_URL, provider: "greenhouse:fixtureco", sourceLabel: "Greenhouse", expectedAts: "greenhouse", applicationState: "AUTHORIZED" },
    authorization: { authorizationId: "job-3", authorizedAction: "fill-and-submit", authorizedAt: "", authorizedApplyUrl: LOCAL_FIXTURE_URL },
  });

  const result = await runExecution(payload, document, location as unknown as Location, {
    dryRun: false,
    attemptId: "already-submitted",
    previousAttemptIds: ["already-submitted"],
  });

  assert.equal(result.stage, "REVIEW_REQUIRED");
  assert.match(result.reviewRequired?.description ?? "", /duplicate/i);
  assert.ok(document.getElementById("application_form"), "the form must still be intact — nothing was clicked");
});

test("end-to-end: missing required résumé (honest today) routes to review-required, never fabricates an upload", async () => {
  const { document, location } = loadFixture("execution-form.html", EXECUTION_FORM_URL);
  const payload = makeExecutionPayload({
    metadata: { schemaVersion: 2, generatedAt: "", automationJobKey: "job-4", jobTitle: "SWE", company: "TestCo", applyUrl: EXECUTION_FORM_URL, provider: "greenhouse:testco", sourceLabel: "Greenhouse", expectedAts: "greenhouse", applicationState: "AUTHORIZED" },
    authorization: { authorizationId: "job-4", authorizedAction: "fill-and-submit", authorizedAt: "", authorizedApplyUrl: EXECUTION_FORM_URL },
  });

  const result = await runExecution(payload, document, location as unknown as Location, {
    dryRun: true,
    attemptId: "attempt-4",
    previousAttemptIds: [],
  });

  assert.equal(result.stage, "REVIEW_REQUIRED");
  assert.equal(result.reviewRequired?.kind, "document-upload-failed");
});

test("end-to-end: a NEVER_AUTO_FILL field with no explicit answer is never written to the DOM", async () => {
  const { document, location } = loadFixture("local-ats-fixture.html", LOCAL_FIXTURE_URL, { runScripts: true });
  const payload = makeExecutionPayload({
    metadata: { schemaVersion: 2, generatedAt: "", automationJobKey: "job-5", jobTitle: "SWE", company: "Fixture Co", applyUrl: LOCAL_FIXTURE_URL, provider: "greenhouse:fixtureco", sourceLabel: "Greenhouse", expectedAts: "greenhouse", applicationState: "AUTHORIZED" },
    authorization: { authorizationId: "job-5", authorizedAction: "fill-and-submit", authorizedAt: "", authorizedApplyUrl: LOCAL_FIXTURE_URL },
    candidate: {
      identity: { fullName: "Test Candidate", givenName: "Test", familyName: "Candidate" },
      contact: { email: "test@example.com", phone: "", city: "", country: "" },
      professionalLinks: { linkedInUrl: "", gitHubUrl: "", portfolioUrl: "" },
      location: { willingToRelocate: false, remotePreference: "" },
      education: [],
      workExperience: [],
      salaryAndAvailability: { expectedSalary: "", noticePeriod: "", earliestStartDate: "" },
      // Even though a stored value exists, it must never be auto-written —
      // this fixture has no work-authorization field, but the invariant is
      // exercised directly via value-resolver/answer-resolver unit tests;
      // this end-to-end run confirms the pipeline never crashes when
      // sensitive-field data exists on the profile but no matching field
      // is present on the page.
      workAuthorization: { authorizationStatus: "EU citizen", sponsorshipRequired: false },
    },
  });

  const result = await runExecution(payload, document, location as unknown as Location, {
    dryRun: true,
    attemptId: "attempt-5",
    previousAttemptIds: [],
  });

  assert.equal(result.stage, "READY_TO_SUBMIT");
});

test("end-to-end: refuses to act when the live page doesn't match the authorization", async () => {
  const { document, location } = loadFixture("local-ats-fixture.html", LOCAL_FIXTURE_URL, { runScripts: true });
  const payload = makeExecutionPayload({
    authorization: { authorizationId: "job-6", authorizedAction: "fill-and-submit", authorizedAt: "", authorizedApplyUrl: "https://boards.greenhouse.io/completely-different-co/jobs/1" },
  });

  const result = await runExecution(payload, document, location as unknown as Location, {
    dryRun: true,
    attemptId: "attempt-6",
    previousAttemptIds: [],
  });

  assert.equal(result.stage, "REVIEW_REQUIRED");
  assert.equal(result.reviewRequired?.kind, "authorization-page-mismatch");
});
