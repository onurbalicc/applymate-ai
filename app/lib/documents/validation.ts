import type { CandidateDocumentType } from "./contracts";

export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type DocumentValidationCode =
  | "empty-file"
  | "oversized-file"
  | "unsupported-file"
  | "invalid-signature"
  | "invalid-filename";

export class DocumentValidationError extends Error {
  constructor(public readonly code: DocumentValidationCode, message: string) {
    super(message);
    this.name = "DocumentValidationError";
  }
}

export interface ValidatedDocumentInput {
  originalFileName: string;
  fileName: string;
  mimeType: string;
  bytes: ArrayBuffer;
  type: CandidateDocumentType;
}

function extensionOf(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? "";
}

export function sanitizeDocumentFileName(fileName: string): string {
  const trimmed = fileName.trim().replace(/[\\/]+/g, "_");
  const sanitized = trimmed
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[^\p{L}\p{N}._() -]+/gu, "_")
    .replace(/\s+/g, " ")
    .slice(0, 180);
  if (!sanitized || sanitized === "." || sanitized === "..") {
    throw new DocumentValidationError("invalid-filename", "Choose a file with a valid name.");
  }
  return sanitized;
}

function hasPdfSignature(bytes: Uint8Array): boolean {
  return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
}

function hasZipSignature(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b &&
    ((bytes[2] === 0x03 && bytes[3] === 0x04) ||
      (bytes[2] === 0x05 && bytes[3] === 0x06) ||
      (bytes[2] === 0x07 && bytes[3] === 0x08));
}

export function validateDocument(input: ValidatedDocumentInput): ValidatedDocumentInput {
  const fileName = sanitizeDocumentFileName(input.originalFileName);
  const extension = extensionOf(fileName);
  const bytes = new Uint8Array(input.bytes);

  if (bytes.byteLength === 0) {
    throw new DocumentValidationError("empty-file", "The selected document is empty.");
  }
  if (bytes.byteLength > MAX_DOCUMENT_SIZE_BYTES) {
    throw new DocumentValidationError("oversized-file", "Documents must be 5 MB or smaller.");
  }

  if (extension === ".pdf") {
    if (input.mimeType && input.mimeType !== PDF_MIME && input.mimeType !== "application/octet-stream") {
      throw new DocumentValidationError("unsupported-file", "The file extension and MIME type do not match a PDF.");
    }
    if (!hasPdfSignature(bytes)) {
      throw new DocumentValidationError("invalid-signature", "This file does not contain a valid PDF signature.");
    }
    return { ...input, fileName, mimeType: PDF_MIME };
  }

  if (extension === ".docx") {
    if (input.mimeType && input.mimeType !== DOCX_MIME && input.mimeType !== "application/octet-stream") {
      throw new DocumentValidationError("unsupported-file", "The file extension and MIME type do not match a DOCX document.");
    }
    if (!hasZipSignature(bytes)) {
      throw new DocumentValidationError("invalid-signature", "This file does not contain a valid DOCX container signature.");
    }
    return { ...input, fileName, mimeType: DOCX_MIME };
  }

  throw new DocumentValidationError("unsupported-file", "Only PDF and DOCX documents are supported.");
}

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure checksum support is unavailable in this browser.");
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes.slice(0));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

