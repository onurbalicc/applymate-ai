/* ─────────────────────────────────────────────────────────
   Job Discovery — Deterministic ranking engine.

   No AI calls here. Scoring is fast, cheap, and explainable —
   one AI call per discovered job would not scale and is not
   needed for a fit score.

   Score breakdown (total 100):
     role title similarity     25
     skill overlap             20
     location / remote match   15
     employment type match     10
     seniority compatibility   10
     recency                   10
     job-data completeness     10
   Excluded keywords are a hard filter, not part of the score —
   a job containing one is removed entirely, never merely
   down-ranked.
   ───────────────────────────────────────────────────────── */

import type { CandidateProfile } from "../ai/contracts";
import type { DiscoveredJob, MatchLabel } from "./contracts";

/** Normalise a string for comparison: lowercase, strip punctuation. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

/** Tokenise a string into words ≥ 3 chars. */
function tokens(s: string): Set<string> {
  return new Set(
    norm(s)
      .split(" ")
      .filter((w) => w.length >= 3)
  );
}

/** Jaccard similarity between two token sets (0–1). */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const inter = [...a].filter((t) => b.has(t)).length;
  const union = new Set([...a, ...b]).size;
  return inter / union;
}

/** Score role title similarity (0–25). */
function scoreRole(profile: CandidateProfile, job: DiscoveredJob): { points: number; match: string | null } {
  const jobTokens = tokens(job.role);
  let best = 0;
  let bestTitle = "";
  for (const target of profile.targetJobTitles) {
    const s = jaccard(tokens(target), jobTokens);
    if (s > best) { best = s; bestTitle = target; }
  }
  const points = Math.round(best * 25);
  return { points, match: points >= 5 ? bestTitle : null };
}

/** Score skill overlap (0–20). */
function scoreSkills(profile: CandidateProfile, job: DiscoveredJob): { points: number; matched: string[] } {
  const jd = norm(job.jobDescription + " " + job.role);
  const matched = profile.technicalSkills.filter((skill) =>
    jd.includes(norm(skill))
  );
  const ratio = Math.min(matched.length / Math.max(profile.technicalSkills.length * 0.4, 1), 1);
  return { points: Math.round(ratio * 20), matched: matched.slice(0, 6) };
}

/** Score location / remote compatibility (0–15). */
function scoreLocation(profile: CandidateProfile, job: DiscoveredJob): { points: number; reason: string | null; caution: string | null } {
  const jobLoc = norm(job.location + " " + job.remoteType);
  const pref = profile.remotePreference;

  if (pref === "remote" && job.remoteType === "remote") return { points: 15, reason: "Fully remote — matches your preference", caution: null };
  if (pref === "remote" && job.remoteType === "hybrid") return { points: 10, reason: "Hybrid remote available", caution: "Role requires some in-office days" };
  if (pref === "remote" && job.remoteType === "onsite") return { points: 4, reason: null, caution: "On-site only — conflicts with remote preference" };
  if (pref === "hybrid" && (job.remoteType === "hybrid" || job.remoteType === "remote")) return { points: 14, reason: "Remote/hybrid — matches preference", caution: null };
  if (pref === "hybrid" && job.remoteType === "onsite") return { points: 8, reason: null, caution: "On-site only — partial conflict" };

  for (const prefLoc of profile.preferredLocations) {
    if (jobLoc.includes(norm(prefLoc))) return { points: 14, reason: `Location matches: ${prefLoc}`, caution: null };
  }

  return { points: 6, reason: null, caution: "Location not in preferred list" };
}

/** Score employment type match (0–10). */
function scoreEmploymentType(profile: CandidateProfile, job: DiscoveredJob): { points: number; match: boolean } {
  const jt = norm(job.employmentType);
  for (const et of profile.employmentTypes) {
    if (jt.includes(norm(et)) || norm(et).includes(jt)) return { points: 10, match: true };
  }
  return { points: 0, match: false };
}

/** Seniority signal words, roughly ordered from junior to senior. */
const JUNIOR_SIGNALS = ["working student", "intern", "internship", "junior", "entry level", "entry-level", "graduate", "trainee"];
const SENIOR_SIGNALS = ["senior", "staff", "principal", "lead", "head of", "director", "vp ", "vice president", "10+ years", "8+ years", "5+ years"];

/** Score seniority compatibility (0–10). Neutral (10) unless a clear mismatch is detected. */
function scoreSeniority(profile: CandidateProfile, job: DiscoveredJob): { points: number; caution: string | null } {
  const profileText = norm(profile.targetJobTitles.join(" ") + " " + profile.employmentTypes.join(" "));
  const jobText = norm(job.role + " " + job.jobDescription);

  const profileIsJunior = JUNIOR_SIGNALS.some((s) => profileText.includes(s));
  const jobLooksSenior = SENIOR_SIGNALS.some((s) => jobText.includes(s));
  const jobLooksJunior = JUNIOR_SIGNALS.some((s) => jobText.includes(s));

  if (profileIsJunior && jobLooksSenior && !jobLooksJunior) {
    return { points: 0, caution: "Role may require more seniority than your profile" };
  }
  return { points: 10, caution: null };
}

