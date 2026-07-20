/* ─────────────────────────────────────────────────────────
   Generic, ATS-agnostic DOM utilities.

   Nothing in this file knows about Greenhouse or Lever. ATS
   adapters call into these helpers and layer their own
   selectors/normalization on top.
   ───────────────────────────────────────────────────────── */

import type {
  FieldLocator,
  RawDetectedField,
  RawFieldInputType,
  RawFieldOption,
  RawFieldTag,
} from "./contracts";

/* ── Visibility ───────────────────────────────────────────── */

/** Best-effort "is this actually shown to the user" check. Not perfect
    (can't detect off-screen-but-technically-visible tricks) but good
    enough to filter template/hidden clutter out of a scan. */
export function isVisible(el: Element): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  return true;
}

/* ── Text helpers ─────────────────────────────────────────── */

export function cleanText(text: string | null | undefined): string | null {
  if (!text) return null;
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** A resolved label is a short question/field name, never a paragraph —
    caught live on Lever/Greenhouse pages where a label container also held
    dynamic upload-status text ("Analyzing resume...Success!") or full EEO
    option descriptions. Truncating here keeps that unrelated page copy out
    of the scan result rather than trying to enumerate every noisy widget. */
const MAX_LABEL_LENGTH = 200;

function capLabel(text: string): string {
  return text.length > MAX_LABEL_LENGTH ? `${text.slice(0, MAX_LABEL_LENGTH).trim()}…` : text;
}

/** Elements commonly nested inside a label/question container that describe
    transient widget state (upload progress, async search results, inline
    validation) rather than the field's actual label — stripped before
    reading textContent so that state text never gets reported as a label. */
const LABEL_NOISE_SELECTOR =
  '[role="status"], [role="alert"], [aria-live], [class*="status"], [class*="loading"], ' +
  '[class*="progress"], [class*="hint"], [class*="description"], [class*="helper"], ' +
  '[class*="error"], [class*="no-results"], [class*="empty-state"], [class*="upload"]';

/** Clone `el`, strip form controls and known widget-noise elements, and
    return cleaned/capped text — shared by every label-resolution step that
    reads a container's textContent. */
function extractCleanLabelText(el: Element): string | null {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(`input, select, textarea, button, ${LABEL_NOISE_SELECTOR}`).forEach((n) => n.remove());
  const text = cleanText(clone.textContent);
  return text ? capLabel(text) : null;
}

/* ── Label resolution ─────────────────────────────────────── */

export interface LabelResolution {
  label: string | null;
  source:
    | "for-attribute"
    | "wrapping-label"
    | "aria-labelledby"
    | "aria-label"
    | "ats-container"
    | "nearby-question-text"
    | "placeholder"
    | "name-or-id"
    | "none";
}

/**
 * Resolve a human-readable label for a form control using the priority
 * order from AGENTS.md §4: for-attribute → wrapping label → aria-labelledby
 * → aria-label → ATS-specific container → nearby question text →
 * placeholder → name/id fallback.
 *
 * `atsLabelSelectors` lets an adapter supply ATS-specific containers
 * (e.g. Greenhouse's `.field label`, Lever's `.application-label`)
 * without this function knowing anything about a specific ATS.
 */
export function resolveLabel(
  el: HTMLElement,
  doc: Document,
  atsLabelSelectors: string[] = [],
  /** Radio/checkbox group representatives: skip steps 1–4, which resolve to
      the individual OPTION's own label ("Yes"/"No") rather than the
      question the group is asking. The question text lives in the
      surrounding container, found by steps 5–6 instead. */
  skipDirectAssociation = false
): LabelResolution {
  // 1. Explicit <label for="id">
  const id = el.id;
  if (!skipDirectAssociation && id) {
    const forLabel = doc.querySelector(`label[for="${cssEscape(id)}"]`);
    const text = forLabel ? extractCleanLabelText(forLabel) : null;
    if (text) return { label: text, source: "for-attribute" };
  }

  // 2. Wrapping <label>
  const wrapping = !skipDirectAssociation ? el.closest("label") : null;
  if (wrapping) {
    const text = extractCleanLabelText(wrapping);
    if (text) return { label: text, source: "wrapping-label" };
  }

  // 3. aria-labelledby
  const labelledBy = !skipDirectAssociation ? el.getAttribute("aria-labelledby") : null;
  if (labelledBy) {
    const parts = labelledBy
      .split(/\s+/)
      .map((refId) => cleanText(doc.getElementById(refId)?.textContent))
      .filter((t): t is string => !!t);
    if (parts.length > 0) return { label: parts.join(" "), source: "aria-labelledby" };
  }

  // 4. aria-label
  const ariaLabel = !skipDirectAssociation ? cleanText(el.getAttribute("aria-label")) : null;
  if (ariaLabel) return { label: ariaLabel, source: "aria-label" };

  // 5. ATS-specific label containers, scoped to the nearest reasonable ancestor
  const container = el.closest("[class]") ?? el.parentElement;
  if (container) {
    for (const selector of atsLabelSelectors) {
      const found = container.querySelector(selector);
      const text = found ? extractCleanLabelText(found) : null;
      if (text) return { label: text, source: "ats-container" };
    }
  }

  // 6. Nearby question text — closest heading-like or question-like sibling above the field
  const nearby = findNearbyQuestionText(el);
  if (nearby) return { label: nearby, source: "nearby-question-text" };

  // 7. Placeholder
  const placeholder = cleanText(el.getAttribute("placeholder"));
  if (placeholder) return { label: placeholder, source: "placeholder" };

  // 8. Name or id as last resort
  const fallback = cleanText(el.getAttribute("name")) ?? cleanText(el.id);
  if (fallback) return { label: humanizeIdentifier(fallback), source: "name-or-id" };

  return { label: null, source: "none" };
}

/** Walks up a few ancestor levels looking for a heading/question-like
    text node that precedes the field but isn't itself a form control. */
function findNearbyQuestionText(el: HTMLElement): string | null {
  let scope: HTMLElement | null = el.parentElement;
  for (let depth = 0; scope && depth < 3; depth++, scope = scope.parentElement) {
    const candidates = Array.from(
      scope.querySelectorAll("label, p, span, div, legend, h1, h2, h3, h4, h5, h6")
    ) as HTMLElement[];
    for (const candidate of candidates) {
      if (candidate.contains(el)) continue;
      if (candidate.querySelector("input, select, textarea, button")) continue;
      const text = cleanText(candidate.textContent);
      if (text && text.length < 200) return text;
    }
  }
  return null;
}

function humanizeIdentifier(raw: string): string {
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

/* ── Nearby helper / validation text / section headings ──── */

export function findHelperText(el: HTMLElement): string | null {
  const describedBy = el.getAttribute("aria-describedby");
  if (describedBy) {
    const text = cleanText(el.ownerDocument.getElementById(describedBy)?.textContent);
    if (text) return text;
  }
  const container = el.closest("[class]") ?? el.parentElement;
  const helper = container?.querySelector(
    '.helper-text, .help-text, .field-description, [class*="hint"], [class*="description"]'
  );
  return cleanText(helper?.textContent) ?? null;
}

export function findValidationText(el: HTMLElement): string | null {
  const container = el.closest("[class]") ?? el.parentElement;
  const validation = container?.querySelector(
    '.error, .error-message, [role="alert"], [class*="invalid"], [class*="validation"]'
  );
  return cleanText(validation?.textContent) ?? null;
}

export function findSectionHeading(el: HTMLElement, root: HTMLElement): string | null {
  let node: Element | null = el;
  while (node && node !== root) {
    let sibling: Element | null = node.previousElementSibling;
    while (sibling) {
      if (/^H[1-6]$/.test(sibling.tagName) || sibling.matches('[class*="section-title"], [class*="section-header"]')) {
        const text = cleanText(sibling.textContent);
        if (text) return text;
      }
      sibling = sibling.previousElementSibling;
    }
    node = node.parentElement;
  }
  return null;
}

/* ── Locator generation (priority order per AGENTS.md §10) ─ */

export function buildLocator(el: HTMLElement): FieldLocator {
  const id = el.id?.trim();
  if (id && isLikelyStable(id)) {
    return { strategy: "id", value: id, fragile: false };
  }

  const name = el.getAttribute("name")?.trim();
  if (name) {
    return { strategy: "name", value: name, fragile: false };
  }

  const dataAttr = findStableDataAttribute(el);
  if (dataAttr) {
    return { strategy: "data-attribute", value: `${dataAttr.name}=${dataAttr.value}`, fragile: false };
  }

  if (id) {
    // id exists but looked auto-generated/unstable — still useful, just flagged.
    return { strategy: "id", value: id, fragile: true };
  }

  const labelFor = findAssociatedLabelSelector(el);
  if (labelFor) {
    return { strategy: "label-association", value: labelFor, fragile: false };
  }

  const scopedSelector = buildScopedSelector(el);
  if (scopedSelector) {
    return { strategy: "css-selector", value: scopedSelector, fragile: false };
  }

  return { strategy: "structural", value: buildStructuralSelector(el), fragile: true };
}

/** Auto-generated ids (react-id-3, :r4:, ember482) look unstable across renders. */
function isLikelyStable(id: string): boolean {
  return !/^(react-|:r|ember\d|:R)/.test(id) && !/^\d+$/.test(id);
}

function findStableDataAttribute(el: HTMLElement): { name: string; value: string } | null {
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("data-") && attr.value && attr.name !== "data-reactid") {
      return { name: attr.name, value: attr.value };
    }
  }
  return null;
}

