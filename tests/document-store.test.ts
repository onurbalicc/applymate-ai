import { test } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import {
  DocumentStoreError,
  IndexedDbDocumentRepository,
} from "../app/lib/documents/document-store";
import { DocumentValidationError, MAX_DOCUMENT_SIZE_BYTES } from "../app/lib/documents/validation";

function pdfBytes(label = "fixture"): ArrayBuffer {
  return Uint8Array.from(Buffer.from(`%PDF-1.7\n${label}`)).buffer;
}

function docxBytes(label = "fixture"): ArrayBuffer {
  return Uint8Array.from(Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from(label)])).buffer;
}

function repository(name: string) {
  return new IndexedDbDocumentRepository(new IDBFactory(), `applymate-test-${name}-${Date.now()}-${Math.random()}`);
}

test("document store saves and reads real PDF bytes and metadata", async () => {
  const repo = repository("pdf");
  const metadata = await repo.saveDocument({ bytes: pdfBytes(), fileName: "Onur Resume.pdf", mimeType: "application/pdf", type: "resume", isDefault: true });
  const stored = await repo.getDocument(metadata.documentId);
  assert.equal(stored.metadata.fileName, "Onur Resume.pdf");
  assert.equal(stored.metadata.isDefault, true);
  assert.deepEqual(new Uint8Array(stored.bytes), new Uint8Array(pdfBytes()));
  assert.equal((await repo.listDocuments()).length, 1);
  repo.close();
});

test("document store accepts a DOCX ZIP signature", async () => {
  const repo = repository("docx");
  const metadata = await repo.saveDocument({
    bytes: docxBytes(),
    fileName: "Cover Letter.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    type: "cover-letter",
    isDefault: true,
  });
  assert.equal(metadata.mimeType, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  repo.close();
});

test("replacing the default résumé preserves old bytes but moves the default flag", async () => {
  const repo = repository("replace");
  const oldDoc = await repo.saveDocument({ bytes: pdfBytes("old"), fileName: "old.pdf", mimeType: "application/pdf", type: "resume", isDefault: true });
  const newDoc = await repo.saveDocument({ bytes: pdfBytes("new"), fileName: "new.pdf", mimeType: "application/pdf", type: "resume", isDefault: true });
  const listed = await repo.listDocuments();
  assert.equal(listed.find((doc) => doc.documentId === oldDoc.documentId)?.isDefault, false);
  assert.equal(listed.find((doc) => doc.documentId === newDoc.documentId)?.isDefault, true);
  assert.equal((await repo.getDocument(oldDoc.documentId)).bytes.byteLength > 0, true);
  repo.close();
});

test("delete removes both metadata and bytes", async () => {
  const repo = repository("delete");
  const metadata = await repo.saveDocument({ bytes: pdfBytes(), fileName: "resume.pdf", mimeType: "application/pdf", type: "resume" });
  await repo.deleteDocument(metadata.documentId);
  await assert.rejects(() => repo.getDocument(metadata.documentId), (error: unknown) => error instanceof DocumentStoreError && error.code === "document-not-found");
  repo.close();
});

test("duplicate content is rejected without storing a second copy", async () => {
  const repo = repository("duplicate");
  await repo.saveDocument({ bytes: pdfBytes(), fileName: "resume.pdf", mimeType: "application/pdf", type: "resume" });
  await assert.rejects(
    () => repo.saveDocument({ bytes: pdfBytes(), fileName: "copy.pdf", mimeType: "application/pdf", type: "resume" }),
    (error: unknown) => error instanceof DocumentStoreError && error.code === "duplicate-file" && Boolean(error.existingDocument)
  );
  assert.equal((await repo.listDocuments()).length, 1);
  repo.close();
});

test("validation rejects unsupported, empty, invalid-signature and oversized files", async () => {
  const repo = repository("invalid");
  await assert.rejects(() => repo.saveDocument({ bytes: new ArrayBuffer(0), fileName: "empty.pdf", mimeType: "application/pdf", type: "resume" }), DocumentValidationError);
  await assert.rejects(() => repo.saveDocument({ bytes: pdfBytes(), fileName: "resume.html", mimeType: "text/html", type: "resume" }), DocumentValidationError);
  await assert.rejects(() => repo.saveDocument({ bytes: Uint8Array.from([1, 2, 3]).buffer, fileName: "fake.pdf", mimeType: "application/pdf", type: "resume" }), DocumentValidationError);
  const oversized = new Uint8Array(MAX_DOCUMENT_SIZE_BYTES + 1);
  oversized.set(Buffer.from("%PDF-"));
  await assert.rejects(() => repo.saveDocument({ bytes: oversized.buffer, fileName: "large.pdf", mimeType: "application/pdf", type: "resume" }), DocumentValidationError);
  repo.close();
});

test("unavailable IndexedDB returns a useful storage error", async () => {
  const repo = new IndexedDbDocumentRepository(undefined, "unavailable");
  await assert.rejects(() => repo.listDocuments(), (error: unknown) => error instanceof DocumentStoreError && error.code === "storage-unavailable");
});

