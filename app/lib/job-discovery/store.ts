"use client";

/* ─────────────────────────────────────────────────────────
   Job Discovery — localStorage store.

   Persists the discovery state (discovered jobs + decisions +
   scheduling metadata) across sessions. Uses the same
   useSyncExternalStore pattern as the rest of the app.

   Schema version is bumped whenever DiscoveryState changes
   in a backwards-incompatible way. A version bump discards
   the old state gracefully (jobs get rediscovered on next
   run) rather than crashing on an unrecognised shape.
   ───────────────────────────────────────────────────────── */

import { useSyncExternalStore } from "react";
import type {
  DiscoveredJob,
  DiscoveredJobDecision,
  DiscoveredJobRecord,
  DiscoveryMeta,
  DiscoveryState,
  DiscoverySummary,
} from "./contracts";

const LS_KEY = "applymate-discovery-state";
const SCHEMA_VERSION = 2;

const DEFAULT_META: DiscoveryMeta = {
  lastAttemptAt: null,
  lastDiscoveryAt: null,
  profileVersionAtLastDiscovery: null,
  status: "idle",
  lastError: null,
  lastResultSummary: null,
  nextEligibleRetryAt: null,
};

const DEFAULT_STATE: DiscoveryState = {
  version: SCHEMA_VERSION,
  records: [],
  meta: DEFAULT_META,
};

let cache: DiscoveryState | null = null;
const listeners = new Set<() => void>();

function read(): DiscoveryState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DiscoveryState;
      // Discard stale schema versions — safe, jobs get rediscovered.
      if (parsed.version === SCHEMA_VERSION && parsed.meta && Array.isArray(parsed.records)) {
        return parsed;
      }
    }
  } catch {
    /* storage unavailable or corrupted */
  }
  return DEFAULT_STATE;
}

function write(next: DiscoveryState) {
  cache = next;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep in-memory */
  }
  listeners.forEach((cb) => cb());
}

const store = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot(): DiscoveryState {
    if (cache === null) cache = read();
    return cache;
  },
  getServerSnapshot: (): DiscoveryState => DEFAULT_STATE,
};

/* ── Selectors ───────────────────────────────────────────── */

export function getDiscoverySnapshot(): DiscoveryState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  return store.getSnapshot();
}

/** Jobs still waiting for a decision (pending + skipped). */
export function getPendingJobs(state: DiscoveryState): DiscoveredJob[] {
  return state.records
    .filter((r) => r.decision === "pending" || r.decision === "skipped")
    .sort((a, b) => b.job.matchScore - a.job.matchScore)
    .map((r) => r.job);
}

/** Queue order: pending first, skipped moved to back. */
export function getQueueOrder(state: DiscoveryState): string[] {
  const pending  = state.records.filter((r) => r.decision === "pending").map((r) => r.job.id);
  const skipped  = state.records.filter((r) => r.decision === "skipped").map((r) => r.job.id);
  return [...pending, ...skipped];
}

/** Count of jobs still awaiting a decision — used by the auto-discovery scheduler. */
export function getPendingCount(state: DiscoveryState): number {
  return state.records.filter((r) => r.decision === "pending" || r.decision === "skipped").length;
}

/* ── Mutators ────────────────────────────────────────────── */

/**
 * Merge newly discovered jobs — deduplicate by id, keep existing decisions.
 * Returns how many were genuinely new vs. already-known duplicates, so the
 * caller can report an honest summary instead of just "0 jobs found".
 */
export function mergeDiscoveredJobs(newJobs: DiscoveredJob[]): { added: number; duplicates: number } {
  const s = store.getSnapshot();
  const existingIds = new Set(s.records.map((r) => r.job.id));

  let duplicates = 0;
  const newRecords: DiscoveredJobRecord[] = [];
  for (const j of newJobs) {
    if (existingIds.has(j.id)) {
      duplicates++;
      continue;
    }
    newRecords.push({
      job: j,
      decision: "pending",
      decidedAt: null,
      automationJobId: null,
    });
  }

  write({
    ...s,
    records: [...s.records, ...newRecords],
  });

  return { added: newRecords.length, duplicates };
}

export function approveJob(jobId: string) {
  const s = store.getSnapshot();
  write({
    ...s,
    records: s.records.map((r) =>
      r.job.id === jobId
        // The automation job's key is always the discovered job's own id —
        // no hashing, no separate identity to keep in sync.
        ? { ...r, decision: "approved" as DiscoveredJobDecision, decidedAt: new Date().toISOString(), automationJobId: r.job.id }
        : r
    ),
  });
}

export function declineJob(jobId: string) {
  const s = store.getSnapshot();
  write({
    ...s,
    records: s.records.map((r) =>
      r.job.id === jobId
        ? { ...r, decision: "declined" as DiscoveredJobDecision, decidedAt: new Date().toISOString() }
        : r
    ),
  });
}

export function skipJob(jobId: string) {
  const s = store.getSnapshot();
  write({
    ...s,
    records: s.records.map((r) =>
      r.job.id === jobId
        ? { ...r, decision: "skipped" as DiscoveredJobDecision, decidedAt: new Date().toISOString() }
        : r
    ),
  });
}

/** Check whether a job has already been approved (prevents duplicate applications). */
export function isAlreadyApproved(jobId: string): boolean {
  const s = store.getSnapshot();
  return s.records.some((r) => r.job.id === jobId && r.decision === "approved");
}

export function clearDiscoveredJobs() {
  write({ ...DEFAULT_STATE, meta: DEFAULT_META });
}

/* ── Discovery scheduling metadata ───────────────────────── */

export function getDiscoveryMeta(): DiscoveryMeta {
  return store.getSnapshot().meta;
}

export function updateDiscoveryMeta(updates: Partial<DiscoveryMeta>) {
  const s = store.getSnapshot();
  write({ ...s, meta: { ...s.meta, ...updates } });
}

export function recordDiscoverySuccess(summary: DiscoverySummary, profileVersion: string) {
  const now = new Date().toISOString();
  updateDiscoveryMeta({
    lastAttemptAt: now,
    lastDiscoveryAt: now,
    profileVersionAtLastDiscovery: profileVersion,
    status: summary.partialErrors.length > 0 ? "partial-error" : "success",
    lastError: summary.partialErrors.length > 0 ? summary.partialErrors.join("; ") : null,
    lastResultSummary: summary,
    nextEligibleRetryAt: null,
  });
}

export function recordDiscoveryFailure(error: string, retryAfterMs: number) {
  const now = new Date().toISOString();
  updateDiscoveryMeta({
    lastAttemptAt: now,
    status: "error",
    lastError: error,
    nextEligibleRetryAt: new Date(Date.now() + retryAfterMs).toISOString(),
  });
}

export function markDiscoveryRunning() {
  updateDiscoveryMeta({ status: "running", lastAttemptAt: new Date().toISOString() });
}

/* ── React hook ──────────────────────────────────────────── */

export function useDiscoveryState(): DiscoveryState {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
}
