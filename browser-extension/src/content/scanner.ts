/* ─────────────────────────────────────────────────────────
   Scan orchestration — pure function from (document, location)
   to a PageScanResult. No chrome.* APIs here, so it's directly
   unit-testable with jsdom fixtures.
   ───────────────────────────────────────────────────────── */

import { detectAts } from "../ats/detect";
import { mapFields } from "../shared/mapper";
import { computeScanCounts, type PageScanResult, type ScanError } from "../shared/contracts";

export function runScan(document: Document, location: Location): PageScanResult {
  const errors: ScanError[] = [];
  const { detection, adapter } = detectAts(document, location);

  if (!adapter) {
    return {
      scannedAt: new Date().toISOString(),
      url: location.href,
      detection,
      formFound: false,
      fields: [],
      counts: computeScanCounts([]),
      errors,
    };
  }

  let formFound = false;
  let fields: PageScanResult["fields"] = [];

  try {
    const root = adapter.findApplicationRoot(document);
    formFound = !!root;
    if (root) {
      const rawFields = adapter.discoverFields(root, document);
      fields = mapFields(rawFields);
    }
  } catch (err) {
    errors.push({
      message: err instanceof Error ? err.message : "Unknown error while scanning the page.",
      recoverable: true,
    });
  }

  return {
    scannedAt: new Date().toISOString(),
    url: location.href,
    detection,
    formFound,
    fields,
    counts: computeScanCounts(fields),
    errors,
  };
}
