"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Dashboard v6 (Operations Overview)
   No full review cards — those live on /review-queue.
   ───────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

        {/* ── Two-column: Sources + Match Rules ── */}
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

        {/* ── Compact Review Queue preview ── */}
        <section>
          <SectionHeader title="Review Queue" />
          <div className="dash-panel p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>4</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>applications ready for review</span>
                </div>
                <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}>E</span>
                  <span>Top match: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>AI Engineer Working Student</span></span>
                  <span className="font-bold" style={{ color: "#60a5fa" }}>86%</span>
                </div>
              </div>
              <Link
                href="/review-queue"
                className="dash-btn dash-btn--primary flex-shrink-0"
              >
                Open Review Queue →
              </Link>
            </div>
          </div>
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

          <section className="lg:col-span-3" id="matches">
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
          <section id="tracker">
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

          <section id="inbox">
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

const automationStats = [
  { value: "1,240", label: "Jobs scanned" },
  { value: "49", label: "High-match found" },
  { value: "45", label: "Low-fit hidden" },
  { value: "4", label: "Ready for review" },
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
  { label: "Ready for approval", value: "4", dotColor: "#4ade80" },
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
  { role: "Junior Data Analyst", company: "DataCorp", time: "2d ago", status: "Applied", statusStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } as React.CSSProperties },
  { role: "Analytics Engineer", company: "FinStack", time: "5d ago", status: "Reply pending", statusStyle: { background: "rgba(250,204,21,0.06)", color: "#fde047", border: "1px solid rgba(250,204,21,0.15)" } as React.CSSProperties },
  { role: "AI Engineer", company: "ExampleTech", time: "Follow-up in 2d", status: "Follow-up due", statusStyle: { background: "rgba(251,146,60,0.06)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.15)" } as React.CSSProperties },
  { role: "Data Scientist Intern", company: "BioML Labs", time: "Tomorrow 14:00", status: "Interview", statusStyle: { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" } as React.CSSProperties },
];

const inboxItems: { subject: string; detail: string; tag: string; dotColor: string; tagStyle: React.CSSProperties }[] = [
  { subject: "Interview invitation — BioML Labs", detail: "Tomorrow at 14:00 · Data Scientist Intern role", tag: "Interview", dotColor: "#4ade80", tagStyle: { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" } },
  { subject: "Reply from FinStack recruiter", detail: "Wants to schedule a call this week", tag: "Reply pending", dotColor: "#fde047", tagStyle: { background: "rgba(250,204,21,0.06)", color: "#fde047", border: "1px solid rgba(250,204,21,0.15)" } },
  { subject: "Follow-up due — ExampleTech", detail: "No response after 7 days · Auto-reminder set", tag: "Follow-up", dotColor: "#fb923c", tagStyle: { background: "rgba(251,146,60,0.06)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.15)" } },
  { subject: "Rejection — SocialMetrics", detail: "Position filled · Archived automatically", tag: "Archived", dotColor: "var(--text-muted)", tagStyle: { background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" } },
  { subject: "New email detected", detail: "From careers@datacorp.de · Needs classification", tag: "New", dotColor: "#60a5fa", tagStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
];
