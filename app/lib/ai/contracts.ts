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

  // Reusable application answers — never infer sensitive fields
  whyInterestedInRoleTemplate: string;
  availabilityNote: string;
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
}

/* ── AI Response wrapper ─────────────────────────────────── */

export interface AiResponse<T> {
  result: T;
  isMock: boolean;
}
