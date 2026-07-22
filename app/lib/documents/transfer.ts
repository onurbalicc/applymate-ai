"use client";

import type {
  ApplicationDocumentSelection,
  SerializableDocumentTransfer,
  SelectedApplicationDocument,
} from "./contracts";
import { documentRepository } from "./document-store";

function arrayBufferToBase64(bytes: ArrayBuffer): string {
  const source = new Uint8Array(bytes);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < source.length; offset += chunkSize) {
    binary += String.fromCharCode(...source.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function prepareOne(reference: SelectedApplicationDocument): Promise<SerializableDocumentTransfer> {
  const stored = await documentRepository.getDocument(reference.documentId);
  if (stored.metadata.checksum !== reference.checksum || stored.metadata.type !== reference.type) {
    throw new Error(`Stored document ${reference.documentId} no longer matches the authorized selection.`);
  }
  return {
    documentId: reference.documentId,
    type: reference.type,
    fileName: reference.fileName,
    mimeType: reference.mimeType,
    sizeBytes: reference.sizeBytes,
    checksum: reference.checksum,
    base64: arrayBufferToBase64(stored.bytes),
  };
}

export async function prepareAuthorizedDocumentTransfers(
  selection: ApplicationDocumentSelection | null
): Promise<SerializableDocumentTransfer[]> {
  if (!selection) return [];
  const references = [selection.resume, selection.coverLetter].filter(
    (document): document is SelectedApplicationDocument => Boolean(document)
  );
  return Promise.all(references.map(prepareOne));
}

