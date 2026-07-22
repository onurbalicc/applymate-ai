"use client";

/* ─────────────────────────────────────────────────────────
   Extension bridge — the web app's side of the browser-
   extension connection (browser-extension/src/background/
   index.ts is the other end). Uses `chrome.runtime.sendMessage
   (EXTENSION_ID, ...)`, which Chrome exposes to any page whose
   origin matches the extension's `externally_connectable`
   manifest entry — no content script, no special web API
   beyond what Chrome already provides to matching pages.

   EXTENSION_ID is stable across reloads/rebuilds because the
   extension's manifest.json pins a `key` (see
   browser-extension/manifest.json) — an unpacked extension's id
   is otherwise re-generated per profile, which would break this
   bridge every time the extension was reloaded during
   development. See browser-extension/MANUAL_TESTING.md for how
   this was verified.

   Every call degrades gracefully when the extension isn't
   installed or `chrome.runtime` isn't available at all (most
   users, most of the time, until this ships to the Web Store) —
   callers always get an explicit { ok: false, reason } rather
   than a thrown exception or a hang.
   ───────────────────────────────────────────────────────── */

import type { ExtensionApplicationPayload } from "../extension-payload/contracts";
import type { SerializableDocumentTransfer } from "../documents/contracts";

/** Pinned via browser-extension/manifest.json's `key` field — see the
    file header. Override via NEXT_PUBLIC_APPLYMATE_EXTENSION_ID for a
    differently-signed build (e.g. once published to the Chrome Web
    Store, which assigns its own id unrelated to the manifest key). */
export const APPLYMATE_EXTENSION_ID =
  process.env.NEXT_PUBLIC_APPLYMATE_EXTENSION_ID || "bhmjneikkldlmlkcgkkbpacnfgijnkac";

const MESSAGE_TIMEOUT_MS = 5000;

interface ChromeRuntimeLike {
  sendMessage: (
    extensionId: string,
    message: unknown,
    callback: (response: unknown) => void
  ) => void;
  lastError?: { message?: string };
}

function getChromeRuntime(): ChromeRuntimeLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { chrome?: { runtime?: ChromeRuntimeLike } };
  return w.chrome?.runtime ?? null;
}

export type BridgeResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function sendToExtension<T>(message: unknown): Promise<BridgeResult<T>> {
  const runtime = getChromeRuntime();
  if (!runtime) {
    return Promise.resolve({ ok: false, reason: "extension-not-detected" });
  }
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ ok: false, reason: "timeout" }), MESSAGE_TIMEOUT_MS);
    try {
      runtime.sendMessage(APPLYMATE_EXTENSION_ID, message, (response) => {
        clearTimeout(timeout);
        if (runtime.lastError) {
          resolve({ ok: false, reason: runtime.lastError.message ?? "extension-not-detected" });
          return;
        }
        if (!response) {
          resolve({ ok: false, reason: "no-response" });
          return;
        }
        resolve({ ok: true, data: response as T });
      });
    } catch (err) {
      clearTimeout(timeout);
      resolve({ ok: false, reason: err instanceof Error ? err.message : "unknown-error" });
    }
  });
}

export async function authorizeExecution(
  payload: ExtensionApplicationPayload,
  options: { dryRun?: boolean; documents?: SerializableDocumentTransfer[] } = {}
): Promise<BridgeResult<{ authorizationId: string; reused?: boolean }>> {
  const authorized = await sendToExtension<{ ok: boolean; authorizationId?: string; attemptId?: string; reused?: boolean; error?: string }>({
    type: "AUTHORIZE_EXECUTION",
    payload,
    dryRun: options.dryRun ?? false,
  });
  if (!authorized.ok) return authorized;
  if (!authorized.data.ok || !authorized.data.authorizationId) {
    return { ok: false, reason: authorized.data.error ?? "authorization-rejected" };
  }

  // Bytes travel separately from the persisted execution payload and are
  // retained by the extension only in memory for this exact attempt.
  const provided = await sendToExtension<{ ok: boolean; error?: string }>({
    type: "PROVIDE_AUTHORIZED_DOCUMENTS",
    authorizationId: payload.authorization.authorizationId,
    attemptId: authorized.data.attemptId ?? payload.authorization.attemptId,
    documents: options.documents ?? [],
    dryRun: options.dryRun ?? false,
  });
  if (!provided.ok) return provided;
  if (!provided.data.ok) return { ok: false, reason: provided.data.error ?? "document-transfer-rejected" };
  return { ok: true, data: { authorizationId: authorized.data.authorizationId, reused: authorized.data.reused } };
}

export interface StoredExecutionRecord {
  authorizationId: string;
  stage: string;
  submissionOutcome: string | null;
  reviewRequired: { kind: string; description: string; requiredAction: string; question?: string } | null;
  log: { stage: string; timestamp: string; message: string }[];
  updatedAt: string;
  documentResults: {
    documentId?: string;
    kind: "resume" | "coverLetter";
    fileName?: string;
    status: string;
    error?: string;
  }[];
}

export function getExecutionStatus(authorizationId: string): Promise<BridgeResult<StoredExecutionRecord>> {
  return sendToExtension<{ ok: boolean; record?: StoredExecutionRecord; error?: string }>({
    type: "GET_EXECUTION_STATUS",
    authorizationId,
  }).then((res) => {
    if (!res.ok) return res;
    if (!res.data.ok || !res.data.record) return { ok: false, reason: res.data.error ?? "not-found" };
    return { ok: true, data: res.data.record };
  });
}

export function stopExecution(authorizationId: string): Promise<BridgeResult<{ ok: boolean }>> {
  return sendToExtension({ type: "STOP_EXECUTION", authorizationId });
}

export function retryExecution(
  payload: ExtensionApplicationPayload,
  documents: SerializableDocumentTransfer[]
): Promise<BridgeResult<{ ok: boolean }>> {
  return sendToExtension({
    type: "RETRY_EXECUTION",
    authorizationId: payload.authorization.authorizationId,
    attemptId: payload.authorization.attemptId,
    payload,
    documents,
  });
}
