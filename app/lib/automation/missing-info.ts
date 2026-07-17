/* ─────────────────────────────────────────────────────────
   Missing-information validation utilities.

   Single source of truth for the rule "a job may not advance
   while required missing-information items remain unresolved."
   Used by the orchestrator (domain enforcement — holds even if
   the UI is bypassed), the UI (display), and the extension
   payload builder (readiness).

   Identity model:
   - ApplicationPackage.missingInformation stays a string[] —
     the AI produces free-text questions and changing the server
     schema is unnecessary for enforcement.
   - Each question gets a STABLE derived id (missingInfoId):
     a deterministic slug of the normalized question text.
     Because the id is derived from the question, legacy
     userProvidedAnswers that only stored { question, answer }
     resolve to exactly the same id — full backward compatibility
     with existing localStorage jobs, no migration required.
   - New answers additionally persist the id explicitly so
     future refactors can stop depending on question text.

   Pure functions only — no storage, no React.
   ───────────────────────────────────────────────────────── */

import type { NormalizedFieldId, SensitivityCategory } from "../application-fields/contracts";
import { classifyQuestion } from "../application-fields/classifier";
import type { AutomationJob } from "./contracts";

/** Normalize question text for stable comparison. */
function normalizeQuestion(question: string): string {
  return question.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Stable, deterministic id for a missing-information question. */
export function missingInfoId(question: string): string {
  const slug = normalizeQuestion(question)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return `mi-${slug || "unknown"}`;
}

/** Structured, classified view of one missing-information question. */
export interface MissingInfoItem {
  id: string;
  question: string;
  normalizedField: NormalizedFieldId | null;
  /** All missing-information items are currently required. */
  required: boolean;
  sensitivity: SensitivityCategory;
}

/** Build structured items from the raw question strings. */
export function getMissingInfoItems(questions: string[]): MissingInfoItem[] {
  return questions.map((question) => {
    const classified = classifyQuestion(question);
    return {
      id: missingInfoId(question),
      question,
      normalizedField: classified.normalizedField,
      required: true,
      sensitivity: classified.sensitivity,
    };
  });
}

/** A user-provided answer; `id` is optional for legacy records. */
export interface ProvidedAnswer {
  id?: string;
  question: string;
  answer: string;
}

/** True when the answer is genuinely usable (whitespace-only is invalid). */
export function isValidAnswer(answer: string | null | undefined): boolean {
  return typeof answer === "string" && answer.trim().length > 0;
}

/** True when `answers` contains a valid answer for `item`. */
export function isItemResolved(item: MissingInfoItem, answers: ProvidedAnswer[]): boolean {
  return answers.some((a) => {
    if (!isValidAnswer(a.answer)) return false;
    if (a.id && a.id === item.id) return true;
    // Legacy answers have no id — match on normalized question text,
    // which produces the same identity the id is derived from.
    return normalizeQuestion(a.question) === normalizeQuestion(item.question);
  });
}

/**
 * The unresolved required items for a job — the enforcement primitive.
 * Checks the job's live missingInformation list against its accumulated
 * userProvidedAnswers. Defensive against legacy records missing fields.
 */
export function getUnresolvedMissingInfo(job: {
  missingInformation?: string[];
  userProvidedAnswers?: ProvidedAnswer[];
}): MissingInfoItem[] {
  const questions = job.missingInformation ?? [];
  const answers = job.userProvidedAnswers ?? [];
  return getMissingInfoItems(questions).filter((item) => !isItemResolved(item, answers));
}

export function hasUnresolvedMissingInfo(job: {
  missingInformation?: string[];
  userProvidedAnswers?: ProvidedAnswer[];
}): boolean {
  return getUnresolvedMissingInfo(job).length > 0;
}

/**
 * Merge newly provided answers into the existing list.
 * - Invalid (empty/whitespace) new answers are dropped.
 * - A new valid answer replaces an older answer with the same identity.
 * - Existing answers are never silently discarded.
 * Returns a new array; inputs are not mutated.
 */
export function mergeProvidedAnswers(
  existing: ProvidedAnswer[],
  incoming: ProvidedAnswer[]
): ProvidedAnswer[] {
  const withIds = (a: ProvidedAnswer): Required<ProvidedAnswer> => ({
    id: a.id ?? missingInfoId(a.question),
    question: a.question,
    answer: a.answer,
  });

  const merged = new Map<string, Required<ProvidedAnswer>>();
  for (const a of existing.map(withIds)) merged.set(a.id, a);
  for (const a of incoming.filter((x) => isValidAnswer(x.answer)).map(withIds)) {
    merged.set(a.id, { ...a, answer: a.answer.trim() });
  }
  return [...merged.values()];
}

/** Narrow AutomationJob helper so callers can pass the whole job. */
export function getUnresolvedForJob(job: AutomationJob): MissingInfoItem[] {
  return getUnresolvedMissingInfo(job);
}
