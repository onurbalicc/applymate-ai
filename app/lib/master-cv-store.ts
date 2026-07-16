"use client";

import { useSyncExternalStore } from "react";
import type { MasterCvResult } from "./ai/contracts";
import { setCvPreviewGenerated } from "./cv-preview-state";

/* ─────────────────────────────────────────────────────────
   Master CV store — the cached, automatically prepared
   Master CV shared by the whole app.

   Written by:
   - the automation orchestrator (prepared automatically when
     the user applies to a job and no cached CV exists)
   - the Profile page's secondary "Prepare now" / "Regenerate"
     actions

   Read by:
   - MasterCvPreview (Profile page status + preview)
   - the orchestrator (reuses the cached result across jobs)

   localStorage key: "applymate-cv-result"
   Also keeps lib/cv-preview-state in sync so the Control
   Center onboarding checklist keeps working.
   ───────────────────────────────────────────────────────── */

const LS_KEY = "applymate-cv-result";

export interface MasterCvState {
  result: MasterCvResult;
  isMock: boolean;
  generatedAt: string;
}

let cache: MasterCvState | null | undefined; // undefined = not yet read
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function read(): MasterCvState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MasterCvState>;
    if (!parsed.result) return null;
    return {
      result: parsed.result,
      isMock: parsed.isMock === true,
      generatedAt: parsed.generatedAt ?? "",
    };
  } catch {
    return null;
  }
}

/** One-shot read (client only). Returns null when no CV is cached. */
export function loadMasterCv(): MasterCvState | null {
  if (typeof window === "undefined") return null;
  if (cache === undefined) cache = read();
  return cache;
}

export function saveMasterCv(result: MasterCvResult, isMock: boolean) {
  const state: MasterCvState = {
    result,
    isMock,
    generatedAt: new Date().toISOString(),
  };
  cache = state;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — keep in-memory */
  }
  setCvPreviewGenerated(true);
  notify();
}

export function clearMasterCv() {
  cache = null;
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
  setCvPreviewGenerated(false);
  notify();
}

const store = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot(): MasterCvState | null {
    if (cache === undefined) cache = read();
    return cache;
  },
  getServerSnapshot: (): MasterCvState | null => null,
};

export function useMasterCv(): MasterCvState | null {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
