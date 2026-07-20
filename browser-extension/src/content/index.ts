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

const INITIAL_SCAN_DELAY_MS = 800;
const MUTATION_DEBOUNCE_MS = 1000;

let latestResult: PageScanResult | null = null;

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

  return false;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return handleMessage(message as ExtensionMessage, sender, sendResponse);
});

scheduleInitialScan();
observeForRescans();
