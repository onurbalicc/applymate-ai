import type { ExtensionApplicationPayload } from "../../../app/lib/extension-payload/contracts";
import type { SerializableDocumentTransfer } from "../../../app/lib/documents/contracts";

export function isAllowedApplyMateOrigin(senderUrl: string | undefined): boolean {
  if (!senderUrl) return false;
  try {
    const url = new URL(senderUrl);
    return url.protocol === "http:" && url.hostname === "localhost";
  } catch {
    return false;
  }
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function checksum(bytes: Uint8Array): Promise<string> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function validateAuthorizedDocumentTransfers(
  payload: ExtensionApplicationPayload,
  expectedAttemptId: string,
  attemptId: string,
  documents: SerializableDocumentTransfer[]
): Promise<string | null> {
  if (attemptId !== expectedAttemptId) return "Document transfer attempt does not match the authorized attempt.";
  const expected = [payload.documents.resume, payload.documents.coverLetter].filter(
    (document): document is NonNullable<typeof document> => Boolean(document)
  );
  if (documents.length !== expected.length) return "Document transfer does not match the authorized document set.";
  for (const reference of expected) {
    const transfer = documents.find((document) => document.documentId === reference.documentId);
    if (!transfer) return `Authorized document ${reference.documentId} was not provided.`;
    if (
      transfer.type !== reference.type ||
      transfer.fileName !== reference.fileName ||
      transfer.mimeType !== reference.mimeType ||
      transfer.sizeBytes !== reference.sizeBytes ||
      transfer.checksum !== reference.checksum ||
      !transfer.base64
    ) return `Transferred document ${reference.documentId} does not match its authorized metadata.`;
    let bytes: Uint8Array;
    try {
      bytes = decodeBase64(transfer.base64);
    } catch {
      return `Transferred document ${reference.documentId} is not valid base64.`;
    }
    if (bytes.byteLength !== reference.sizeBytes) return `Transferred document ${reference.documentId} has an unexpected byte length.`;
    if (await checksum(bytes) !== reference.checksum) return `Transferred document ${reference.documentId} failed checksum verification.`;
  }
  return null;
}

export class TemporaryDocumentVault {
  private values = new Map<string, { attemptId: string; documents: SerializableDocumentTransfer[] }>();

  put(authorizationId: string, attemptId: string, documents: SerializableDocumentTransfer[]): void {
    this.values.set(authorizationId, { attemptId, documents: documents.map((document) => ({ ...document })) });
  }

  get(authorizationId: string, attemptId: string): SerializableDocumentTransfer[] {
    const entry = this.values.get(authorizationId);
    if (!entry || entry.attemptId !== attemptId) return [];
    return entry.documents.map((document) => ({ ...document }));
  }

  clear(authorizationId: string): void {
    this.values.delete(authorizationId);
  }

  has(authorizationId: string): boolean {
    return this.values.has(authorizationId);
  }
}
