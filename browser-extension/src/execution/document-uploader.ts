import type { ExtensionApplicationPayload } from "../../../app/lib/extension-payload/contracts";
import type { SerializableDocumentTransfer } from "../../../app/lib/documents/contracts";
import type { NormalizedDetectedField } from "../shared/contracts";
import { locateElement } from "./field-filler";
import type { DocumentKind, DocumentUploadResult } from "./execution-types";

const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_UPLOAD_TIMEOUT_MS = 5000;

export interface DocumentSource {
  documentId: string;
  file: File;
}

function transferType(kind: DocumentKind): SerializableDocumentTransfer["type"] {
  return kind === "resume" ? "resume" : "cover-letter";
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** Resolve only the exact file reference frozen into this authorization.
    An unrelated transfer is ignored even if its type looks suitable. */
export function resolveDocumentSource(
  kind: DocumentKind,
  payload: ExtensionApplicationPayload,
  transfers: SerializableDocumentTransfer[]
): DocumentSource | null {
  const reference = kind === "resume" ? payload.documents.resume : payload.documents.coverLetter;
  if (!reference) return null;
  const transfer = transfers.find((candidate) =>
    candidate.documentId === reference.documentId && candidate.type === transferType(kind)
  );
  if (!transfer) return null;
  if (
    transfer.checksum !== reference.checksum ||
    transfer.fileName !== reference.fileName ||
    transfer.mimeType !== reference.mimeType ||
    transfer.sizeBytes !== reference.sizeBytes
  ) return null;
  const bytes = fromBase64(transfer.base64);
  if (bytes.byteLength !== transfer.sizeBytes) return null;
  const fileBytes = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return {
    documentId: transfer.documentId,
    file: new File([fileBytes], transfer.fileName, { type: transfer.mimeType, lastModified: Date.now() }),
  };
}

function isAllowedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => lower.endsWith(extension)) && file.size > 0 && file.size <= MAX_SIZE_BYTES;
}

export function attachFileToInput(input: HTMLInputElement, file: File): void {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function nearbyUploadText(input: HTMLInputElement): string {
  return (input.closest("[data-field], .field, .application-field, .upload, .resume, .cover-letter")?.textContent
    ?? input.parentElement?.textContent
    ?? "").toLowerCase();
}

function rejectionText(text: string): string | null {
  if (/file.*too (large|big)|exceeds.*(limit|size)/i.test(text)) return "The ATS says the file is too large.";
  if (/unsupported|invalid file|file type.*not (allowed|supported)|upload failed|could not upload/i.test(text)) {
    return "The ATS rejected the document type or upload.";
  }
  return null;
}

function processing(text: string): boolean {
  return /uploading|processing|analyzing|scanning|please wait/i.test(text) && !/success|uploaded|complete/i.test(text);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadDocument(
  field: NormalizedDetectedField | null,
  kind: DocumentKind,
  payload: ExtensionApplicationPayload,
  doc: Document,
  transfers: SerializableDocumentTransfer[],
  timeoutMs = DEFAULT_UPLOAD_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<DocumentUploadResult> {
  if (!field) return { kind, status: "skipped-no-field" };
  if (signal?.aborted) return { kind, status: "failed", fieldId: field.raw.scanFieldId, error: "Document upload was cancelled." };

  const source = resolveDocumentSource(kind, payload, transfers);
  if (!source) {
    return {
      kind,
      status: "missing-document",
      fieldId: field.raw.scanFieldId,
      error: `No authorized ${kind === "resume" ? "résumé" : "cover-letter"} bytes were transferred for this attempt.`,
    };
  }
  if (!isAllowedFile(source.file)) {
    return {
      kind,
      documentId: source.documentId,
      fileName: source.file.name,
      status: "rejected",
      fieldId: field.raw.scanFieldId,
      error: `File "${source.file.name}" is not an allowed PDF/DOCX file of 5 MB or less.`,
    };
  }

  let input = locateElement(field, doc) as HTMLInputElement | null;
  if (!input || input.type !== "file") {
    return { kind, documentId: source.documentId, fileName: source.file.name, status: "unsupported-widget", fieldId: field.raw.scanFieldId, error: "Could not locate a native file input behind this upload widget." };
  }
  if (input.files?.[0]?.name === source.file.name) {
    return { kind, documentId: source.documentId, fileName: source.file.name, status: "already-present", fieldId: field.raw.scanFieldId, detectedFileName: source.file.name };
  }

  try {
    attachFileToInput(input, source.file);
  } catch (error) {
    return { kind, documentId: source.documentId, fileName: source.file.name, status: "failed", fieldId: field.raw.scanFieldId, error: error instanceof Error ? error.message : "Unknown upload error." };
  }

  const startedAt = Date.now();
  do {
    if (signal?.aborted) return { kind, documentId: source.documentId, fileName: source.file.name, status: "failed", fieldId: field.raw.scanFieldId, error: "Document upload was cancelled." };
    await delay(0);
    input = locateElement(field, doc) as HTMLInputElement | null;
    if (!input || input.type !== "file") {
      return { kind, documentId: source.documentId, fileName: source.file.name, status: "failed", fieldId: field.raw.scanFieldId, error: "The ATS replaced the upload control before acceptance could be confirmed." };
    }
    const text = nearbyUploadText(input);
    const rejected = rejectionText(`${field.raw.validationText ?? ""} ${text}`);
    if (rejected) {
      return { kind, documentId: source.documentId, fileName: source.file.name, status: "rejected", fieldId: field.raw.scanFieldId, error: rejected };
    }
    const detectedFileName = input.files?.[0]?.name;
    const filenameVisible = text.includes(source.file.name.toLowerCase());
    if (detectedFileName === source.file.name && (!processing(text) || filenameVisible || /success|uploaded|complete/i.test(text))) {
      return { kind, documentId: source.documentId, fileName: source.file.name, status: "uploaded", fieldId: field.raw.scanFieldId, detectedFileName };
    }
    if (Date.now() - startedAt >= timeoutMs) break;
    await delay(Math.min(150, timeoutMs));
  } while (true);

  return { kind, documentId: source.documentId, fileName: source.file.name, status: "processing-timeout", fieldId: field.raw.scanFieldId, error: "The ATS did not confirm the document upload before the timeout." };
}
