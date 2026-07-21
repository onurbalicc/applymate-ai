/* ─────────────────────────────────────────────────────────
   Field filler — writes one resolved value into the live DOM.

   Real browser filling for text/email/tel/url/number/date
   inputs, textarea, native select, radio groups and checkbox
   groups (§8). File inputs are handled separately by
   document-uploader.ts.

   For framework-controlled inputs (React, etc.), setting
   `.value` directly and dispatching a plain "input" event does
   NOT reliably trigger the framework's onChange — React tracks
   the native value setter internally. The fix is the well-known
   technique used here: grab the native prototype's value setter
   explicitly and call it, THEN dispatch input/change/blur. This
   never touches React internals directly (no fiber access, no
   `__reactProps$...` poking) — it only uses standard DOM APIs
   in the order a real browser would produce them from user
   typing, which is what makes frameworks' own listeners fire.

   Never overwrites an existing value unless the payload
   explicitly permits it (default: overwriteExistingValues =
   false) or the existing value was written by ApplyMate earlier
   in this same execution.
   ───────────────────────────────────────────────────────── */

import type { NormalizedDetectedField } from "../shared/contracts";
import type { FieldExecutionResult } from "./execution-types";

/* ── Locating the live element from a serialized locator ───── */

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function locateByLabelText(doc: Document, quotedText: string): HTMLElement | null {
  const labels = Array.from(doc.querySelectorAll("label"));
  const match = labels.find((l) => (l.textContent ?? "").trim().startsWith(quotedText));
  if (!match) return null;
  const forId = match.getAttribute("for");
  if (forId) return doc.getElementById(forId);
  return match.querySelector("input, select, textarea");
}

/** Re-locate the single representative element a RawDetectedField's
    locator points to. For radio/checkbox groups, prefer
    `locateGroupElements` instead — this returns only the first element. */
export function locateElement(field: NormalizedDetectedField, doc: Document): HTMLElement | null {
  const { strategy, value } = field.raw.locator;
  switch (strategy) {
    case "id":
      return doc.getElementById(value);
    case "name":
      return doc.querySelector(`[name="${cssEscape(value)}"]`);
    case "data-attribute": {
      const eq = value.indexOf("=");
      if (eq === -1) return null;
      const attr = value.slice(0, eq);
      const attrValue = value.slice(eq + 1);
      return doc.querySelector(`[${attr}="${cssEscape(attrValue)}"]`);
    }
    case "label-association": {
      const match = value.match(/label:has-text\("(.+)"\)/);
      return match ? locateByLabelText(doc, match[1]) : null;
    }
    case "css-selector":
    case "structural":
      try {
        return doc.querySelector(value);
      } catch {
        return null;
      }
  }
}

/** All elements sharing a radio/checkbox group's `name` — needed because
    the stored locator points at only the first option encountered during
    scanning, not every option. */
export function locateGroupElements(field: NormalizedDetectedField, doc: Document): HTMLInputElement[] {
  if (!field.raw.name) {
    const single = locateElement(field, doc);
    return single ? [single as HTMLInputElement] : [];
  }
  const type = field.raw.inputType === "checkbox-group" ? "checkbox" : "radio";
  return Array.from(doc.querySelectorAll(`input[type="${type}"][name="${cssEscape(field.raw.name)}"]`));
}

