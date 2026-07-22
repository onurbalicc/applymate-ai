import { test } from "node:test";
import assert from "node:assert/strict";
import { makeExecutionPayload } from "./execution-fixtures";
import type { SerializableDocumentTransfer } from "../../app/lib/documents/contracts";
import {
  isAllowedApplyMateOrigin,
  TemporaryDocumentVault,
  validateAuthorizedDocumentTransfers,
} from "../src/background/document-transfer";

async function sha256(bytes: Uint8Array): Promise<string> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Buffer.from(digest).toString("hex");
}

async function transfer(): Promise<SerializableDocumentTransfer> {
  const bytes = Uint8Array.from(Buffer.from("%PDF-1.7"));
  return {
    documentId: "doc-1",
    type: "resume",
    fileName: "Resume.pdf",
    mimeType: "application/pdf",
    sizeBytes: bytes.byteLength,
    checksum: await sha256(bytes),
    base64: Buffer.from(bytes).toString("base64"),
  };
}

async function authorizedPayload() {
  const document = await transfer();
  return makeExecutionPayload({
    authorization: {
      authorizationId: "job-1",
      attemptId: "attempt-1",
      authorizedAction: "fill-and-submit",
      authorizedAt: "2026-07-22T00:00:00.000Z",
      authorizedApplyUrl: "https://boards.greenhouse.io/test/jobs/1",
    },
    documents: {
      resumeFileAvailable: true,
      coverLetterFileAvailable: false,
      coverLetterTextAvailable: false,
      resume: { ...document, selectionReason: "default" },
    },
  });
}

test("authorized document transfer accepts an exact attempt, document and checksum", async () => {
  assert.equal(await validateAuthorizedDocumentTransfers(await authorizedPayload(), "attempt-1", "attempt-1", [await transfer()]), null);
});

test("wrong attempt, wrong document id and unrelated extra documents are rejected", async () => {
  const payload = await authorizedPayload();
  const document = await transfer();
  assert.match((await validateAuthorizedDocumentTransfers(payload, "attempt-1", "wrong", [document])) ?? "", /attempt/);
  assert.match((await validateAuthorizedDocumentTransfers(payload, "attempt-1", "attempt-1", [{ ...document, documentId: "other" }])) ?? "", /not provided/);
  assert.match((await validateAuthorizedDocumentTransfers(payload, "attempt-1", "attempt-1", [document, { ...document, documentId: "extra" }])) ?? "", /document set/);
});

test("tampered bytes fail checksum verification", async () => {
  const payload = await authorizedPayload();
  const document = await transfer();
  const tampered = { ...document, base64: Buffer.from("%PDF-tampered").toString("base64"), sizeBytes: Buffer.byteLength("%PDF-tampered") };
  payload.documents.resume = { ...payload.documents.resume!, sizeBytes: tampered.sizeBytes };
  assert.match((await validateAuthorizedDocumentTransfers(payload, "attempt-1", "attempt-1", [tampered])) ?? "", /checksum/);
});

test("only configured localhost ApplyMate origins are accepted for the MVP", () => {
  assert.equal(isAllowedApplyMateOrigin("http://localhost:3000/profile"), true);
  assert.equal(isAllowedApplyMateOrigin("http://localhost:4000/"), true);
  assert.equal(isAllowedApplyMateOrigin("https://evil.example/"), false);
  assert.equal(isAllowedApplyMateOrigin(undefined), false);
});

test("temporary bytes are attempt-scoped and cleared after terminal execution", async () => {
  const vault = new TemporaryDocumentVault();
  vault.put("job-1", "attempt-1", [await transfer()]);
  assert.equal(vault.get("job-1", "attempt-1").length, 1);
  assert.equal(vault.get("job-1", "attempt-2").length, 0);
  vault.clear("job-1");
  assert.equal(vault.has("job-1"), false);
});

