import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture } from "./test-utils";
import { uploadDocument, resolveDocumentSource } from "../src/execution/document-uploader";
import { makeExecutionPayload, makeMappedField } from "./execution-fixtures";

test("résumé upload is honestly 'not-available' — no résumé file exists anywhere in ApplyMate today", () => {
  const payload = makeExecutionPayload({ documents: { resumeFileAvailable: false, coverLetterFileAvailable: false, coverLetterTextAvailable: false } });
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "resume", normalizedField: "resumeFile", label: "Resume", inputType: "file", required: true });
  const result = uploadDocument(field, "resume", payload, document);
  assert.equal(result.status, "not-available");
});

test("resolveDocumentSource never fabricates a file even when the payload claims one is available (defense in depth)", () => {
  // Even if resumeFileAvailable were somehow true, resolveDocumentSource has
  // no actual file storage to draw from — it must still return null, not a
  // synthetic/placeholder File.
  const payload = makeExecutionPayload({ documents: { resumeFileAvailable: true, coverLetterFileAvailable: true, coverLetterTextAvailable: true } });
  assert.equal(resolveDocumentSource("resume", payload), null);
  assert.equal(resolveDocumentSource("coverLetter", payload), null);
});

test("no document field on the page is reported as skipped-no-field, not a failure", () => {
  const payload = makeExecutionPayload();
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const result = uploadDocument(null, "coverLetter", payload, document);
  assert.equal(result.status, "skipped-no-field");
});