/* ── Native-setter value dispatch ────────────────────────── */

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): void {
  const proto =
    el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : el.tagName === "SELECT"
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else (el as HTMLInputElement).value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

function currentValueOf(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  if (tag === "select") return (el as HTMLSelectElement).value;
  if (tag === "textarea") return (el as HTMLTextAreaElement).value;
  return (el as HTMLInputElement).value ?? "";
}

function hasExistingValue(el: HTMLElement): boolean {
  const type = el.getAttribute("type");
  if (type === "checkbox" || type === "radio") return (el as HTMLInputElement).checked;
  return currentValueOf(el).trim().length > 0;
}

/* ── Public fill functions ───────────────────────────────── */

export interface FillOptions {
  /** Fields this execution run has already written — lets a second pass
      (e.g. retry) overwrite ApplyMate's own prior value without touching
      anything the user typed themselves. */
  filledByApplyMate: Set<string>;
  overwriteExistingValues: boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fill one text-like/select field. Returns a FieldExecutionResult —
 * never throws; DOM/element errors are captured in the result.
 *
 * Verifies the write actually stuck and retries once after a short delay
 * if not — found necessary against a real, heavily client-rendered
 * Greenhouse page during live validation: the native-setter + dispatched-
 * event technique is textbook-correct, but on a page still finishing
 * React hydration at the moment of the write, the framework's own render
 * can silently discard it a moment later. A synchronous "it didn't throw"
 * success was not enough evidence the value actually persisted.
 */
export async function fillTextLikeField(
  field: NormalizedDetectedField,
  value: string,
  source: FieldExecutionResult["source"],
  doc: Document,
  options: FillOptions
): Promise<FieldExecutionResult> {
  const base = { fieldId: field.raw.scanFieldId, mappedKey: field.normalizedField ?? undefined, source };
  const firstEl = locateElement(field, doc);
  if (!firstEl) {
    return { ...base, status: "failed", error: "Could not re-locate the field on the live page." };
  }

  const alreadyHasValue = hasExistingValue(firstEl);
  const writtenByUs = options.filledByApplyMate.has(field.raw.scanFieldId);
  if (alreadyHasValue && !writtenByUs && !options.overwriteExistingValues) {
    return { ...base, status: "already-filled" };
  }

  try {
    // Re-locate fresh on every attempt rather than reusing one element
    // reference — found necessary live: a framework can swap the DOM node
    // out entirely between attempts (not just reset its value), and
    // verifying against a now-detached reference always "succeeds" even
    // though the live page never received the write.
    const delays = [150, 400, 900];
    for (let attempt = 0; attempt < delays.length; attempt++) {
      const el = locateElement(field, doc);
      if (!el) return { ...base, status: "failed", error: "Field was removed from the page during fill." };
      setNativeValue(el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value);
      await delay(delays[attempt]);
      const live = locateElement(field, doc);
      if (live && currentValueOf(live) === value) {
        options.filledByApplyMate.add(field.raw.scanFieldId);
        return { ...base, status: "filled" };
      }
    }
    return { ...base, status: "failed", error: "Value did not persist after write — the page's own script may have reset it (e.g. still hydrating)." };
  } catch (err) {
    return { ...base, status: "failed", error: err instanceof Error ? err.message : "Unknown fill error." };
  }
}

/** Fill a single checkbox to the desired boolean state. */
export async function fillCheckboxField(
  field: NormalizedDetectedField,
  checked: boolean,
  source: FieldExecutionResult["source"],
  doc: Document,
  options: FillOptions
): Promise<FieldExecutionResult> {
  const base = { fieldId: field.raw.scanFieldId, mappedKey: field.normalizedField ?? undefined, source };
  const el = locateElement(field, doc) as HTMLInputElement | null;
  if (!el) return { ...base, status: "failed", error: "Could not re-locate the field on the live page." };

  const writtenByUs = options.filledByApplyMate.has(field.raw.scanFieldId);
  if (el.checked !== checked) {
    if (el.checked && !writtenByUs && !options.overwriteExistingValues) {
      return { ...base, status: "already-filled" };
    }
    el.click();
    await delay(150);
    // Re-locate rather than trusting the original reference — a framework
    // re-render can swap the node, not just reset its checked state.
    let live = locateElement(field, doc) as HTMLInputElement | null;
    if (!live) return { ...base, status: "failed", error: "Field was removed from the page during fill." };
    if (live.checked !== checked) {
      live.click();
      await delay(400);
      live = locateElement(field, doc) as HTMLInputElement | null;
    }
    options.filledByApplyMate.add(field.raw.scanFieldId);
    if (!live || live.checked !== checked) {
      return { ...base, status: "failed", error: "Checkbox state did not persist after click." };
    }
  }
  return { ...base, status: "filled" };
}

/** Select the option in a radio/checkbox group whose value or label best
    matches the resolved answer. Matches by exact value first, then a
    case-insensitive label match, then a loose boolean-ish match ("yes"/
    "true"/"1" ↔ true). Never guesses when nothing matches. */
export async function fillGroupField(
  field: NormalizedDetectedField,
  value: string | boolean,
  source: FieldExecutionResult["source"],
  doc: Document,
  options: FillOptions
): Promise<FieldExecutionResult> {
  const base = { fieldId: field.raw.scanFieldId, mappedKey: field.normalizedField ?? undefined, source };
  const elements = locateGroupElements(field, doc);
  if (elements.length === 0) {
    return { ...base, status: "failed", error: "Could not re-locate the field group on the live page." };
  }

  const target = String(value).trim().toLowerCase();
  const boolMatch = typeof value === "boolean";

  const match = elements.find((el) => {
    const optValue = el.value.trim().toLowerCase();
    if (optValue === target) return true;
    const optionLabel = field.raw.options.find((o) => o.value === el.value)?.label?.toLowerCase() ?? "";
    if (optionLabel === target) return true;
    if (boolMatch) {
      const truthy = /^(yes|true|1)$/.test(optValue) || /^(yes|true|1)$/.test(optionLabel);
      const falsy = /^(no|false|0)$/.test(optValue) || /^(no|false|0)$/.test(optionLabel);
      if (value === true && truthy) return true;
      if (value === false && falsy) return true;
    }
    return false;
  });

  if (!match) {
    return { ...base, status: "failed", error: `No option in this group matched the resolved value "${value}".` };
  }

  const writtenByUs = options.filledByApplyMate.has(field.raw.scanFieldId);
  const alreadyChecked = elements.some((el) => el.checked);
  if (alreadyChecked && !match.checked && !writtenByUs && !options.overwriteExistingValues) {
    return { ...base, status: "already-filled" };
  }
  if (!match.checked) {
    match.click();
    await delay(150);
    if (!match.checked) {
      match.click();
      await delay(400);
    }
    options.filledByApplyMate.add(field.raw.scanFieldId);
  }
  if (!match.checked) {
    return { ...base, status: "failed", error: "Selection did not persist after click." };
  }
  return { ...base, status: "filled" };
}
