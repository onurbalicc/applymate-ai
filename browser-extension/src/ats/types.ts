import type { AtsDetectionResult, RawDetectedField } from "../shared/contracts";

/** One implementation per supported ATS. Kept intentionally small —
    shared DOM behavior lives in shared/dom-utils.ts; only genuinely
    ATS-specific selectors/normalization live in the adapter itself. */
export interface AtsAdapter {
  platform: "greenhouse" | "lever";
  detect(document: Document, location: Location): AtsDetectionResult;
  findApplicationRoot(document: Document): HTMLElement | null;
  discoverFields(root: HTMLElement, document: Document): RawDetectedField[];
}
