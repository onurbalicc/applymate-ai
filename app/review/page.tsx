"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/app/components/DashboardLayout";
import { reviewJobs, type ReviewJob } from "@/app/lib/mock-data";
import { useI18n } from "@/app/lib/i18n";
import { useApplicationState } from "@/app/lib/application-state";
import type { TKey } from "@/app/lib/translations";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Application Package Builder (/review)

   Route: /review?job=<index>

   This is the emotional center of the product.
   ApplyMate prepared a complete application package from the
   user's Master CV Profile — the user reviews it, then
   approves, declines, or saves for later.

   Actions are wired to the shared useSyncExternalStore demo
   state (localStorage) — the same store used by the review
   queue and tracker. Approve adds the job to Tracker and
   removes it from the queue.
   ───────────────────────────────────────────────────────── */

export default function ReviewPage() {
  return (
    <ReviewShell>
      <Suspense fallback={null}>
        <ReviewContent />
      </Suspense>
    </ReviewShell>
  );
}

function ReviewShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <DashboardLayout activeNavId="review" pageTitle={t("review.pageTitle")}>
      {children}
    </DashboardLayout>
  );
}

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawIdx = Number(searchParams.get("job"));
  const jobIdx = Number.isInteger(rawIdx) && rawIdx >= 0 && rawIdx < reviewJobs.length ? rawIdx : 0;
  const job = reviewJobs[jobIdx];

  const { t } = useI18n();
  const { state, approve, decline, skip } = useApplicationState();

  /* ── UI feedback state ── */
  const [actionState, setActionState] = useState<"idle" | "approving" | "declining" | "skipping">("idle");
  const [toast, setToast] = useState<{ text: string; color: string } | null>(null);

  /* ── Copy-to-clipboard state (per material) ── */
  const [copiedCover, setCopiedCover] = useState(false);
  const [copiedRecruiter, setCopiedRecruiter] = useState(false);

  function handleCopyCover() {
    navigator.clipboard.writeText(job.coverLetter).then(() => {
      setCopiedCover(true);
      setTimeout(() => setCopiedCover(false), 1500);
    });
  }

  function handleCopyRecruiter() {
    navigator.clipboard.writeText(job.recruiterMessage ?? "").then(() => {
      setCopiedRecruiter(true);
      setTimeout(() => setCopiedRecruiter(false), 1500);
    });
  }

  const isApproved  = state.approved.includes(jobIdx);
  const isDeclined  = state.declined.includes(jobIdx);
  const isActing    = actionState !== "idle";

  function showToast(text: string, color: string) {
    setToast({ text, color });
    setTimeout(() => setToast(null), 2400);
  }

  function handleApprove() {
    if (isActing || isApproved) return;
    setActionState("approving");
    showToast(t("review.approvedToast"), "#4ade80");
    // Apply state change and redirect after brief feedback
    setTimeout(() => {
      approve(jobIdx);
      router.push("/tracker");
    }, 900);
  }

  function handleDecline() {
    if (isActing) return;
    setActionState("declining");
    showToast(t("queue.declined"), "#f87171");
    setTimeout(() => {
      decline(jobIdx);
      router.push("/review-queue");
    }, 600);
  }

  function handleSkip() {
    if (isActing) return;
    setActionState("skipping");
    showToast(t("queue.skipped"), "#fde047");
    setTimeout(() => {
      skip(jobIdx);
      router.push("/review-queue");
    }, 600);
  }

  /* ── Derived data ── */
  const summaryFields: { labelKey: TKey; value: string }[] = [
    { labelKey: "review.source", value: job.source },
    { labelKey: "review.found",  value: job.found },
    { labelKey: "dash.workType", value: job.workType },
    { labelKey: "review.salary", value: job.salary },
  ];

  const workflowSteps: { labelKey: TKey; done: boolean; active: boolean }[] = [
    { labelKey: "landing.wf.scan",    done: true,  active: false },
    { labelKey: "landing.wf.match",   done: true,  active: false },
    { labelKey: "landing.wf.prepare", done: true,  active: false },
    { labelKey: "review.stepReview",  done: false, active: true  },
    { labelKey: "landing.wf.approve", done: false, active: false },
    { labelKey: "landing.wf.track",   done: false, active: false },
  ];

  /* Checklist items derived from job data */
  const checklistItems = [
    { icon: "📄", label: `CV focus adjusted — ${job.cvImprovements.length} improvements identified` },
    { icon: "✉️", label: `Cover letter drafted for ${job.company}` },
    { icon: "💬", label: job.materials.some(m => m.labelKey === "material.recruiterMessage") ? "Recruiter message prepared" : "Outreach message ready" },
    { icon: "⚠️", label: `Risks reviewed — ${job.riskLevel} risk level` },
    { icon: "🎤", label: `${job.interviewQuestions.length} interview questions prepared` },
    { icon: "⏳", label: "Waiting for your approval" },
  ];

  /* Package chips */
  const packageChips = [
    "✉️ Cover letter",
    "📄 CV notes",
    "💬 Recruiter message",
    "🎤 Interview prep",
    "⚠️ Risk review",
  ].filter((_, i) => {
    // Only include recruiter message chip if the job has it
    if (i === 2) return job.materials.some(m => m.labelKey === "material.recruiterMessage");
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold animate-fade-up pointer-events-none"
          style={{
            background: toast.color === "#4ade80" ? "rgba(34,197,94,0.12)" : toast.color === "#f87171" ? "rgba(248,113,113,0.10)" : "rgba(250,204,21,0.08)",
            color: toast.color,
            border: `1px solid ${toast.color}33`,
            backdropFilter: "blur(12px)",
          }}
        >
          {toast.text}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — Package Overview Header
          ═══════════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(14,165,233,0.06) 100%)",
          border: "1px solid rgba(59,130,246,0.18)",
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          {/* Left: Package label + job info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }}
              >
                {t("review.packageHeader")}
              </span>
              {isApproved ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.10)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.22)" }}>
                  ✓ Approved
                </span>
              ) : isDeclined ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.22)" }}>
                  ✕ Declined
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(250,204,21,0.08)", color: "#fde047", border: "1px solid rgba(250,204,21,0.2)" }}>
                  ● {t("review.packageReady")}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold leading-tight mb-0.5" style={{ color: "var(--text-primary)" }}>
              {job.role}
            </h2>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              {job.company} · {job.location}
            </p>
            <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              {t("review.packageAiNote")}
            </p>
            {/* Package content chips */}
            <div className="flex flex-wrap gap-1.5">
              {packageChips.map((chip) => (
                <span
                  key={chip}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                  style={{ background: "rgba(34,197,94,0.06)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.12)" }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Right: dual score + trust note */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <ScoreRing value={job.score} gradientId="pkgMatchGrad" label="Match" />
            <ScoreRing value={job.qualityScore} gradientId="pkgQualGrad" label="Quality" size={64} />
            <p className="text-[10px] text-center max-w-[90px]" style={{ color: "var(--text-muted)" }}>
              🔒 {t("common.nothingSubmitted")}
            </p>
          </div>
        </div>

        {/* Already approved banner */}
        {isApproved && (
          <div
            className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mt-2"
            style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)" }}
          >
            <p className="text-[13px] font-semibold" style={{ color: "#4ade80" }}>
              {t("review.alreadyApproved")}
            </p>
            <Link href="/tracker" className="dash-btn dash-btn--primary text-[12px] flex-shrink-0">
              {t("common.openTracker")}
            </Link>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — Workflow pipeline status
          ═══════════════════════════════════════════════════════ */}
      <div className="dash-panel p-4">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {workflowSteps.map((step, i) => (
            <div key={step.labelKey} className="flex items-center gap-1">
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: step.active ? "linear-gradient(135deg, #2563eb, #0ea5e9)" : step.done ? "rgba(34,197,94,0.08)" : "var(--bg-raised)",
                  color: step.active ? "#fff" : step.done ? "#4ade80" : "var(--text-muted)",
                  border: step.active ? "none" : `1px solid ${step.done ? "rgba(34,197,94,0.15)" : "var(--border-subtle)"}`,
                }}
              >
                {step.done && !step.active ? "✓ " : ""}{t(step.labelKey)}
              </span>
              {i < workflowSteps.length - 1 && (
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — Master CV Connection panel
          ═══════════════════════════════════════════════════════ */}
      <div
        className="dash-panel p-5"
        style={{ borderColor: "rgba(99,102,241,0.22)", background: "rgba(99,102,241,0.03)" }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)" }}
          >
            📋
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              {t("review.masterCvTitle")}
            </p>
            <p className="text-[12px] leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>
              {t("review.masterCvBody")}
            </p>
            {/* Per-job adaptation note */}
            <div
              className="rounded-lg px-3 py-2 text-[12px] leading-relaxed mb-3"
              style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", color: "var(--text-secondary)" }}
            >
              <span className="font-semibold" style={{ color: "#a5b4fc" }}>Adaptation: </span>
              {job.cvAdaptationNote}
            </div>
            <Link href="/profile" className="text-[12px] font-medium" style={{ color: "#a5b4fc" }}>
              {t("review.viewMasterCv")}
            </Link>
          </div>
        </div>

        {/* Job summary fields */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {summaryFields.map((f) => (
            <div key={f.labelKey}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>{t(f.labelKey)}</p>
              <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — Quality score + Why this fits
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Quality breakdown */}
        <div className="lg:col-span-2 dash-panel p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#qualGrad)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50 * (job.qualityScore / 100)} ${2 * Math.PI * 50}`} className="score-ring" />
                <defs><linearGradient id="qualGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold gradient-text">{job.qualityScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t("review.quality")}</p>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}>{job.qualityLabel}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {job.qualityBreakdown.map((q) => (
              <div key={q.labelKey} className="flex items-center gap-2">
                <span className="text-[12px] flex-1" style={{ color: "var(--text-secondary)" }}>{t(q.labelKey)}</span>
                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                  <div className="h-full rounded-full" style={{ width: `${q.pct}%`, background: q.pct >= 85 ? "linear-gradient(90deg, #2563eb, #22d3ee)" : q.pct >= 75 ? "#93c5fd" : "#fb923c" }} />
                </div>
                <span className="text-[11px] font-bold tabular-nums w-8 text-right" style={{ color: q.pct >= 85 ? "#60a5fa" : q.pct >= 75 ? "#93c5fd" : "#fb923c" }}>{q.pct}%</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{t("review.riskLevel")}</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full ml-auto" style={riskLevelStyle(job.riskLevel)}>{job.riskLevel}</span>
            </div>
          </div>
        </div>

        {/* Why this fits */}
        <div className="lg:col-span-3 dash-panel p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>{t("review.whyThisFits")}</h3>
          <ul className="flex flex-col gap-2.5">
            {job.whyFitsBullets.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}>✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — Application Checklist
          ═══════════════════════════════════════════════════════ */}
      <div className="dash-panel p-5">
        <h3 className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          {t("review.checklistTitle")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {checklistItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
              style={{
                background: item.icon === "⏳"
                  ? "rgba(250,204,21,0.04)"
                  : "rgba(34,197,94,0.04)",
                border: item.icon === "⏳"
                  ? "1px solid rgba(250,204,21,0.14)"
                  : "1px solid rgba(34,197,94,0.12)",
              }}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              <span
                className="text-[12px] leading-snug"
                style={{ color: item.icon === "⏳" ? "#fde047" : "var(--text-secondary)" }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6 — Risk & Gap Analysis
          ═══════════════════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>{t("review.riskGap")}</h3>
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
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={style}>{t(severityKey[risk.severity])}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-lg px-4 py-2.5 text-[12px]" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          💡 <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("review.recommendation")}</span> {job.recommendation}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7 — Prepared Materials
          ═══════════════════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>{t("review.preparedMaterials")}</h3>

        {/* Cover Letter */}
        <MaterialCard title={t("review.coverLetterDraft")} icon="✉️">
          <p className="text-[13px] leading-[1.75] whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>{job.coverLetter}</p>
          <button
            className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "var(--blue-dim)", color: copiedCover ? "#4ade80" : "#93c5fd", border: `1px solid ${copiedCover ? "rgba(34,197,94,0.25)" : "rgba(59,130,246,0.2)"}` }}
            onClick={handleCopyCover}
          >
            {copiedCover ? "✓ Copied" : t("common.copyToClipboard")}
          </button>
        </MaterialCard>

        {/* Recruiter Message — only if materials include it */}
        {job.materials.some(m => m.labelKey === "material.recruiterMessage") && (
          <MaterialCard title={t("material.recruiterMessage")} icon="💬">
            <p className="text-[13px] leading-[1.75] whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>{job.recruiterMessage}</p>
            <button
              className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "var(--blue-dim)", color: copiedRecruiter ? "#4ade80" : "#93c5fd", border: `1px solid ${copiedRecruiter ? "rgba(34,197,94,0.25)" : "rgba(59,130,246,0.2)"}` }}
              onClick={handleCopyRecruiter}
            >
              {copiedRecruiter ? "✓ Copied" : t("common.copyToClipboard")}
            </button>
          </MaterialCard>
        )}

        {/* CV Improvements */}
        <MaterialCard title={t("review.cvImprovements")} icon="📄">
          <ul className="flex flex-col gap-2.5">
            {job.cvImprovements.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                  style={{ background: "var(--blue-dim)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>{i + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </MaterialCard>

        {/* Interview Prep */}
        <MaterialCard title={t("material.interviewPrep")} icon="🎤">
          <ul className="flex flex-col gap-2.5">
            {job.interviewQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(34,211,238,0.08)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.15)" }}>Q{i + 1}</span>
                {q}
              </li>
            ))}
          </ul>
        </MaterialCard>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 8 — Final Approval Panel
          ═══════════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(14,165,233,0.03) 100%)",
          border: "1px solid rgba(59,130,246,0.2)",
        }}
      >
        <div>
          <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            {t("review.approvalPanelTitle")}
          </h3>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {t("review.approvalDemoNote")}
          </p>
        </div>

        {/* Inline checklist summary */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {["Cover letter", "CV notes", "Risk review", "Interview prep"].map((item) => (
            <span key={item} className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "#4ade80" }}>✓</span> {item}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        {isApproved ? (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-1"
              style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.18)" }}
            >
              ✓ {t("review.alreadyApproved")}
            </div>
            <Link href="/tracker" className="dash-btn dash-btn--primary w-full sm:w-auto justify-center">
              {t("common.openTracker")}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/review-queue" className="dash-btn dash-btn--ghost w-full sm:w-auto justify-center text-center">
              {t("review.backToQueue")}
            </Link>
            <button
              id="review-skip-btn"
              className="dash-btn dash-btn--outline w-full sm:w-auto justify-center"
              onClick={handleSkip}
              disabled={isActing || isDeclined}
            >
              {t("review.skipBtn")}
            </button>
            <button
              id="review-decline-btn"
              className="dash-btn dash-btn--outline w-full sm:w-auto justify-center"
              onClick={handleDecline}
              disabled={isActing || isDeclined}
              style={isDeclined ? { opacity: 0.5 } : {}}
            >
              {isDeclined ? "✕ Declined" : t("review.declineBtn")}
            </button>
            <div className="flex-1 hidden sm:block" />
            <button
              id="review-approve-btn"
              className="dash-btn dash-btn--primary w-full sm:w-auto justify-center"
              onClick={handleApprove}
              disabled={isActing}
              style={{
                opacity: isActing ? 0.7 : 1,
                minWidth: "180px",
              }}
            >
              {actionState === "approving" ? "Approving…" : t("review.approveApply")}
            </button>
          </div>
        )}
      </div>

      {/* Demo disclaimer */}
      <p className="text-[11px] text-center pb-4" style={{ color: "var(--text-muted)" }}>
        {t("common.demoMaterials")}
      </p>
    </div>
  );
}

/* ── Helper: Dual score ring (compact) ───────────────────── */
function ScoreRing({
  value,
  gradientId,
  label,
  size = 80,
}: {
  value: number;
  gradientId: string;
  label: string;
  size?: number;
}) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const fill = (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={`url(#${gradientId})`} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={`${fill} ${circ}`} className="score-ring" />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold gradient-text leading-none" style={{ fontSize: size < 70 ? 14 : 20 }}>{value}</span>
          <span className="text-[8px] mt-0.5" style={{ color: "var(--text-muted)" }}>/ 100</span>
        </div>
      </div>
      <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
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

/* ── Helpers: severity/risk styles ──────────────────────── */
const severityKey: Record<ReviewJob["risks"][number]["severity"], TKey> = {
  High:   "severity.High",
  Medium: "severity.Medium",
  Low:    "severity.Low",
};

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