function findAssociatedLabelSelector(el: HTMLElement): string | null {
  const wrapping = el.closest("label");
  if (wrapping) {
    const text = cleanText(wrapping.textContent);
    if (text) return `label:has-text("${text.slice(0, 60)}")`;
  }
  return null;
}

/** A CSS selector scoped by the nearest ancestor with a class name, using
    tag + type + position among same-type siblings (more stable than a
    full nth-child chain from the root). */
function buildScopedSelector(el: HTMLElement): string | null {
  const container = el.closest("[class]");
  if (!container) return null;
  const containerSelector = `.${Array.from(container.classList)[0]}`;
  const tag = el.tagName.toLowerCase();
  const type = el.getAttribute("type");
  const typeSelector = type ? `${tag}[type="${type}"]` : tag;
  const siblings = Array.from(container.querySelectorAll(typeSelector));
  const index = siblings.indexOf(el);
  if (siblings.length === 1) return `${containerSelector} ${typeSelector}`;
  if (index >= 0) return `${containerSelector} ${typeSelector}:nth-of-type(${index + 1})`;
  return null;
}

function buildStructuralSelector(el: HTMLElement): string {
  const parts: string[] = [];
  let node: HTMLElement | null = el;
  for (let depth = 0; node && depth < 5; depth++, node = node.parentElement) {
    const parent = node.parentElement;
    if (!parent) {
      parts.unshift(node.tagName.toLowerCase());
      break;
    }
    const siblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
    const index = siblings.indexOf(node) + 1;
    parts.unshift(`${node.tagName.toLowerCase()}:nth-child(${index})`);
  }
  return parts.join(" > ");
}

