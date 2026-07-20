/* ─────────────────────────────────────────────────────────
   Typed message passing between the content script and the
   popup panel. No background service worker is involved — the
   popup talks to the content script directly via
   chrome.tabs.sendMessage, which is sufficient for a purely
   read-only, single-tab scanning tool.
   ───────────────────────────────────────────────────────── */

import type { PageScanResult } from "./contracts";

export interface SerializableExtensionError {
  message: string;
  /** True when the page simply isn't a supported ATS — not a bug. */
  unsupportedPage: boolean;
}

export type ExtensionMessage =
  | { type: "SCAN_PAGE" }
  | { type: "GET_SCAN_RESULT" }
  | { type: "SCAN_RESULT"; payload: PageScanResult }
  | { type: "SCAN_ERROR"; error: SerializableExtensionError };

export type ExtensionResponse =
  | { type: "SCAN_RESULT"; payload: PageScanResult }
  | { type: "SCAN_ERROR"; error: SerializableExtensionError };
