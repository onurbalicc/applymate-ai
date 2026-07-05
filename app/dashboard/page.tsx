"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";
import { reviewJobs } from "@/app/lib/mock-data";
import { useI18n } from "@/app/lib/i18n";
import { useApplicationState } from "@/app/lib/application-state";
import type { TKey } from "@/app/lib/translations";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Control Center
   Answers: "What is ApplyMate doing for me, and what needs
   my approval now?" Engine status + next actions only —
   the full pipeline lives on /tracker, messages on /inbox.
   ───────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [resetToast, setResetToast] = useState(false);
  const { t } = useI18n();
  const { state, reset, pendingCount, approvedCount } = useApplicationState();

  const topMatch = state.queue.length > 0 ? reviewJobs[state.queue[0]] : null;

  function handleReset() {
    reset();
    setResetToast(true);
    setTimeout(() => setResetToast(false), 2200);
  }

  /* Live counts derived from the demo state */
  const stats = automationStats.map((s) =>
    s.labelKey === "dash.readyForReview" ? { ...s, value: String(pendingCount) } : s
  );
  const queueCounts = appQueue.map((q) =>
    q.labelKey === "dash.readyForApproval" ? { ...q, value: String(pendingCount) } : q
  );
  const actionCounts: Record<string, string> = {
    "/review-queue": String(pendingCount),
    "/tracker": String(4 + approvedCount),
    "/inbox": "3",
  };

  return (
    <DashboardLayout
      activeNavId="auto-apply"
      topBarRight={
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
          {t("dash.systemActive")}
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
              {t("dash.completeProfile")}{" "}
              <Link href="/profile" className="font-semibold" style={{ color: "#fb923c" }}>{t("dash.goToProfile")}</Link>
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

        {/* ── Core motto ──────────────────── */}
        <div
          className="rounded-lg px-4 py-2.5 text-center text-[12px]"
          style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
        >
          🤖 <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("common.motto")}</span>
        </div>

        {/* ── Today's Automation ──────────── */}
        <section>
          <SectionHeader title={t("dash.todaysAutomation")} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.map((s) => (
              <div key={s.labelKey} className="dash-stat-card">
                <p className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t(s.labelKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Two-column: Sources + Match Rules ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section>
            <SectionHeader title={t("dash.jobSources")} />
            <div className="dash-panel">
              {jobSources.map((src, i) => (
                <div
                  key={src.name}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < jobSources.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                >
                  <span className="text-sm w-5 text-center">{src.icon}</span>
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{src.name}</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={src.statusStyle}>{t(src.statusKey)}</span>
                  <span className="text-[10px] hidden sm:block" style={{ color: "var(--text-muted)", minWidth: "80px", textAlign: "right" }}>{src.detail}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionHeader title={t("dash.matchRules")} inline />
              <Link href="/profile" className="text-[11px] font-medium" style={{ color: "#93c5fd" }}>{t("dash.editInProfile")}</Link>
            </div>
            <div className="dash-panel p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchRules.map((rule) => (
                  <div key={rule.labelKey}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{t(rule.labelKey)}</p>
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
          <SectionHeader title={t("dash.reviewQueue")} />
          <div className="dash-panel p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                {topMatch ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{pendingCount}</span>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("dash.readyForReviewLine")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}>{topMatch.company[0]}</span>
                      <span>{t("dash.topMatch")} <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{topMatch.role}</span></span>
                      <span className="font-bold" style={{ color: "#60a5fa" }}>{topMatch.score}%</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm py-2" style={{ color: "var(--text-secondary)" }}>
                    ✅ {t("dash.allCaughtUp")}
                  </p>
                )}
              </div>
              <Link
                href="/review-queue"
                className="dash-btn dash-btn--primary flex-shrink-0"
              >
                {t("common.openReviewQueue")}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Two-column: Application Queue + Job Matches ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <section className="lg:col-span-2">
            <SectionHeader title={t("dash.applicationQueue")} />
            <div className="dash-panel p-4 flex flex-col gap-3">
              {queueCounts.map((q) => (
                <div key={q.labelKey} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: q.dotColor }} />
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t(q.labelKey)}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{q.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SectionHeader title={t("dash.jobMatches")} inline />
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}>{t("dash.only75")}</span>
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

        {/* ── Next actions strip ──────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title={t("dash.nextActions")} inline />
            <button
              onClick={handleReset}
              className="text-[11px] font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              {t("demo.reset")}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {nextActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="dash-panel p-4 flex items-center gap-3 transition-colors hover:border-[rgba(59,130,246,0.4)]"
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border-mid)" }}
                  aria-hidden="true"
                >
                  {a.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t(a.labelKey)}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    <span className="font-bold" style={{ color: a.color }}>{actionCounts[a.href]}</span> {t(a.contextKey)}
                  </p>
                </div>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Reset confirmation toast ────── */}
        {resetToast && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold animate-fade-up"
            style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", backdropFilter: "blur(12px)" }}
          >
            ✓ {t("demo.resetDone")}
          </div>
        )}
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
  const { t } = useI18n();
  return (
    <div className="dash-panel overflow-hidden">
      <div className="hidden md:grid px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: "1fr 120px 70px 120px", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-raised)" }}>
        <span>{t("dash.role")}</span><span>{t("dash.location")}</span><span className="text-center">{t("dash.score")}</span><span className="text-right">{t("dash.status")}</span>
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
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={job.statusStyle}>{t(job.statusKey)}</span>
          </div>
        </div>
      ))}
      <div className="px-4 py-2 text-[11px] text-center flex items-center justify-center gap-1.5" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-raised)" }}>
        {t("dash.hiddenAuto")} <span style={{ color: "#60a5fa", cursor: "pointer" }}>{t("common.showAll")}</span>
      </div>
    </div>
  );
}

