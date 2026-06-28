"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Dashboard v4
   Uses shared layout. Interactive review queue.
   ───────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reviewAction, setReviewAction] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const currentReview = reviewIdx < reviewQueue.length ? reviewQueue[reviewIdx] : null;
  const remaining = Math.max(0, reviewQueue.length - reviewIdx);

  function handleReviewAction(action: string) {
    setReviewAction(action);
    setTimeout(() => {
      setReviewAction(null);
      setReviewIdx((i) => i + 1);
    }, 900);
  }

  return (
    <DashboardLayout
      activeNavId="auto-apply"
      topBarRight={
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
          System active
        </span>
      }
    >
      <div className="max-w-[1120px] mx-auto flex flex-col gap-5">

        {/* ── Profile completeness banner ─── */}
        {!bannerDismissed && (
          <div
            className="rounded-lg px-4 py-2.5 flex items-center gap-3 text-[12px]"
            style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)", color: "var(--text-secondary)" }}
          >
            <span>⚡</span>
            <span className="flex-1">
              Complete your profile to improve match accuracy.{" "}
              <Link href="/profile" className="font-semibold" style={{ color: "#fb923c" }}>Go to Profile →</Link>
            </span>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-sm flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Product message ─────────────── */}
        <div
          className="rounded-lg px-4 py-2.5 text-center text-[12px]"
          style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
        >
          Your time goes into improving your profile. <span className="font-semibold" style={{ color: "var(--text-primary)" }}>ApplyMate handles the repetitive application workflow.</span>
        </div>

        {/* ── Today's Automation ──────────── */}
        <section>
          <SectionHeader title="Today&apos;s Automation" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {automationStats.map((s) => (
              <div key={s.label} className="dash-stat-card">
                <p className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Two-column: Sources + Match Rules summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section>
            <SectionHeader title="Job Sources" />
            <div className="dash-panel">
              {jobSources.map((src, i) => (
                <div
                  key={src.name}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < jobSources.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                >
                  <span className="text-sm w-5 text-center">{src.icon}</span>
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{src.name}</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={src.statusStyle}>{src.status}</span>
                  <span className="text-[10px] hidden sm:block" style={{ color: "var(--text-muted)", minWidth: "80px", textAlign: "right" }}>{src.detail}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionHeader title="Match Rules" inline />
              <Link href="/profile" className="text-[11px] font-medium" style={{ color: "#93c5fd" }}>Edit in Profile →</Link>
            </div>
            <div className="dash-panel p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchRules.map((rule) => (
                  <div key={rule.label}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{rule.label}</p>
                    {Array.isArray(rule.value) ? (
                      <div className="flex flex-wrap gap-1">
                        {rule.value.map((v) => (
                          <span key={v} className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}>{v}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{rule.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ── Review Queue (interactive) ──── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SectionHeader title="Review Queue" inline />
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}>
                {remaining} ready
              </span>
            </div>
            <p className="text-[11px] hidden sm:block" style={{ color: "var(--text-muted)" }}>
              Review only what&apos;s worth your time
            </p>
          </div>

          {currentReview ? (
            <ReviewCard
              job={currentReview}
              action={reviewAction}
              onApprove={() => handleReviewAction("approved")}
              onDecline={() => handleReviewAction("declined")}
              onSkip={() => handleReviewAction("skipped")}
            />
          ) : (
            <div
              className="dash-panel p-8 text-center"
              style={{ borderStyle: "dashed" }}
            >
              <p className="text-lg mb-1">✅</p>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>All caught up!</p>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No more jobs to review. New matches will appear here.</p>
            </div>
          )}
        </section>

        {/* ── Two-column: Application Queue + Job Matches ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <section className="lg:col-span-2">
            <SectionHeader title="Application Queue" />
            <div className="dash-panel p-4 flex flex-col gap-3">
              {appQueue.map((q) => (
                <div key={q.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: q.dotColor }} />
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{q.label}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{q.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SectionHeader title="Job Matches" inline />
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}>75%+ only</span>
              </div>
              <div className="hidden sm:flex gap-1.5">
                {["Remote", "Germany"].map((f) => (
                  <span key={f} className="dash-filter-pill">{f}</span>
                ))}
              </div>
            </div>
            <JobMatchesTable />
          </section>
        </div>

        {/* ── Tracker + Inbox ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section>
            <SectionHeader title="Active Applications" />
            <div className="dash-panel">
              {trackerItems.map((t, i) => (
                <div key={t.role} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: i < trackerItems.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)", opacity: 0.8 }}>{t.company[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.role} <span className="font-normal" style={{ color: "var(--text-muted)" }}>· {t.company}</span></p>
                  </div>
                  <span className="text-[10px] hidden sm:block flex-shrink-0" style={{ color: "var(--text-muted)" }}>{t.time}</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={t.statusStyle}>{t.status}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Inbox" />
            <div className="dash-panel">
              {inboxItems.map((item, i) => (
                <div key={item.subject} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: i < inboxItems.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.dotColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.subject}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{item.detail}</p>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={item.tagStyle}>{item.tag}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function SectionHeader({ title, inline }: { title: string; inline?: boolean }) {
  if (inline) return <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>;
  return <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>{title}</h2>;
}

/* ── Review Card (interactive) ───────────────────────────── */
function ReviewCard({
  job,
  action,
  onApprove,
  onDecline,
  onSkip,
}: {
  job: (typeof reviewQueue)[number];
  action: string | null;
  onApprove: () => void;
  onDecline: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="dash-review-card">
      {/* Action feedback */}
      {action && (
        <div
          className="rounded-lg px-3 py-2 mb-4 text-center text-[12px] font-semibold animate-fade-up"
          style={{
            background: action === "approved" ? "rgba(34,197,94,0.08)" : action === "declined" ? "rgba(248,113,113,0.08)" : "rgba(250,204,21,0.06)",
            color: action === "approved" ? "#4ade80" : action === "declined" ? "#f87171" : "#fde047",
            border: `1px solid ${action === "approved" ? "rgba(34,197,94,0.15)" : action === "declined" ? "rgba(248,113,113,0.15)" : "rgba(250,204,21,0.15)"}`,
          }}
        >
          {action === "approved" && "✓ Application approved! Moving to next..."}
          {action === "declined" && "✕ Declined. Moving to next..."}
          {action === "skipped" && "⏭ Skipped. Moving to next..."}
        </div>
      )}

      {/* AI context banner */}
      <div className="rounded-lg px-3 py-2 mb-4 flex items-center gap-2" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)" }}>
        <span className="text-sm">🤖</span>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          AI prepared this application because it <span className="font-semibold" style={{ color: "#60a5fa" }}>passed your {job.threshold}% match threshold</span>.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}>
              {job.company[0]}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{job.role}</h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{job.company} · {job.location}</p>
            </div>
          </div>

          <div className="rounded-lg p-3.5 mb-4" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-[11px] font-semibold mb-1" style={{ color: "#60a5fa" }}>Why this fits</p>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{job.whyFits}</p>
          </div>

          <div className="flex flex-wrap gap-5 mb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Matches</p>
              <div className="flex flex-wrap gap-1.5">
                {job.matches.map((s) => <span key={s} className="skill-chip skill-chip--match">{s}</span>)}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Gaps</p>
              <div className="flex flex-wrap gap-1.5">
                {job.gaps.map((s) => <span key={s} className="skill-chip skill-chip--missing">{s}</span>)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {job.materials.map((m) => (
              <span key={m.label} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: "rgba(34,197,94,0.06)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.12)" }}>
                {m.icon} {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Score ring */}
        <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-subtle)" strokeWidth="9" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#dashScoreGrad)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 52 * (job.score / 100)} ${2 * Math.PI * 52}`} className="score-ring" />
              <defs>
                <linearGradient id="dashScoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold gradient-text leading-none">{job.score}</span>
              <span className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>/ 100</span>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}>
            {job.score >= 85 ? "Strong match" : "Good match"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-4 mt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button className="dash-btn dash-btn--ghost" onClick={onDecline} disabled={!!action}>✕ Decline</button>
        <button className="dash-btn dash-btn--ghost" onClick={onSkip} disabled={!!action}>⏭ Skip</button>
        <div className="flex-1" />
        <button className="dash-btn dash-btn--outline" disabled={!!action}>Review application →</button>
        <button className="dash-btn dash-btn--primary" onClick={onApprove} disabled={!!action}>✓ Approve &amp; apply</button>
      </div>

      <p className="text-[11px] text-center mt-3" style={{ color: "var(--text-muted)" }}>
        🔒 Nothing is submitted without your approval.
      </p>
    </div>
  );
}

/* ── Job Matches Table ──────────────────────────────────── */
function JobMatchesTable() {
  return (
    <div className="dash-panel overflow-hidden">
      <div className="hidden md:grid px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: "1fr 120px 70px 120px", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-raised)" }}>
        <span>Role</span><span>Location</span><span className="text-center">Score</span><span className="text-right">Status</span>
      </div>
      {jobMatches.map((job) => (
        <div key={job.role} className="dash-job-row" style={{ opacity: job.match < 70 ? 0.35 : 1 }}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: job.match >= 75 ? "linear-gradient(135deg, #2563eb, #0ea5e9)" : "var(--bg-overlay)" }}>{job.company[0]}</div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{job.role}</p>
              <p className="text-[11px] truncate md:hidden" style={{ color: "var(--text-muted)" }}>{job.location}</p>
            </div>
          </div>
          <span className="hidden md:block text-xs truncate" style={{ color: "var(--text-secondary)", width: "120px" }}>{job.location}</span>
          <div className="flex items-center justify-center" style={{ width: "70px" }}>
            <span className="text-xs font-bold tabular-nums" style={{ color: job.match >= 85 ? "#60a5fa" : job.match >= 75 ? "#93c5fd" : "var(--text-muted)" }}>{job.match}%</span>
          </div>
          <div className="flex justify-end" style={{ width: "120px" }}>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={job.statusStyle}>{job.status}</span>
          </div>
        </div>
      ))}
      <div className="px-4 py-2 text-[11px] text-center flex items-center justify-center gap-1.5" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-raised)" }}>
        🚫 45 low-match jobs hidden automatically · <span style={{ color: "#60a5fa", cursor: "pointer" }}>Show all</span>
      </div>
    </div>
  );
}

/* ── DATA ───────────────────────────────────────────────── */

const reviewQueue = [
  {
    role: "AI Engineer Working Student", company: "ExampleTech GmbH", location: "Berlin / Remote", score: 86, threshold: 75,
    whyFits: "Strong overlap with Python, SQL, and ML requirements. Your LLM projects and data analytics background match the team's applied AI focus.",
    matches: ["Python", "SQL", "Machine Learning", "Data Analytics"], gaps: ["FastAPI", "Docker"],
    materials: [{ icon: "✉️", label: "Cover letter" }, { icon: "💬", label: "Recruiter message" }, { icon: "🎤", label: "Interview prep" }],
  },
  {
    role: "Junior Data Analyst", company: "DataCorp", location: "Berlin", score: 91, threshold: 75,
    whyFits: "Your SQL and data analytics skills are a direct match. Python experience and dashboard projects align perfectly with the role requirements.",
    matches: ["SQL", "Python", "Data Analytics", "Tableau"], gaps: ["Looker"],
    materials: [{ icon: "✉️", label: "Cover letter" }, { icon: "💬", label: "Recruiter message" }],
  },
  {
    role: "Data Scientist Intern", company: "BioML Labs", location: "Munich", score: 79, threshold: 75,
    whyFits: "Your ML coursework and Python projects cover the core requirements. Statistics background helps. Some gaps in bioinformatics domain knowledge.",
    matches: ["Python", "Machine Learning", "Statistics"], gaps: ["R", "Bioinformatics", "TensorFlow"],
    materials: [{ icon: "✉️", label: "Cover letter" }, { icon: "🎤", label: "Interview prep" }],
  },
  {
    role: "Analytics Engineer", company: "FinStack", location: "Remote — Germany", score: 84, threshold: 75,
    whyFits: "Your dbt and SQL experience directly match the core stack. Data pipeline work aligns with the team's analytics engineering focus.",
    matches: ["SQL", "dbt", "Python", "Git"], gaps: ["Airflow", "Snowflake"],
    materials: [{ icon: "✉️", label: "Cover letter" }, { icon: "💬", label: "Recruiter message" }, { icon: "🎤", label: "Interview prep" }],
  },
];

const automationStats = [
  { value: "1,240", label: "Jobs scanned" },
  { value: "49", label: "High-match found" },
  { value: "45", label: "Low-fit hidden" },
  { value: "8", label: "Ready for review" },
  { value: "5", label: "Replies pending" },
];

const jobSources: { name: string; icon: string; status: string; detail: string; statusStyle: React.CSSProperties }[] = [
  { name: "LinkedIn", icon: "🔗", status: "Scanning", detail: "520 jobs checked", statusStyle: { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" } },
  { name: "StepStone", icon: "🪜", status: "Connected", detail: "320 jobs checked", statusStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
  { name: "Indeed", icon: "🔍", status: "Updated 12m ago", detail: "280 jobs checked", statusStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
  { name: "Company career pages", icon: "🏢", status: "Connected", detail: "85 pages tracked", statusStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
  { name: "Remote job boards", icon: "🌍", status: "Scanning", detail: "35 boards active", statusStyle: { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" } },
];

const matchRules: { label: string; value: string | string[] }[] = [
  { label: "Minimum match", value: "75%" },
  { label: "Target roles", value: ["Data Analyst", "AI Engineer", "Data Scientist"] },
  { label: "Location", value: "Germany / Remote" },
  { label: "Work type", value: ["Working student", "Junior", "Entry-level"] },
];

const appQueue = [
  { label: "Ready for approval", value: "8", dotColor: "#4ade80" },
  { label: "Drafts prepared", value: "12", dotColor: "#93c5fd" },
  { label: "Waiting for user review", value: "3", dotColor: "#fde047" },
  { label: "Scheduled follow-ups", value: "2", dotColor: "#fb923c" },
];

const jobMatches = [
  { role: "Junior Data Analyst", company: "DataCorp", location: "Berlin", match: 91, status: "Ready", statusStyle: { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" } },
  { role: "AI Engineer Working Student", company: "ExampleTech", location: "Remote — DE", match: 86, status: "Draft ready", statusStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
  { role: "Data Scientist Intern", company: "BioML Labs", location: "Munich", match: 79, status: "Needs review", statusStyle: { background: "rgba(250,204,21,0.06)", color: "#fde047", border: "1px solid rgba(250,204,21,0.15)" } },
  { role: "Marketing Analyst", company: "SocialMetrics", location: "Hamburg", match: 52, status: "Hidden · Low fit", statusStyle: { background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" } },
];

const trackerItems = [
  { role: "Data Analyst", company: "Google", time: "2d ago", status: "Applied", statusStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } as React.CSSProperties },
  { role: "Product Manager", company: "Notion", time: "5d ago", status: "Reply pending", statusStyle: { background: "rgba(250,204,21,0.06)", color: "#fde047", border: "1px solid rgba(250,204,21,0.15)" } as React.CSSProperties },
  { role: "UX Designer", company: "Figma", time: "Follow-up in 2d", status: "Follow-up due", statusStyle: { background: "rgba(251,146,60,0.06)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.15)" } as React.CSSProperties },
  { role: "AI Engineer", company: "Anthropic", time: "Tomorrow 14:00", status: "Interview", statusStyle: { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" } as React.CSSProperties },
];

const inboxItems: { subject: string; detail: string; tag: string; dotColor: string; tagStyle: React.CSSProperties }[] = [
  { subject: "Interview invitation — Anthropic", detail: "Tomorrow at 14:00 · AI Engineer role", tag: "Interview", dotColor: "#4ade80", tagStyle: { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" } },
  { subject: "Reply from Notion recruiter", detail: "Wants to schedule a call this week", tag: "Reply pending", dotColor: "#fde047", tagStyle: { background: "rgba(250,204,21,0.06)", color: "#fde047", border: "1px solid rgba(250,204,21,0.15)" } },
  { subject: "Follow-up due — Figma", detail: "No response after 7 days · Auto-reminder set", tag: "Follow-up", dotColor: "#fb923c", tagStyle: { background: "rgba(251,146,60,0.06)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.15)" } },
  { subject: "Rejection — SocialMetrics", detail: "Position filled · Archived automatically", tag: "Archived", dotColor: "var(--text-muted)", tagStyle: { background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" } },
  { subject: "New email detected", detail: "From careers@datacorp.de · Needs classification", tag: "New", dotColor: "#60a5fa", tagStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
];
