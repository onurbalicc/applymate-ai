"use client";

import { useEffect, useRef, useState } from "react";
import type { CandidateDocumentMetadata, CandidateDocumentType } from "@/app/lib/documents/contracts";
import {
  DocumentStoreError,
  documentRepository,
  fileToArrayBuffer,
} from "@/app/lib/documents/document-store";
import { DocumentValidationError } from "@/app/lib/documents/validation";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function readableError(error: unknown): string {
  if (error instanceof DocumentValidationError || error instanceof DocumentStoreError) return error.message;
  return error instanceof Error ? error.message : "The document could not be saved.";
}

interface DocumentSlotProps {
  type: CandidateDocumentType;
  title: string;
  description: string;
  optional?: boolean;
  document?: CandidateDocumentMetadata;
  busy: boolean;
  onUpload: (file: File, type: CandidateDocumentType) => Promise<void>;
  onRemove: (documentId: string) => Promise<void>;
}

function DocumentSlot({
  type,
  title,
  description,
  optional,
  document,
  busy,
  onUpload,
  onRemove,
}: DocumentSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl p-4" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-raised)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
            {optional && (
              <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full" style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                Optional
              </span>
            )}
          </div>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{description}</p>
        </div>
        <span aria-hidden className="text-lg">{type === "resume" ? "▤" : "✉"}</span>
      </div>

      {document ? (
        <div className="rounded-lg px-3 py-2.5 mb-3" style={{ background: "var(--surface-inset, rgba(0,0,0,0.12))", border: "1px solid var(--border-subtle)" }}>
          <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{document.fileName}</p>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
            {document.mimeType === "application/pdf" ? "PDF" : "DOCX"} · {formatBytes(document.sizeBytes)} · saved {formatDate(document.updatedAt)}
          </p>
        </div>
      ) : (
        <div className="rounded-lg px-3 py-3 mb-3 text-[11px]" style={{ color: "var(--text-muted)", border: "1px dashed var(--border-mid)" }}>
          No document stored.
        </div>
      )}

      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void onUpload(file, type);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="dash-btn dash-btn--outline text-[11px]"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Saving…" : document ? `Replace ${type === "resume" ? "résumé" : "cover letter"}` : "Choose PDF or DOCX"}
        </button>
        {document && (
          <button
            type="button"
            className="dash-btn dash-btn--ghost text-[11px]"
            disabled={busy}
            onClick={() => void onRemove(document.documentId)}
            style={{ color: "#f87171" }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<CandidateDocumentMetadata[]>([]);
  const [busyType, setBusyType] = useState<CandidateDocumentType | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function refresh() {
    try {
      setDocuments(await documentRepository.listDocuments());
    } catch (error) {
      setMessage({ kind: "error", text: readableError(error) });
    }
  }

  useEffect(() => {
    let cancelled = false;
    void documentRepository.listDocuments().then(
      (storedDocuments) => {
        if (!cancelled) setDocuments(storedDocuments);
      },
      (error: unknown) => {
        if (!cancelled) setMessage({ kind: "error", text: readableError(error) });
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  async function upload(file: File, type: CandidateDocumentType) {
    const previousDefault = documents.find((document) => document.type === type && document.isDefault);
    setBusyType(type);
    setMessage(null);
    try {
      const bytes = await fileToArrayBuffer(file);
      const savedDocument = await documentRepository.saveDocument({
        bytes,
        fileName: file.name,
        mimeType: file.type,
        type,
        source: "default",
        isDefault: true,
      });
      if (previousDefault && previousDefault.documentId !== savedDocument.documentId) {
        await documentRepository.deleteDocument(previousDefault.documentId);
      }
      await refresh();
      setMessage({ kind: "success", text: `${type === "resume" ? "Résumé" : "Cover letter"} saved locally in this browser.` });
    } catch (error) {
      if (error instanceof DocumentStoreError && error.code === "duplicate-file" && error.existingDocument) {
        await documentRepository.markDefault(error.existingDocument.documentId);
        if (previousDefault && previousDefault.documentId !== error.existingDocument.documentId) {
          await documentRepository.deleteDocument(previousDefault.documentId);
        }
        await refresh();
        setMessage({ kind: "success", text: "That document was already stored and is now the default." });
      } else {
        setMessage({ kind: "error", text: readableError(error) });
      }
    } finally {
      setBusyType(null);
    }
  }

  async function remove(documentId: string) {
    const document = documents.find((item) => item.documentId === documentId);
    if (!document) return;
    setBusyType(document.type);
    setMessage(null);
    try {
      await documentRepository.deleteDocument(documentId);
      await refresh();
      setMessage({ kind: "success", text: "Document removed from this browser." });
    } catch (error) {
      setMessage({ kind: "error", text: readableError(error) });
    } finally {
      setBusyType(null);
    }
  }

  const defaultResume = documents.find((document) => document.type === "resume" && document.isDefault);
  const defaultCoverLetter = documents.find((document) => document.type === "cover-letter" && document.isDefault);

  return (
    <section id="documents">
      <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Application documents</h2>
      <div className="dash-panel p-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Save your default application files once. ApplyMate uses them when no job-specific document exists.
            </p>
            <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
              Stored only in this browser for the MVP. Clearing browser data may remove these files; this is not cloud backup.
            </p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ color: "#93c5fd", background: "var(--blue-dim)", border: "1px solid rgba(59,130,246,0.18)" }}>
            Local storage
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DocumentSlot
            type="resume"
            title="Default résumé"
            description="Used when no job-specific résumé exists"
            document={defaultResume}
            busy={busyType === "resume"}
            onUpload={upload}
            onRemove={remove}
          />
          <DocumentSlot
            type="cover-letter"
            title="Default cover letter"
            description="Used only when the application needs a cover-letter file"
            optional
            document={defaultCoverLetter}
            busy={busyType === "cover-letter"}
            onUpload={upload}
            onRemove={remove}
          />
        </div>

        {message && (
          <div
            role={message.kind === "error" ? "alert" : "status"}
            className="rounded-lg px-3 py-2.5 text-[11px] mt-3"
            style={message.kind === "error"
              ? { color: "#fca5a5", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)" }
              : { color: "#4ade80", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)" }}
          >
            {message.text}
          </div>
        )}
      </div>
    </section>
  );
}
