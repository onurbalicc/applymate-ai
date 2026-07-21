"use client";

import { useSyncExternalStore } from "react";
import { reviewJobs } from "../mock-data";
import {
  type AutomationJob,
  type AutomationJobSeed,
  type AutomationStatus,
  RUNNING_STATUSES,
  RUNNING_EXECUTION_STATUSES,
  EXECUTION_STEPS,
} from "./contracts";

/** Records written before Part 2 (or a mid-migration legacy record) lack
    the newer execution fields entirely on disk — `job` is typed as a
    complete AutomationJob, but the on-disk JSON that produced it may not
    actually have these keys. Backfill with honest nulls rather than
    leaving them `undefined`, which several call sites type as `null`. */
function backfillExecutionFields(job: AutomationJob): AutomationJob {
  return {
    ...job,
    authorizedAt: job.authorizedAt ?? null,
    authorizedAction: job.authorizedAction ?? null,
    executionProgress: job.executionProgress ?? null,
    executionAttemptId: job.executionAttemptId ?? null,
    authorizedApplyUrl: job.authorizedApplyUrl ?? null,
    submittedAt: job.submittedAt ?? null,
    submissionOutcome: job.submissionOutcome ?? null,
    reviewRequiredReason: job.reviewRequiredReason ?? null,
  };
}

/* ─────────────────────────────────────────────────────────
   Automation job store — localStorage-backed, one job per
   stable job key (string).

   Key scheme:
   - Mock jobs:      String(reviewJobs index), e.g. "0"
   - Discovered jobs: the DiscoveredJob's own id, e.g.
                      "demo:demo-004" or "greenhouse:gitlab:123"
   This key is never derived/hashed — it is always the job's
   own natural identity, so it survives reloads and never
   collides.

   Same useSyncExternalStore pattern as lib/application-state.

   Reload safety: jobs found in a RUNNING status when the store
   is first read were interrupted by a page reload — they are
   normalized to PAUSED so nothing restarts or duplicates
   silently. The user resumes them explicitly.

   Backward compatibility: records written by the previous
   sprint (numeric jobIndex 0–3 for mock jobs, or hashed
   indices ≥1000 for the old broken discovered-job approach)
   are migrated on read. Mock-job records are backfilled with
   role/company/jobDescription from reviewJobs. Old hashed
   discovered-job records cannot be reliably resolved (their
   source data was never persisted) and are dropped — they were
   never reachable from any UI list in the previous sprint either.
   ───────────────────────────────────────────────────────── */

const LS_KEY = "applymate-automation-jobs";

export type AutomationJobMap = Record<string, AutomationJob>;

let cache: AutomationJobMap | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function persist(map: AutomationJobMap) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — keep in-memory */
  }
}

/** Migrate one legacy-shaped record. Returns null when it can't be salvaged. */
function migrateLegacyJob(key: string, raw: Record<string, unknown>): AutomationJob | null {
  // Already new-shape.
  if (typeof raw.key === "string" && typeof raw.role === "string") {
    return raw as unknown as AutomationJob;
  }

  const numericKey = Number(key);
  const isLegacyMockKey = Number.isInteger(numericKey) && numericKey >= 0 && numericKey < 1000;

  if (isLegacyMockKey) {
    const mock = reviewJobs[numericKey];
    if (!mock) return null;
    return {
      ...(raw as object),
      key: String(numericKey),
      sourceJobId: String(numericKey),
      isFromDiscovery: false,
      role: mock.role,
      company: mock.company,
      jobDescription: mock.jobDescription,
      applyUrl: null,
      provider: "mock",
      sourceLabel: "ApplyMate Demo",
    } as AutomationJob;
  }

  // Legacy hashed discovered-job key (≥1000) from the previous, broken
  // integration — its real source data was never persisted anywhere, and
  // it was never linked from any discovery record either. Drop it rather
  // than display a job we cannot honestly identify.
  return null;
}

