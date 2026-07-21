/* ─────────────────────────────────────────────────────────
   Outcome detector — reliable post-submission outcome (§12).

   Called once, a short delay after submit-controller.ts clicks
   the real submit control (never after a dry run — there is
   nothing to detect). Deliberately conservative: SUBMITTED is
   returned only when a real, unambiguous success signal is
   present. Anything else — including simply "nothing looks
   wrong" — is `"unknown"`, which the execution engine turns
   into review-required, never SUBMITTED. Clicking a button is
   not evidence of success.
   ───────────────────────────────────────────────────────── */

import type { SubmissionOutcome } from "../../../app/lib/automation/contracts";
import type { OutcomeDetectionResult } from "./execution-types";

const SUCCESS_TEXT_PATTERNS = [
  /thank you for (applying|your application)/i,
  /application (has been |was )?(received|submitted) successfully/i,
  /we('ve| have) received your application/i,
  /your application (has been|was) submitted/i,
  /successfully submitted your application/i,
];

const LOGIN_TEXT_PATTERNS = [/sign in to continue/i, /log in to (apply|continue)/i, /create an account to apply/i];

const CAPTCHA_SELECTOR =
  'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], [class*="captcha"], #g-recaptcha, .g-recaptcha, [data-sitekey], .h-captcha';

export interface OutcomeDetectionParams {
  doc: Document;
  location: Location;
  urlBeforeSubmit: string;
  /** Reference to the application form root captured before submitting —
      many ATS platforms remove or replace the form on success. */
  formRoot: HTMLElement | null;
}

function bodyText(doc: Document): string {
  return doc.body?.innerText ?? "";
}

export function detectOutcome(params: OutcomeDetectionParams): OutcomeDetectionResult {
  const { doc, location, urlBeforeSubmit, formRoot } = params;
  const evidence: string[] = [];
  const text = bodyText(doc);

  if (doc.querySelector(CAPTCHA_SELECTOR)) {
    evidence.push("CAPTCHA widget present after submit attempt.");
    return { outcome: "captcha-required", evidence };
  }

  if (LOGIN_TEXT_PATTERNS.some((p) => p.test(text)) || doc.querySelector('input[type="password"]')) {
    evidence.push("Login/account-creation prompt present after submit attempt.");
    return { outcome: "login-required", evidence };
  }

  const urlChanged = location.href !== urlBeforeSubmit;
  const externalOrigin = (() => {
    try {
      return new URL(urlBeforeSubmit).origin !== location.origin;
    } catch {
      return false;
    }
  })();
  if (urlChanged && externalOrigin) {
    evidence.push(`Navigated to a different origin after submit: ${location.href}`);
    return { outcome: "external-redirect", evidence };
  }

  const successTextMatch = SUCCESS_TEXT_PATTERNS.find((p) => p.test(text));
  if (successTextMatch) {
    evidence.push(`Confirmation text matched: ${successTextMatch}`);
    return submitted(evidence);
  }

  const formRemoved = formRoot ? !doc.contains(formRoot) : false;
  const urlLooksLikeConfirmation = /thank|confirm|success|applied/i.test(location.pathname);
  if (urlChanged && urlLooksLikeConfirmation) {
    evidence.push(`URL changed to a confirmation-looking path: ${location.pathname}`);
    return submitted(evidence);
  }
  if (formRemoved && urlChanged) {
    evidence.push("Application form was removed from the page and the URL changed after submit.");
    return submitted(evidence);
  }

  const visibleErrors = Array.from(
    doc.querySelectorAll('.error, .error-message, [role="alert"], [class*="invalid"], [class*="validation-error"]')
  ).filter((el) => (el.textContent ?? "").trim().length > 0);
  if (visibleErrors.length > 0 && !urlChanged) {
    evidence.push(`${visibleErrors.length} visible validation error(s) remained after submit attempt.`);
    return { outcome: "validation-rejected", evidence };
  }

  // Nothing conclusive — never assume success from silence.
  evidence.push("No unambiguous success or failure signal found after submit attempt.");
  return { outcome: "unknown", evidence };
}

function submitted(evidence: string[]): OutcomeDetectionResult {
  return { outcome: "submitted" as SubmissionOutcome, evidence };
}
