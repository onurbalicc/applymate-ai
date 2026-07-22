import type {
  ApplicationDocumentSelection,
  CandidateDocumentMetadata,
  CandidateDocumentType,
  SelectedApplicationDocument,
} from "./contracts";

export interface DocumentSelectionInput {
  jobId: string;
  applicationPackageId?: string;
  selectedResumeDocumentId?: string;
  selectedCoverLetterDocumentId?: string;
  resolvedAt?: string;
}

function frozen(
  document: CandidateDocumentMetadata,
  reason: SelectedApplicationDocument["selectionReason"]
): SelectedApplicationDocument {
  return {
    documentId: document.documentId,
    type: document.type,
    fileName: document.fileName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    checksum: document.checksum,
    selectionReason: reason,
  };
}

function selectOne(
  type: CandidateDocumentType,
  documents: CandidateDocumentMetadata[],
  input: DocumentSelectionInput,
  explicitId?: string
): SelectedApplicationDocument | undefined {
  const generated = documents.find((document) =>
    document.type === type &&
    document.source === "generated" &&
    document.jobId === input.jobId &&
    (!document.applicationPackageId || !input.applicationPackageId || document.applicationPackageId === input.applicationPackageId)
  );
  if (generated) return frozen(generated, "job-specific-generated");

  if (explicitId) {
    const selected = documents.find((document) => document.documentId === explicitId && document.type === type);
    if (selected) {
      if (selected.jobId && selected.jobId !== input.jobId) {
        throw new Error(`Selected ${type} belongs to a different job.`);
      }
      if (selected.applicationPackageId && input.applicationPackageId && selected.applicationPackageId !== input.applicationPackageId) {
        throw new Error(`Selected ${type} belongs to a different application package.`);
      }
      return frozen(selected, "job-specific-user-selected");
    }
  }

  const defaultDocument = documents.find((document) => document.type === type && document.isDefault && !document.jobId);
  return defaultDocument ? frozen(defaultDocument, "default") : undefined;
}

export function selectApplicationDocuments(
  documents: CandidateDocumentMetadata[],
  input: DocumentSelectionInput
): ApplicationDocumentSelection {
  return {
    resolvedAt: input.resolvedAt ?? new Date().toISOString(),
    resume: selectOne("resume", documents, input, input.selectedResumeDocumentId),
    coverLetter: selectOne("cover-letter", documents, input, input.selectedCoverLetterDocumentId),
  };
}

