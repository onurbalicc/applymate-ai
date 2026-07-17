"use client";

import { reviewJobs } from "../mock-data";
import { getProfileSnapshot } from "../candidate-profile";
import { loadMasterCv, saveMasterCv } from "../master-cv-store";
import type { CandidateProfile, MasterCvResult, ApplicationPackage } from "../ai/contracts";
import {
  getAutomationJob,
  createAutomationJob,
  updateAutomationJob,
  setAutomationStatus,
} from "./store";
import { PIPELINE_STEPS, type AutomationJobSeed } from "./contracts";

/* ─────────────────────────────────────────────────────────
   Application automation orchestrator.

   startAutomation(jobIndex) / startAutomationForJob(seed) are
   the entry points, triggered by swipe-right / "Apply with
   ApplyMate". They run the full preparation pipeline in the
   background, keyed by the job's own stable identity — see
   lib/automation/store.ts for the key scheme.

     ANALYZING_JOB
     → PREPARING_MASTER_CV      (reuses cache when present)
     → GENERATING_JOB_SPECIFIC_CV ┐
     → GENERATING_COVER_LETTER    ├ one package generation call
     → PREPARING_FORM_ANSWERS     ┘
     → CHECKING_MISSING_INFORMATION
     → PACKAGE_READY
     → FORM_AUTOMATION_PENDING   (honest stop: no external
                                  submission exists yet)

   Interruptions:
   - incomplete profile        → NEEDS_USER_INPUT (before any generation)
   - package missing info      → NEEDS_USER_INPUT (compact answer request)
   - no job description        → MANUAL_ACTION_REQUIRED (never fabricated)
   - API failure               → FAILED (retryable)
   - user action               → PAUSED / CANCELLED

   The pipeline runs client-side; it survives client-side
   navigation. A hard reload pauses in-flight jobs (see store)
   and the user resumes explicitly — nothing restarts silently.
   ───────────────────────────────────────────────────────── */

const inFlight = new Set<string>();

function progressOf(status: (typeof PIPELINE_STEPS)[number]["status"]): number {
  return PIPELINE_STEPS.find((s) => s.status === status)?.progress ?? 0;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True when the user paused/cancelled while a step was awaiting. */
function stopped(key: string): boolean {
  const job = getAutomationJob(key);
  return !job || job.status === "PAUSED" || job.status === "CANCELLED";
}

/* ── Profile completeness ────────────────────────────────── */

/**
 * Fundamentals required before any generation runs.
 * Missing work authorization / salary are NOT blockers here —
 * they surface later as package-level missing information and
 * are never invented.
 */
export function checkProfileFundamentals(profile: CandidateProfile): string[] {
  const missing: string[] = [];
  if (!profile.fullName.trim()) missing.push("Full name");
  if (!profile.professionalSummary.trim()) missing.push("Professional summary");
  if (profile.technicalSkills.length === 0) missing.push("Technical skills");
  if (profile.workExperience.length === 0 && profile.education.length === 0)
    missing.push("Work experience or education");
  if (profile.targetJobTitles.length === 0) missing.push("Target job titles");
  return missing;
}

/* ── Master CV ───────────────────────────────────────────── */

/**
 * Generate the Master CV via the API and cache it.
 * Exported so the Profile page's secondary Regenerate action
 * can reuse it. Throws on failure.
 */
export async function generateMasterCvNow(): Promise<{ result: MasterCvResult; isMock: boolean }> {
  const profile = getProfileSnapshot();
  const res = await fetch("/api/generate-cv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Master CV generation failed.");
  }
  saveMasterCv(data.result, !!data.isMock);
  return { result: data.result, isMock: !!data.isMock };
}

/* ── Pipeline ────────────────────────────────────────────── */