/* ── Generic field discovery ──────────────────────────────── */

const FIELD_SELECTOR =
  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select';

export function findCandidateElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll(FIELD_SELECTOR));
}

export function classifyInputType(el: HTMLElement): RawFieldTag {
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea") return "textarea";
  if (tag === "select") return "select";
  return "input";
}

export function classifyRawInputType(el: HTMLElement): RawFieldInputType {
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea") return "textarea";
  if (tag === "select") {
    return (el as HTMLSelectElement).multiple ? "select-multiple" : "select";
  }
  const type = (el.getAttribute("type") || "text").toLowerCase();
  switch (type) {
    case "email":
    case "tel":
    case "url":
    case "number":
    case "date":
    case "file":
      return type as RawFieldInputType;
    case "checkbox": {
      const name = el.getAttribute("name");
      const ownerDoc = el.ownerDocument ?? document;
      if (name && ownerDoc.querySelectorAll(`input[type="checkbox"][name="${cssEscape(name)}"]`).length > 1) {
        return "checkbox-group";
      }
      return "checkbox";
    }
    case "radio":
      return "radio-group";
    case "text":
    case "search":
      return "text";
    default:
      return "unknown";
  }
}

export function extractOptions(el: HTMLElement): RawFieldOption[] {
  if (el.tagName.toLowerCase() === "select") {
    return Array.from((el as HTMLSelectElement).options)
      .filter((opt) => opt.value !== "")
      .map((opt) => ({ value: opt.value, label: cleanText(opt.textContent) ?? opt.value }));
  }
  const type = el.getAttribute("type");
  if (type === "radio" || type === "checkbox") {
    const name = el.getAttribute("name");
    if (!name) return [];
    const group = Array.from(
      (el.ownerDocument ?? document).querySelectorAll(`input[type="${type}"][name="${cssEscape(name)}"]`)
    ) as HTMLInputElement[];
    return group.map((input) => ({
      value: input.value,
      label: resolveLabel(input, input.ownerDocument).label ?? input.value,
    }));
  }
  return [];
}