/** Score how complete/usable the posting's own data is (0–10). */
function scoreCompleteness(job: DiscoveredJob): number {
  let points = 0;
  if (job.jobDescription && job.jobDescription.trim().length > 200) points += 5;
  if (job.salaryRange && job.salaryRange.trim().length > 0) points += 2;
  if (job.location && job.location.trim().length > 0) points += 2;
  if (job.applyUrl && job.applyUrl.trim().length > 0) points += 1;
  return Math.min(points, 10);
}

/** Score job recency (0–10). */
function scoreRecency(job: DiscoveredJob): number {
  try {
    const postedMs = new Date(job.postedAt).getTime();
    const nowMs = Date.now();
    const ageDays = (nowMs - postedMs) / (1000 * 60 * 60 * 24);
    if (ageDays <= 1)  return 10;
    if (ageDays <= 3)  return 8;
    if (ageDays <= 7)  return 6;
    if (ageDays <= 14) return 4;
    if (ageDays <= 30) return 2;
    return 0;
  } catch {
    return 3; // unknown date → neutral
  }
}

/** Detect exclusion keywords from profile — hard filter, not a score component. */
function isExcluded(profile: CandidateProfile, job: DiscoveredJob): boolean {
  const target = norm(job.role + " " + job.jobDescription);
  return profile.excludedKeywords.some((kw) => target.includes(norm(kw)));
}

export interface RankedJob {
  job: DiscoveredJob;
  excluded: boolean;
  excludedReason: string | null;
}

/**
 * Rank a list of discovered jobs against the candidate profile.
 * Returns jobs with matchScore, matchLabel, matchReasons, cautionReasons filled.
 * Jobs excluded by keyword receive excluded:true.
 */
export function rankJobs(
  profile: CandidateProfile,
  jobs: Omit<DiscoveredJob, "matchScore" | "matchLabel" | "matchReasons" | "cautionReasons">[]
): RankedJob[] {
  return jobs.map((rawJob) => {
    // Cast — we'll fill in the computed fields
    const job = rawJob as DiscoveredJob;

    // Exclusion check
    if (isExcluded(profile, job)) {
      const kw = profile.excludedKeywords.find((k) =>
        norm(job.role + " " + job.jobDescription).includes(norm(k))
      );
      job.matchScore = 0;
      job.matchLabel = "Possible match";
      job.matchReasons = [];
      job.cautionReasons = [];
      return { job, excluded: true, excludedReason: kw ? `Contains excluded keyword: "${kw}"` : "Excluded keyword match" };
    }

    const roleResult   = scoreRole(profile, job);
    const skillResult  = scoreSkills(profile, job);
    const locResult    = scoreLocation(profile, job);
    const etResult     = scoreEmploymentType(profile, job);
    const seniority    = scoreSeniority(profile, job);
    const recency      = scoreRecency(job);
    const completeness = scoreCompleteness(job);

    const total = Math.min(
      roleResult.points + skillResult.points + locResult.points + etResult.points +
      seniority.points + recency + completeness,
      100
    );

    job.matchScore = total;
    job.matchLabel = total >= 80 ? "Strong match" : total >= 65 ? "Good match" : "Possible match";

    const reasons: string[] = [];
    if (roleResult.match) reasons.push(`Role matches your target: ${roleResult.match}`);
    if (skillResult.matched.length > 0) reasons.push(`Skills found: ${skillResult.matched.slice(0, 4).join(", ")}`);
    if (locResult.reason) reasons.push(locResult.reason);
    if (etResult.match) reasons.push(`Employment type matches your preference`);
    job.matchReasons = reasons.slice(0, 4);

    const cautions: string[] = [];
    if (locResult.caution) cautions.push(locResult.caution);
    if (seniority.caution) cautions.push(seniority.caution);
    if (!etResult.match) cautions.push(`Employment type (${job.employmentType}) may not match your preference`);
    job.cautionReasons = cautions;

    return { job, excluded: false, excludedReason: null };
  });
}

/** Sort ranked jobs: non-excluded first, then by score desc. */
export function sortRankedJobs(ranked: RankedJob[]): DiscoveredJob[] {
  return ranked
    .filter((r) => !r.excluded)
    .sort((a, b) => b.job.matchScore - a.job.matchScore)
    .map((r) => r.job);
}

export function matchLabelFromScore(score: number): MatchLabel {
  if (score >= 80) return "Strong match";
  if (score >= 65) return "Good match";
  return "Possible match";
}
