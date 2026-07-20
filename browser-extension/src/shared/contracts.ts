/* ─────────────────────────────────────────────────────────
   Browser extension data contracts — detection + field
   discovery + mapping.

   These types describe what the extension observes on a live
   ATS page. They are deliberately separate from ApplyMate's
   internal Unified Application Field Contract
   (app/lib/application-fields/contracts.ts) — that contract
   describes ApplyMate's own vocabulary of fields, this one
   describes raw DOM observations. The mapper (src/shared/mapper.ts)
   is the bridge between the two, and imports the real
   NormalizedFieldId / SensitivityCategory types directly rather
   than redefining them.

   Everything here must stay JSON-serializable — instances cross
   the content-script ↔ popup message boundary via
   chrome.runtime/tabs messaging, which structured-clones values.
   ───────────────────────────────────────────────────────── */

import type {
  FieldCategory,
  NormalizedFieldId,
  SensitivityCategory,
} from "../../../app/lib/application-fields/contracts";

/* ── ATS detection ───────────────────────────────────────── */

export type AtsPlatform = "greenhouse" | "lever" | "unsupported";

export interface AtsDetectionResult {
  platform: AtsPlatform;
  confidence: "high" | "medium" | "low";
  /** Human-readable signals that led to this verdict — shown in the panel for transparency. */
  evidence: string[];
}

/* ── Field locators ──────────────────────────────────────── */

export type LocatorStrategy =
  | "id"
  | "name"
  | "data-attribute"
  | "label-association"
  | "css-selector"
  | "structural";

export interface FieldLocator {
  strategy: LocatorStrategy;
  /** The actual selector/value to re-find this element. Meaning depends on strategy:
      id → element id; name → [name="..."] value; data-attribute → "attr=value";
      label-association → the label's `for`/text; css-selector/structural → a full CSS selector. */
  value: string;
  /** True for locators that depend on DOM position (nth-child chains) and may break on re-render. */
  fragile: boolean;
}

/* ── Raw DOM field discovery ─────────────────────────────── */

export type RawFieldTag = "input" | "textarea" | "select" | "button";

export type RawFieldInputType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "textarea"
  | "select"
  | "select-multiple"
  | "radio-group"
  | "checkbox-group"
  | "checkbox"
  | "file"
  | "date"
  | "unknown";

export interface RawFieldOption {
  value: string;
  label: string;
}

/** One interactive field discovered on the live form. Never carries a
    user-entered value — only whether one is present. */
export interface RawDetectedField {
  /** Stable-within-scan synthetic id, used to correlate raw ↔ mapped fields. */
  scanFieldId: string;
  tag: RawFieldTag;
  inputType: RawFieldInputType;
  name: string | null;
  id: string | null;
  label: string | null;
  labelSource:
    | "for-attribute"
    | "wrapping-label"
    | "aria-labelledby"
    | "aria-label"
    | "ats-container"
    | "nearby-question-text"
    | "placeholder"
    | "name-or-id"
    | "none";
  placeholder: string | null;
  ariaLabel: string | null;
  ariaLabelledBy: string | null;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  options: RawFieldOption[];
  /** Whether the field currently holds a value — never the value itself. */
  hasValue: boolean;
  helperText: string | null;
  validationText: string | null;
  sectionHeading: string | null;
  visible: boolean;
  locator: FieldLocator;
  /** Free-form ATS-specific metadata (e.g. Greenhouse question id, Lever card type). */
  atsMetadata: Record<string, string>;
}

/* ── Mapping ──────────────────────────────────────────────── */

export type FieldMappingStatus = "mapped" | "ambiguous" | "unmapped" | "unsupported";
export type MappingConfidence = "high" | "medium" | "low";

/** One discovered field, after mapping into ApplyMate's field vocabulary. */
export interface NormalizedDetectedField {
  raw: RawDetectedField;
  mappingStatus: FieldMappingStatus;
  normalizedField: NormalizedFieldId | null;
  category: FieldCategory | null;
  confidence: MappingConfidence;
  /** Signals that led to this mapping (or lack of one) — e.g. "label matched /e-?mail/", "input type=email". */
  matchedSignals: string[];
  /** Other plausible candidates when status is "ambiguous", most-likely first. */
  alternativeFields: NormalizedFieldId[];
  sensitivity: SensitivityCategory;
  explanation: string;
}

/* ── Page scan ────────────────────────────────────────────── */

export interface ScanCounts {
  total: number;
  mapped: number;
  ambiguous: number;
  unmapped: number;
  unsupported: number;
}

export interface ScanError {
  message: string;
  /** Non-fatal: the scan still returns whatever it found before the error. */
  recoverable: boolean;
}

export interface PageScanResult {
  scannedAt: string; // ISO 8601
  url: string;
  detection: AtsDetectionResult;
  /** Null when no application form/root could be located. */
  formFound: boolean;
  fields: NormalizedDetectedField[];
  counts: ScanCounts;
  errors: ScanError[];
}

export function computeScanCounts(fields: NormalizedDetectedField[]): ScanCounts {
  return {
    total: fields.length,
    mapped: fields.filter((f) => f.mappingStatus === "mapped").length,
    ambiguous: fields.filter((f) => f.mappingStatus === "ambiguous").length,
    unmapped: fields.filter((f) => f.mappingStatus === "unmapped").length,
    unsupported: fields.filter((f) => f.mappingStatus === "unsupported").length,
  };
}
