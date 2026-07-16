"use client";

import { useState } from "react";
import Link from "next/link";
import { reviewJobs } from "@/app/lib/mock-data";
import { useAutomationJob } from "@/app/lib/automation/store";
import {
  PIPELINE_STEPS,
  SIMPLE_STAGES,
  SIMPLE_STATUS_LABELS,
  RUNNING_STATUSES,
  toSimpleStatus,
  simpleStageIndex,
  type AutomationJob,
  type SimpleStatus,
} from "@/app/lib/automation/contracts";
import {
  pauseAutomation,
  resumeAutomation,
  cancelAutomation,
  provideMissingAnswers,
} from "@/app/lib/automation/orchestrator";

/* ─────────────────────────────────────────────────────────
   AutomationProgress — the user-facing "ApplyMate is
   handling it" experience shown in the Tracker and on /review.

   Presentation only shows the simplified 5-status /
   4-stage model (see lib/automation/contracts.ts). The
   detailed internal pipeline stays available behind an
   opt-in "See details" disclosure — nothing is removed,
   only de-emphasized.

   compact: badge + one-line explanation + one primary CTA
            (Tracker cards)
   full:    simple stages + missing-info + secondary controls
            tucked behind "Manage automation" (/review)
   ───────────────────────────────────────────────────────── */

