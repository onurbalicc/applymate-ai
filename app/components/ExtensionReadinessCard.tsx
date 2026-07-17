"use client";

import { useMemo, useState } from "react";
import { useCandidateProfile } from "@/app/lib/candidate-profile";
import { buildExtensionApplicationPayload } from "@/app/lib/extension-payload/builder";
import type { AutomationJob } from "@/app/lib/automation/contracts";
import type { ExtensionReadinessState } from "@/app/lib/extension-payload/contracts";

/* ─────────────────────────────────────────────────────────
   ExtensionReadinessCard — verifies the browser-extension
   foundation end-to-end by building the real payload for
   this job and summarizing it honestly:

   - readiness state (text-field assistance only — nothing
     fills or submits external forms yet)
   - how many fields are auto-fillable / need confirmation /
     always manual
   - manual steps and blocking questions

   A raw JSON preview is available in development builds only.
   ───────────────────────────────────────────────────────── */

const STATE_META: Record<ExtensionReadinessState, { label: string; style: React.CSSProperties }> = {
  READY_FOR_TEXT_FIELD_ASSISTANCE: {
    label: "Ready for form assistance",
    style: { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" },
  },
  NEEDS_USER_INPUT: {
    label: "Needs your input",
    style: { background: "rgba(251,146,60,0.08)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.2)" },
  },
  PACKAGE_NOT_READY: {
    label: "Not ready yet",
    style: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" },
  },
  INVALID_APPLICATION_STATE: {
    label: "Unavailable",
    style: { background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" },
  },
};

export default function ExtensionReadinessCard({ job }: { job: AutomationJob }) {
  const profile = useCandidateProfile();
  const [showJson, setShowJson] = useState(false);

  const payload = useMemo(
    () => buildExtensionApplicationPayload(job, profile),
    [job, profile]
  );

  const safeCount = payload.normalizedFields.filter((f) => f.sensitivity === "SAFE_AUTO_FILL").length;
  const confirmCount = payload.normalizedFields.filter((f) => f.sensitivity === "NEEDS_CONFIRMATION").length;
  const neverCount = payload.normalizedFields.filter((f) => f.sensitivity === "NEVER_AUTO_FILL").length;

  const stateMeta = STATE_META[payload.readiness.state];
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="dash-panel p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            🧩 Form-filling preparation
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            What ApplyMate&rsquo;s future browser assistant could help with for this application.
          </p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={stateMeta.style}>
          {stateMeta.label}
        </span>
      </div>

      {/* Field counts */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-center">
          <p className="text-lg font-bold tabular-nums leading-tight" style={{ color: safeCount > 0 ? "#4ade80" : "var(--text-muted)" }}>{safeCount}</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Auto-fillable</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold tabular-nums leading-tight" style={{ color: confirmCount > 0 ? "#fde047" : "var(--text-muted)" }}>{confirmCount}</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Need your confirmation</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold tabular-nums leading-tight" style={{ color: neverCount > 0 ? "#fb923c" : "var(--text-muted)" }}>{neverCount}</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Always manual</p>
        </div>
      </div>

      {/* Blocking questions */}
      {payload.readiness.blockingReasons.length > 0 && (
        <div className="rounded-lg px-3.5 py-2.5" style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.15)" }}>
          <p className="text-[11px] font-semibold mb-1" style={{ color: "#fb923c" }}>Blocked until resolved</p>
          <ul className="flex flex-col gap-1">
            {payload.readiness.blockingReasons.map((reason, i) => (
              <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "#fb923c" }}>●</span>{reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Manual steps */}
      {payload.readiness.manualSteps.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>You&rsquo;ll do these yourself</p>
          <ul className="flex flex-col gap-1">
            {payload.readiness.manualSteps.map((step, i) => (
              <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--text-muted)" }}>○</span>{step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {payload.readiness.warnings.length > 0 && (
        <ul className="flex flex-col gap-1">
          {payload.readiness.warnings.map((w, i) => (
            <li key={i} className="text-[10px]" style={{ color: "var(--text-muted)" }}>⚠ {w}</li>
          ))}
        </ul>
      )}

      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        🔒 The browser assistant is a future step — nothing fills or submits external forms yet,
        and final submission will always be your own click.
      </p>

      {/* Dev-only payload preview */}
      {isDev && (
        <div>
          <button
            type="button"
            className="text-[10px] font-medium underline"
            style={{ color: "var(--text-muted)" }}
            onClick={() => setShowJson((v) => !v)}
          >
            {showJson ? "Hide developer payload" : "Developer payload preview"}
          </button>
          {showJson && (
            <pre
              className="mt-2 rounded-lg p-3 text-[10px] overflow-x-auto max-h-72 overflow-y-auto"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
            >
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
