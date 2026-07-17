"use client";

/* ─────────────────────────────────────────────────────────
   Job Discovery — Service layer.

   Orchestrates one discovery run:
   1. Build query from candidate profile.
   2. POST to /api/discover (server-side provider calls).
   3. Rank returned jobs against the profile.
   4. Split into: duplicates / excluded / below-threshold / added.
   5. Merge the passing jobs into the discovery store.

   Runs client-side so it can read from localStorage. The
   actual provider calls are server-side (API route) to keep
   any future API keys off the client.

   This module does one run and reports what happened —
   honestly distinguishing "nothing matched" from "the request
   itself failed". It does not decide *when* to run; see
   scheduler.ts for the automatic-trigger policy.
   ───────────────────────────────────────────────────────── */

import type { CandidateProfile } from "../ai/contracts";
import type { DiscoveredJob, DiscoveryQuery, DiscoverySummary } from "./contracts";
import { rankJobs, sortRankedJobs } from "./ranking";
import { mergeDiscoveredJobs } from "./store";

export class DiscoveryRequestError extends Error {}

/**
 * Run one discovery cycle. Throws DiscoveryRequestError when the request
 * itself failed (network error, non-2xx, every provider erroring) — the
 * caller must not treat that the same as "zero jobs found".
 */
export async function runDiscovery(profile: CandidateProfile): Promise<DiscoverySummary> {
  const query: DiscoveryQuery = {
    targetRoles: profile.targetJobTitles,
    locations: profile.preferredLocations,
    remotePreference: profile.remotePreference,
    employmentTypes: profile.employmentTypes,
    excludedKeywords: profile.excludedKeywords,
  };

  let response: Response;
  try {
    response = await fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
  } catch (err) {
    throw new DiscoveryRequestError(
      err instanceof Error ? `Could not reach the discovery service: ${err.message}` : "Could not reach the discovery service."
    );
  }

  if (!response.ok) {
    throw new DiscoveryRequestError(`Discovery service returned ${response.status}.`);
  }

  const data = await response.json();

  if (data.allFailed) {
    throw new DiscoveryRequestError(
      Array.isArray(data.partialErrors) ? data.partialErrors.join("; ") : "All discovery providers failed."
    );
  }

  const rawJobs: Omit<DiscoveredJob, "matchScore" | "matchLabel" | "matchReasons" | "cautionReasons">[] = data.jobs ?? [];
  const isDemo: boolean = data.isDemo ?? true;
  const providerLabel: string = data.providerLabel ?? "Demo";
  const partialErrors: string[] = Array.isArray(data.partialErrors) ? data.partialErrors : [];

  const fetched = rawJobs.length;

  const ranked = rankJobs(profile, rawJobs);
  const excluded = ranked.filter((r) => r.excluded).length;
  const passingAll = sortRankedJobs(ranked);
  const belowThreshold = passingAll.filter((j) => j.matchScore < profile.minMatchScore).length;
  const passing = passingAll.filter((j) => j.matchScore >= profile.minMatchScore);

  const { added, duplicates } = mergeDiscoveredJobs(passing);

  return {
    fetched,
    duplicates,
    excluded,
    belowThreshold,
    added,
    isDemo,
    providerLabel,
    partialErrors,
  };
}
