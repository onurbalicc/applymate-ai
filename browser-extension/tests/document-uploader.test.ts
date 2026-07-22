import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture } from "./test-utils";
import { uploadDocument, resolveDocumentSource } from "../src/execution/document-uploader";
import { makeExecutionPayload, makeMappedField } from "./execution-fixtures";
import type { SerializableDocumentTransfer } from "../../app/lib/documents/contracts";

function pdfTransfer(overrides: Partial<SerializableDocumentTransfer> = {}): SerializableDocumentTransfer {
  const bytes = Buffer.from("%PDF-1.7\nfixture");
  return {
    documentId: "doc-resume-1",
    type: "resume",
    fileName: "Test_Resume.pdf",
    mimeType: "application/pdf",
    sizeBytes: bytes.byteLength,
    checksum: "fixture-checksum",
    base64: bytes.toString("base64"),
    ...overrides,
  };
}

function payloadFor(transfer: SerializableDocumentTransfer) {
  return makeExecutionPayload({
    documents: {
      resumeFileAvailable: true,
      coverLetterFileAvailable: transfer.type === "cover-letter",
      coverLetterTextAvailable: false,
      ...(transfer.type === "resume" ? {
        resume: { ...transfer, type: "resume", selectionReason: "default" as const },
      } : {
        coverLetter: { ...transfer, type: "cover-letter", selectionReason: "default" as const },
      }),
    },
  });
}

test("required résumé reports missing-document when no authorized bytes arrived", async () => {
  const payload = makeExecutionPayload();
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "resume", normalizedField: "resumeFile", label: "Resume", inputType: "file", required: true });
  const result = await uploadDocument(field, "resume", payload, document, []);
  assert.equal(result.status, "missing-document");
});

test("resolveDocumentSource accepts only the exact frozen document reference", () => {
  loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const transfer = pdfTransfer();
  const payload = payloadFor(transfer);
  assert.equal(resolveDocumentSource("resume", payload, [transfer])?.file.name, transfer.fileName);
  assert.equal(resolveDocumentSource("resume", payload, [pdfTransfer({ documentId: "unrelated" })]), null);
  assert.equal(resolveDocumentSource("coverLetter", payload, [transfer]), null);
});

test("native Greenhouse-like résumé input receives the File and confirms it live", async () => {
  const transfer = pdfTransfer();
  const payload = payloadFor(transfer);
  const { document } = loadFixture("greenhouse-document.html", "https://boards.greenhouse.io/testco/jobs/123", { runScripts: true });
  const field = makeMappedField({ id: "greenhouse_resume", normalizedField: "resumeFile", label: "Resume", inputType: "file", required: true });
  let changes = 0;
  document.getElementById("greenhouse_resume")!.addEventListener("change", () => { changes += 1; });
  const result = await uploadDocument(field, "resume", payload, document, [transfer], 20);
  assert.equal(result.status, "uploaded");
  assert.equal(result.detectedFileName, "Test_Resume.pdf");
  assert.equal(changes, 1);
});

test("hidden Lever-style native input remains uploadable", async () => {
  const transfer = pdfTransfer();
  const payload = payloadFor(transfer);
  const { document } = loadFixture("lever-document.html", "https://jobs.lever.co/testco/123/apply", { runScripts: true });
  const field = makeMappedField({ id: "lever_resume", normalizedField: "resumeFile", label: "Resume", inputType: "file", required: true });
  const result = await uploadDocument(field, "resume", payload, document, [transfer], 20);
  assert.equal(result.status, "uploaded");
});

test("ATS rejection text blocks an otherwise assigned file", async () => {
  const transfer = pdfTransfer();
  const payload = payloadFor(transfer);
  const { document } = loadFixture("greenhouse-document.html", "https://boards.greenhouse.io/testco/jobs/123", { runScripts: true });
  const input = document.getElementById("greenhouse_resume") as HTMLInputElement;
  input.dataset.reject = "true";
  const field = makeMappedField({ id: "greenhouse_resume", normalizedField: "resumeFile", label: "Resume", inputType: "file", required: true });
  const result = await uploadDocument(field, "resume", payload, document, [transfer], 20);
  assert.equal(result.status, "rejected");
});

test("cover-letter file uses its own frozen reference", async () => {
  const transfer = pdfTransfer({ documentId: "doc-cover-1", type: "cover-letter", fileName: "Cover_Letter.pdf" });
  const payload = payloadFor(transfer);
  const { document } = loadFixture("document-ats-fixture.html", "https://boards.greenhouse.io/testco/jobs/123", { runScripts: true });
  const field = makeMappedField({ id: "cover_letter", normalizedField: "coverLetterFile", label: "Cover letter", inputType: "file" });
  const result = await uploadDocument(field, "coverLetter", payload, document, [transfer], 20);
  assert.equal(result.status, "uploaded");
  assert.equal(result.documentId, "doc-cover-1");
});

test("processing state times out instead of reporting a false upload success", async () => {
  const transfer = pdfTransfer();
  const payload = payloadFor(transfer);
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const input = document.getElementById("resume")!;
  input.parentElement!.append(" Analyzing resume, please wait");
  const field = makeMappedField({ id: "resume", normalizedField: "resumeFile", label: "Resume", inputType: "file", required: true });
  const result = await uploadDocument(field, "resume", payload, document, [transfer], 1);
  assert.equal(result.status, "processing-timeout");
});

test("no document field is skipped without becoming a failure", async () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const result = await uploadDocument(null, "coverLetter", makeExecutionPayload(), document, []);
  assert.equal(result.status, "skipped-no-field");
});
