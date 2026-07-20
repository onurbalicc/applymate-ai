/* ─────────────────────────────────────────────────────────
   Field mapper — raw DOM observations → ApplyMate's Unified
   Application Field Contract.

   Deterministic, scoring-based, no LLM. Reuses the real
   classifier (app/lib/application-fields/classifier.ts) for
   sensitivity so the extension can never diverge from the rest
   of the product's safety rules: an uncertain field always
   stays "ambiguous"/"unmapped" rather than being forced into a
   guessed category, and sensitivity can only escalate, never
   relax, exactly as it does everywhere else in ApplyMate.
   ───────────────────────────────────────────────────────── */

import { FIELD_CATEGORY } from "../../../app/lib/application-fields/contracts";
import { classifySensitivity } from "../../../app/lib/application-fields/classifier";
import type { NormalizedFieldId } from "../../../app/lib/application-fields/contracts";
import type { FieldMappingStatus, MappingConfidence, NormalizedDetectedField, RawDetectedField } from "./contracts";
import { FIELD_SIGNAL_RULES, SHORT_TEXT_WORD_LIMIT } from "./field-signals";

interface ScoredCandidate {
  field: NormalizedFieldId;
  score: number;
  signals: string[];
}

/** DOM attributes use snake_case/kebab-case/camelCase ("cover_letter",
    "job-title") where labels use spaces ("Cover Letter") — found live when
    a Greenhouse cover-letter upload's only distinguishing signal was
    `id="cover_letter"`, which `/cover\s*letter/` couldn't match without
    this normalization. */
function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

function buildHaystack(raw: RawDetectedField): string {
  const parts = [
    raw.label,
    raw.name ? humanize(raw.name) : null,
    raw.id ? humanize(raw.id) : null,
    raw.placeholder,
    raw.ariaLabel,
    raw.sectionHeading,
    raw.options.map((o) => o.label).join(" "),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function scoreCandidates(raw: RawDetectedField): ScoredCandidate[] {
  const haystack = buildHaystack(raw);
  if (!haystack.trim()) return [];
  const wordCount = haystack.split(/\s+/).filter(Boolean).length;

  const candidates: ScoredCandidate[] = [];
  for (const rule of FIELD_SIGNAL_RULES) {
    if (rule.shortTextOnly && wordCount > SHORT_TEXT_WORD_LIMIT) continue;
    let score = 0;
    const signals: string[] = [];
    for (const pattern of rule.textPatterns) {
      if (pattern.test(haystack)) {
        score += 3;
        signals.push(`text matched ${pattern}`);
        break; // one match per rule is enough signal; avoid double-counting near-duplicate patterns
      }
    }
    if (score > 0 && rule.typeHints?.includes(raw.inputType)) {
      score += 2;
      signals.push(`input type "${raw.inputType}" corroborates`);
    }
    if (score > 0) candidates.push({ field: rule.field, score, signals });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

const UNSUPPORTED_INPUT_TYPES = new Set(["unknown"]);

/** Map one raw field. Never forces a low-confidence guess into "mapped" —
    ties or weak-single-signal matches stay ambiguous/unmapped instead. */
export function mapField(raw: RawDetectedField): NormalizedDetectedField {
  if (UNSUPPORTED_INPUT_TYPES.has(raw.inputType)) {
    return finish(raw, "unsupported", null, "low", [], [], "Input type is not one this scanner understands yet.");
  }

  const candidates = scoreCandidates(raw);

  if (candidates.length === 0) {
    return finish(
      raw,
      "unmapped",
      null,
      "low",
      [],
      [],
      raw.label ? "No known ApplyMate field matched this label." : "No label could be resolved for this field."
    );
  }

  const [top, second] = candidates;
  const margin = top.score - (second?.score ?? 0);

  if (second && margin < 2) {
    // Two or more plausible candidates too close to call — stay honest.
    const alternatives = candidates
      .filter((c) => c.score >= top.score - 1)
      .slice(0, 4)
      .map((c) => c.field);
    return finish(
      raw,
      "ambiguous",
      null,
      "low",
      top.signals,
      alternatives,
      `Multiple ApplyMate fields are plausible (${alternatives.join(", ")}) — left for manual review.`
    );
  }

  const confidence: MappingConfidence = top.score >= 5 ? "high" : "medium";
  return finish(
    raw,
    "mapped",
    top.field,
    confidence,
    top.signals,
    [],
    `Matched ApplyMate field "${top.field}" (${confidence} confidence).`
  );
}

function finish(
  raw: RawDetectedField,
  mappingStatus: FieldMappingStatus,
  normalizedField: NormalizedFieldId | null,
  confidence: MappingConfidence,
  matchedSignals: string[],
  alternativeFields: NormalizedFieldId[],
  explanation: string
): NormalizedDetectedField {
  const sensitivity = classifySensitivity({ normalizedField, label: raw.label });
  return {
    raw,
    mappingStatus,
    normalizedField,
    category: normalizedField ? FIELD_CATEGORY[normalizedField] : null,
    confidence,
    matchedSignals,
    alternativeFields,
    sensitivity,
    explanation,
  };
}

export function mapFields(rawFields: RawDetectedField[]): NormalizedDetectedField[] {
  return rawFields.map(mapField);
}
