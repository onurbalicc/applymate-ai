export type CandidateDocumentType = "resume" | "cover-letter";

export type CandidateDocumentSource =
  | "user-upload"
  | "generated"
  | "default"
  | "job-specific";

export interface CandidateDocumentMetadata {
  documentId: string;
  candidateProfileId: string;
  type: CandidateDocumentType;
  source: CandidateDocumentSource;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  checksum: string;
  isDefault: boolean;
  jobId?: string;
  applicationPackageId?: string;
}

export interface StoredCandidateDocument {
  metadata: CandidateDocumentMetadata;
  bytes: ArrayBuffer;
}

export interface SelectedApplicationDocument {
  documentId: string;
  type: CandidateDocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  selectionReason:
    | "job-specific-generated"
    | "job-specific-user-selected"
    | "default";
}

/** Frozen into an AutomationJob at authorization time. It contains only
    stable references and display-safe metadata, never document bytes. */
export interface ApplicationDocumentSelection {
  resolvedAt: string;
  resume?: SelectedApplicationDocument;
  coverLetter?: SelectedApplicationDocument;
}

/** Short-lived message representation used only while one authorized
    attempt is crossing from the web app to the extension. Never persist it
    in localStorage, Tracker state, or chrome.storage.local. */
export interface SerializableDocumentTransfer {
  documentId: string;
  type: CandidateDocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  base64: string;
}

export const LOCAL_CANDIDATE_PROFILE_ID = "local-candidate-profile";

