"use client";

import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";
import {
  trackerApps,
  trackerStageMeta,
  trackerStageOrder,
  type TrackerStage,
} from "@/app/lib/mock-data";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Application Tracker
   Pipeline view of every approved application:
   Applied → Reply pending → Follow-up due → Interview → Archived
   ───────────────────────────────────────────────────────── */

export default function TrackerPage() {
  const activeCount = trackerApps.filter((a) => a.stage !== "archived").length;

  return (
    <DashboardLayout
      activeNavId="tracker"
      pageTitle="Application Tracker"
      topBarRight={
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          {activeCount} active applications
        </span>
      }
    >
      <div className="max-w-[1120px] mx-auto flex flex-col gap-5">

        {/* ── Page intro ─────────────────── */}
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Every application you approve lands here. Track its stage, see the latest event, and act on the next step.
        </p>

        {/* ── Stage summary ──────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {trackerStageOrder.map((stage) => {
            const meta = trackerStageMeta[stage];
            const n = countStage(stage);
            return (
              <div key={stage} className="dash-stat-card flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
                <div>
                  <p className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{n}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{meta.label}</p>
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
                  <span className="text-[12px] font-bold flex-1" style={{ color: "var(--text-primary)" }}>{meta.label}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                  >
                    {apps.length}
                  </span>
                </div>

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
                {apps.length === 0 && (
                  <div
                    className="rounded-xl px-3 py-6 text-center text-[11px]"
                    style={{ border: "1px dashed var(--border-mid)", color: "var(--text-muted)" }}
                  >
                    Nothing here yet
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
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>4 applications are waiting for your approval</span>{" "}
            in the review queue — approved ones appear here.
          </p>
          <Link href="/review-queue" className="dash-btn dash-btn--primary flex-shrink-0">
            Open Review Queue →
          </Link>
          <Link href="/inbox" className="dash-btn dash-btn--outline flex-shrink-0">
            📬 Open Inbox
          </Link>
        </div>

        <p className="text-[11px] text-center pb-4" style={{ color: "var(--text-muted)" }}>
          This is a demo preview with mock applications. Statuses will update automatically once real tracking is live.
        </p>
      </div>
    </DashboardLayout>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function countStage(stage: TrackerStage) {
  return trackerApps.filter((a) => a.stage === stage).length;
}
