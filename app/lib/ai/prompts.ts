/* ─────────────────────────────────────────────────────────
   Prompt builders for each AI generation surface.

   Rules enforced in every prompt:
   - Do not invent skills, experience, or facts.
   - Do not fabricate company information.
   - Do not infer sensitive data (visa, salary, demographics).
   - Flag missing information; never fabricate it.
   - Use action-oriented, professional language.
   - Return structured JSON only.
   ───────────────────────────────────────────────────────── */

import type { CandidateProfile, PackageGenerationInput } from "./contracts";

export function buildMasterCvPrompt(
  profile: CandidateProfile,
  rawCvText?: string
): string {
  const experienceSummary = profile.workExperience
    .map(
      (exp) =>
        `Role: ${exp.role} at ${exp.company} (${exp.period})\n` +
        (exp.bullets.length > 0
          ? `Existing bullets: ${exp.bullets.join("; ")}`
          : "(no bullets yet)")
    )
    .join("\n\n");

  const projectSummary = profile.projects
    .map(
      (p) =>
        `Project: ${p.name} (Stack: ${p.stack.join(", ")})\nDescription: ${p.description}`
    )
    .join("\n\n");

  const educationSummary = profile.education
    .map((e) => `${e.degree} — ${e.institution} (${e.period})`)
    .join("\n");

  const rawCvSection = rawCvText?.trim()
    ? `\n\nThe candidate also provided the following raw CV text for additional context. Use it to supplement (not override) the structured profile above:\n<RAW_CV>\n${rawCvText.trim()}\n</RAW_CV>`
    : "";

  return `You are an expert CV writer and career strategist at ApplyMate AI.
Your task is to analyze the candidate's structured profile and produce a polished, honest Master CV result.

STRICT RULES:
1. Do not invent skills, experience, results, or metrics not present in the profile.
2. Do not add percentage improvements or quantified achievements unless they appear in the source data.
3. Use action-oriented, recruiter-friendly language.
4. If important information is missing (work authorization, language level, etc.), add it to "gaps" — do not guess.
5. Improve clarity and impact; preserve factual meaning.
6. The readinessScore (0–100) must reflect completeness and strength of the actual profile, not aspirational.
7. Return structured JSON matching the schema exactly. No markdown, no preamble.

CANDIDATE PROFILE:
Name: ${profile.fullName}
Headline: ${profile.headline}
Summary: ${profile.professionalSummary}
Target roles: ${profile.targetJobTitles.join(", ")}
Technical skills: ${profile.technicalSkills.join(", ")}
Languages: ${profile.languages.map((l) => `${l.language} (${l.level})`).join(", ")}
Work authorization: ${profile.workAuthorization || "NOT SPECIFIED"}
Location: ${profile.city}, ${profile.country}

WORK EXPERIENCE:
${experienceSummary || "(none provided)"}

EDUCATION:
${educationSummary || "(none provided)"}

PROJECTS:
${projectSummary || "(none provided)"}

CERTIFICATIONS:
${profile.certifications.length > 0 ? profile.certifications.join(", ") : "(none)"}
${rawCvSection}`;
}

export function buildApplicationPackagePrompt(
  input: PackageGenerationInput
): string {
  const { profile, masterCvSummary, jobDescriptionText, companyName, roleTitle, applicationLanguage } = input;

  const lang = applicationLanguage || "English";

  const cvContext = masterCvSummary?.trim()
    ? `\nMASTER CV SUMMARY:\n${masterCvSummary.trim()}`
    : `\nCANDIDATE SKILLS: ${profile.technicalSkills.join(", ")}\nCANDIDATE SUMMARY: ${profile.professionalSummary}`;

  return `You are a senior career strategist at ApplyMate AI. Generate a complete, honest application package for the candidate below.

STRICT RULES:
1. Do not claim experience or skills the candidate does not demonstrably have.
2. Do not invent company facts — use only what is in the job description.
3. Do not fabricate metrics, achievements, or outcomes.
4. Do not answer sensitive questions (demographic, disability, etc.) — mark as needs-user-input.
5. If work authorization or salary expectation is not in the profile, leave them as needs-user-input.
6. A "Weak fit" job must NOT receive a deceptively positive package. Be honest.
7. The cover letter and recruiter message must be written in: ${lang}.
8. Generate only the application answers for questions explicitly mentioned in the job description.
9. Return structured JSON only. No markdown, no preamble.

CANDIDATE PROFILE:
Name: ${profile.fullName}
Location: ${profile.city}, ${profile.country}
Work authorization: ${profile.workAuthorization || "NOT SPECIFIED — mark as needs-user-input"}
Target roles: ${profile.targetJobTitles.join(", ")}
Languages: ${profile.languages.map((l) => `${l.language} (${l.level})`).join(", ")}
Remote preference: ${profile.remotePreference}
Employment types: ${profile.employmentTypes.join(", ")}
${cvContext}

TARGET JOB:
Company: ${companyName}
Role: ${roleTitle}

JOB DESCRIPTION:
<JOB_DESCRIPTION>
${jobDescriptionText}
</JOB_DESCRIPTION>`;
}
