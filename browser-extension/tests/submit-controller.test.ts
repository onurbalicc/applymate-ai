import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture } from "./test-utils";
import { attemptSubmit, findSubmitControl, detectCaptcha, pageMatchesAuthorization } from "../src/execution/submit-controller";
import type { FormReadinessResult } from "../src/execution/execution-types";

const READY: FormReadinessResult = { ready: true, unresolvedRequired: [], validationErrors: [], optionalUnanswered: [] };
const NOT_READY: FormReadinessResult = { ready: false, unresolvedRequired: [{ fieldId: "x", label: "X", reason: "missing" }], validationErrors: [], optionalUnanswered: [] };

test("findSubmitControl identifies the form's own submit button", () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const root = document.getElementById("application_form")!;
  const control = findSubmitControl(root);
  assert.equal(control?.id, "submit_btn");
});

test("dry run identifies the control but never clicks it", () => {
  const { document, location } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const root = document.getElementById("application_form")!;
  let clicked = false;
  document.getElementById("submit_btn")!.addEventListener("click", () => { clicked = true; });

  const result = attemptSubmit({
    root,
    doc: document,
    location: location as unknown as Location,
    authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123",
    readiness: READY,
    attempt: { attemptId: "a1", authorizationId: "job-1", authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123", attemptedAt: "" },
    previousAttempts: [],
    dryRun: true,
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.wouldClick, true);
  assert.equal(result.submitControlFound, true);
  assert.equal(clicked, false, "dry run must never actually click the submit control");
});

test("a real (non-dry-run) submit against a ready form clicks the control", () => {
  const { document, location } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const root = document.getElementById("application_form")!;
  let clicked = false;
  document.getElementById("submit_btn")!.addEventListener("click", () => { clicked = true; });

  const result = attemptSubmit({
    root,
    doc: document,
    location: location as unknown as Location,
    authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123",
    readiness: READY,
    attempt: { attemptId: "a1", authorizationId: "job-1", authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123", attemptedAt: "" },
    previousAttempts: [],
    dryRun: false,
  });

  assert.equal(result.outcome, "submitted");
  assert.equal(clicked, true);
});

test("refuses to submit when the form is not ready", () => {
  const { document, location } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const root = document.getElementById("application_form")!;
  const result = attemptSubmit({
    root, doc: document, location: location as unknown as Location,
    authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123",
    readiness: NOT_READY,
    attempt: { attemptId: "a1", authorizationId: "job-1", authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123", attemptedAt: "" },
    previousAttempts: [],
    dryRun: false,
  });
  assert.equal(result.outcome, "blocked");
  assert.match(result.reason ?? "", /not ready/i);
});

test("refuses a duplicate submission attempt with a reused idempotency key", () => {
  const { document, location } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const root = document.getElementById("application_form")!;
  const result = attemptSubmit({
    root, doc: document, location: location as unknown as Location,
    authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123",
    readiness: READY,
    attempt: { attemptId: "already-used", authorizationId: "job-1", authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123", attemptedAt: "" },
    previousAttempts: [{ attemptId: "already-used", authorizationId: "job-1", authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123", attemptedAt: "" }],
    dryRun: false,
  });
  assert.equal(result.outcome, "blocked");
  assert.match(result.reason ?? "", /duplicate/i);
});

test("refuses to submit when the live page doesn't match the authorized URL", () => {
  const { document, location } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const root = document.getElementById("application_form")!;
  const result = attemptSubmit({
    root, doc: document, location: location as unknown as Location,
    authorizedApplyUrl: "https://boards.greenhouse.io/othercompany/jobs/999",
    readiness: READY,
    attempt: { attemptId: "a1", authorizationId: "job-1", authorizedApplyUrl: "https://boards.greenhouse.io/othercompany/jobs/999", attemptedAt: "" },
    previousAttempts: [],
    dryRun: false,
  });
  assert.equal(result.outcome, "blocked");
  assert.match(result.reason ?? "", /does not match/i);
});

test("refuses to submit when a CAPTCHA is present, even if the form is otherwise ready", () => {
  const { document, location } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const captchaDiv = document.createElement("div");
  captchaDiv.className = "g-recaptcha";
  document.body.appendChild(captchaDiv);
  const root = document.getElementById("application_form")!;

  assert.equal(detectCaptcha(document), true);

  const result = attemptSubmit({
    root, doc: document, location: location as unknown as Location,
    authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123",
    readiness: READY,
    attempt: { attemptId: "a1", authorizationId: "job-1", authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123", attemptedAt: "" },
    previousAttempts: [],
    dryRun: false,
  });
  assert.equal(result.outcome, "blocked");
  assert.match(result.reason ?? "", /captcha/i);
});

test("pageMatchesAuthorization ignores query-string differences but requires the same origin+path", () => {
  const loc = { origin: "https://boards.greenhouse.io", pathname: "/testco/jobs/123" } as Location;
  assert.equal(pageMatchesAuthorization(loc, "https://boards.greenhouse.io/testco/jobs/123?ref=email"), true);
  assert.equal(pageMatchesAuthorization(loc, "https://boards.greenhouse.io/othercompany/jobs/999"), false);
});