/* ── DATA (roles, companies, and locations stay English) ── */

const automationStats: { value: string; labelKey: TKey }[] = [
  { value: "1,240", labelKey: "common.jobsScanned" },
  { value: "49", labelKey: "dash.highMatchFound" },
  { value: "45", labelKey: "common.lowFitHidden" },
  { value: "4", labelKey: "dash.readyForReview" },
  { value: "3", labelKey: "dash.unreadInInbox" },
];

const jobSources: { name: string; icon: string; statusKey: TKey; detail: string; statusStyle: React.CSSProperties }[] = [
  { name: "LinkedIn", icon: "🔗", statusKey: "dash.scanning", detail: "520 jobs checked", statusStyle: { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" } },
  { name: "StepStone", icon: "🪜", statusKey: "dash.connected", detail: "320 jobs checked", statusStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
  { name: "Indeed", icon: "🔍", statusKey: "dash.updated12m", detail: "280 jobs checked", statusStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
  { name: "Company career pages", icon: "🏢", statusKey: "dash.connected", detail: "85 pages tracked", statusStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
  { name: "Remote job boards", icon: "🌍", statusKey: "dash.scanning", detail: "35 boards active", statusStyle: { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" } },
];

const matchRules: { labelKey: TKey; value: string | string[] }[] = [
  { labelKey: "dash.minMatch", value: "75%" },
  { labelKey: "dash.targetRoles", value: ["Data Analyst", "AI Engineer", "Data Scientist"] },
  { labelKey: "dash.location", value: "Germany / Remote" },
  { labelKey: "dash.workType", value: ["Working student", "Junior", "Entry-level"] },
];

const appQueue: { labelKey: TKey; value: string; dotColor: string }[] = [
  { labelKey: "dash.readyForApproval", value: "4", dotColor: "#4ade80" },
  { labelKey: "dash.draftsPrepared", value: "12", dotColor: "#93c5fd" },
  { labelKey: "dash.waitingUserReview", value: "3", dotColor: "#fde047" },
  { labelKey: "dash.scheduledFollowUps", value: "2", dotColor: "#fb923c" },
];

const jobMatches: { role: string; company: string; location: string; match: number; statusKey: TKey; statusStyle: React.CSSProperties }[] = [
  { role: "Junior Data Analyst", company: "DataCorp", location: "Berlin", match: 91, statusKey: "status.ready", statusStyle: { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" } },
  { role: "AI Engineer Working Student", company: "ExampleTech", location: "Remote — DE", match: 86, statusKey: "status.draftReady", statusStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
  { role: "Data Scientist Intern", company: "BioML Labs", location: "Munich", match: 79, statusKey: "status.needsReview", statusStyle: { background: "rgba(250,204,21,0.06)", color: "#fde047", border: "1px solid rgba(250,204,21,0.15)" } },
  { role: "Marketing Analyst", company: "SocialMetrics", location: "Hamburg", match: 52, statusKey: "status.lowFitHiddenChip", statusStyle: { background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" } },
];

/* Next-action links — counts are injected from the demo state at render */
const nextActions: { href: string; icon: string; labelKey: TKey; contextKey: TKey; color: string }[] = [
  { href: "/review-queue", icon: "📋", labelKey: "nav.reviewQueue", contextKey: "dash.readyForReviewLine", color: "#4ade80" },
  { href: "/tracker",      icon: "📊", labelKey: "nav.tracker",     contextKey: "tracker.activeApps",      color: "#60a5fa" },
  { href: "/inbox",        icon: "📬", labelKey: "nav.inbox",       contextKey: "inbox.unread",            color: "#fde047" },
];
