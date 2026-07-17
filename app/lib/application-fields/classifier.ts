/* ─────────────────────────────────────────────────────────
   Deterministic sensitive-question classifier.

   Classifies a normalized field and/or a raw form label into
   exactly one behavioral category:

     SAFE_AUTO_FILL     — objective facts, fill without pausing
     NEEDS_CONFIRMATION — pre-fill allowed, but blocked until
                          the user explicitly confirms
     NEVER_AUTO_FILL    — never touched automatically, ever

   Design rules (safety-biased, no LLM involved):
   - Label evidence can only ESCALATE severity, never reduce it.
     A field mapped to a "safe" id whose label mentions visa/
     sponsorship/consent is treated as NEVER_AUTO_FILL.
   - Unknown or ambiguous fields default to NEEDS_CONFIRMATION,
     never to SAFE_AUTO_FILL.
   - Work authorization / sponsorship / visa are NEVER_AUTO_FILL
     even when the profile stores an explicit value: the value
     may be surfaced to the user, but the action of answering on
     a real form must always be the user's own.
   - Sensitive answers are never inferred from nationality,
     location, education, or any other indirect data — this
     module only classifies; it produces no values at all.
   ───────────────────────────────────────────────────────── */

import { FIELD_CATEGORY, type NormalizedFieldId, type SensitivityCategory } from "./contracts";

/* ── Severity ordering ───────────────────────────────────── */

const SEVERITY: Record<SensitivityCategory, number> = {
  SAFE_AUTO_FILL: 0,
  NEEDS_CONFIRMATION: 1,
  NEVER_AUTO_FILL: 2,
};