function read(): AutomationJobMap {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) return {};

    const migrated: AutomationJobMap = {};
    let changed = false;

    for (const key of Object.keys(parsed)) {
      const entry = parsed[key] as Record<string, unknown> | null;
      if (!entry) continue;

      const migratedLegacy = migrateLegacyJob(key, entry);
      if (!migratedLegacy) {
        changed = true; // dropped
        continue;
      }
      const job = backfillExecutionFields(migratedLegacy);
      // Any record that needed migrateLegacyJob's backfill differs from
      // what was on disk — always true unless it was already new-shape,
      // which migrateLegacyJob returns unchanged (still safe to rewrite).
      changed = true;

      // Normalize jobs interrupted by a reload. Package-preparation steps
      // (RUNNING_STATUSES) resume manually via PAUSED, same as before.
      // Autonomous-execution steps (RUNNING_EXECUTION_STATUSES) must NOT
      // silently resume filling/submitting on next load — normalize to
      // REVIEW_REQUIRED instead, per the duplicate-submission safety rule.
      if (RUNNING_STATUSES.includes(job.status)) {
        migrated[job.key] = {
          ...job,
          status: "PAUSED",
          error: "Preparation was interrupted by a page reload. Resume to continue.",
          updatedAt: new Date().toISOString(),
        };
      } else if (RUNNING_EXECUTION_STATUSES.includes(job.status)) {
        migrated[job.key] = {
          ...job,
          status: "REVIEW_REQUIRED",
          reviewRequiredReason: {
            kind: "execution-interrupted",
            description: `The autonomous application was interrupted mid-execution (last step: ${job.status}) by a page or extension reload.`,
            requiredAction: "Open the extension popup to check the live page state, then retry from the Tracker.",
          },
          updatedAt: new Date().toISOString(),
        };
      } else {
        migrated[job.key] = job;
      }
    }

    if (changed) persist(migrated);
    return migrated;
  } catch {
    return {};
  }
}

function getMap(): AutomationJobMap {
  if (cache === null) cache = read();
  return cache;
}

function write(map: AutomationJobMap) {
  cache = map;
  persist(map);
  notify();
}

const EMPTY: AutomationJobMap = {};

const store = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot(): AutomationJobMap {
    return getMap();
  },
  getServerSnapshot: (): AutomationJobMap => EMPTY,
};

/* ── Accessors / actions ─────────────────────────────────── */

export function getAutomationJob(key: string): AutomationJob | null {
  if (typeof window === "undefined") return null;
  return getMap()[key] ?? null;
}

export function createAutomationJob(seed: AutomationJobSeed): AutomationJob {
  const now = new Date().toISOString();
  const job: AutomationJob = {
    id: `auto-${seed.key}-${Date.now()}`,
    key: seed.key,
    sourceJobId: seed.sourceJobId,
    isFromDiscovery: seed.isFromDiscovery,
    role: seed.role,
    company: seed.company,
    jobDescription: seed.jobDescription,
    applyUrl: seed.applyUrl,
    provider: seed.provider,
    sourceLabel: seed.sourceLabel,
    status: "QUEUED",
    currentStep: "QUEUED",
    progress: 5,
    startedAt: now,
    updatedAt: now,
    isDemo: false,
    requiresUserInput: false,
    missingInformation: [],
    userProvidedAnswers: [],
    error: null,
    package: null,
    authorizedAt: null,
    authorizedAction: null,
    executionProgress: null,
    executionAttemptId: null,
    authorizedApplyUrl: null,
    submittedAt: null,
    submissionOutcome: null,
    reviewRequiredReason: null,
  };
  write({ ...getMap(), [seed.key]: job });
  return job;
}

export function updateAutomationJob(
  key: string,
  updates: Partial<AutomationJob>
): AutomationJob | null {
  const map = getMap();
  const existing = map[key];
  if (!existing) return null;
  const next: AutomationJob = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  write({ ...map, [key]: next });
  return next;
}

export function removeAutomationJob(key: string) {
  const map = { ...getMap() };
  delete map[key];
  write(map);
}

export function setAutomationStatus(
  key: string,
  status: AutomationStatus,
  extra: Partial<AutomationJob> = {}
) {
  const isStep = RUNNING_STATUSES.includes(status) ||
    status === "PACKAGE_READY" || status === "FORM_AUTOMATION_PENDING";
  updateAutomationJob(key, {
    status,
    ...(isStep ? { currentStep: status } : {}),
    ...extra,
  });
}

/**
 * Sync one autonomous-execution status update from the extension into the
 * web app's own AutomationJob record (the single Tracker source of truth —
 * see lib/automation/execution-sync.ts for the polling caller). Sets
 * `executionProgress` from EXECUTION_STEPS automatically when the status
 * is a known execution step.
 */
export function setExecutionStatus(
  key: string,
  status: AutomationStatus,
  extra: Partial<AutomationJob> = {}
) {
  const stepProgress = EXECUTION_STEPS.find((s) => s.status === status)?.progress;
  updateAutomationJob(key, {
    status,
    currentStep: status,
    ...(stepProgress !== undefined ? { executionProgress: stepProgress } : {}),
    ...extra,
  });
}

/* ── Hooks ───────────────────────────────────────────────── */

export function useAutomationJobs(): AutomationJobMap {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function useAutomationJob(key: string): AutomationJob | null {
  const map = useAutomationJobs();
  return map[key] ?? null;
}
