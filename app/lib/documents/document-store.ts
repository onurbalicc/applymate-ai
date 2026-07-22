"use client";

import type {
  CandidateDocumentMetadata,
  CandidateDocumentSource,
  CandidateDocumentType,
  StoredCandidateDocument,
} from "./contracts";
import { LOCAL_CANDIDATE_PROFILE_ID } from "./contracts";
import { sha256Hex, validateDocument } from "./validation";

const DATABASE_NAME = "applymate-documents";
const DATABASE_VERSION = 1;
const STORE_NAME = "documents";

export type DocumentStoreErrorCode =
  | "storage-unavailable"
  | "quota-exceeded"
  | "document-not-found"
  | "corrupted-document"
  | "duplicate-file"
  | "migration-failure";

export class DocumentStoreError extends Error {
  constructor(
    public readonly code: DocumentStoreErrorCode,
    message: string,
    public readonly existingDocument?: CandidateDocumentMetadata
  ) {
    super(message);
    this.name = "DocumentStoreError";
  }
}

export interface SaveDocumentInput {
  bytes: ArrayBuffer;
  fileName: string;
  mimeType: string;
  type: CandidateDocumentType;
  source?: CandidateDocumentSource;
  candidateProfileId?: string;
  isDefault?: boolean;
  jobId?: string;
  applicationPackageId?: string;
}

interface PersistedDocument {
  metadata: CandidateDocumentMetadata;
  bytes: ArrayBuffer;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
  });
}

function mapStorageError(error: unknown): DocumentStoreError {
  if (error instanceof DocumentStoreError) return error;
  const name = error instanceof DOMException ? error.name : "";
  if (name === "QuotaExceededError") {
    return new DocumentStoreError("quota-exceeded", "Browser storage is full. Remove an older document and try again.");
  }
  return new DocumentStoreError("storage-unavailable", "Local document storage is unavailable in this browser.");
}

