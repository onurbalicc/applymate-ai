import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture } from "./test-utils";
import { validateForm } from "../src/execution/form-validator";
import { makeMappedField } from "./execution-fixtures";
import type { FieldExecutionResult, DocumentUploadResult } from "../src/execution/execution-types";

function attachTestFile(document: Document, inputId: string, fileName: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const transfer = new DataTransfer();
  transfer.items.add(new File(["%PDF-test"], fileName, { type: "application/pdf" }));
  input.files = transfer.files;
}

test("ready when every required field resolved and no validation errors remain", () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "first_name", normalizedField: "givenName", label: "First Name", required: true });
  document.getElementById("first_name")!.setAttribute("value", "Ada");
  (document.getElementById("first_name") as HTMLInputElement).value = "Ada";

  const results: FieldExecutionResult[] = [{ fieldId: field.raw.scanFieldId, status: "filled" }];
  const readiness = validateForm([field], results, [], document);
  assert.equal(readiness.ready, true);
  assert.equal(readiness.unresolvedRequired.length, 0);
});

test("not ready when a required field is unresolved", () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "email", normalizedField: "email", label: "Email", required: true });
  const results: FieldExecutionResult[] = [{ fieldId: field.raw.scanFieldId, status: "unresolved-required", error: "No verified email." }];
  const readiness = validateForm([field], results, [], document);
  assert.equal(readiness.ready, false);
  assert.equal(readiness.unresolvedRequired.length, 1);
  assert.equal(readiness.unresolvedRequired[0].reason, "No verified email.");
});

test("not ready when a required field was blocked by the sensitivity policy", () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "email", normalizedField: "sponsorshipRequired", label: "Sponsorship?", required: true });
  const results: FieldExecutionResult[] = [{ fieldId: field.raw.scanFieldId, status: "blocked", blockedReason: "Sensitive field, no explicit answer." }];
  const readiness = validateForm([field], results, [], document);
  assert.equal(readiness.ready, false);
  assert.equal(readiness.unresolvedRequired[0].reason, "Sensitive field, no explicit answer.");
});

test("optional unresolved fields are reported separately and never block readiness", () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "pre_filled", normalizedField: null, label: "Optional field", required: false });
  const results: FieldExecutionResult[] = [{ fieldId: field.raw.scanFieldId, status: "skipped-optional", error: "No source." }];
  const readiness = validateForm([field], results, [], document);
  assert.equal(readiness.ready, true);
  assert.equal(readiness.optionalUnanswered.length, 1);
});

test("a missing required document upload blocks readiness", () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const missingDoc: DocumentUploadResult[] = [{ kind: "resume", status: "missing-document", fieldId: "scan-resume" }];
  const readiness = validateForm([], [], missingDoc, document);
  assert.equal(readiness.ready, false);
  assert.equal(readiness.unresolvedRequired.some((i) => i.label === "Résumé"), true);
});

test("an accepted required résumé satisfies document readiness", () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "resume", normalizedField: "resumeFile", label: "Résumé", inputType: "file", required: true });
  attachTestFile(document, "resume", "Resume.pdf");
  const uploaded: DocumentUploadResult[] = [{ kind: "resume", status: "uploaded", fieldId: field.raw.scanFieldId, documentId: "doc-1", fileName: "Resume.pdf" }];
  const readiness = validateForm([field], [], uploaded, document);
  assert.equal(readiness.ready, true);
});

test("a file cleared after upload confirmation blocks final readiness", () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "resume", normalizedField: "resumeFile", label: "Résumé", inputType: "file", required: true });
  const uploaded: DocumentUploadResult[] = [{ kind: "resume", status: "uploaded", fieldId: field.raw.scanFieldId, documentId: "doc-1", fileName: "Resume.pdf" }];
  const readiness = validateForm([field], [], uploaded, document);
  assert.equal(readiness.ready, false);
  assert.match(readiness.unresolvedRequired[0].reason, /replaced or cleared/);
});

test("an absent optional cover letter does not block readiness", () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "resume", normalizedField: "coverLetterFile", label: "Cover letter", inputType: "file", required: false });
  const missing: DocumentUploadResult[] = [{ kind: "coverLetter", status: "missing-document", fieldId: field.raw.scanFieldId }];
  const readiness = validateForm([field], [], missing, document);
  assert.equal(readiness.ready, true);
  assert.equal(readiness.optionalUnanswered.length, 1);
});

test("browser-native validity errors (e.g. malformed email) surface as validation errors", () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "email", normalizedField: "email", label: "Email", required: true });
  (document.getElementById("email") as HTMLInputElement).value = "not-an-email";
  const results: FieldExecutionResult[] = [{ fieldId: field.raw.scanFieldId, status: "filled" }];
  const readiness = validateForm([field], results, [], document);
  assert.equal(readiness.ready, false);
  assert.ok(readiness.validationErrors.length > 0);
});
