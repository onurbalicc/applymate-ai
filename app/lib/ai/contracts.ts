/* ─────────────────────────────────────────────────────────
   AI contracts — TypeScript types for all AI surface
   inputs and outputs across the ApplyMate generation layer.

   Server routes receive these as POST bodies.
   Client components build these from profile state.
   ───────────────────────────────────────────────────────── */

/* ── Candidate Profile ───────────────────────────────────── */

export interface WorkExperience {
  id: string;
  role: string;
  company: string;
  period: string;
  bullets: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  period: string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  stack: string[];
  description: string;
}

export interface LanguageLevel {
  language: string;
  level: string;
}

export interface CandidateProfile {
  // Personal
  fullName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedIn: string;
  gitHub: string;
  portfolio: string;

  // Professional
  headline: string;
  professionalSummary: string;
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  technicalSkills: string[];
  languages: LanguageLevel[];
  certifications: string[];

  // Application preferences
  targetJobTitles: string[];
  preferredLocations: string[];
  remotePreference: "remote" | "hybrid" | "onsite" | "flexible";
  employmentTypes: string[];
  salaryExpectation: string;
  noticePeriod: string;
  earliestStartDate: string;
  workAuthorization: string;
  visaSponsorshipRequired: boolean;
  willingToRelocate: boolean;
  preferredApplicationLanguage: string;
  /** Keywords that auto-exclude a job from discovery (e.g. "senior", "10+ years"). */
  excludedKeywords: string[];
  /** Jobs below this score are filtered out before entering the review queue (0–100). */
  minMatchScore: number;

  // Reusable application answers — never infer sensitive fields
  whyInterestedInRoleTemplate: string;
  availabilityNote: string;

  /**
   * Explicit, user-approved answers reusable across applications — the
   * ONLY way a NEEDS_CONFIRMATION or NEVER_AUTO_FILL field may be answered
   * autonomously (see browser-extension/src/execution/answer-resolver.ts).
   * Never populated by AI generation; only ever written by the user
   * explicitly saving an answer (in Profile settings, or approving one
   * from a review-required application).
   */
  reusableAnswers: ReusableAnswer[];

  /**
   * The user's explicit, standing policy for demographic self-identification
   * questions (gender, race/ethnicity, veteran status, disability, sexual
   * orientation, etc.) on autonomous applications. Defaults to "not-set",
   * which always routes a required demographic question to review-required
   * — it is never treated as an implicit "decline" or a green light to guess.
   */
  demographicAnswerPolicy: DemographicAnswerPolicy;
  /** Only consulted when demographicAnswerPolicy === "use-explicit-profile-answer". */
  demographicAnswers: DemographicAnswers;
}

/** One reusable answer the user explicitly approved for autonomous reuse.
    `questionKey` is a normalized-question identity (see missing-info.ts's
    missingInfoId, reused here for the same stable-matching behavior) so
    the same saved answer matches equivalent phrasing across ATS forms. */
export interface ReusableAnswer {
  questionKey: string;
  /** The verbatim question text as originally asked, for display only. */
  question: string;
  answer: string;
  approvedAt: string;
}

export type DemographicAnswerPolicy =
  /** No standing policy — every required demographic question routes to
      review-required until the user explicitly sets one. This is the
      default and the only safe out-of-the-box behavior. */
  | "not-set"
  /** Select the ATS's own "Decline to self-identify" / "Prefer not to
      answer" option wherever the platform offers one. */
  | "decline"
  /** Use the specific value the user stored for that exact question in
      `demographicAnswers` below — never inferred, only ever explicit. */
  | "use-explicit-profile-answer";

/** Explicit demographic self-identification answers, keyed by the same
    NormalizedFieldId used everywhere else in the field contract. Only
    consulted when demographicAnswerPolicy === "use-explicit-profile-answer",
    and only for the exact key present — never extrapolated to a related
    field. Kept out of CandidateProfile's main shape (a separate, clearly-
    named sub-object) so it is never accidentally copied into a generic
    profile-value lookup the way SAFE_AUTO_FILL fields are. */
export interface DemographicAnswers {
  gender?: string;
  raceOrEthnicity?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
  sexualOrientation?: string;
  transgenderStatus?: string;
}

/* ── Master CV Generation ────────────────────────────────── */

export interface CvGenerationInput {
  profile: CandidateProfile;
  rawCvText?: string;
}

export interface ExperienceBullets {
  experienceId: string;
  bullets: string[];
}

export interface ProjectBullets {
  projectId: string;
  bullets: string[];
}

export interface MasterCvResult {
  headline: string;
  professionalSummary: string;
  experienceBullets: ExperienceBullets[];
  projectBullets: ProjectBullets[];
  skills: {
    languages: string[];
    dataAndAI: string[];
    toolsAndPlatforms: string[];
    other: string[];
  };
  gaps: string[];
  improvementSuggestions: string[];
  readinessScore: number;
}

/* ── Application Package Generation ─────────────────────── */

export interface PackageGenerationInput {
  profile: CandidateProfile;
  masterCvSummary?: string;
  jobDescriptionText: string;
  companyName: string;
  roleTitle: string;
  applicationLanguage?: string;
}

export interface ApplicationAnswer {
  question: string;
  answer: string;
  confidence: "high" | "medium" | "needs-user-input";
}

export interface ApplicationPackage {
  matchScore: number;
  decision: "Strong fit" | "Possible fit" | "Weak fit";
  fitSummary: string;
  strengths: string[];
  gaps: string[];
  risks: string[];
  cvAdaptation: {
    headline: string;
    summary: string;
    skillsToPrioritize: string[];
    bulletSuggestions: string[];
    keywords: string[];
  };
  coverLetter: {
    subject: string;
    body: string;
  };
  recruiterMessage: string;
  applicationAnswers: ApplicationAnswer[];
  missingInformation: string[];
  recommendedNextStep: string;
  /** Stable document references selected outside the AI response. Raw bytes
      are never part of an application package. */
  documents?: {
    resumeDocumentId?: string;
    coverLetterDocumentId?: string;
  };
}

/* ── AI Response wrapper ─────────────────────────────────── */

export interface AiResponse<T> {
  result: T;
  isMock: boolean;
}
