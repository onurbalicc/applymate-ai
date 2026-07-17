"use client";

/* ─────────────────────────────────────────────────────────
   Job Discovery — automatic scheduling.

   Decides WHEN discovery should run automatically, and runs
   it exactly once when eligible. No manual "Scan now" button
   is required for the normal flow — Dashboard and Review Queue
   both call `maybeRunDiscovery()` on mount; the checks below
   make sure that never turns into a network request storm.

   Honesty note: this is a local-first, browser-only scheduler.
   It only runs while the user has the app open in a tab — it
   is NOT a background worker and does not run while the
   browser is closed. Copy in the UI must never imply otherwise.
   ───────────────────────────────────────────────────────── */

import { useEffect } from "react";
import type { CandidateProfile } from "../ai/contracts";
import { useCandidateProfile } from "../candidate-profile";
import { runDiscovery, DiscoveryRequestError } from "./service";
import {
  getDiscoverySnapshot,
  getPendingCount,
  markDiscoveryRunning,
  recordDiscoverySuccess,
  recordDiscoveryFailure,
} from "./store";
import type { DiscoverySummary } from "./contracts";

/** How often to automatically re-check for new jobs when nothing else prompts it. */
export const REFRESH_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours — easy to tune later
/** Minimum gap between any two discovery attempts, success or failure. */
export const MIN_ATTEMPT_GAP_MS = 5 * 60 * 1000; // 5 minutes
/** How long to back off after a failure before retrying automatically. */
export const RETRY_AFTER_FAILURE_MS = 15 * 60 * 1000; // 15 minutes
/** Queue is considered "running low" below this many pending discovered jobs. */
export const QUEUE_LOW_THRESHOLD = 2;

/** Fields that, if changed, mean previous discovery results may be stale. */
function computeProfileVersion(profile: CandidateProfile): string {
  return JSON.stringify({
    targetJobTitles: [...profile.targetJobTitles].sort(),
    preferredLocations: [...profile.preferredLocations].sort(),
    remotePreference: profile.remotePreference,
    employmentTypes: [...profile.employmentTypes].sort(),
    excludedKeywords: [...profile.excludedKeywords].sort(),
    minMatchScore: profile.minMatchScore,
  });
}

/** A profile needs at least these fields before discovery is worth running. */
export function isProfileSufficientForDiscovery(profile: CandidateProfile): boolean {
  return profile.targetJobTitles.length > 0 && profile.technicalSkills.length > 0;
}

export type DiscoveryTriggerReason =
  | "first_discovery"
  | "preferences_changed"
  | "stale"
  | "queue_low"
  | "retry_after_failure";

export interface DiscoveryEligibility {
  should: boolean;
  reason: DiscoveryTriggerReason | "not_eligible";
  detail: string;
}

/** Pure decision function — no side effects, easy to test/reason about. */
export function evaluateDiscoveryEligibility(profile: CandidateProfile): DiscoveryEligibility {
  const state = getDiscoverySnapshot();
  const meta = state.meta;
  const now = Date.now();

  if (meta.status === "running") {
    return { should: false, reason: "not_eligible", detail: "Discovery already running." };
  }

  if (meta.lastAttemptAt && now - new Date(meta.lastAttemptAt).getTime() < MIN_ATTEMPT_GAP_MS) {
    return { should: false, reason: "not_eligible", detail: "Rate limited — checked too recently." };
  }

  if (!isProfileSufficientForDiscovery(profile)) {
    return { should: false, reason: "not_eligible", detail: "Profile is not complete enough yet." };
  }

  if (!meta.lastDiscoveryAt) {
    return { should: true, reason: "first_discovery", detail: "No previous discovery has completed." };
  }

  const currentVersion = computeProfileVersion(profile);
  if (meta.profileVersionAtLastDiscovery !== currentVersion) {
    return { should: true, reason: "preferences_changed", detail: "Job preferences changed since the last check." };
  }

  const ageMs = now - new Date(meta.lastDiscoveryAt).getTime();
  if (ageMs > REFRESH_INTERVAL_MS) {
    return { should: true, reason: "stale", detail: "Last check was more than 4 hours ago." };
  }

  const pending = getPendingCount(state);
  if (pending < QUEUE_LOW_THRESHOLD) {
    return { should: true, reason: "queue_low", detail: "Few recommendations left to review." };
  }

  if (meta.status === "error" && meta.nextEligibleRetryAt && now > new Date(meta.nextEligibleRetryAt).getTime()) {
    return { should: true, reason: "retry_after_failure", detail: "Retrying after a previous failure." };
  }

  return { should: false, reason: "not_eligible", detail: "Recommendations are up to date." };
}

let inFlight = false;

/**
 * Run discovery if — and only if — it is currently eligible. Safe to call
 * from multiple mounted components (Dashboard, Review Queue) without risking
 * duplicate concurrent requests; the in-flight guard is process-wide.
 */
export async function maybeRunDiscovery(profile: CandidateProfile): Promise<void> {
  if (inFlight) return;
  const eligibility = evaluateDiscoveryEligibility(profile);
  if (!eligibility.should) return;

  inFlight = true;
  markDiscoveryRunning();
  try {
    const summary: DiscoverySummary = await runDiscovery(profile);
    recordDiscoverySuccess(summary, computeProfileVersion(profile));
  } catch (err) {
    const message = err instanceof DiscoveryRequestError
      ? err.message
      : err instanceof Error ? err.message : "Discovery failed for an unknown reason.";
    recordDiscoveryFailure(message, RETRY_AFTER_FAILURE_MS);
  } finally {
    inFlight = false;
  }
}

/** Explicit user-triggered refresh — bypasses the "not eligible" staleness/queue
    checks but still respects the running/rate-limit guards so it can't be abused
    into a request storm by repeated clicking. */
export async function runDiscoveryNow(profile: CandidateProfile): Promise<DiscoverySummary> {
  if (inFlight) throw new DiscoveryRequestError("Discovery is already running.");
  const meta = getDiscoverySnapshot().meta;
  if (meta.lastAttemptAt && Date.now() - new Date(meta.lastAttemptAt).getTime() < MIN_ATTEMPT_GAP_MS) {
    throw new DiscoveryRequestError("Please wait a few minutes before checking again.");
  }

  inFlight = true;
  markDiscoveryRunning();
  try {
    const summary = await runDiscovery(profile);
    recordDiscoverySuccess(summary, computeProfileVersion(profile));
    return summary;
  } catch (err) {
    const message = err instanceof DiscoveryRequestError
      ? err.message
      : err instanceof Error ? err.message : "Discovery failed for an unknown reason.";
    recordDiscoveryFailure(message, RETRY_AFTER_FAILURE_MS);
    throw err;
  } finally {
    inFlight = false;
  }
}

/**
 * Call once per page that should keep recommendations fresh
 * (Dashboard, Review Queue). Checks eligibility on mount and
 * whenever the profile actually changes — never on every render,
 * since useCandidateProfile only returns a new reference when
 * the underlying store changes.
 */
export function useAutoDiscovery(): void {
  const profile = useCandidateProfile();
  useEffect(() => {
    void maybeRunDiscovery(profile);
  }, [profile]);
}