async function runPipeline(key: string) {
  if (inFlight.has(key)) return;
  inFlight.add(key);

  try {
    const job = getAutomationJob(key);
    if (!job) {
      setAutomationStatus(key, "FAILED", { error: "Unknown job." });
      return;
    }

    /* Step 1 — analyze job + profile fundamentals */
    setAutomationStatus(key, "ANALYZING_JOB", { progress: progressOf("ANALYZING_JOB"), error: null });
    await delay(700);
    if (stopped(key)) return;

    const profile = getProfileSnapshot();
    const missingFundamentals = checkProfileFundamentals(profile);
    if (missingFundamentals.length > 0) {
      setAutomationStatus(key, "NEEDS_USER_INPUT", {
        requiresUserInput: true,
        missingInformation: missingFundamentals,
        error: null,
      });
      return;
    }

    /* Step 2 — Master CV (reuse cache when available) */
    setAutomationStatus(key, "PREPARING_MASTER_CV", { progress: progressOf("PREPARING_MASTER_CV") });
    let masterCv = loadMasterCv();
    if (!masterCv) {
      const generated = await generateMasterCvNow();
      masterCv = { result: generated.result, isMock: generated.isMock, generatedAt: new Date().toISOString() };
    } else {
      await delay(500); // cached — brief step for visible progress
    }
    if (stopped(key)) return;

    /* Step 3 — job description must exist; never fabricate it */
    if (!job.jobDescription?.trim()) {
      setAutomationStatus(key, "MANUAL_ACTION_REQUIRED", {
        error: "No job description is available for this posting. ApplyMate never fabricates job details.",
      });
      return;
    }

    /* Steps 4–6 — one package generation covers the job-specific
       CV adaptation, motivation letter, and application answers */
    setAutomationStatus(key, "GENERATING_JOB_SPECIFIC_CV", { progress: progressOf("GENERATING_JOB_SPECIFIC_CV") });

    const res = await fetch("/api/generate-package", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile,
        masterCvSummary: `${masterCv.result.headline}\n${masterCv.result.professionalSummary}`,
        jobDescriptionText: job.jobDescription,
        companyName: job.company,
        roleTitle: job.role,
        applicationLanguage: profile.preferredApplicationLanguage || "English",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Application package generation failed.");
    }
    const pkg: ApplicationPackage = data.result;
    const isDemo = !!data.isMock || masterCv.isMock;
    if (stopped(key)) return;

    setAutomationStatus(key, "GENERATING_COVER_LETTER", { progress: progressOf("GENERATING_COVER_LETTER"), isDemo });
    await delay(500);
    if (stopped(key)) return;

    setAutomationStatus(key, "PREPARING_FORM_ANSWERS", { progress: progressOf("PREPARING_FORM_ANSWERS") });
    await delay(500);
    if (stopped(key)) return;

    /* Step 7 — missing information check */
    setAutomationStatus(key, "CHECKING_MISSING_INFORMATION", {
      progress: progressOf("CHECKING_MISSING_INFORMATION"),
      package: pkg,
      isDemo,
    });
    await delay(500);
    if (stopped(key)) return;

    if (pkg.missingInformation.length > 0) {
      setAutomationStatus(key, "NEEDS_USER_INPUT", {
        requiresUserInput: true,
        missingInformation: pkg.missingInformation,
      });
      return;
    }

    /* Step 8 — done (honest stop before external automation) */
    setAutomationStatus(key, "PACKAGE_READY", { progress: progressOf("PACKAGE_READY") });
    await delay(500);
    if (stopped(key)) return;
    setAutomationStatus(key, "FORM_AUTOMATION_PENDING", { progress: 100 });
  } catch (err) {
    console.error("Automation pipeline failed:", err);
    setAutomationStatus(key, "FAILED", {
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    });
  } finally {
    inFlight.delete(key);
  }
}

/* ── Public actions ──────────────────────────────────────── */

/**
 * Generic entry point — creates the automation job (or reuses an
 * already-running/prepared one) from a fully-formed seed, then
 * starts the background pipeline. Duplicate-safe by construction:
 * the seed's key IS the job's stable identity, so re-invoking with
 * the same key never creates a second job.
 */
export function startAutomationForJob(seed: AutomationJobSeed): string {
  const existing = getAutomationJob(seed.key);
  if (existing && existing.status !== "CANCELLED" && existing.status !== "FAILED") {
    return seed.key; // already running or already prepared — never duplicate
  }
  createAutomationJob(seed);
  void runPipeline(seed.key);
  return seed.key;
}

/**
 * Swipe-right entry point for mock (reviewJobs) jobs. Thin wrapper
 * around startAutomationForJob that resolves the seed from the
 * static mock array and uses String(jobIndex) as the stable key.
 */
export function startAutomation(jobIndex: number): void {
  const mock = reviewJobs[jobIndex];
  if (!mock) return;
  startAutomationForJob({
    key: String(jobIndex),
    sourceJobId: String(jobIndex),
    isFromDiscovery: false,
    role: mock.role,
    company: mock.company,
    jobDescription: mock.jobDescription,
    applyUrl: null,
    provider: "mock",
    sourceLabel: "ApplyMate Demo",
  });
}

/** Resume a PAUSED or retry a FAILED job. Reuses cached results. */
export function resumeAutomation(key: string): void {
  const job = getAutomationJob(key);
  if (!job || (job.status !== "PAUSED" && job.status !== "FAILED")) return;

  if (job.package) {
    // Package already generated — only re-run the final checks.
    if (job.missingInformation.length > 0 && job.userProvidedAnswers.length === 0) {
      setAutomationStatus(key, "NEEDS_USER_INPUT", { requiresUserInput: true, error: null });
    } else {
      setAutomationStatus(key, "PACKAGE_READY", { progress: progressOf("PACKAGE_READY"), error: null });
      setAutomationStatus(key, "FORM_AUTOMATION_PENDING", { progress: 100 });
    }
    return;
  }

  updateAutomationJob(key, { status: "QUEUED", error: null });
  void runPipeline(key);
}

export function pauseAutomation(key: string): void {
  const job = getAutomationJob(key);
  if (!job) return;
  setAutomationStatus(key, "PAUSED", { error: null });
}

export function cancelAutomation(key: string): void {
  const job = getAutomationJob(key);
  if (!job) return;
  setAutomationStatus(key, "CANCELLED", { error: null });
}

/**
 * User answered the missing-information request.
 * Answers are stored on the job (never silently written into the
 * profile) and the application moves on to FORM_AUTOMATION_PENDING.
 */
export function provideMissingAnswers(
  key: string,
  answers: { question: string; answer: string }[]
): void {
  const job = getAutomationJob(key);
  if (!job || job.status !== "NEEDS_USER_INPUT") return;

  const nonEmpty = answers.filter((a) => a.answer.trim().length > 0);

  if (!job.package) {
    // Fundamentals were missing — the profile itself needs editing;
    // answers alone can't fix that. Send the user to the profile.
    return;
  }

  updateAutomationJob(key, {
    userProvidedAnswers: [...job.userProvidedAnswers, ...nonEmpty],
    requiresUserInput: false,
  });
  setAutomationStatus(key, "PACKAGE_READY", { progress: progressOf("PACKAGE_READY") });
  setAutomationStatus(key, "FORM_AUTOMATION_PENDING", { progress: 100 });
}
