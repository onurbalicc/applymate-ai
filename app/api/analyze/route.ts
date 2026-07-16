import { NextResponse } from "next/server";
import { callGemini } from "@/app/lib/ai/provider";

/* ─────────────────────────────────────────────────────────
   POST /api/analyze
   Body: { cv: string, jobDesc: string }
   Response: { success, result: AnalysisResult, isMock }
   ───────────────────────────────────────────────────────── */

export interface AnalysisResult {
  matchScore: number;
  decision: "Strong fit" | "Possible fit" | "Weak fit";
  summary: string;
  strengths: string[];
  gaps: string[];
  risks: string[];
  recommendedFocus: string[];
  suggestedNextStep: string;
}

const FALLBACK: AnalysisResult = {
  matchScore: 84,
  decision: "Strong fit",
  summary:
    "This is a demo fallback result. Add a real GEMINI_API_KEY in your .env.local to trigger live AI matching. Candidate shows strong potential in Python and data analytics.",
  strengths: ["Python (Mock)", "SQL (Mock)", "Data Analytics (Mock)", "Machine Learning (Mock)"],
  gaps: ["FastAPI (Mock)", "Docker (Mock)", "German B1 (Mock)"],
  risks: ["No work authorization for Germany explicitly mentioned (Mock)"],
  recommendedFocus: [
    "Highlight experience with data pipeline scaling (Mock)",
    "Clarify exact level of German proficiency (Mock)",
  ],
  suggestedNextStep: "prepare application package",
};

const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    matchScore: { type: "INTEGER" },
    decision: {
      type: "STRING",
      enum: ["Strong fit", "Possible fit", "Weak fit"],
    },
    summary: { type: "STRING" },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    gaps: { type: "ARRAY", items: { type: "STRING" } },
    risks: { type: "ARRAY", items: { type: "STRING" } },
    recommendedFocus: { type: "ARRAY", items: { type: "STRING" } },
    suggestedNextStep: { type: "STRING" },
  },
  required: [
    "matchScore",
    "decision",
    "summary",
    "strengths",
    "gaps",
    "risks",
    "recommendedFocus",
    "suggestedNextStep",
  ],
};

function buildPrompt(cv: string, jobDesc: string): string {
  return `You are an expert technical recruiter and career coach at ApplyMate AI.
Your goal is to perform a quality-first, honest analysis matching a candidate's CV/resume against a Job Description.

Here is the candidate's CV text:
<CV>
${cv}
</CV>

Here is the Job Description text:
<JOB_DESCRIPTION>
${jobDesc}
</JOB_DESCRIPTION>

Please evaluate the match score and fit with these strict rules:
1. Do not invent experience or skills not explicitly present in the CV.
2. Be extremely honest about gaps and risks (e.g. visa requirements, missing major tech stack, language barriers).
3. Under decision:
   - "Strong fit" means the CV meets 85%+ of requirements and stack.
   - "Possible fit" means the CV meets 65%-84% of requirements, or has minor gaps.
   - "Weak fit" means the CV has major missing requirements (<65% match).
4. For suggestedNextStep, suggest one of:
   - "prepare application package"
   - "improve profile first"
   - "skip this role"
5. Do not make assumptions. Keep the summary realistic, professional, and objective.
6. Return a JSON object matching the requested schema. Do not output markdown, preambles, or postambles.`;
}

function sanitize(result: AnalysisResult): AnalysisResult {
  const validDecisions = ["Strong fit", "Possible fit", "Weak fit"] as const;
  return {
    matchScore:
      typeof result.matchScore === "number" && !isNaN(result.matchScore)
        ? result.matchScore
        : 0,
    decision: validDecisions.includes(result.decision)
      ? result.decision
      : "Possible fit",
    summary: result.summary || "",
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    gaps: Array.isArray(result.gaps) ? result.gaps : [],
    risks: Array.isArray(result.risks) ? result.risks : [],
    recommendedFocus: Array.isArray(result.recommendedFocus)
      ? result.recommendedFocus
      : [],
    suggestedNextStep: result.suggestedNextStep || "",
  };
}

export async function POST(request: Request) {
  try {
    const { cv, jobDesc } = await request.json();

    if (!cv?.trim() || !jobDesc?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: !cv?.trim()
            ? "CV text is required."
            : "Job description is required.",
        },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(cv, jobDesc);

    const { result, isMock } = await callGemini<AnalysisResult>({
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
    console.error("AI Analysis failed:", error);
    const message =
      error instanceof Error ? error.message : "An internal error occurred.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