function maxSeverity(a: SensitivityCategory, b: SensitivityCategory): SensitivityCategory {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

/* ── Base classification per normalized field ────────────── */

const FIELD_SENSITIVITY: Record<NormalizedFieldId, SensitivityCategory> = {
  // identity — objective facts, except self-identification
  givenName: "SAFE_AUTO_FILL",
  familyName: "SAFE_AUTO_FILL",
  fullName: "SAFE_AUTO_FILL",
  preferredPronouns: "NEVER_AUTO_FILL", // self-identification — user's explicit choice only

  // contact
  email: "SAFE_AUTO_FILL",
  phone: "SAFE_AUTO_FILL",
  city: "SAFE_AUTO_FILL",
  country: "SAFE_AUTO_FILL",
  currentLocation: "NEEDS_CONFIRMATION", // ambiguous phrasing on forms — confirm

  // professional links
  linkedInUrl: "SAFE_AUTO_FILL",
  gitHubUrl: "SAFE_AUTO_FILL",
  portfolioUrl: "SAFE_AUTO_FILL",
  websiteUrl: "SAFE_AUTO_FILL",
  otherLink: "SAFE_AUTO_FILL",

  // documents — attaching a file is always a deliberate act
  resumeFile: "NEEDS_CONFIRMATION",
  coverLetterFile: "NEEDS_CONFIRMATION",
  portfolioFile: "NEEDS_CONFIRMATION",

  // location preferences
  willingToRelocate: "NEEDS_CONFIRMATION",
  remotePreference: "NEEDS_CONFIRMATION",

  // work authorization — NEVER auto-filled even with stored values
  authorizedInCountry: "NEVER_AUTO_FILL",
  sponsorshipRequired: "NEVER_AUTO_FILL",
  visaStatus: "NEVER_AUTO_FILL",

  // salary & availability — high-stakes, confirm every time
  expectedSalary: "NEEDS_CONFIRMATION",
  salaryCurrency: "NEEDS_CONFIRMATION",
  salaryPeriod: "NEEDS_CONFIRMATION",
  noticePeriod: "NEEDS_CONFIRMATION",
  earliestStartDate: "NEEDS_CONFIRMATION",

  // education — stored facts
  institution: "SAFE_AUTO_FILL",
  degree: "SAFE_AUTO_FILL",
  fieldOfStudy: "SAFE_AUTO_FILL",
  educationStartDate: "SAFE_AUTO_FILL",
  educationEndDate: "SAFE_AUTO_FILL",

  // experience — stored facts
  currentCompany: "SAFE_AUTO_FILL",
  currentTitle: "SAFE_AUTO_FILL",
  employer: "SAFE_AUTO_FILL",
  role: "SAFE_AUTO_FILL",
  experienceStartDate: "SAFE_AUTO_FILL",
  experienceEndDate: "SAFE_AUTO_FILL",
  experienceDescription: "SAFE_AUTO_FILL",

  // AI-generated content — always reviewed before use
  coverLetterBody: "NEEDS_CONFIRMATION",
  recruiterMessage: "NEEDS_CONFIRMATION",
  customQuestionAnswer: "NEEDS_CONFIRMATION",
  additionalInformation: "NEEDS_CONFIRMATION",

  // legal declarations & demographic self-identification
  certifyTrueAndAccurate: "NEVER_AUTO_FILL",
  consentToDataProcessing: "NEVER_AUTO_FILL",
  backgroundCheckConsent: "NEVER_AUTO_FILL",
  criminalHistory: "NEVER_AUTO_FILL",
  gender: "NEVER_AUTO_FILL",
  raceOrEthnicity: "NEVER_AUTO_FILL",
  veteranStatus: "NEVER_AUTO_FILL",
  disabilityStatus: "NEVER_AUTO_FILL",
  captcha: "NEVER_AUTO_FILL",
};

/* ── Label pattern fallbacks ─────────────────────────────── */

/** Risky label patterns → NEVER_AUTO_FILL. Checked first; escalation only. */
const NEVER_LABEL_PATTERNS: RegExp[] = [
  /authori[sz](ed|ation)/,
  /legally\s+(able|permitted|allowed)\s+to\s+work/,
  /work\s+permit/,
  /right\s+to\s+work/,
  /sponsor/,
  /\bvisa\b/,
  /immigration/,
  /criminal/,
  /felony/,
  /convict/,
  /disabilit/,
  /\bgender\b/,
  /\bsex\b/,
  /\brace\b/,
  /ethnicit/,
  /veteran/,
  /military\s+(status|service)/,
  /certif(y|ication)\b.*\b(true|accurate|correct)/,
  /\bi\s+certify\b/,
  /\battest\b/,
  /penalty\s+of\s+perjury/,
  /\bconsent\b/,
  /privacy\s+(policy|notice)/,
  /terms\s+(of|and|&)/,
  /\bgdpr\b/,
  /data\s+process/,
  /background\s+check/,
  /captcha/,
  /human\s+verification/,
  /not\s+a\s+robot/,
  /\beeo\b/,
  /self.?identif/,
  /pronoun/,
];

/** Clearly-safe label patterns → SAFE_AUTO_FILL (only when nothing risky matched). */
const SAFE_LABEL_PATTERNS: RegExp[] = [
  /first\s*name/,
  /last\s*name/,
  /family\s*name/,
  /given\s*name/,
  /full\s*name/,
  /\be-?mail\b/,
  /\bphone\b/,
  /mobile\s*number/,
  /linkedin/,
  /github/,
  /portfolio/,
  /\bwebsite\b/,
];

/** Classify a raw label alone. Unknown → NEEDS_CONFIRMATION (never SAFE by default). */
export function classifyLabel(label: string): SensitivityCategory {
  const normalized = label.toLowerCase();
  if (NEVER_LABEL_PATTERNS.some((p) => p.test(normalized))) return "NEVER_AUTO_FILL";
  if (SAFE_LABEL_PATTERNS.some((p) => p.test(normalized))) return "SAFE_AUTO_FILL";
  return "NEEDS_CONFIRMATION";
}

/**
 * Classify a field into exactly one behavioral category.
 * Uses the normalized field's base classification when known,
 * then lets the raw label escalate (never reduce) severity.
 */
export function classifySensitivity(input: {
  normalizedField?: NormalizedFieldId | null;
  label?: string | null;
}): SensitivityCategory {
  const base: SensitivityCategory = input.normalizedField
    ? FIELD_SENSITIVITY[input.normalizedField]
    : "NEEDS_CONFIRMATION";

  if (!input.label || input.label.trim() === "") return base;

  const fromLabel = classifyLabel(input.label);

  // Escalation only: a risky label overrides a safe/confirm base,
  // but a safe-looking label never downgrades a sensitive base.
  if (input.normalizedField) {
    return maxSeverity(base, fromLabel === "NEVER_AUTO_FILL" ? "NEVER_AUTO_FILL" : base);
  }
  return fromLabel;
}

/* ── Heuristic label → normalized field guess ────────────── */

const LABEL_FIELD_GUESSES: { pattern: RegExp; field: NormalizedFieldId }[] = [
  { pattern: /sponsor/, field: "sponsorshipRequired" },
  { pattern: /authori[sz]|work\s+permit|right\s+to\s+work/, field: "authorizedInCountry" },
  { pattern: /\bvisa\b/, field: "visaStatus" },
  { pattern: /salary|compensation|pay\s+expectation/, field: "expectedSalary" },
  { pattern: /notice\s+period/, field: "noticePeriod" },
  { pattern: /start\s+date|available\s+to\s+start|availability/, field: "earliestStartDate" },
  { pattern: /relocat/, field: "willingToRelocate" },
  { pattern: /\bphone\b|mobile\s*number/, field: "phone" },
  { pattern: /\be-?mail\b/, field: "email" },
  { pattern: /linkedin/, field: "linkedInUrl" },
  { pattern: /github/, field: "gitHubUrl" },
  { pattern: /portfolio/, field: "portfolioUrl" },
  { pattern: /cover\s+letter/, field: "coverLetterBody" },
];

/**
 * Best-effort guess of the normalized field a free-text question refers to.
 * Returns null when nothing matches — callers must treat null as "custom".
 */
export function guessNormalizedFieldFromLabel(label: string): NormalizedFieldId | null {
  const normalized = label.toLowerCase();
  for (const { pattern, field } of LABEL_FIELD_GUESSES) {
    if (pattern.test(normalized)) return field;
  }
  return null;
}

/** Convenience: full classification result for a raw question/label. */
export function classifyQuestion(label: string): {
  normalizedField: NormalizedFieldId | null;
  category: ReturnType<typeof categoryOf>;
  sensitivity: SensitivityCategory;
} {
  const normalizedField = guessNormalizedFieldFromLabel(label);
  return {
    normalizedField,
    category: categoryOf(normalizedField),
    sensitivity: classifySensitivity({ normalizedField, label }),
  };
}

function categoryOf(field: NormalizedFieldId | null) {
  return field ? FIELD_CATEGORY[field] : ("customQuestions" as const);
}
