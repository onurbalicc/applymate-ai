import { test } from "node:test";
import assert from "node:assert/strict";
import type { CandidateDocumentMetadata } from "../app/lib/documents/contracts";
import { selectApplicationDocuments } from "../app/lib/documents/selection";

function document(overrides: Partial<CandidateDocumentMetadata>): CandidateDocumentMetadata {
  return {
    documentId: "doc-default",
    candidateProfileId: "local-candidate-profile",
    type: "resume",
    source: "default",
    fileName: "resume.pdf",
    originalFileName: "resume.pdf",
    mimeType: "application/pdf",
    sizeBytes: 100,
    createdAt: "2026-07-22T00:00:00.000Z",
    updatedAt: "2026-07-22T00:00:00.000Z",
    checksum: "checksum",
    isDefault: true,
    ...overrides,
  };
}

test("job-specific generated résumé wins over explicit and default documents", () => {
  const selection = selectApplicationDocuments([
    document({}),
    document({ documentId: "doc-selected", isDefault: false, source: "user-upload" }),
    document({ documentId: "doc-generated", isDefault: false, source: "generated", jobId: "job-1", applicationPackageId: "pkg-1" }),
  ], { jobId: "job-1", applicationPackageId: "pkg-1", selectedResumeDocumentId: "doc-selected", resolvedAt: "fixed" });
  assert.equal(selection.resume?.documentId, "doc-generated");
  assert.equal(selection.resume?.selectionReason, "job-specific-generated");
  assert.equal(selection.resolvedAt, "fixed");
});

test("explicit selected résumé wins when no generated document exists", () => {
  const selection = selectApplicationDocuments([
    document({}),
    document({ documentId: "doc-selected", isDefault: false, source: "job-specific", jobId: "job-1" }),
  ], { jobId: "job-1", selectedResumeDocumentId: "doc-selected" });
  assert.equal(selection.resume?.documentId, "doc-selected");
  assert.equal(selection.resume?.selectionReason, "job-specific-user-selected");
});

test("default résumé and cover letter are independent fallbacks", () => {
  const selection = selectApplicationDocuments([
    document({}),
    document({ documentId: "cover", type: "cover-letter", fileName: "cover.pdf", originalFileName: "cover.pdf", checksum: "cover-checksum" }),
  ], { jobId: "job-1" });
  assert.equal(selection.resume?.documentId, "doc-default");
  assert.equal(selection.coverLetter?.documentId, "cover");
});

test("no documents resolves to an explicit empty frozen selection", () => {
  const selection = selectApplicationDocuments([], { jobId: "job-1", resolvedAt: "fixed" });
  assert.deepEqual(selection, { resolvedAt: "fixed", resume: undefined, coverLetter: undefined });
});

test("a selected document belonging to another job is rejected", () => {
  assert.throws(() => selectApplicationDocuments([
    document({ documentId: "wrong", isDefault: false, source: "job-specific", jobId: "job-2" }),
  ], { jobId: "job-1", selectedResumeDocumentId: "wrong" }), /different job/);
});

