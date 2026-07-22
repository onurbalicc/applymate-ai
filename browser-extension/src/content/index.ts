/* ─────────────────────────────────────────────────────────
   Content script entry point.

   Lifecycle:
   1. Delayed initial scan (many ATS forms render client-side
      after the base document is idle — scanning immediately
      would miss fields).
   2. A debounced MutationObserver re-scans when the page's DOM
      changes meaningfully (e.g. async question list, react
      re-render) — never on every mutation, and never more than
      once per debounce window.
   3. Responds to SCAN_PAGE / GET_SCAN_RESULT messages from the
      popup panel with the latest PageScanResult.

   This script only reads the DOM. It never sets a value,
   clicks anything, or submits any form.
   ───────────────────────────────────────────────────────── */

import type { ExtensionMessage } from "../shared/messages";
import type { PageScanResult } from "../shared/contracts";
import { debounce } from "../shared/dom-utils";
import { runScan } from "./scanner";
import { runExecution } from "../execution/execution-engine";
import type { ExtensionApplicationPayload } from "../../../app/lib/extension-payload/contracts";
import type { ExecutionResult, ExecutionStage } from "../execution/execution-types";

const INITIAL_SCAN_DELAY_MS = 800;
const MUTATION_DEBOUNCE_MS = 1000;

let latestResult: PageScanResult | null = null;
const activeExecutions = new Map<string, AbortController>();

function scanNow(): PageScanResult {
  latestResult = runScan(document, window.location);
  return latestResult;
}

function scheduleInitialScan(): void {
  window.setTimeout(scanNow, INITIAL_SCAN_DELAY_MS);
}

function observeForRescans(): void {
  const debouncedRescan = debounce(() => {
    scanNow();
  }, MUTATION_DEBOUNCE_MS);

  const observer = new MutationObserver((mutations) => {
    // Ignore mutations the scanner itself can never have caused (it makes
    // none) and skip trivial noise like text-node updates inside already
    //-scanned inputs; only childList changes are worth a re-scan.
    const meaningful = mutations.some((m) => m.type === "childList" && (m.addedNodes.length > 0 || m.removedNodes.length > 0));
    if (meaningful) debouncedRescan();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function handleMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: ExtensionMessage) => void
): boolean {
  if (message.type === "SCAN_PAGE") {
    try {
      sendResponse({ type: "SCAN_RESULT", payload: scanNow() });
    } catch (err) {
      sendResponse({
        type: "SCAN_ERROR",
        error: { message: err instanceof Error ? err.message : "Scan failed.", unsupportedPage: false },
      });
    }
    return true;
  }

  if (message.type === "GET_SCAN_RESULT") {
    if (latestResult) {
      sendResponse({ type: "SCAN_RESULT", payload: latestResult });
    } else {
      try {
        sendResponse({ type: "SCAN_RESULT", payload: scanNow() });
      } catch (err) {
        sendResponse({
          type: "SCAN_ERROR",
          error: { message: err instanceof Error ? err.message : "Scan failed.", unsupportedPage: false },
        });
      }
    }
    return true;
  }

  if (message.type === "RUN_EXECUTION") {
    sendResponse({ type: "EXECUTION_STARTED" });
    const payload = message.payload as ExtensionApplicationPayload;
    const controller = new AbortController();
    activeExecutions.get(payload.authorization.authorizationId)?.abort();
    activeExecutions.set(payload.authorization.authorizationId, controller);
    void runExecutionAndReport(
      payload,
      message.attemptId,
      message.previousAttemptIds,
      message.dryRun,
      message.documents,
      controller.signal
    );
    return true;
  }

  if (message.type === "CANCEL_EXECUTION") {
    activeExecutions.get(message.authorizationId)?.abort();
    activeExecutions.delete(message.authorizationId);
    sendResponse({ type: "EXECUTION_STARTED" });
    return true;
  }

  return false;
}

/** Runs the execution engine and relays progress + the final result to
    the background worker, which is the only thing keeping state the web
    app can poll (see background/index.ts) — the content script itself
    holds no execution state beyond the single run in flight. */
async function runExecutionAndReport(
  payload: ExtensionApplicationPayload,
  attemptId: string,
  previousAttemptIds: string[],
  dryRun: boolean,
  documents: import("../../../app/lib/documents/contracts").SerializableDocumentTransfer[],
  signal: AbortSignal
): Promise<void> {
  const reportProgress = (stage: ExecutionStage, msg: string) => {
    chrome.runtime.sendMessage({
      type: "EXECUTION_PROGRESS",
      authorizationId: payload.authorization.authorizationId,
      stage,
      message: msg,
    });
  };

  reportProgress("OPENING_APPLICATION", "Content script ready — starting execution.");

  let result: ExecutionResult;
  try {
    result = await runExecution(payload, document, window.location, { dryRun, attemptId, previousAttemptIds, documents, signal });
  } catch (err) {
    result = {
      authorizationId: payload.authorization.authorizationId,
      stage: "REVIEW_REQUIRED",
      fields: [],
      documents: [],
      readiness: null,
      submissionOutcome: null,
      reviewRequired: {
        kind: "unsupported-ats-interaction",
        description: err instanceof Error ? err.message : "Unknown execution error.",
        requiredAction: "Complete this application manually.",
      },
      log: [],
    };
  }

  chrome.runtime.sendMessage({
    type: "EXECUTION_RESULT",
    authorizationId: result.authorizationId,
    stage: result.stage,
    submissionOutcome: result.submissionOutcome,
    reviewRequired: result.reviewRequired,
    log: result.log,
    documents: result.documents,
  });
  activeExecutions.delete(payload.authorization.authorizationId);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return handleMessage(message as ExtensionMessage, sender, sendResponse);
});

scheduleInitialScan();
observeForRescans();