function statusBadgeStyle(simple: SimpleStatus): React.CSSProperties {
  switch (simple) {
    case "ready":
      return { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" };
    case "needs_input":
      return { background: "rgba(251,146,60,0.08)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.2)" };
    case "failed":
    case "cancelled":
      return { background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" };
    case "paused":
      return { background: "rgba(250,204,21,0.08)", color: "#fde047", border: "1px solid rgba(250,204,21,0.2)" };
    default:
      return { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" };
  }
}

function AiSourceBadge({ job }: { job: AutomationJob }) {
  if (!job.package) return null;
  return job.isDemo ? (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(250,204,21,0.08)", color: "#fde047", border: "1px solid rgba(250,204,21,0.2)" }}>
      ⚡ Demo fallback
    </span>
  ) : (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
      ✓ Real AI
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
      <div className="h-full rounded-full transition-all duration-500 ease-out"
           style={{ width: `${value}%`, background: "linear-gradient(90deg, #2563eb, #22d3ee)" }} />
    </div>
  );
}

/** Short, human explanation + CTA label per simple status. Compact cards
    are navigation-only — all actions live on the full /review panel. */
function compactCopy(job: AutomationJob): { explanation: string; ctaLabel: string } {
  const simple = toSimpleStatus(job.status);
  switch (simple) {
    case "preparing":
      return { explanation: "ApplyMate is creating your tailored application.", ctaLabel: "View progress" };
    case "needs_input": {
      const n = job.missingInformation.length;
      return { explanation: `We need ${n} quick answer${n === 1 ? "" : "s"} before continuing.`, ctaLabel: "Answer questions" };
    }
    case "ready":
      return { explanation: "Your application package is ready.", ctaLabel: "View application" };
    case "paused":
      return { explanation: "Preparation is paused.", ctaLabel: "View progress" };
    case "failed":
      return { explanation: "Something went wrong while preparing this application.", ctaLabel: "View progress" };
    case "cancelled":
      return { explanation: "This application was cancelled.", ctaLabel: "View progress" };
  }
}

/* ── Missing information form ────────────────────────────── */

function MissingInfoForm({ job }: { job: AutomationJob }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Fundamentals missing (no package yet) — the profile itself is incomplete.
  if (!job.package) {
    return (
      <div className="rounded-lg px-3.5 py-3" style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.18)" }}>
        <p className="text-[12px] font-semibold mb-1.5" style={{ color: "#fb923c" }}>
          We need a few details in your profile to continue.
        </p>
        <ul className="flex flex-col gap-1 mb-2.5">
          {job.missingInformation.map((item, i) => (
            <li key={i} className="text-[12px] flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "#fb923c" }}>○</span>{item}
            </li>
          ))}
        </ul>
        <Link href="/profile" className="dash-btn dash-btn--primary text-[12px]">
          Complete profile
        </Link>
      </div>
    );
  }

  // Package-level missing information — compact answer request.
  const allFilled = job.missingInformation.every((_, i) => (answers[i] ?? "").trim());
  return (
    <div className="rounded-lg px-3.5 py-3 flex flex-col gap-2.5"
         style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.18)" }}>
      <div>
        <p className="text-[12px] font-semibold" style={{ color: "#fb923c" }}>
          We need a few answers to continue.
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          ApplyMate never guesses legal, salary, authorization, or personal information.
        </p>
      </div>
      {job.missingInformation.map((item, i) => (
        <div key={i} className="flex flex-col gap-1">
          <label className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{item}</label>
          <input
            type="text"
            value={answers[i] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
            placeholder="Your answer…"
            className="px-3 py-2 rounded-lg text-[12px]"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-mid)", color: "var(--text-primary)", outline: "none" }}
          />
        </div>
      ))}
      <button
        className="dash-btn dash-btn--primary text-[12px] self-start"
        disabled={!allFilled}
        style={{ opacity: allFilled ? 1 : 0.6 }}
        onClick={() =>
          provideMissingAnswers(
            job.jobIndex,
            job.missingInformation.map((q, i) => ({ question: q, answer: (answers[i] ?? "").trim() }))
          )
        }
      >
        Continue application
      </button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */

export default function AutomationProgress({
  jobIndex,
  compact = false,
}: {
  jobIndex: number;
  compact?: boolean;
}) {
  const job = useAutomationJob(jobIndex);
  const reviewJob = reviewJobs[jobIndex];
  const [showDetails, setShowDetails] = useState(false);
  const [showManage, setShowManage] = useState(false);
  if (!job || !reviewJob) return null;

  const simple = toSimpleStatus(job.status);
  const isRunning = RUNNING_STATUSES.includes(job.status);
  const currentIdx = simpleStageIndex(job.currentStep);
  const currentDetailedIdx = PIPELINE_STEPS.findIndex((s) => s.status === job.currentStep);
  const isReady = simple === "ready";

  /* ── Compact variant (Tracker cards) ── */
  if (compact) {
    const { explanation, ctaLabel } = compactCopy(job);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={statusBadgeStyle(simple)}>
            {isRunning && <span className="analyze-spinner" style={{ width: 8, height: 8, marginRight: 4, display: "inline-block" }} />}
            {SIMPLE_STATUS_LABELS[simple]}
          </span>
          <AiSourceBadge job={job} />
        </div>
        <p className="text-[11px] leading-snug" style={{ color: "var(--text-secondary)" }}>{explanation}</p>
        <Link href={`/review?job=${jobIndex}`} className="text-[11px] font-semibold" style={{ color: "#60a5fa" }}>
          {ctaLabel} →
        </Link>
      </div>
    );
  }

  /* ── Full variant ── */
  const heading = isReady
    ? "Application prepared"
    : simple === "paused"
    ? "Application paused"
    : simple === "failed"
    ? "Application preparation failed"
    : simple === "cancelled"
    ? "Application cancelled"
    : "Application in progress";

  return (
    <div className="dash-panel p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            {heading}
          </p>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            {reviewJob.role} · {reviewJob.company}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={statusBadgeStyle(simple)}>
            {SIMPLE_STATUS_LABELS[simple]}
          </span>
          <AiSourceBadge job={job} />
        </div>
      </div>

      <ProgressBar value={job.progress} />

      {/* Simple 4-stage checklist */}
      <div className="flex flex-col gap-1.5">
        {SIMPLE_STAGES.map((stage, i) => {
          const done = isReady ? true : i < currentIdx;
          const active = !isReady && i === currentIdx && isRunning;
          return (
            <div key={stage.label} className="flex items-center gap-2.5 text-[12px]">
              <span className="w-4 text-center flex-shrink-0" style={{
                color: done ? "#4ade80" : active ? "#60a5fa" : "var(--text-muted)",
              }}>
                {done ? "✓" : active ? "●" : "○"}
              </span>
              <span style={{
                color: done ? "var(--text-secondary)" : active ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: active ? 600 : 400,
              }}>
                {stage.label}{active && "…"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed internal steps — opt-in only */}
      <div>
        <button
          type="button"
          className="text-[11px] font-medium"
          style={{ color: "var(--text-muted)" }}
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails ? "Hide details" : "See details"}
        </button>
        {showDetails && (
          <div className="flex flex-col gap-1.5 mt-2.5 pl-1">
            {PIPELINE_STEPS.map((step, i) => {
              const done = isReady
                ? step.status !== "FORM_AUTOMATION_PENDING" || job.status === "FORM_AUTOMATION_PENDING"
                : i < currentDetailedIdx;
              const active = !isReady && i === currentDetailedIdx && isRunning;
              const pendingFormAutomation = step.status === "FORM_AUTOMATION_PENDING";
              return (
                <div key={step.status} className="flex items-center gap-2.5 text-[11px]">
                  <span className="w-4 text-center flex-shrink-0" style={{
                    color: done ? "#4ade80" : active ? "#60a5fa" : "var(--text-muted)",
                  }}>
                    {done ? "✓" : active ? "●" : "○"}
                  </span>
                  <span style={{ color: done ? "var(--text-secondary)" : active ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {step.label}
                    {active && "…"}
                    {pendingFormAutomation && job.status === "FORM_AUTOMATION_PENDING" && (
                      <span className="ml-1.5" style={{ color: "var(--text-muted)" }}>
                        (coming soon — nothing is submitted yet)
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Honest completion note */}
      {job.status === "FORM_AUTOMATION_PENDING" && (
        <div className="rounded-lg px-3.5 py-2.5 text-[12px]"
             style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", color: "var(--text-secondary)" }}>
          ✅ <span className="font-semibold" style={{ color: "#4ade80" }}>Your application package is ready.</span>{" "}
          Submitting it automatically is the next step we&rsquo;re building — nothing has been submitted yet.
        </div>
      )}

      {/* Interruptions */}
      {job.status === "NEEDS_USER_INPUT" && <MissingInfoForm job={job} />}

      {job.status === "MANUAL_ACTION_REQUIRED" && (
        <div className="rounded-lg px-3.5 py-2.5 text-[12px]"
             style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.18)", color: "#fb923c" }}>
          {job.error}
        </div>
      )}

      {job.status === "FAILED" && (
        <div className="rounded-lg px-3.5 py-2.5 text-[12px]"
             style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.18)", color: "#f87171" }}>
          <span className="font-semibold">Preparation failed: </span>{job.error}
        </div>
      )}

      {job.status === "PAUSED" && job.error && (
        <div className="rounded-lg px-3.5 py-2.5 text-[12px]"
             style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.15)", color: "#fde047" }}>
          {job.error}
        </div>
      )}

      {/* Secondary controls — tucked behind a manage toggle */}
      <div className="pt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button
          type="button"
          className="text-[11px] font-medium pt-3"
          style={{ color: "var(--text-muted)" }}
          onClick={() => setShowManage((v) => !v)}
        >
          {showManage ? "Hide options" : "Manage automation"}
        </button>
        {showManage && (
          <div className="flex items-center gap-2 flex-wrap pt-3">
            {isRunning && (
              <button className="dash-btn dash-btn--outline text-[12px]" onClick={() => pauseAutomation(jobIndex)}>
                Pause
              </button>
            )}
            {(job.status === "PAUSED" || job.status === "FAILED") && (
              <button className="dash-btn dash-btn--primary text-[12px]" onClick={() => resumeAutomation(jobIndex)}>
                {job.status === "FAILED" ? "Retry" : "Resume"}
              </button>
            )}
            {job.status !== "CANCELLED" && job.status !== "FORM_AUTOMATION_PENDING" && (
              <button className="dash-btn dash-btn--ghost text-[12px]" style={{ color: "var(--text-muted)" }}
                      onClick={() => cancelAutomation(jobIndex)}>
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