export function hasExistingValue(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === "select") return !!(el as HTMLSelectElement).value;
  if (tag === "textarea") return (el as HTMLTextAreaElement).value.trim().length > 0;
  const type = el.getAttribute("type");
  if (type === "checkbox" || type === "radio") return (el as HTMLInputElement).checked;
  if (type === "file") return ((el as HTMLInputElement).files?.length ?? 0) > 0;
  return (el as HTMLInputElement).value?.trim().length > 0;
}

/* ── Generic field assembly (shared by every ATS adapter) ─── */

export interface DiscoveryOptions {
  atsLabelSelectors?: string[];
  /** ATS-specific extra metadata for one element, merged into atsMetadata. */
  atsMetadata?: (el: HTMLElement) => Record<string, string>;
}

let scanIdCounter = 0;

/**
 * Walks every interactive control under `root` and produces one
 * RawDetectedField per logical field — radio/checkbox groups sharing a
 * `name` collapse into a single group field rather than one per option.
 * Adapters call this after locating their application root; ATS-specific
 * behavior is injected via `options`, not hard-coded here.
 */
export function discoverFieldsGeneric(
  root: HTMLElement,
  doc: Document,
  options: DiscoveryOptions = {}
): RawDetectedField[] {
  const elements = findCandidateElements(root);
  const seenGroupNames = new Set<string>();
  const fields: RawDetectedField[] = [];

  for (const el of elements) {
    const type = el.getAttribute("type");
    const isGroupedOption = type === "radio" || (type === "checkbox" && isPartOfCheckboxGroup(el));
    if (isGroupedOption) {
      const name = el.getAttribute("name");
      const groupKey = name ?? el.outerHTML;
      if (seenGroupNames.has(groupKey)) continue;
      seenGroupNames.add(groupKey);
    }

    const rawInputType = classifyRawInputType(el);

    // Skip elements that aren't actually shown to the user — EXCEPT file
    // inputs. Live testing on Greenhouse/Lever surfaced two different
    // "invisible" patterns that must be told apart:
    //  - react-select/intl-tel-input internals: hidden native shadow inputs
    //    paired with a custom-styled combobox (native `required` validation
    //    targets), and widget-internal search boxes — never real fields,
    //    and they show up as confusing duplicate entries in the panel.
    //  - résumé/cover-letter uploads: on Lever (and many custom-styled
    //    forms), the real `<input type="file">` is itself visually hidden
    //    behind a styled "Attach"/"Upload" button — this is the near-
    //    universal accessible file-upload pattern, not noise, and dropping
    //    it would silently hide the single most important field on the form.
    if (!isVisible(el) && rawInputType !== "file") continue;

    const labelResolution = resolveLabel(el, doc, options.atsLabelSelectors ?? [], isGroupedOption);
    // Many custom-styled ATS forms mark a field required only visually
    // (a trailing "*"/"✱" in the label) rather than via the native
    // `required` attribute, which ends up on a hidden shadow input instead.
    const markedRequiredInLabel = /[*✱]\s*$/.test(labelResolution.label ?? "");

    fields.push({
      scanFieldId: `scan-${++scanIdCounter}`,
      tag: classifyInputType(el),
      inputType: rawInputType,
      name: el.getAttribute("name"),
      id: el.id || null,
      label: labelResolution.label,
      labelSource: labelResolution.source,
      placeholder: cleanText(el.getAttribute("placeholder")),
      ariaLabel: cleanText(el.getAttribute("aria-label")),
      ariaLabelledBy: el.getAttribute("aria-labelledby"),
      required: el.hasAttribute("required") || el.getAttribute("aria-required") === "true" || markedRequiredInLabel,
      disabled: (el as HTMLInputElement).disabled ?? false,
      readOnly: (el as HTMLInputElement).readOnly ?? false,
      options: extractOptions(el),
      hasValue: hasExistingValue(el),
      helperText: findHelperText(el),
      validationText: findValidationText(el),
      sectionHeading: findSectionHeading(el, root),
      visible: isVisible(el),
      locator: buildLocator(el),
      atsMetadata: options.atsMetadata ? options.atsMetadata(el) : {},
    });
  }

  return fields;
}

function isPartOfCheckboxGroup(el: HTMLElement): boolean {
  const name = el.getAttribute("name");
  if (!name) return false;
  const doc = el.ownerDocument ?? document;
  return doc.querySelectorAll(`input[type="checkbox"][name="${cssEscape(name)}"]`).length > 1;
}

/* ── Debounce ─────────────────────────────────────────────── */

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}
