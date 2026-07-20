/* ─────────────────────────────────────────────────────────
   Deterministic signal table mapping raw DOM evidence to
   ApplyMate's NormalizedFieldId vocabulary (imported directly
   from app/lib/application-fields/contracts.ts — never
   redefined here).

   This is intentionally more detailed than
   classifier.ts::guessNormalizedFieldFromLabel (which only
   needs to guess from a bare question string for missing-info
   purposes). The extension has richer DOM evidence available
   — input type, name/id, placeholder, option labels — so it
   scores multiple signals per field instead of a single regex.
   ───────────────────────────────────────────────────────── */

import type { NormalizedFieldId } from "../../../app/lib/application-fields/contracts";
import type { RawFieldInputType } from "./contracts";

export interface FieldSignalRule {
  field: NormalizedFieldId;
  /** Matched against the combined label/name/id/placeholder/aria text. */
  textPatterns: RegExp[];
  /** Input types that corroborate this field (bonus score, not required). */
  typeHints?: RawFieldInputType[];
  /** This rule's patterns are generic single words (e.g. "country", "role")
      that reliably identify a short standalone field label but produce
      false positives when embedded inside a longer sentence (e.g. "...in
      this country?"). Only evaluated when the combined signal text is
      short — long free-text questions never match on these alone. */
  shortTextOnly?: boolean;
}

export const SHORT_TEXT_WORD_LIMIT = 6;

export const FIELD_SIGNAL_RULES: FieldSignalRule[] = [
  // Identity
  { field: "givenName", textPatterns: [/first\s*name/, /given\s*name/, /^fname$/] },
  { field: "familyName", textPatterns: [/last\s*name/, /family\s*name/, /sur\s*name/, /^lname$/] },
  { field: "fullName", textPatterns: [/full\s*name/, /^name$/, /your\s*name/, /legal\s*name/] },
  { field: "preferredPronouns", textPatterns: [/pronoun/] },

  // Contact
  { field: "email", textPatterns: [/e-?mail/], typeHints: ["email"] },
  { field: "phone", textPatterns: [/phone/, /mobile/, /telephone/], typeHints: ["tel"] },
  { field: "city", textPatterns: [/\bcity\b/, /\btown\b/], shortTextOnly: true },
  { field: "country", textPatterns: [/\bcountry\b/, /\bnation\b/], shortTextOnly: true },
  { field: "currentLocation", textPatterns: [/current\s*location/, /where.*(based|located)/, /\blocation\b/] },

  // Professional links
  { field: "linkedInUrl", textPatterns: [/linkedin/] },
  { field: "gitHubUrl", textPatterns: [/github/] },
  { field: "portfolioUrl", textPatterns: [/portfolio/] },
  { field: "websiteUrl", textPatterns: [/\bwebsite\b/, /personal\s*site/] },
  { field: "otherLink", textPatterns: [/other\s*link/, /additional\s*link/], typeHints: ["url"] },

  // Documents
  { field: "resumeFile", textPatterns: [/r[eé]sum[eé]/, /\bcv\b/], typeHints: ["file"] },
  { field: "coverLetterFile", textPatterns: [/cover\s*letter/], typeHints: ["file"] },
  { field: "portfolioFile", textPatterns: [/portfolio\s*(file|attachment|upload)/, /work\s*sample/], typeHints: ["file"] },

  // Location preferences
  { field: "willingToRelocate", textPatterns: [/relocat/] },
  { field: "remotePreference", textPatterns: [/remote/, /work\s*from\s*home/, /hybrid/, /on-?site\s*preference/] },

  // Work authorization
  { field: "authorizedInCountry", textPatterns: [/authori[sz](ed|ation)/, /right\s+to\s+work/, /work\s+permit/, /legally\s+(able|permitted|allowed)\s+to\s+work/] },
  { field: "sponsorshipRequired", textPatterns: [/sponsor/] },
  { field: "visaStatus", textPatterns: [/\bvisa\b/, /immigration/] },

  // Salary & availability
  { field: "expectedSalary", textPatterns: [/salary/, /compensation/, /pay\s*expectation/] },
  { field: "salaryCurrency", textPatterns: [/currency/] },
  { field: "salaryPeriod", textPatterns: [/salary.*(per|frequency)/, /annual|hourly|monthly.*(rate|salary)/] },
  { field: "noticePeriod", textPatterns: [/notice\s*period/] },
  { field: "earliestStartDate", textPatterns: [/start\s*date/, /available\s*to\s*start/, /availability/], typeHints: ["date"] },

  // Education
  { field: "institution", textPatterns: [/school|university|institution|college/] },
  { field: "degree", textPatterns: [/\bdegree\b/] },
  { field: "fieldOfStudy", textPatterns: [/field\s*of\s*study/, /major/, /discipline/] },
  { field: "educationStartDate", textPatterns: [/education.*start/, /start.*(school|university|study)/], typeHints: ["date"] },
  { field: "educationEndDate", textPatterns: [/education.*end/, /graduat/], typeHints: ["date"] },

  // Experience
  { field: "currentCompany", textPatterns: [/current\s*(company|employer)/] },
  { field: "currentTitle", textPatterns: [/current\s*(title|role|position)/, /job\s*title/] },
  { field: "employer", textPatterns: [/\bemployer\b/, /\bcompany\b/], shortTextOnly: true },
  { field: "role", textPatterns: [/\brole\b/, /\bposition\b/], shortTextOnly: true },
  { field: "experienceStartDate", textPatterns: [/experience.*start/, /employment.*start/], typeHints: ["date"] },
  { field: "experienceEndDate", textPatterns: [/experience.*end/, /employment.*end/], typeHints: ["date"] },
  { field: "experienceDescription", textPatterns: [/describe\s*your\s*experience/, /relevant\s*experience/] },

  // Application content / generated answers
  { field: "coverLetterBody", textPatterns: [/cover\s*letter/, /motivation\s*letter/] },
  { field: "recruiterMessage", textPatterns: [/message\s*to\s*(the\s*)?recruiter/, /note\s*to\s*hiring/] },
  { field: "additionalInformation", textPatterns: [/additional\s*information/, /anything\s*else/] },

  // Legal & sensitive
  { field: "certifyTrueAndAccurate", textPatterns: [/certify.*(true|accurate|correct)/, /\bi\s+certify\b/, /\battest\b/, /penalty\s+of\s+perjury/] },
  { field: "consentToDataProcessing", textPatterns: [/\bconsent\b/, /privacy\s*(policy|notice)/, /\bgdpr\b/, /data\s*process/] },
  { field: "backgroundCheckConsent", textPatterns: [/background\s*check/] },
  { field: "criminalHistory", textPatterns: [/criminal/, /felony/, /convict/] },
  { field: "gender", textPatterns: [/\bgender\b/, /\bsex\b/] },
  { field: "raceOrEthnicity", textPatterns: [/\brace\b/, /ethnicit/] },
  { field: "veteranStatus", textPatterns: [/veteran/, /military\s*(status|service)/] },
  { field: "disabilityStatus", textPatterns: [/disabilit/] },
  { field: "captcha", textPatterns: [/captcha/, /human\s*verification/, /not\s*a\s*robot/] },
];
