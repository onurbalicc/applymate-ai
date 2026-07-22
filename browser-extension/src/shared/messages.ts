/* ─────────────────────────────────────────────────────────
   Typed message passing between the content script, the popup
   panel, and (Part 2) the background service worker.

   Popup ↔ content script: direct chrome.tabs.sendMessage, same
   as Part 1 — read-only scanning never needed a background
   script in the loop.

   Background → content script: RUN_EXECUTION, sent once the
   authorized application tab finishes loading (see
   background/index.ts) — the user never has to open the popup
   for autonomous execution to start (§17).

   Content script → background: EXECUTION_PROGRESS/EXECUTION_
   RESULT, defined and sent directly in content/index.ts
   (background/index.ts's own internal message types mirror
   these; kept in that file rather than duplicated here since
   only the background worker consumes them).
   ───────────────────────────────────────────────────────── */

import type { PageScanResult } from "./contracts";
import type { ExecutionResult } from "../execution/execution-types";
import type { SerializableDocumentTransfer } from "../../../app/lib/documents/contracts";

export interface SerializableExtensionError {
  message: string;
  /** True when the page simply isn't a supported ATS — not a bug. */
  unsupportedPage: boolean;
}

export type ExtensionMessage =
  | { type: "SCAN_PAGE" }
  | { type: "GET_SCAN_RESULT" }
  | { type: "SCAN_RESULT"; payload: PageScanResult }
  | { type: "SCAN_ERROR"; error: SerializableExtensionError }
  | {
      type: "RUN_EXECUTION";
      // Untyped at the message-passing boundary on purpose: the payload
      // crosses from the web app (external message) through the
      // background worker to here, and re-importing app/lib's full
      // ExtensionApplicationPayload type here would be redundant with
      // execution-engine.ts, which validates its real shape at the only
      // point that matters — where it's actually used.
      payload: unknown;
      attemptId: string;
      previousAttemptIds: string[];
      dryRun: boolean;
      documents: SerializableDocumentTransfer[];
    }
  | { type: "EXECUTION_STARTED" }
  | { type: "CANCEL_EXECUTION"; authorizationId: string }
  | { type: "EXECUTION_DONE"; result: ExecutionResult };

export type ExtensionResponse =
  | { type: "SCAN_RESULT"; payload: PageScanResult }
  | { type: "SCAN_ERROR"; error: SerializableExtensionError }
  | { type: "EXECUTION_STARTED" }
  | { type: "EXECUTION_DONE"; result: ExecutionResult };
