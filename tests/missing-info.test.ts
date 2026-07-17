import { test } from "node:test";
import assert from "node:assert/strict";
import {
  missingInfoId,
  getUnresolvedMissingInfo,
  mergeProvidedAnswers,
  isValidAnswer,
} from "../app/lib/automation/missing-info";

const Q_AUTH = "Work authorization status for this location";
const Q_SALARY = "Salary expectation (if required by the application form)";

/* ── Answer validity ─────────────────────────────────────── */

test("whitespace-only answers are invalid", () => {
  assert.equal(isValidAnswer("   "), false);
  assert.equal(isValidAnswer("\t\n"), false);
  assert.equal(isValidAnswer(""), false);
  assert.equal(isValidAnswer(null), false);
  assert.equal(isValidAnswer(undefined), false);
  assert.equal(isValidAnswer("EU citizen"), true);
});

/* ── Resolution logic ────────────────────────────────────── */

test("all items answered → nothing unresolved", () => {
  const unresolved = getUnresolvedMissingInfo({
    missingInformation: [Q_AUTH, Q_SALARY],
    userProvidedAnswers: [
      { question: Q_AUTH, answer: "EU citizen" },
      { question: Q_SALARY, answer: "€45k" },
    ],
  });
  assert.equal(unresolved.length, 0);
});

test("one unanswered item → exactly that item is returned", () => {
  const unresolved = getUnresolvedMissingInfo({
    missingInformation: [Q_AUTH, Q_SALARY],
    userProvidedAnswers: [{ question: Q_AUTH, answer: "EU citizen" }],
  });
  assert.equal(unresolved.length, 1);
  assert.equal(unresolved[0].question, Q_SALARY);
});

test("whitespace-only answer does NOT resolve its item", () => {
  const unresolved = getUnresolvedMissingInfo({
    missingInformation: [Q_AUTH],
    userProvidedAnswers: [{ question: Q_AUTH, answer: "   " }],
  });
  assert.equal(unresolved.length, 1);
});

test("legacy answers without id resolve by question text (case/whitespace-insensitive)", () => {
  const unresolved = getUnresolvedMissingInfo({
    missingInformation: [Q_AUTH],
    userProvidedAnswers: [{ question: "  WORK Authorization status for this   location ", answer: "EU citizen" }],
  });
  assert.equal(unresolved.length, 0);
});

test("id-based matching resolves regardless of question phrasing drift", () => {
  const unresolved = getUnresolvedMissingInfo({
    missingInformation: [Q_AUTH],
    userProvidedAnswers: [
      { id: missingInfoId(Q_AUTH), question: "Different phrasing entirely", answer: "EU citizen" },
    ],
  });
  assert.equal(unresolved.length, 0);
});

test("defensive against legacy records missing fields entirely", () => {
  assert.equal(getUnresolvedMissingInfo({}).length, 0);
  assert.equal(getUnresolvedMissingInfo({ missingInformation: [Q_AUTH] }).length, 1);
});

/* ── Structured items carry sensitivity classification ────── */

test("missing-info items are classified — work auth is NEVER_AUTO_FILL", () => {
  const unresolved = getUnresolvedMissingInfo({ missingInformation: [Q_AUTH] });
  assert.equal(unresolved[0].sensitivity, "NEVER_AUTO_FILL");
  assert.equal(unresolved[0].normalizedField, "authorizedInCountry");
  assert.equal(unresolved[0].required, true);
  assert.ok(unresolved[0].id.startsWith("mi-"));
});

/* ── Merge behavior ──────────────────────────────────────── */

test("merge keeps existing answers and drops empty new ones", () => {
  const merged = mergeProvidedAnswers(
    [{ question: Q_AUTH, answer: "EU citizen" }],
    [{ question: Q_SALARY, answer: "  " }]
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].answer, "EU citizen");
});

test("new valid answer overrides older answer with same identity", () => {
  const merged = mergeProvidedAnswers(
    [{ question: Q_AUTH, answer: "old answer" }],
    [{ question: Q_AUTH, answer: "  new answer  " }]
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].answer, "new answer"); // trimmed
  assert.equal(merged[0].id, missingInfoId(Q_AUTH));
});

test("merge does not mutate its inputs", () => {
  const existing = [{ question: Q_AUTH, answer: "old" }];
  const incoming = [{ question: Q_AUTH, answer: "new" }];
  mergeProvidedAnswers(existing, incoming);
  assert.equal(existing[0].answer, "old");
  assert.equal(incoming[0].answer, "new");
  assert.equal(existing.length, 1);
});

/* ── Stable id derivation ────────────────────────────────── */

test("missingInfoId is stable and normalized", () => {
  assert.equal(missingInfoId(Q_AUTH), missingInfoId("  work AUTHORIZATION status for this location "));
  assert.notEqual(missingInfoId(Q_AUTH), missingInfoId(Q_SALARY));
});
