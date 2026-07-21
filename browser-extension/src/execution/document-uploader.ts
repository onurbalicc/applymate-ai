/* ─────────────────────────────────────────────────────────
   Document uploader — résumé and cover-letter file upload (§9).

   Honest limitation, stated up front: ApplyMate does not
   generate or store an actual résumé/cover-letter FILE
   anywhere today (see docs/auto-apply-architecture.md and
   ExtensionApplicationPayload.documents — resumeFileAvailable
   and coverLetterFileAvailable are always false in the current
   product). This module therefore always reports
   `"not-available"` for both today, which the execution engine
   correctly turns into a review-required application rather
   than skipping the upload silently or fabricating one.

   The actual upload TECHNIQUE below is real, working code —
   File inputs cannot have `.files` assigned directly (browsers
   block scripted file selection for security), but a synthetic
   File can be attached via the DataTransfer API, which native
   inputs do accept. This is what will be used the moment a real
   résumé file exists to hand it (see `resolveDocumentSource`'s
   single TODO-shaped seam) — nothing else in this module needs
   to change.
   ───────────────────────────────────────────────────────── */

import type { ExtensionApplicationPayload } from "../../../app/lib/extension-payload/contracts";
import type { NormalizedDetectedField } from "../shared/contracts";
import { locateElement } from "./field-filler";
import type { DocumentKind, DocumentUploadResult } from "./execution-types";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
/** Conservative — below every major ATS's documented limit (Greenhouse:
    100MB technically, but their UX and most others target well under 10MB;
    this is a sanity check, not an authoritative per-ATS limit). */
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export interface DocumentSource {
  file: File;
}

/**
 * Resolve the actual file to upload for one document kind, per the
 * fallback order in §9: job-specific → default verified → generated →
 * none. Returns null when nothing exists to upload — callers must never
 * invent a file, and this repo has no résumé/cover-letter file storage
 * yet, so this always returns null today. Kept as its own function (not
 * inlined) so wiring in a real file source later is a one-place change.
 */
export function resolveDocumentSource(
  kind: DocumentKind,
  payload: ExtensionApplicationPayload
): DocumentSource | null {
  const available = kind === "resume" ? payload.documents.resumeFileAvailable : payload.documents.coverLetterFileAvailable;
  if (!available) return null;
  // No code path can reach here today — resumeFileAvailable/
  // coverLetterFileAvailable are always false (see file header). This
  // branch exists so the real upload technique below is exercised by
  // tests today and requires no changes once a file source ships.
  return null;
}

function isAllowedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext)) && file.size > 0 && file.size <= MAX_SIZE_BYTES;
}

/** Attach a File to a native `<input type="file">` via the DataTransfer
    API and dispatch the events a real file-picker selection would
    produce. Scripted assignment to `.files` is not possible any other
    way in a standards-compliant browser. */
export function attachFileToInput(input: HTMLInputElement, file: File): void {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Upload one document. Never fabricates a file: when no verified source
 * exists (`resolveDocumentSource` returns null — always true today), the
 * result is honestly "not-available", which the execution engine routes
 * to review-required for any application whose form requires it.
 */
export function uploadDocument(
  field: NormalizedDetectedField | null,
  kind: DocumentKind,
  payload: ExtensionApplicationPayload,
  doc: Document
): DocumentUploadResult {
  if (!field) {
    return { kind, status: "skipped-no-field" };
  }

  const source = resolveDocumentSource(kind, payload);
  if (!source) {
    return { kind, status: "not-available", fieldId: field.raw.scanFieldId };
  }

  if (!isAllowedFile(source.file)) {
    return {
      kind,
      status: "failed",
      fieldId: field.raw.scanFieldId,
      error: `File "${source.file.name}" is not an allowed type/size for upload.`,
    };
  }

  const input = locateElement(field, doc) as HTMLInputElement | null;
  if (!input || input.type !== "file") {
    return { kind, status: "failed", fieldId: field.raw.scanFieldId, error: "Could not re-locate the file input on the live page." };
  }

  try {
    attachFileToInput(input, source.file);
    return { kind, status: "uploaded", fieldId: field.raw.scanFieldId };
  } catch (err) {
    return {
      kind,
      status: "failed",
      fieldId: field.raw.scanFieldId,
      error: err instanceof Error ? err.message : "Unknown upload error.",
    };
  }
}
