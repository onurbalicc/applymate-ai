/* ─────────────────────────────────────────────────────────
   Greenhouse adapter.

   Covers both the classic embedded board (boards.greenhouse.io,
   job-boards.greenhouse.io, grnh.se short links) and Greenhouse
   forms embedded on a company's own domain via their standard
   `job_application[...]` field naming, which is the most
   consistent signal across Greenhouse's various board themes.
   ───────────────────────────────────────────────────────── */

import type { AtsDetectionResult, RawDetectedField } from "../shared/contracts";
import { cleanText, discoverFieldsGeneric } from "../shared/dom-utils";
import type { AtsAdapter } from "./types";

const ROOT_SELECTORS = [
  "#application_form",
  "form#application_form",
  ".application--form",
  '[data-testid="application-form"]',
  ".job-application-form",
];

const LABEL_SELECTORS = [
  ".field label",
  "label.application-label",
  ".application-question label",
  ".select2-container + label",
];

/** Greenhouse's most consistent DOM fingerprint regardless of board theme:
    Rails-style nested field names. */
const GREENHOUSE_NAME_PATTERN = /^job_application\[/;

function findGreenhouseForm(document: Document): HTMLElement | null {
  for (const selector of ROOT_SELECTORS) {
    const found = document.querySelector<HTMLElement>(selector);
    if (found) return found;
  }
  // Fallback: any form containing at least one Greenhouse-named field.
  const forms = Array.from(document.querySelectorAll("form"));
  for (const form of forms) {
    if (form.querySelector(`[name^="job_application["]`)) return form;
  }
  return null;
}

function detect(document: Document, location: Location): AtsDetectionResult {
  const evidence: string[] = [];

  const hostnameMatch = /(^|\.)greenhouse\.io$|(^|\.)grnh\.se$/.test(location.hostname);
  if (hostnameMatch) evidence.push(`hostname "${location.hostname}" is a Greenhouse domain`);

  const pathHint = /\/embed\/job_app|boards\.greenhouse\.io|job-boards\.greenhouse\.io/.test(
    location.hostname + location.pathname
  );
  if (pathHint) evidence.push("URL path matches Greenhouse's board/embed pattern");

  const formRoot = findGreenhouseForm(document);
  if (formRoot) evidence.push("found a Greenhouse-style application form in the DOM");

  const namedFieldCount = document.querySelectorAll('[name^="job_application["]').length;
  if (namedFieldCount > 0) {
    evidence.push(`${namedFieldCount} field(s) use Greenhouse's "job_application[...]" naming`);
  }

  const strongDomSignal = !!formRoot || namedFieldCount > 0;

  if (hostnameMatch && strongDomSignal) {
    return { platform: "greenhouse", confidence: "high", evidence };
  }
  if (hostnameMatch || strongDomSignal) {
    return { platform: "greenhouse", confidence: "medium", evidence };
  }
  return { platform: "unsupported", confidence: "low", evidence: [] };
}

function atsMetadata(el: HTMLElement): Record<string, string> {
  const meta: Record<string, string> = {};
  const name = el.getAttribute("name");
  if (name && GREENHOUSE_NAME_PATTERN.test(name)) {
    const questionMatch = name.match(/answers_attributes\]\[(\d+)\]/);
    if (questionMatch) meta.questionIndex = questionMatch[1];
    meta.greenhouseFieldName = name;
  }
  const fieldWrapper = el.closest("[id^='question_'], [id^='job_application_']");
  if (fieldWrapper?.id) meta.wrapperId = fieldWrapper.id;
  const custom = cleanText(el.closest(".custom-question")?.getAttribute("data-field-id") ?? null);
  if (custom) meta.customFieldId = custom;
  return meta;
}

function discoverFields(root: HTMLElement, document: Document): RawDetectedField[] {
  return discoverFieldsGeneric(root, document, {
    atsLabelSelectors: LABEL_SELECTORS,
    atsMetadata,
  });
}

export const greenhouseAdapter: AtsAdapter = {
  platform: "greenhouse",
  detect,
  findApplicationRoot: findGreenhouseForm,
  discoverFields,
};
