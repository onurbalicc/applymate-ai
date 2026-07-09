import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  try {
    const { cv, jobDesc } = await request.json();

    if (!cv || !cv.trim() || !jobDesc || !jobDesc.trim()) {
      return NextResponse.json(
        { success: false, error: "CV and Job Description are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback behavior if GEMINI_API_KEY is missing
      const fallbackResult: AnalysisResult = {
        matchScore: 84,
        decision: "Strong fit",
        summary: "This is a demo fallback result. Add a real GEMINI_API_KEY in your .env.local to trigger live AI matching. Candidate shows strong potential in Python and data analytics.",
        strengths: ["Python (Mock)", "SQL (Mock)", "Data Analytics (Mock)", "Machine Learning (Mock)"],
        gaps: ["FastAPI (Mock)", "Docker (Mock)", "German B1 (Mock)"],
        risks: ["No work authorization for Germany explicitly mentioned (Mock)"],
        recommendedFocus: [
          "Highlight experience with data pipeline scaling (Mock)",
          "Clarify exact level of German proficiency (Mock)"
        ],
        suggestedNextStep: "prepare application package"
      };

      return NextResponse.json({
        success: true,
        result: fallbackResult,
        isMock: true,
      });
    }

    const prompt = `
You are an expert technical recruiter and career coach at ApplyMate AI.
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
6. Return a JSON object matching the requested schema. Do not output markdown, preambles, or postambles.
`;

    // Make api call to Gemini API using native fetch
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                matchScore: { type: "INTEGER" },
                decision: { type: "STRING", enum: ["Strong fit", "Possible fit", "Weak fit"] },
                summary: { type: "STRING" },
                strengths: { type: "ARRAY", items: { type: "STRING" } },
                gaps: { type: "ARRAY", items: { type: "STRING" } },
                risks: { type: "ARRAY", items: { type: "STRING" } },
                recommendedFocus: { type: "ARRAY", items: { type: "STRING" } },
                suggestedNextStep: { type: "STRING" }
              },
              required: ["matchScore", "decision", "summary", "strengths", "gaps", "risks", "recommendedFocus", "suggestedNextStep"]
            }
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("Empty response from Gemini API model.");
    }

    let parsed: AnalysisResult;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new Error("Gemini model output failed to parse as valid JSON.");
    }

    // Defensive runtime validations
    if (typeof parsed.matchScore !== "number" || isNaN(parsed.matchScore)) {
      parsed.matchScore = 0;
    }
    if (!["Strong fit", "Possible fit", "Weak fit"].includes(parsed.decision)) {
      parsed.decision = "Possible fit";
    }
    parsed.summary = parsed.summary || "";
    parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
    parsed.gaps = Array.isArray(parsed.gaps) ? parsed.gaps : [];
    parsed.risks = Array.isArray(parsed.risks) ? parsed.risks : [];
    parsed.recommendedFocus = Array.isArray(parsed.recommendedFocus) ? parsed.recommendedFocus : [];
    parsed.suggestedNextStep = parsed.suggestedNextStep || "";

    return NextResponse.json({
      success: true,
      result: parsed,
      isMock: false,
    });
  } catch (error) {
    console.error("AI Analysis failed:", error);
    const message = error instanceof Error ? error.message : "An internal error occurred.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
