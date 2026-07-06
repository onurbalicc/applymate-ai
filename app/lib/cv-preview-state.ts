"use client";

import { useSyncExternalStore } from "react";

/* ─────────────────────────────────────────────────────────
   Master CV preview state — extracted from MasterCvPreview
   so other modules (e.g. the Control Center onboarding
   checklist) can read it without importing UI.

   localStorage key: "applymate-cv-preview"
   Same useSyncExternalStore pattern as lib/i18n and
   lib/application-state: server snapshot is `false`
   (un-generated), so prerendered HTML hydrates cleanly.
   ───────────────────────────────────────────────────────── */

const LS_KEY = "applymate-cv-preview";

interface CvPreviewState {
  generated: boolean;
  generatedAt: string;
}

let cachedGenerated: boolean | null = null;
const listeners = new Set<() => void>();

function readGenerated(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<CvPreviewState>;
    return parsed.generated === true;
  } catch {
    return false;
  }
}

/** Mark the Master CV preview as generated (true) or clear it (false). */
export function setCvPreviewGenerated(value: boolean) {
  cachedGenerated = value;
  try {
    if (value) {
      const state: CvPreviewState = { generated: true, generatedAt: new Date().toISOString() };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  } catch {
    /* localStorage unavailable — keep in-memory value */
  }
  listeners.forEach((cb) => cb());
}

const store = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot(): boolean {
    if (cachedGenerated === null) cachedGenerated = readGenerated();
    return cachedGenerated;
  },
  getServerSnapshot: (): boolean => false,
};

/** Whether the Master CV preview has been generated in this browser. */
export function useCvPreviewGenerated(): boolean {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
