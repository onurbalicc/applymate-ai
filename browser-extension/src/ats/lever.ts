/* ─────────────────────────────────────────────────────────
   Lever adapter.

   Lever postings live under jobs.lever.co/<company>/<id>/apply
   (and some companies proxy it on their own domain). The
   application form is consistently built from "card" sections
   with a small, stable set of field name conventions (name,
   email, phone, org, urls[...], resume, additionalFiles,
   cards[][field][]).
   ───────────────────────────────────────────────────────── */

import type { AtsDetectionResult, RawDetectedField } from "../shared/contracts";
import { discoverFieldsGeneric } from "../shared/dom-utils";
import type { AtsAdapter } from "./types";

const ROOT_SELECTORS = [
  "#application-form",
  "form.application-form",
  '[data-qa="postings-apply-form"]',
  ".posting-apply form",
];

const LABEL_SELECTORS = [
  ".application-label",
  ".section-label",
  ".application-question .application-label",
];

const LEVER_NAME_HINTS = ["resume", "additionalFiles", "cards[", "urls[", "comments"];

function findLeverForm(document: Document): HTMLElement | null {
  for (const selector of ROOT_SELECTORS) {
    const found = document.querySelector<HTMLElement>(selector);
    if (found) return found;
  }
  const forms = Array.from(document.querySelectorAll("form"));
  for (const form of forms) {
    if (LEVER_NAME_HINTS.some((hint) => form.querySelector(`[name*="${hint}"]`))) return form;
  }
  return null;
}

function detect(document: Document, location: Location): AtsDetectionResult {
  const evidence: string[] = [];

  const hostnameMatch = /(^|\.)lever\.co$/.test(location.hostname);
  if (hostnameMatch) evidence.push(`hostname "${location.hostname}" is a Lever domain`);

  const pathHint = /\/apply\/?$/.test(location.pathname) || location.hostname.startsWith("jobs.lever.co");
  if (pathHint) evidence.push("URL path matches Lever's posting/apply pattern");

  const formRoot = findLeverForm(document);
  if (formRoot) evidence.push("found a Lever-style application form in the DOM");

  const cardCount = document.querySelectorAll(".application-question, [data-qa='application-question']").length;
  if (cardCount > 0) evidence.push(`${cardCount} Lever "application-question" card(s) found`);

  const strongDomSignal = !!formRoot || cardCount > 0;

  if (hostnameMatch && strongDomSignal) {
    return { platform: "lever", confidence: "high", evidence };
  }
  if (hostnameMatch || strongDomSignal) {
    return { platform: "lever", confidence: "medium", evidence };
  }
  return { platform: "unsupported", confidence: "low", evidence: [] };
}

function atsMetadata(el: HTMLElement): Record<string, string> {
  const meta: Record<string, string> = {};
  const name = el.getAttribute("name");
  if (name) meta.leverFieldName = name;
  const card = el.closest(".application-question, [data-qa='application-question']");
  if (card) {
    const qa = card.getAttribute("data-qa");
    if (qa) meta.cardDataQa = qa;
  }
  return meta;
}

function discoverFields(root: HTMLElement, document: Document): RawDetectedField[] {
  return discoverFieldsGeneric(root, document, {
    atsLabelSelectors: LABEL_SELECTORS,
    atsMetadata,
  });
}

export const leverAdapter: AtsAdapter = {
  platform: "lever",
  detect,
  findApplicationRoot: findLeverForm,
  discoverFields,
};
