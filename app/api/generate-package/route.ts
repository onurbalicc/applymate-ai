import { NextResponse } from "next/server";
import { callGemini } from "@/app/lib/ai/provider";
import { buildApplicationPackagePrompt } from "@/app/lib/ai/prompts";
import type {
  PackageGenerationInput,
  ApplicationPackage,
} from "@/app/lib/ai/contracts";

/* ─────────────────────────────────────────────────────────
   POST /api/generate-package
   Body: PackageGenerationInput
   Response: { success, result: ApplicationPackage, isMock }
   ───────────────────────────────────────────────────────── */

const FALLBACK: ApplicationPackage = {
  matchScore: 82,
  decision: "Possible fit",
  fitSummary:
    "This is a demo fallback result. Add a real GEMINI_API_KEY in your .env.local to generate a live application package. Candidate shows relevant technical skills for this role, with some gaps in specific tooling.",
  strengths: ["Python (Demo)", "SQL (Demo)", "Machine Learning (Demo)"],
  gaps: [
    "Specific tool/framework experience not confirmed (Demo)",
    "Work authorization not specified (Demo)",
  ],
  risks: [
    "Work authorization details not provided — confirm eligibility before applying. (Demo)",
  ],
  cvAdaptation: {
    headline: "Data Analytics M.Sc. Student | Python · SQL · ML (Demo)",
    summary:
      "Candidate demonstrates relevant analytical and engineering skills. Profile should be tailored to highlight role-specific experience. (Demo)",
    skillsToPrioritize: ["Python", "SQL", "Machine Learning"],
    bulletSuggestions: [
      "Highlight any API or backend project experience for engineering roles. (Demo)",
      "Lead with the most impactful data or AI project for data science roles. (Demo)",
    ],
    keywords: ["Python", "SQL", "Machine Learning", "Data Analytics"],
  },
  coverLetter: {
    subject: "Application — [Role Title] at [Company] (Demo)",
    body: "This is a demo cover letter placeholder. Add GEMINI_API_KEY to generate a real, personalised cover letter based on the job description and candidate profile.",
  },
  recruiterMessage:
    "This is a demo recruiter message placeholder. Add GEMINI_API_KEY to generate a real, concise recruiter outreach message. (Demo)",
  applicationAnswers: [
    {
      question: "What is your work authorization status?",
      answer: "",
      confidence: "needs-user-input",
    },
  ],
  missingInformation: [
    "Work authorization status for this location",
    "Salary expectation (if required by the application form)",
  ],
  recommendedNextStep: "Review the package and confirm missing information before applying.",
};

const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    matchScore: { type: "INTEGER" },
    decision: {
      type: "STRING",
      enum: ["Strong fit", "Possible fit", "Weak fit"],
    },
    fitSummary: { type: "STRING" },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    gaps: { type: "ARRAY", items: { type: "STRING" } },
    risks: { type: "ARRAY", items: { type: "STRING" } },
    cvAdaptation: {
      type: "OBJECT",
      properties: {
        headline: { type: "STRING" },
        summary: { type: "STRING" },
        skillsToPrioritize: { type: "ARRAY", items: { type: "STRING" } },
        bulletSuggestions: { type: "ARRAY", items: { type: "STRING" } },
        keywords: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: [
        "headline",
        "summary",
        "skillsToPrioritize",
        "bulletSuggestions",
        "keywords",
      ],
    },
    coverLetter: {
      type: "OBJECT",
      properties: {
        subject: { type: "STRING" },
        body: { type: "STRING" },
      },
      required: ["subject", "body"],
    },
    recruiterMessage: { type: "STRING" },
    applicationAnswers: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          answer: { type: "STRING" },
          confidence: {
            type: "STRING",
            enum: ["high", "medium", "needs-user-input"],
          },
        },
        required: ["question", "answer", "confidence"],
      },
    },
    missingInformation: { type: "ARRAY", items: { type: "STRING" } },
    recommendedNextStep: { type: "STRING" },
  },
  required: [
    "matchScore",
    "decision",
    "fitSummary",
    "strengths",
    "gaps",
    "risks",
    "cvAdaptation",
    "coverLetter",
    "recruiterMessage",
    "applicationAnswers",
    "missingInformation",
    "recommendedNextStep",
  ],
};

function sanitize(result: ApplicationPackage): ApplicationPackage {
  const validDecisions = ["Strong fit", "Possible fit", "Weak fit"] as const;
  const validConfidence = ["high", "medium", "needs-user-input"] as const;

  return {
    matchScore:
      typeof result.matchScore === "number" && !isNaN(result.matchScore)
        ? Math.max(0, Math.min(100, result.matchScore))
        : 0,
    decision: validDecisions.includes(result.decision)
      ? result.decision
      : "Possible fit",
    fitSummary: result.fitSummary || "",
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    gaps: Array.isArray(result.gaps) ? result.gaps : [],
    risks: Array.isArray(result.risks) ? result.risks : [],
    cvAdaptation: {
      headline: result.cvAdaptation?.headline || "",
      summary: result.cvAdaptation?.summary || "",
      skillsToPrioritize: Array.isArray(result.cvAdaptation?.skillsToPrioritize)
        ? result.cvAdaptation.skillsToPrioritize
        : [],
      bulletSuggestions: Array.isArray(result.cvAdaptation?.bulletSuggestions)
        ? result.cvAdaptation.bulletSuggestions
        : [],
      keywords: Array.isArray(result.cvAdaptation?.keywords)
        ? result.cvAdaptation.keywords
        : [],
    },
    coverLetter: {
      subject: result.coverLetter?.subject || "",
      body: result.coverLetter?.body || "",
    },
    recruiterMessage: result.recruiterMessage || "",
    applicationAnswers: Array.isArray(result.applicationAnswers)
      ? result.applicationAnswers.map((a) => ({
          question: a.question || "",
          answer: a.answer || "",
          confidence: validConfidence.includes(a.confidence)
            ? a.confidence
            : "needs-user-input",
        }))
      : [],
    missingInformation: Array.isArray(result.missingInformation)
      ? result.missingInformation
      : [],
    recommendedNextStep: result.recommendedNextStep || "",
  };
}

export async function POST(request: Request) {
  try {
    const body: PackageGenerationInput = await request.json();

    if (!body.profile) {
      return NextResponse.json(
        { success: false, error: "Candidate profile is required." },
        { status: 400 }
      );
    }
    if (!body.jobDescriptionText?.trim()) {
      return NextResponse.json(
        { success: false, error: "Job description text is required." },
        { status: 400 }
      );
    }
    if (!body.companyName?.trim() || !body.roleTitle?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Company name and role title are required.",
        },
        { status: 400 }
      );
    }

    const prompt = buildApplicationPackagePrompt(body);

    const { result, isMock } = await callGemini<ApplicationPackage>({
      prompt,
      schema: GEMINI_SCHEMA,
      fallback: FALLBACK,
    });

    return NextResponse.json({
      success: true,
      result: sanitize(result),
      isMock,
    });
  } catch (error) {
    console.error("Application package generation failed:", error);
    const message =
      error instanceof Error ? error.message : "An internal error occurred.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
