"use client";

import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";
import {
  reviewJobs,
  trackerApps,
  trackerStageMeta,
  trackerStageOrder,
  type TrackerStage,
} from "@/app/lib/mock-data";
import { useI18n } from "@/app/lib/i18n";
import { useApplicationState } from "@/app/lib/application-state";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Application Tracker
   Pipeline view: base mock pipeline + applications the user
   approved in this demo session (they land in "Applied").
   ───────────────────────────────────────────────────────── */

export default function TrackerPage() {
  const { t } = useI18n();
  const { state, approvedCount, pendingCount } = useApplicationState();

  /* Jobs approved in this demo session → new "Applied" cards */
  const approvedEntries = state.approved.map((id) => reviewJobs[id]);
  const activeCount = trackerApps.filter((a) => a.stage !== "archived").length + approvedCount;

  function stageCount(stage: TrackerStage) {
    const base = trackerApps.filter((a) => a.stage === stage).length;
    return stage === "applied" ? base + approvedCount : base;
  }

  return (
    <DashboardLayout
      activeNavId="tracker"
      topBarRight={
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          {activeCount} {t("tracker.activeApps")}
        </span>
      }
    >
      <div className="max-w-[1120px] mx-auto flex flex-col gap-5">

        {/* ── Page intro ─────────────────── */}
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {t("tracker.intro")}
        </p>

        {/* ── Stage summary ──────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {trackerStageOrder.map((stage) => {
            const meta = trackerStageMeta[stage];
            const n = stageCount(stage);
            return (
              <div key={stage} className="dash-stat-card flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
                <div>
                  <p className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{n}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t(meta.labelKey)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Pipeline board ─────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
          {trackerStageOrder.map((stage) => {
            const meta = trackerStageMeta[stage];
            const apps = trackerApps.filter((a) => a.stage === stage);
            return (
              <section key={stage} className="flex flex-col gap-2.5">
                {/* Column header */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
                  <span className="text-[12px] font-bold flex-1" style={{ color: "var(--text-primary)" }}>{t(meta.labelKey)}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                  >
                    {stageCount(stage)}
                  </span>
                </div>

                {/* Newly approved (demo session) — Applied column only */}
                {stage === "applied" && approvedEntries.map((job) => (
                  <div
                    key={"approved-" + job.role + job.company}
                    className="dash-panel p-3.5 flex flex-col gap-2.5"
                    style={{ borderColor: "rgba(59,130,246,0.35)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
                      >
                        {job.company[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                          {job.role}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{job.company}</p>
                      </div>
                      <span
                        className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "var(--blue-dim)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" }}
                      >
                        {t("demo.newChip")}
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      ✓ {t("demo.approvedEvent")}
                    </p>

                    <div
                      className="rounded-md px-2.5 py-1.5 text-[11px] leading-snug"
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                    >
                      → {t("demo.approvedNext")}
                    </div>
                  </div>
                ))}

                {/* Cards */}
                {apps.map((app) => (
                  <div
                    key={app.role + app.company}
                    className="dash-panel p-3.5 flex flex-col gap-2.5"
                    style={{ opacity: stage === "archived" ? 0.65 : 1 }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{
                          background: stage === "archived" ? "var(--bg-overlay)" : "linear-gradient(135deg, #2563eb, #0ea5e9)",
                        }}
                      >
                        {app.company[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                          {app.role}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{app.company}</p>
                      </div>
                      <span
                        className="ml-auto text-[11px] font-bold tabular-nums flex-shrink-0"
                        style={{ color: app.score >= 85 ? "#60a5fa" : app.score >= 75 ? "#93c5fd" : "var(--text-muted)" }}
                      >
                        {app.score}%
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {app.lastEvent}
                    </p>

                    <div
                      className="rounded-md px-2.5 py-1.5 text-[11px] leading-snug"
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                    >
                      → {app.nextAction}
                    </div>
                  </div>
                ))}

                {/* Empty column state */}
                {stageCount(stage) === 0 && (
                  <div
                    className="rounded-xl px-3 py-6 text-center text-[11px]"
                    style={{ border: "1px dashed var(--border-mid)", color: "var(--text-muted)" }}
                  >
                    {t("tracker.empty")}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* ── Footer actions ─────────────── */}
        <div
          className="dash-panel p-4 flex flex-col sm:flex-row items-center gap-3"
        >
          <p className="text-[12px] flex-1 text-center sm:text-left" style={{ color: "var(--text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("tracker.waitingA", { n: pendingCount })}</span>{" "}
            {t("tracker.waitingB")}
          </p>
          <Link href="/review-queue" className="dash-btn dash-btn--primary flex-shrink-0">
            {t("common.openReviewQueue")}
          </Link>
          <Link href="/inbox" className="dash-btn dash-btn--outline flex-shrink-0">
            📬 {t("common.openInbox")}
          </Link>
        </div>

        <p className="text-[11px] text-center pb-4" style={{ color: "var(--text-muted)" }}>
          {t("tracker.demoNote")}
        </p>
      </div>
    </DashboardLayout>
  );
}