function randomDocumentId(): string {
  if (globalThis.crypto?.randomUUID) return `doc_${globalThis.crypto.randomUUID()}`;
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export class IndexedDbDocumentRepository {
  private databasePromise: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly factory: IDBFactory | undefined = globalThis.indexedDB,
    private readonly databaseName = DATABASE_NAME
  ) {}

  private open(): Promise<IDBDatabase> {
    if (!this.factory) {
      return Promise.reject(new DocumentStoreError("storage-unavailable", "IndexedDB is unavailable in this browser."));
    }
    if (this.databasePromise) return this.databasePromise;

    this.databasePromise = new Promise((resolve, reject) => {
      const request = this.factory!.open(this.databaseName, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (db.objectStoreNames.contains(STORE_NAME)) return;
        const store = db.createObjectStore(STORE_NAME, { keyPath: "metadata.documentId" });
        store.createIndex("checksum", "metadata.checksum", { unique: false });
        store.createIndex("type", "metadata.type", { unique: false });
        store.createIndex("isDefault", "metadata.isDefault", { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new DocumentStoreError("migration-failure", request.error?.message ?? "Could not open document storage."));
      request.onblocked = () => reject(new DocumentStoreError("migration-failure", "Document storage upgrade is blocked by another open tab."));
    });
    return this.databasePromise;
  }

  async saveDocument(input: SaveDocumentInput): Promise<CandidateDocumentMetadata> {
    const validated = validateDocument({
      originalFileName: input.fileName,
      fileName: input.fileName,
      mimeType: input.mimeType,
      bytes: input.bytes.slice(0),
      type: input.type,
    });
    const checksum = await sha256Hex(validated.bytes);
    const existing = (await this.listDocuments()).find(
      (document) => document.type === input.type && document.checksum === checksum
    );
    if (existing) {
      throw new DocumentStoreError("duplicate-file", "This document is already stored in ApplyMate.", existing);
    }

    const now = new Date().toISOString();
    const metadata: CandidateDocumentMetadata = {
      documentId: randomDocumentId(),
      candidateProfileId: input.candidateProfileId ?? LOCAL_CANDIDATE_PROFILE_ID,
      type: input.type,
      source: input.source ?? (input.isDefault ? "default" : "user-upload"),
      fileName: validated.fileName,
      originalFileName: input.fileName,
      mimeType: validated.mimeType,
      sizeBytes: validated.bytes.byteLength,
      createdAt: now,
      updatedAt: now,
      checksum,
      isDefault: input.isDefault ?? false,
      ...(input.jobId ? { jobId: input.jobId } : {}),
      ...(input.applicationPackageId ? { applicationPackageId: input.applicationPackageId } : {}),
    };

    try {
      const db = await this.open();
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const done = transactionDone(transaction);
      const store = transaction.objectStore(STORE_NAME);
      if (metadata.isDefault) {
        const all = await requestResult(store.getAll()) as PersistedDocument[];
        for (const document of all) {
          if (document.metadata.type === metadata.type && document.metadata.isDefault) {
            document.metadata = { ...document.metadata, isDefault: false, updatedAt: now };
            store.put(document);
          }
        }
      }
      store.add({ metadata, bytes: validated.bytes.slice(0) } satisfies PersistedDocument);
      await done;
      return metadata;
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async getDocument(documentId: string): Promise<StoredCandidateDocument> {
    try {
      const db = await this.open();
      const transaction = db.transaction(STORE_NAME, "readonly");
      const done = transactionDone(transaction);
      const value = await requestResult(transaction.objectStore(STORE_NAME).get(documentId)) as PersistedDocument | undefined;
      await done;
      if (!value) throw new DocumentStoreError("document-not-found", "The selected document no longer exists.");
      if (!(value.bytes instanceof ArrayBuffer) || value.bytes.byteLength !== value.metadata.sizeBytes) {
        throw new DocumentStoreError("corrupted-document", "The stored document is corrupted or incomplete.");
      }
      return { metadata: { ...value.metadata }, bytes: value.bytes.slice(0) };
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async getDocumentMetadata(documentId: string): Promise<CandidateDocumentMetadata> {
    return (await this.getDocument(documentId)).metadata;
  }

  async listDocuments(): Promise<CandidateDocumentMetadata[]> {
    try {
      const db = await this.open();
      const transaction = db.transaction(STORE_NAME, "readonly");
      const done = transactionDone(transaction);
      const values = await requestResult(transaction.objectStore(STORE_NAME).getAll()) as PersistedDocument[];
      await done;
      return values.map((value) => ({ ...value.metadata })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.getDocumentMetadata(documentId);
    try {
      const db = await this.open();
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const done = transactionDone(transaction);
      transaction.objectStore(STORE_NAME).delete(documentId);
      await done;
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async markDefault(documentId: string): Promise<CandidateDocumentMetadata> {
    const target = await this.getDocument(documentId);
    try {
      const db = await this.open();
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const done = transactionDone(transaction);
      const store = transaction.objectStore(STORE_NAME);
      const all = await requestResult(store.getAll()) as PersistedDocument[];
      const now = new Date().toISOString();
      for (const document of all) {
        if (document.metadata.type !== target.metadata.type) continue;
        const isTarget = document.metadata.documentId === documentId;
        document.metadata = {
          ...document.metadata,
          isDefault: isTarget,
          source: isTarget ? "default" : document.metadata.source,
          updatedAt: isTarget ? now : document.metadata.updatedAt,
        };
        store.put(document);
      }
      await done;
      return { ...target.metadata, isDefault: true, source: "default", updatedAt: now };
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async associateWithJob(documentId: string, jobId: string, applicationPackageId?: string): Promise<CandidateDocumentMetadata> {
    const document = await this.getDocument(documentId);
    const metadata: CandidateDocumentMetadata = {
      ...document.metadata,
      jobId,
      ...(applicationPackageId ? { applicationPackageId } : {}),
      updatedAt: new Date().toISOString(),
    };
    try {
      const db = await this.open();
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const done = transactionDone(transaction);
      transaction.objectStore(STORE_NAME).put({ metadata, bytes: document.bytes } satisfies PersistedDocument);
      await done;
      return metadata;
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  close(): void {
    void this.databasePromise?.then((database) => database.close());
    this.databasePromise = null;
  }
}

export const documentRepository = new IndexedDbDocumentRepository();

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}
