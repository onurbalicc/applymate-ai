"use client";

import { useSyncExternalStore } from "react";
import {
  type AutomationJob,
  type AutomationStatus,
  RUNNING_STATUSES,
} from "./contracts";

/* ─────────────────────────────────────────────────────────
   Automation job store — localStorage-backed, one job per
   review-queue jobIndex.

   Same useSyncExternalStore pattern as lib/application-state.

   Reload safety: jobs found in a RUNNING status when the store
   is first read were interrupted by a page reload — they are
   normalized to PAUSED so nothing restarts or duplicates
   silently. The user resumes them explicitly.
   ───────────────────────────────────────────────────────── */

const LS_KEY = "applymate-automation-jobs";

export type AutomationJobMap = Record<number, AutomationJob>;

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

function read(): AutomationJobMap {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AutomationJobMap;
    if (typeof parsed !== "object" || parsed === null) return {};

    // Normalize jobs interrupted by a reload: RUNNING → PAUSED.
    let changed = false;
    for (const key of Object.keys(parsed)) {
      const job = parsed[Number(key)];
      if (job && RUNNING_STATUSES.includes(job.status)) {
        parsed[Number(key)] = {
          ...job,
          status: "PAUSED",
          error: "Preparation was interrupted by a page reload. Resume to continue.",
          updatedAt: new Date().toISOString(),
        };
        changed = true;
      }
    }
    if (changed) persist(parsed);
    return parsed;
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

export function getAutomationJob(jobIndex: number): AutomationJob | null {
  if (typeof window === "undefined") return null;
  return getMap()[jobIndex] ?? null;
}

export function createAutomationJob(jobIndex: number): AutomationJob {
  const now = new Date().toISOString();
  const job: AutomationJob = {
    id: `auto-${jobIndex}-${Date.now()}`,
    jobIndex,
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
  };
  write({ ...getMap(), [jobIndex]: job });
  return job;
}

export function updateAutomationJob(
  jobIndex: number,
  updates: Partial<AutomationJob>
): AutomationJob | null {
  const map = getMap();
  const existing = map[jobIndex];
  if (!existing) return null;
  const next: AutomationJob = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  write({ ...map, [jobIndex]: next });
  return next;
}

export function removeAutomationJob(jobIndex: number) {
  const map = { ...getMap() };
  delete map[jobIndex];
  write(map);
}

export function setAutomationStatus(
  jobIndex: number,
  status: AutomationStatus,
  extra: Partial<AutomationJob> = {}
) {
  const isStep = RUNNING_STATUSES.includes(status) ||
    status === "PACKAGE_READY" || status === "FORM_AUTOMATION_PENDING";
  updateAutomationJob(jobIndex, {
    status,
    ...(isStep ? { currentStep: status } : {}),
    ...extra,
  });
}

/* ── Hooks ───────────────────────────────────────────────── */

export function useAutomationJobs(): AutomationJobMap {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function useAutomationJob(jobIndex: number): AutomationJob | null {
  const map = useAutomationJobs();
  return map[jobIndex] ?? null;
}
