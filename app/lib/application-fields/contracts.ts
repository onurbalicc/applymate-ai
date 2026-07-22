/* ─────────────────────────────────────────────────────────
   Unified Application Field Contract — ATS-independent.

   This is ApplyMate's internal vocabulary for application-form
   fields. Every ATS integration (Greenhouse, Lever, and any
   future one) normalizes INTO this model and maps OUT of it —
   the rest of the product never needs to know how a specific
   ATS names or structures a field.

   Pure types + lookup tables. No React, no storage, no AI —
   deliberately dependency-free so it can be shared with a
   future browser extension and unit-tested in plain Node.
   ───────────────────────────────────────────────────────── */

/** Top-level grouping every normalized field belongs to. */
export type FieldCategory =
  | "identity"
  | "contact"
  | "professionalLinks"
  | "documents"
  | "location"
  | "workAuthorization"
  | "salary"
  | "education"
  | "experience"
  | "generatedAnswers"
  | "legalDeclarations"
  | "demographicQuestions"
  | "customQuestions";

/** Every normalized field ApplyMate understands today. */
export type NormalizedFieldId =
  // identity
  | "givenName"
  | "familyName"
  | "fullName"
  | "preferredPronouns"
  // contact
  | "email"
  | "phone"
  | "city"
  | "country"
  | "currentLocation"
  // professionalLinks
  | "linkedInUrl"
  | "gitHubUrl"
  | "portfolioUrl"
  | "websiteUrl"
  | "otherLink"
  // documents
  | "resumeFile"
  | "coverLetterFile"
  | "portfolioFile"
  // location
  | "willingToRelocate"
  | "remotePreference"
  // workAuthorization
  | "authorizedInCountry"
  | "sponsorshipRequired"
  | "visaStatus"
  // salary & availability
  | "expectedSalary"
  | "salaryCurrency"
  | "salaryPeriod"
  | "noticePeriod"
  | "earliestStartDate"
  // education
  | "institution"
  | "degree"
  | "fieldOfStudy"
  | "educationStartDate"
  | "educationEndDate"
  // experience
  | "currentCompany"
  | "currentTitle"
  | "employer"
  | "role"
  | "experienceStartDate"
  | "experienceEndDate"
  | "experienceDescription"
  // generated content
  | "coverLetterBody"
  | "recruiterMessage"
  | "customQuestionAnswer"
  | "additionalInformation"
  // legal & sensitive
  | "certifyTrueAndAccurate"
  | "consentToDataProcessing"
  | "backgroundCheckConsent"
  | "criminalHistory"
  | "gender"
  | "raceOrEthnicity"
  | "veteranStatus"
  | "disabilityStatus"
  | "sexualOrientation"
  | "transgenderStatus"
  | "captcha";

/** Category of each normalized field — exhaustive, compiler-checked. */
export const FIELD_CATEGORY: Record<NormalizedFieldId, FieldCategory> = {
  givenName: "identity",
  familyName: "identity",
  fullName: "identity",
  preferredPronouns: "identity",

  email: "contact",
  phone: "contact",
  city: "contact",
  country: "contact",
  currentLocation: "contact",

  linkedInUrl: "professionalLinks",
  gitHubUrl: "professionalLinks",
  portfolioUrl: "professionalLinks",
  websiteUrl: "professionalLinks",
  otherLink: "professionalLinks",

  resumeFile: "documents",
  coverLetterFile: "documents",
  portfolioFile: "documents",

  willingToRelocate: "location",
  remotePreference: "location",

  authorizedInCountry: "workAuthorization",
  sponsorshipRequired: "workAuthorization",
  visaStatus: "workAuthorization",

  expectedSalary: "salary",
  salaryCurrency: "salary",
  salaryPeriod: "salary",
  noticePeriod: "salary",
  earliestStartDate: "salary",

  institution: "education",
  degree: "education",
  fieldOfStudy: "education",
  educationStartDate: "education",
  educationEndDate: "education",

  currentCompany: "experience",
  currentTitle: "experience",
  employer: "experience",
  role: "experience",
  experienceStartDate: "experience",
  experienceEndDate: "experience",
  experienceDescription: "experience",

  coverLetterBody: "generatedAnswers",
  recruiterMessage: "generatedAnswers",
  customQuestionAnswer: "customQuestions",
  additionalInformation: "generatedAnswers",

  certifyTrueAndAccurate: "legalDeclarations",
  consentToDataProcessing: "legalDeclarations",
  backgroundCheckConsent: "legalDeclarations",
  criminalHistory: "legalDeclarations",
  gender: "demographicQuestions",
  raceOrEthnicity: "demographicQuestions",
  veteranStatus: "demographicQuestions",
  disabilityStatus: "demographicQuestions",
  sexualOrientation: "demographicQuestions",
  transgenderStatus: "demographicQuestions",
  captcha: "legalDeclarations",
};

/** Input widget type as it would appear on an ATS form. */
export type FieldInputType =
  | "text"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "file"
  | "date"
  | "unknown";

/** Where a field's value comes from. */
export type FieldValueSource =
  | "profile"          // stored candidate profile fact
  | "masterCv"         // AI-polished Master CV content
  | "generatedPackage" // per-job AI-generated content
  | "userAnswer"       // explicit answer the user typed for this application
  | "documentStore"    // frozen reference to a locally stored document
  | "unavailable";     // nothing exists to fill this (e.g. no resume file)

/**
 * Behavioral sensitivity classification — see classifier.ts.
 * Severity order (low → high): SAFE_AUTO_FILL < NEEDS_CONFIRMATION < NEVER_AUTO_FILL.
 */
export type SensitivityCategory =
  | "SAFE_AUTO_FILL"
  | "NEEDS_CONFIRMATION"
  | "NEVER_AUTO_FILL";

/** Fill lifecycle of a mapped field within one assistance session. */
export type FieldFillStatus =
  | "unfilled"           // known value, not yet placed anywhere
  | "prefilled"          // auto-filled, spot-check recommended
  | "needs-confirmation" // pre-filled but blocked until the user confirms
  | "never-auto-fill"    // deliberately left untouched — manual only
  | "user-filled"        // the user filled/confirmed it themselves
  | "unavailable";       // no value/file exists to fill with

/**
 * One candidate field for a (future) form-assistance session.
 * Pre-DOM, `detectedLabel` is null — it is populated only once a
 * real form has been read by the future extension.
 */
export interface ApplicationFieldCandidate {
  normalizedField: NormalizedFieldId;
  category: FieldCategory;
  /** Raw label as detected on a live form; null before any DOM exists. */
  detectedLabel: string | null;
  inputType: FieldInputType;
  source: FieldValueSource;
  value: string | boolean | null;
  /** 0–1. Profile facts are 1; AI answers inherit their confidence. */
  confidence: number;
  sensitivity: SensitivityCategory;
  /** True for anything not SAFE_AUTO_FILL. */
  requiresUserReview: boolean;
  fillStatus: FieldFillStatus;
  required: boolean;
  /** Optional human-readable explanation or warning. */
  note?: string;
}
