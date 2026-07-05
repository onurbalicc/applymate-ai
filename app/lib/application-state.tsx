"use client";

import { useSyncExternalStore } from "react";
import { reviewJobs } from "./mock-data";

/* ─────────────────────────────────────────────────────────
   Demo application state — frontend-only, localStorage-backed.

   Tracks what the user did with the review queue:
   - queue:    ordered pending job indices; queue[0] is the
               card currently shown. Skip moves it to the end.
   - approved: jobs approved for the demo tracker (never a
               real submission).
   - declined: jobs removed from the queue.
   - skipped:  jobs the user postponed at least once (they
               stay in the queue, at the back).

   Same useSyncExternalStore pattern as lib/i18n: the server
   snapshot is the default state, so prerendered HTML hydrates
   cleanly and re-renders to the stored state afterwards.
   ───────────────────────────────────────────────────────── */

export interface DemoAppState {
  queue: number[];
  approved: number[];
  declined: number[];
  skipped: number[];
}

const STORAGE_KEY = "applymate-demo-state";
const ALL_JOB_IDS = reviewJobs.map((_, i) => i);

const DEFAULT_STATE: DemoAppState = {
  queue: ALL_JOB_IDS,
  approved: [],
  declined: [],
  skipped: [],
};

function isIdArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every((x) => Number.isInteger(x) && x >= 0 && x < reviewJobs.length);
}

function isValidState(v: unknown): v is DemoAppState {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return isIdArray(s.queue) && isIdArray(s.approved) && isIdArray(s.declined) && isIdArray(s.skipped);
}

let cache: DemoAppState | null = null;
const listeners = new Set<() => void>();

function read(): DemoAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidState(parsed)) return parsed;
    }
  } catch {
    /* corrupted or unavailable storage — fall back to default */
  }
  return DEFAULT_STATE;
}

function write(next: DemoAppState) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep in-memory state */
  }
  listeners.forEach((cb) => cb());
}

const store = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot(): DemoAppState {
    if (cache === null) cache = read();
    return cache;
  },
  getServerSnapshot: (): DemoAppState => DEFAULT_STATE,
};

/* ── Actions ─────────────────────────────────────────────── */

function approve(jobId: number) {
  const s = store.getSnapshot();
  write({
    ...s,
    queue: s.queue.filter((id) => id !== jobId),
    approved: s.approved.includes(jobId) ? s.approved : [...s.approved, jobId],
    skipped: s.skipped.filter((id) => id !== jobId),
  });
}

function decline(jobId: number) {
  const s = store.getSnapshot();
  write({
    ...s,
    queue: s.queue.filter((id) => id !== jobId),
    declined: s.declined.includes(jobId) ? s.declined : [...s.declined, jobId],
    skipped: s.skipped.filter((id) => id !== jobId),
  });
}

function skip(jobId: number) {
  const s = store.getSnapshot();
  write({
    ...s,
    queue: [...s.queue.filter((id) => id !== jobId), jobId],
    skipped: s.skipped.includes(jobId) ? s.skipped : [...s.skipped, jobId],
  });
}

function reset() {
  write({ ...DEFAULT_STATE, queue: [...ALL_JOB_IDS], approved: [], declined: [], skipped: [] });
}

/* ── Hook ────────────────────────────────────────────────── */

export function useApplicationState() {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  return {
    state,
    approve,
    decline,
    skip,
    reset,
    /** Jobs still waiting for a decision (includes skipped). */
    pendingCount: state.queue.length,
    /** Jobs approved for the demo tracker. */
    approvedCount: state.approved.length,
    /** Approve + decline decisions made so far. */
    handledCount: state.approved.length + state.declined.length,
    totalCount: reviewJobs.length,
  };
}
