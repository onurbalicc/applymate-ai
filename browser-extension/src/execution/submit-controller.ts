/* ─────────────────────────────────────────────────────────
   Submit controller — the last, most heavily-gated step (§11).

   Every one of these checks must pass before a real click ever
   happens. Any failure returns "blocked" with a specific
   reason — never a silent no-op, never a best-effort click
   anyway. `dryRun: true` runs every check and identifies the
   exact control that WOULD be clicked, without clicking it —
   this is the mode used against real, public Greenhouse/Lever
   pages during validation (see MANUAL_TESTING.md); a real click
   only ever happens with `dryRun: false` against the local test
   fixture in tests/fixtures/local-ats-fixture.html.
   ───────────────────────────────────────────────────────── */

import type { FormReadinessResult, SubmitAttempt } from "./execution-types";

export interface SubmitControllerResult {
  outcome: "submitted" | "blocked";
  reason?: string;
  submitControlFound: boolean;
  submitControlText?: string;
  /** True once every gate passed and only the actual click remains — set
      even in dryRun mode, so callers can assert "this WOULD have submitted". */
  wouldClick: boolean;
}

const EXTERNAL_AUTH_PATTERN = /linkedin|indeed|google|facebook|apply with|sign in with/i;
const SUBMIT_TEXT_PATTERN = /submit|apply|send application|complete application/i;
const CAPTCHA_SELECTOR =
  'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], [class*="captcha"], #g-recaptcha, .g-recaptcha, [data-sitekey], .h-captcha';

function isExternalAuthButton(el: HTMLElement): boolean {
  const text = (el.textContent ?? "").toLowerCase();
  if (EXTERNAL_AUTH_PATTERN.test(text)) return true;
  return !!el.closest('[class*="social"], [class*="sso"], [class*="oauth"]');
}

/** Confidently identify the ONE final submit control scoped to the
    detected application root — never a bare `button[type="submit"]`
    query over the whole document, which could hit unrelated page chrome. */
export function findSubmitControl(root: HTMLElement): HTMLElement | null {
  const nativeSubmits = Array.from(
    root.querySelectorAll('button[type="submit"], input[type="submit"]')
  ) as HTMLElement[];
  const validNativeSubmits = nativeSubmits.filter((el) => !isExternalAuthButton(el));

  if (validNativeSubmits.length === 1) return validNativeSubmits[0];
  if (validNativeSubmits.length > 1) {
    return (
      validNativeSubmits.find((el) => SUBMIT_TEXT_PATTERN.test(el.textContent ?? "")) ??
      validNativeSubmits[validNativeSubmits.length - 1]
    );
  }

  // Fall back to a clearly-labeled generic button still scoped to the form
  // root — some ATS themes render the submit action as a plain <button>
  // with JS-driven form submission rather than type="submit".
  const genericButtons = Array.from(root.querySelectorAll("button")) as HTMLElement[];
  return (
    genericButtons.find((el) => SUBMIT_TEXT_PATTERN.test(el.textContent ?? "") && !isExternalAuthButton(el)) ?? null
  );
}

export function detectCaptcha(doc: Document): boolean {
  return !!doc.querySelector(CAPTCHA_SELECTOR);
}

export function pageMatchesAuthorization(location: Location, authorizedApplyUrl: string): boolean {
  try {
    const authorized = new URL(authorizedApplyUrl);
    return location.origin === authorized.origin && location.pathname === authorized.pathname;
  } catch {
    return false;
  }
}

export interface SubmitControllerParams {
  root: HTMLElement;
  doc: Document;
  location: Location;
  authorizedApplyUrl: string;
  readiness: FormReadinessResult;
  attempt: SubmitAttempt;
  previousAttempts: SubmitAttempt[];
  /** true against every real page during development validation; false
      only against the local test fixture. */
  dryRun: boolean;
}

/**
 * Attempt (or, in dryRun mode, simulate) the final form submission.
 * Gate order matters — idempotency and page-match are checked before
 * anything else touches the DOM.
 */
export function attemptSubmit(params: SubmitControllerParams): SubmitControllerResult {
  const blocked = (reason: string): SubmitControllerResult => ({
    outcome: "blocked",
    reason,
    submitControlFound: false,
    wouldClick: false,
  });

  if (params.previousAttempts.some((a) => a.attemptId === params.attempt.attemptId)) {
    return blocked("Duplicate submission attempt — this idempotency key was already used.");
  }
  if (!pageMatchesAuthorization(params.location, params.authorizedApplyUrl)) {
    return blocked(
      `Current page (${params.location.href}) does not match the authorized application URL (${params.authorizedApplyUrl}).`
    );
  }
  if (!params.readiness.ready) {
    return blocked("Form is not ready — unresolved required fields or validation errors remain.");
  }
  if (detectCaptcha(params.doc)) {
    return blocked("CAPTCHA detected on the page — automation must not attempt to bypass it.");
  }

  const control = findSubmitControl(params.root);
  if (!control) {
    return blocked("Could not confidently identify the form's final submit control.");
  }

  const submitControlText = control.textContent?.trim() ?? "";

  if (params.dryRun) {
    return {
      outcome: "blocked",
      reason: "Dry run — the submit control was identified but not clicked.",
      submitControlFound: true,
      submitControlText,
      wouldClick: true,
    };
  }

  control.click();
  return { outcome: "submitted", submitControlFound: true, submitControlText, wouldClick: true };
}
