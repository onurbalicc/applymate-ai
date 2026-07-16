import { NextResponse } from "next/server";
import { callGemini } from "@/app/lib/ai/provider";
import { buildMasterCvPrompt } from "@/app/lib/ai/prompts";
import type { CvGenerationInput, MasterCvResult } from "@/app/lib/ai/contracts";

/* ─────────────────────────────────────────────────────────
   POST /api/generate-cv
   Body: CvGenerationInput
   Response: { success, result: MasterCvResult, isMock }
   ───────────────────────────────────────────────────────── */

const FALLBACK: MasterCvResult = {
  headline:
    "Data Analytics M.Sc. Student | Python · SQL · dbt · Machine Learning · AI Engineering",
  professionalSummary:
    "This is a demo fallback result. Add a real GEMINI_API_KEY in your .env.local to generate a live Master CV. Candidate demonstrates a strong technical foundation in Python, SQL, and dbt, with hands-on machine learning and applied AI engineering experience.",
  experienceBullets: [
    {
      experienceId: "exp-1",
      bullets: [
        "Designed and maintained modular dbt data models and transformation pipelines for analytical reporting. (Demo)",
        "Built and evaluated ML models using Python, Scikit-learn, and PyTorch for classification and NLP tasks. (Demo)",
        "Developed interactive dashboards translating complex datasets into actionable business insights. (Demo)",
        "Explored LLM and RAG architectures as part of applied AI engineering coursework. (Demo)",
      ],
    },
  ],
  projectBullets: [
    {
      projectId: "proj-1",
      bullets: [
        "Built an AI-powered job application assistant using Next.js and Gemini API with structured LLM outputs. (Demo)",
      ],
    },
    {
      projectId: "proj-2",
      bullets: [
        "Implemented a retrieval-augmented generation pipeline enabling semantic search over large document collections. (Demo)",
      ],
    },
    {
      projectId: "proj-3",
      bullets: [
        "Designed modular dbt models with testing and documentation for an analytical data layer serving BI reporting. (Demo)",
      ],
    },
  ],
  skills: {
    languages: ["Python", "SQL", "TypeScript"],
    dataAndAI: ["Machine Learning", "LLMs", "RAG", "NLP", "Scikit-learn", "PyTorch"],
    toolsAndPlatforms: ["dbt", "Git", "GitHub", "Jupyter", "BigQuery"],
    other: ["Data Analytics", "BI Reporting", "Data Pipelines"],
  },
  gaps: [
    "Work authorization for Germany not specified — required for most Germany-based roles.",
    "German language level not confirmed — affects eligibility for German-only job postings.",
    "No prior professional work experience listed — only academic and project work.",
  ],
  improvementSuggestions: [
    "Specify your work authorization status (EU citizen, visa required, etc.) to unlock more filtered job matches.",
    "Add quantified outcomes to project descriptions wherever possible (e.g., processing time, model accuracy).",
    "Clarify your German language level explicitly (A2, B1, B2, C1) for better role filtering.",
    "Consider adding a FastAPI or REST API project to strengthen backend engineering match scores.",
  ],
  readinessScore: 68,
};

const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING" },
    professionalSummary: { type: "STRING" },
    experienceBullets: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          experienceId: { type: "STRING" },
          bullets: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["experienceId", "bullets"],
      },
    },
    projectBullets: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          projectId: { type: "STRING" },
          bullets: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["projectId", "bullets"],
      },
    },
    skills: {
      type: "OBJECT",
      properties: {
        languages: { type: "ARRAY", items: { type: "STRING" } },
        dataAndAI: { type: "ARRAY", items: { type: "STRING" } },
        toolsAndPlatforms: { type: "ARRAY", items: { type: "STRING" } },
        other: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["languages", "dataAndAI", "toolsAndPlatforms", "other"],
    },
    gaps: { type: "ARRAY", items: { type: "STRING" } },
    improvementSuggestions: { type: "ARRAY", items: { type: "STRING" } },
    readinessScore: { type: "INTEGER" },
  },
  required: [
    "headline",
    "professionalSummary",
    "experienceBullets",
    "projectBullets",
    "skills",
    "gaps",
    "improvementSuggestions",
    "readinessScore",
  ],
};

function sanitize(result: MasterCvResult): MasterCvResult {
  return {
    headline: result.headline || "",
    professionalSummary: result.professionalSummary || "",
    experienceBullets: Array.isArray(result.experienceBullets)
      ? result.experienceBullets
      : [],
    projectBullets: Array.isArray(result.projectBullets)
      ? result.projectBullets
      : [],
    skills: {
      languages: Array.isArray(result.skills?.languages)
        ? result.skills.languages
        : [],
      dataAndAI: Array.isArray(result.skills?.dataAndAI)
        ? result.skills.dataAndAI
        : [],
      toolsAndPlatforms: Array.isArray(result.skills?.toolsAndPlatforms)
        ? result.skills.toolsAndPlatforms
        : [],
      other: Array.isArray(result.skills?.other) ? result.skills.other : [],
    },
    gaps: Array.isArray(result.gaps) ? result.gaps : [],
    improvementSuggestions: Array.isArray(result.improvementSuggestions)
      ? result.improvementSuggestions
      : [],
    readinessScore:
      typeof result.readinessScore === "number" &&
      !isNaN(result.readinessScore)
        ? Math.max(0, Math.min(100, result.readinessScore))
        : 0,
  };
}

export async function POST(request: Request) {
  try {
    const body: CvGenerationInput = await request.json();

    if (!body.profile) {
      return NextResponse.json(
        { success: false, error: "Candidate profile is required." },
        { status: 400 }
      );
    }

    const prompt = buildMasterCvPrompt(body.profile, body.rawCvText);

    const { result, isMock } = await callGemini<MasterCvResult>({
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
    console.error("Master CV generation failed:", error);
    const message =
      error instanceof Error ? error.message : "An internal error occurred.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
