"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/app/components/DashboardLayout";
import { reviewJobs, type ReviewJob } from "@/app/lib/mock-data";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Application Review Detail
   Full prepared application package before approval.
   Reads ?job=<index> to show the job selected in the queue.
   ───────────────────────────────────────────────────────── */

export default function ReviewPage() {
  return (
    <DashboardLayout activeNavId="review" pageTitle="Review Application">
      <Suspense fallback={null}>
        <ReviewContent />
      </Suspense>
    </DashboardLayout>
  );
}

function ReviewContent() {
  const searchParams = useSearchParams();
  const rawIdx = Number(searchParams.get("job"));
  const jobIdx = Number.isInteger(rawIdx) && rawIdx >= 0 && rawIdx < reviewJobs.length ? rawIdx : 0;
  const job = reviewJobs[jobIdx];

  const [savedDraft, setSavedDraft] = useState(false);

  function handleSaveDraft() {
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2200);
  }

  const summaryFields = [
    { label: "Source", value: job.source },
    { label: "Found", value: job.found },
    { label: "Work type", value: job.workType },
    { label: "Salary", value: job.salary },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">

      {/* ── Subtitle ───────────────────── */}
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Check the job fit, prepared materials, and risks before approving the application.
      </p>

      {/* ── Top summary card ────────────── */}
      <div className="dash-review-card">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left: job info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}>
                {job.company[0]}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{job.role}</h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{job.company} · {job.location}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {summaryFields.map((f) => (
                <div key={f.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>{f.label}</p>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{f.value}</p>
                </div>
              ))}
            </div>

            <p className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              🔒 Nothing is submitted without your approval.
            </p>
          </div>

          {/* Right: score ring */}
          <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0">
            <ScoreRing value={job.score} gradientId="revScoreGrad" />
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}>
              {job.score >= 85 ? "Strong match" : "Good match"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Workflow status ────────────── */}
      <div className="dash-panel p-4">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {workflowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: step.active ? "linear-gradient(135deg, #2563eb, #0ea5e9)" : step.done ? "rgba(34,197,94,0.08)" : "var(--bg-raised)",
                  color: step.active ? "#fff" : step.done ? "#4ade80" : "var(--text-muted)",
                  border: step.active ? "none" : `1px solid ${step.done ? "rgba(34,197,94,0.15)" : "var(--border-subtle)"}`,
                }}
              >
                {step.done && !step.active ? "✓ " : ""}{step.label}
              </span>
              {i < workflowSteps.length - 1 && (
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Application quality + Why this fits ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Quality score */}
        <div className="lg:col-span-2 dash-panel p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#qualGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50 * (job.qualityScore / 100)} ${2 * Math.PI * 50}`} className="score-ring" />
                <defs><linearGradient id="qualGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold gradient-text">{job.qualityScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Application Quality</p>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}>{job.qualityLabel}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {job.qualityBreakdown.map((q) => (
              <div key={q.label} className="flex items-center gap-2">
                <span className="text-[12px] flex-1" style={{ color: "var(--text-secondary)" }}>{q.label}</span>
                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                  <div className="h-full rounded-full" style={{ width: `${q.pct}%`, background: q.pct >= 85 ? "linear-gradient(90deg, #2563eb, #22d3ee)" : q.pct >= 75 ? "#93c5fd" : "#fb923c" }} />
                </div>
                <span className="text-[11px] font-bold tabular-nums w-8 text-right" style={{ color: q.pct >= 85 ? "#60a5fa" : q.pct >= 75 ? "#93c5fd" : "#fb923c" }}>{q.pct}%</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Risk level</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full ml-auto" style={riskLevelStyle(job.riskLevel)}>{job.riskLevel}</span>
            </div>
          </div>
        </div>

        {/* Why this fits */}
        <div className="lg:col-span-3 dash-panel p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Why This Fits</h3>
          <ul className="flex flex-col gap-2.5">
            {job.whyFitsBullets.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}>✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Risk & Gap Analysis ─────────── */}
      <section>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Risk &amp; Gap Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {job.risks.map((risk) => {
            const style = severityStyle(risk.severity);
            return (
              <div key={risk.label} className="dash-panel p-4 flex items-start gap-3">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5" style={style}>
                  {risk.severity === "High" ? "!" : risk.severity === "Medium" ? "~" : "·"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>{risk.label}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={style}>{risk.severity}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-lg px-4 py-2.5 text-[12px]" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          💡 <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Recommendation:</span> {job.recommendation}
        </div>
      </section>

      {/* ── Prepared Materials ──────────── */}
      <section>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Prepared Materials</h3>

        {/* Cover Letter */}
        <MaterialCard title="Cover Letter Draft" icon="✉️">
          <p className="text-[13px] leading-[1.75] whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>{job.coverLetter}</p>
          <button className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" }}>📋 Copy to clipboard</button>
        </MaterialCard>

        {/* Recruiter Message */}
        <MaterialCard title="Recruiter Message" icon="💬">
          <p className="text-[13px] leading-[1.75] whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>{job.recruiterMessage}</p>
          <button className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" }}>📋 Copy to clipboard</button>
        </MaterialCard>

        {/* CV Improvements */}
        <MaterialCard title="CV Improvements" icon="📄">
          <ul className="flex flex-col gap-2.5">
            {job.cvImprovements.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: "var(--blue-dim)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>{i + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </MaterialCard>

        {/* Interview Prep */}
        <MaterialCard title="Interview Prep" icon="🎤">
          <ul className="flex flex-col gap-2.5">
            {job.interviewQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: "rgba(34,211,238,0.08)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.15)" }}>Q{i + 1}</span>
                {q}
              </li>
            ))}
          </ul>
        </MaterialCard>
      </section>

      {/* ── Actions ────────────────────── */}
      <div
        className="flex flex-col sm:flex-row items-center gap-3 pt-4 mt-2"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <Link href="/review-queue" className="dash-btn dash-btn--ghost w-full sm:w-auto justify-center text-center">
          ← Back to Review Queue
        </Link>
        <button className="dash-btn dash-btn--outline w-full sm:w-auto justify-center" onClick={handleSaveDraft}>
          {savedDraft ? "✓ Draft saved" : "💾 Save draft"}
        </button>
        <button className="dash-btn dash-btn--outline w-full sm:w-auto justify-center">
          🔄 Regenerate materials
        </button>
        <div className="flex-1 hidden sm:block" />
        <button className="dash-btn dash-btn--primary w-full sm:w-auto justify-center">
          ✓ Approve &amp; Apply
        </button>
      </div>

      {/* Save toast */}
      {savedDraft && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold animate-fade-up"
          style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", backdropFilter: "blur(12px)" }}
        >
          ✓ Draft saved successfully
        </div>
      )}

      <p className="text-[11px] text-center pb-4" style={{ color: "var(--text-muted)" }}>
        This is a demo preview. Real AI-generated materials are coming soon.
      </p>
    </div>
  );
}

/* ── Helper: Score ring ──────────────────────────────────── */
function ScoreRing({ value, gradientId }: { value: number; gradientId: string }) {
  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-subtle)" strokeWidth="9" />
        <circle cx="60" cy="60" r="52" fill="none" stroke={`url(#${gradientId})`} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 52 * (value / 100)} ${2 * Math.PI * 52}`} className="score-ring" />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold gradient-text leading-none">{value}</span>
        <span className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>/ 100</span>
      </div>
    </div>
  );
}

/* ── Helper: Material Card ───────────────────────────────── */
function MaterialCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="dash-panel p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: "var(--bg-raised)", border: "1px solid var(--border-mid)" }}>{icon}</span>
        <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

/* ── Helper: severity/risk styles ────────────────────────── */
function severityStyle(severity: ReviewJob["risks"][number]["severity"]): React.CSSProperties {
  if (severity === "High")
    return { background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.15)" };
  if (severity === "Medium")
    return { background: "rgba(250,204,21,0.06)", color: "#fde047", border: "1px solid rgba(250,204,21,0.15)" };
  return { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" };
}

function riskLevelStyle(level: string): React.CSSProperties {
  if (level.startsWith("Low"))
    return { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" };
  if (level.includes("High"))
    return { background: "rgba(251,146,60,0.08)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.15)" };
  return { background: "rgba(250,204,21,0.06)", color: "#fde047", border: "1px solid rgba(250,204,21,0.15)" };
}

/* ── Static workflow position ───────────────────────────── */
const workflowSteps = [
  { label: "Scan", done: true, active: false },
  { label: "Match", done: true, active: false },
  { label: "Prepare", done: true, active: false },
  { label: "Review", done: false, active: true },
  { label: "Approve", done: false, active: false },
  { label: "Track", done: false, active: false },
];
