"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";
import { reviewJobs, type ReviewJob } from "@/app/lib/mock-data";
import { useI18n } from "@/app/lib/i18n";
import { useApplicationState } from "@/app/lib/application-state";
import { startAutomation, startAutomationForJob } from "@/app/lib/automation/orchestrator";
import {
  useDiscoveryState,
  getQueueOrder,
  getPendingCount,
  approveJob,
  declineJob,
  skipJob,
  clearDiscoveredJobs,
} from "@/app/lib/job-discovery/store";
import {
  useAutoDiscovery,
  runDiscoveryNow,
  isProfileSufficientForDiscovery,
} from "@/app/lib/job-discovery/scheduler";
import { useCandidateProfile } from "@/app/lib/candidate-profile";
import type { DiscoveredJob } from "@/app/lib/job-discovery/contracts";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Review Queue (automatic discovery)

   Discovery runs automatically (see lib/job-discovery/scheduler)
   when the profile is ready, no previous discovery has run, the
   last one is stale, preferences changed, or the queue is
   running low. There is no prominent manual scan button — a
   small "Check again" link only appears when discovery failed
   or the queue is empty.

   Swipe right / "Apply with ApplyMate" starts the background
   automation pipeline for the current card (discovered or the
   legacy mock queue). Discovered-job automation is keyed by the
   job's own stable id — see lib/automation/store.ts.
   ───────────────────────────────────────────────────────── */

const SWIPE_THRESHOLD = 90;

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── Unified card data ───────────────────────────────────── */
type CardKind =
  | { kind: "mock"; jobId: number; job: ReviewJob }
  | { kind: "discovered"; jobId: string; job: DiscoveredJob };

function useQueue() {
  const mockState    = useApplicationState();
  const discoveryState = useDiscoveryState();

  // Discovered jobs queue: pending first, skipped at back
  const discoveredQueue = getQueueOrder(discoveryState).map((id) => {
    const record = discoveryState.records.find((r) => r.job.id === id);
    return record?.job ?? null;
  }).filter(Boolean) as DiscoveredJob[];

  // Mock jobs queue (fallback / supplement)
  const mockQueue = mockState.state.queue.map((id) => ({
    id,
    job: reviewJobs[id],
  })).filter((x) => x.job != null);

  // Combine: discovered jobs first
  const combined: CardKind[] = [
    ...discoveredQueue.map((j): CardKind => ({ kind: "discovered", jobId: j.id, job: j })),
    ...mockQueue.map((x): CardKind => ({ kind: "mock", jobId: x.id, job: x.job })),
  ];

  return {
    combined,
    mockState,
    discoveryState,
    discoveredQueueLength: discoveredQueue.length,
    mockQueueLength: mockQueue.length,
    totalCount:
      mockState.totalCount +
      discoveryState.records.filter((r) => r.decision !== "declined").length,
    handledCount:
      mockState.handledCount +
      discoveryState.records.filter((r) => r.decision === "approved" || r.decision === "declined").length,
  };
}

export default function ReviewQueuePage() {
  const [swipeAnim, setSwipeAnim]     = useState<string | null>(null);
  const [statusMsg, setStatusMsg]     = useState<{ text: string; color: string } | null>(null);
  const [cardKey, setCardKey]         = useState(0);
  const [automationStarted, setAutomationStarted] = useState<{ role: string; company: string } | null>(null);
  const [dragX, setDragX]             = useState(0);
  const [manualCheckState, setManualCheckState] = useState<"idle" | "checking" | "error">("idle");
  const touchStartX = useRef<number | null>(null);
  const { t } = useI18n();
  const profile = useCandidateProfile();

  // Automatic discovery — checks eligibility on mount / profile change,
  // runs at most once, guarded against duplicate concurrent requests.
  useAutoDiscovery();

  const {
    combined,
    mockState,
    discoveredQueueLength,
    totalCount,
    handledCount,
    discoveryState,
  } = useQueue();

  const currentCard = combined.length > 0 ? combined[0] : null;
  const isAnimating = !!swipeAnim;
  const discoveryMeta = discoveryState.meta;
  const pendingDiscovered = getPendingCount(discoveryState);
  const profileReady = isProfileSufficientForDiscovery(profile);

  /* ── Manual "check again" — explicit, subtle, rate-limited by the scheduler ── */
  const handleManualCheck = useCallback(async () => {
    if (manualCheckState === "checking") return;
    setManualCheckState("checking");
    try {
      await runDiscoveryNow(profile);
      setManualCheckState("idle");
    } catch {
      setManualCheckState("error");
    }
  }, [manualCheckState, profile]);

  /* ── Advance to next card ──────────────────────────────── */
  const advanceToNext = useCallback(
    (action: "declined" | "skipped" | "approved") => {
      if (isAnimating || !currentCard) return;

      const animClass =
        action === "declined" ? "animate-swipe-left" :
        action === "approved" ? "animate-swipe-right" :
        "animate-swipe-down";

      const msgs = {
        declined: { text: t("queue.declined"), color: "#f87171" },
        skipped:  { text: t("queue.skipped"),  color: "#fde047" },
        approved: null,
      };

      setSwipeAnim(animClass);
      if (msgs[action]) setStatusMsg(msgs[action]);

      setTimeout(() => {
        if (currentCard.kind === "discovered") {
          const { jobId, job } = currentCard;
          if (action === "approved") {
            approveJob(jobId);
            // The discovered job's own id IS the automation job's stable key —
            // no hashing, no separate registry to keep in sync.
            startAutomationForJob({
              key: job.id,
              sourceJobId: job.id,
              isFromDiscovery: true,
              role: job.role,
              company: job.company,
              jobDescription: job.jobDescription,
              applyUrl: job.applyUrl || null,
              provider: job.provider,
              sourceLabel: job.sourceLabel,
            });
            setAutomationStarted({ role: job.role, company: job.company });
          } else if (action === "declined") {
            declineJob(jobId);
          } else {
            skipJob(jobId);
          }
        } else {
          // Mock job
          const { jobId, job } = currentCard;
          if (action === "approved") {
            mockState.approve(jobId);
            startAutomation(jobId);
            setAutomationStarted({ role: job.role, company: job.company });
          } else if (action === "declined") {
            mockState.decline(jobId);
          } else {
            mockState.skip(jobId);
          }
        }

        setSwipeAnim(null);
        setCardKey((k) => k + 1);
      }, 500);

      setTimeout(() => setStatusMsg(null), 2600);
    },
    [isAnimating, currentCard, mockState, t]
  );

  /* ── Touch swipe ───────────────────────────────────────── */
  const dragXRef = useRef(0);
  function handleTouchStart(e: React.TouchEvent) {
    if (isAnimating) return;
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const x = e.touches[0].clientX - touchStartX.current;
    dragXRef.current = x;
    setDragX(x);
  }
  function handleTouchEnd() {
    if (touchStartX.current === null) return;
    const x = dragXRef.current;
    touchStartX.current = null;
    dragXRef.current = 0;
    setDragX(0);
    if (x > SWIPE_THRESHOLD) advanceToNext("approved");
    else if (x < -SWIPE_THRESHOLD) advanceToNext("declined");
  }

  function resetQueue() {
    mockState.reset();
    clearDiscoveredJobs();
    setCardKey((k) => k + 1);
    setStatusMsg(null);
    setSwipeAnim(null);
  }

  /* ── Keyboard shortcuts ────────────────────────────────── */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (isAnimating || !currentCard) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft")  { e.preventDefault(); advanceToNext("declined"); }
      if (e.key === "ArrowRight") { e.preventDefault(); advanceToNext("approved"); }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { e.preventDefault(); advanceToNext("skipped"); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isAnimating, currentCard, advanceToNext]);

  /* ── Profile not ready yet — discovery can't run, say so plainly ── */
  if (!profileReady) {
    return (
      <DashboardLayout activeNavId="review">
        <div className="max-w-3xl mx-auto">
          <div className="dash-panel p-10 text-center" style={{ borderStyle: "dashed" }}>
            <p className="text-3xl mb-3">📝</p>
            <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              Complete your profile to start finding matches
            </p>
            <p className="text-[13px] mb-6 max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
              ApplyMate needs your target roles and technical skills before it can look for suitable jobs.
            </p>
            <Link href="/profile" className="dash-btn dash-btn--primary">
              Go to Profile
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeNavId="review">
      <div className="max-w-3xl mx-auto">

        {/* ── Page intro ─────────────────── */}
        <div className="mb-4">
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {t("queue.intro")}
          </p>
        </div>

        {/* ── Discovery status line — honest, unobtrusive ── */}
        <DiscoveryStatusLine
          meta={discoveryMeta}
          manualCheckState={manualCheckState}
          onManualCheck={handleManualCheck}
        />

        {/* ── Demo notice ─────────────────────── */}
        {discoveredQueueLength > 0 && discoveryMeta.lastResultSummary?.isDemo !== false && (
          <div
            className="rounded-md px-3 py-2 mb-4 text-[11px] flex items-center gap-2"
            style={{ background: "rgba(250,204,21,0.04)", border: "1px solid rgba(250,204,21,0.12)", color: "var(--text-muted)" }}
          >
            <span>🧪</span>
            <span>{t("discovery.demoNotice")}</span>
          </div>
        )}
        {discoveredQueueLength > 0 && discoveryMeta.lastResultSummary?.isDemo === false && (
          <div
            className="rounded-md px-3 py-2 mb-4 text-[11px] flex items-center gap-2"
            style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", color: "var(--text-muted)" }}
          >
            <span>✓</span>
            <span>Showing live postings from {discoveryMeta.lastResultSummary.providerLabel}.</span>
          </div>
        )}

        {/* ── Progress ───────────────────────── */}
        {currentCard && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[12px] font-medium tabular-nums" style={{ color: "var(--text-secondary)" }}>
              {t("queue.progress", { i: Math.min(handledCount + 1, Math.max(totalCount, 1)), n: Math.max(totalCount, 1) })}
            </span>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(Math.min(handledCount + 1, Math.max(totalCount, 1)) / Math.max(totalCount, 1)) * 100}%`,
                  background: "linear-gradient(90deg, #2563eb, #22d3ee)",
                }}
              />
            </div>
          </div>
        )}

        {/* ── Keyboard hints ─────────────────── */}
        {currentCard && (
          <div
            className="hidden sm:flex items-center justify-center gap-4 mb-4 py-1.5 rounded-lg text-[11px]"
            style={{ background: "rgba(59,130,246,0.03)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <span>← <span className="font-medium" style={{ color: "#f87171" }}>{t("common.decline")}</span></span>
            <span className="opacity-30">|</span>
            <span>↓ / S  <span className="font-medium" style={{ color: "#fde047" }}>{t("common.skip")}</span></span>
            <span className="opacity-30">|</span>
            <span>→ <span className="font-medium" style={{ color: "#4ade80" }}>{t("common.approve")}</span></span>
          </div>
        )}

        {/* ── Status feedback pill ────────────── */}
        {statusMsg && (
          <div
            className="rounded-lg px-4 py-2.5 mb-4 text-center text-[12px] font-semibold animate-fade-up"
            style={{
              background: statusMsg.color === "#4ade80" ? "rgba(34,197,94,0.08)" :
                           statusMsg.color === "#f87171" ? "rgba(248,113,113,0.08)" :
                           "rgba(250,204,21,0.06)",
              color: statusMsg.color,
              border: `1px solid ${statusMsg.color}22`,
            }}
          >
            {statusMsg.text}
          </div>
        )}

        {/* ── Automation-started banner ───────── */}
        {automationStarted && (
          <div
            className="rounded-lg px-4 py-3 mb-4 flex items-center gap-3 flex-wrap animate-fade-up"
            style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}
          >
            <span className="text-base">🤖</span>
            <p className="text-[12px] flex-1 min-w-[200px]" style={{ color: "var(--text-secondary)" }}>
              <span className="font-semibold" style={{ color: "#4ade80" }}>ApplyMate is preparing your application</span>
              {" "}for {automationStarted.role} at {automationStarted.company}. You can continue reviewing other jobs.
            </p>
            <Link href="/tracker" className="dash-btn dash-btn--outline text-[12px] flex-shrink-0">
              View progress
            </Link>
          </div>
        )}

        {/* ── Card / empty states ─────────────── */}
        {currentCard ? (
          <div
            key={cardKey}
            className={swipeAnim ?? (dragX !== 0 ? undefined : "animate-card-enter")}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: dragX !== 0 ? `translateX(${dragX}px) rotate(${dragX / 40}deg)` : undefined,
              transition: dragX !== 0 ? "none" : "transform 0.2s ease-out",
              touchAction: "pan-y",
            }}
          >
            {dragX !== 0 && (
              <div
                className="text-center text-[12px] font-bold mb-2 rounded-lg py-1.5"
                style={{
                  background: dragX > 0 ? "rgba(34,197,94,0.08)" : "rgba(248,113,113,0.08)",
                  color: dragX > 0 ? "#4ade80" : "#f87171",
                  border: `1px solid ${dragX > 0 ? "rgba(34,197,94,0.2)" : "rgba(248,113,113,0.2)"}`,
                  opacity: Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1),
                }}
              >
                {dragX > 0 ? "→ Apply with ApplyMate" : "← Decline"}
              </div>
            )}

            {currentCard.kind === "discovered" ? (
              <DiscoveredJobCard
                job={currentCard.job}
                disabled={isAnimating}
                onApprove={() => advanceToNext("approved")}
                onDecline={() => advanceToNext("declined")}
                onSkip={() => advanceToNext("skipped")}
              />
            ) : (
              <MockReviewCard
                job={currentCard.job}
                jobIdx={currentCard.jobId}
                wasSkipped={mockState.state.skipped.includes(currentCard.jobId)}
                disabled={isAnimating}
                onApprove={() => advanceToNext("approved")}
                onDecline={() => advanceToNext("declined")}
                onSkip={() => advanceToNext("skipped")}
              />
            )}
          </div>
        ) : (
          <EmptyQueueState
            meta={discoveryMeta}
            pendingDiscovered={pendingDiscovered}
            manualCheckState={manualCheckState}
            onManualCheck={handleManualCheck}
            onReset={resetQueue}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

/* ── Discovery status line — compact, honest, no jargon ──── */
function DiscoveryStatusLine({
  meta,
  manualCheckState,
  onManualCheck,
}: {
  meta: ReturnType<typeof useDiscoveryState>["meta"];
  manualCheckState: "idle" | "checking" | "error";
  onManualCheck: () => void;
}) {
  if (meta.status === "running" || manualCheckState === "checking") {
    return (
      <div className="flex items-center gap-2 mb-4 text-[12px]" style={{ color: "var(--text-secondary)" }}>
        <span className="analyze-spinner" style={{ width: 12, height: 12 }} />
        <span>Checking for new jobs…</span>
      </div>
    );
  }

  if (meta.status === "error" || manualCheckState === "error") {
    return (
      <div className="flex items-center gap-2 mb-4 text-[12px] flex-wrap" style={{ color: "#fb923c" }}>
        <span>⚠️ We couldn&rsquo;t check for new jobs right now.</span>
        <button type="button" className="font-semibold underline" onClick={onManualCheck} style={{ color: "#fb923c" }}>
          Try again
        </button>
      </div>
    );
  }

  if (meta.status === "partial-error") {
    return (
      <div className="flex items-center gap-2 mb-4 text-[12px] flex-wrap" style={{ color: "var(--text-muted)" }}>
        <span>⚠️ Some job sources had trouble, but we still found matches.</span>
        <button type="button" className="font-semibold underline" onClick={onManualCheck} style={{ color: "#93c5fd" }}>
          Check again
        </button>
      </div>
    );
  }

  if (meta.lastDiscoveryAt) {
    return (
      <div className="flex items-center justify-between gap-2 mb-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
        <span>Last checked {formatRelativeTime(meta.lastDiscoveryAt)}. We&rsquo;ll refresh your matches automatically while you use ApplyMate.</span>
        <button type="button" className="font-medium underline flex-shrink-0" onClick={onManualCheck} style={{ color: "var(--text-muted)" }}>
          Check again
        </button>
      </div>
    );
  }

  return null;
}

/* ── Empty queue state — distinguishes every honest reason ── */
function EmptyQueueState({
  meta,
  pendingDiscovered,
  manualCheckState,
  onManualCheck,
  onReset,
}: {
  meta: ReturnType<typeof useDiscoveryState>["meta"];
  pendingDiscovered: number;
  manualCheckState: "idle" | "checking" | "error";
  onManualCheck: () => void;
  onReset: () => void;
}) {
  const { t } = useI18n();
  const isChecking = meta.status === "running" || manualCheckState === "checking";
  const hasFailed = meta.status === "error" || manualCheckState === "error";

  let icon = "✅";
  let title = t("queue.complete");
  let desc = t("queue.completeDesc");

  if (isChecking) {
    icon = "🔎";
    title = "Finding matches for you…";
    desc = "ApplyMate is checking your configured job sources for new openings that fit your profile.";
  } else if (hasFailed) {
    icon = "⚠️";
    title = "We couldn't check for new jobs";
    desc = "Something went wrong while looking for matches. You can try again, or wait — ApplyMate will retry automatically.";
  } else if (pendingDiscovered === 0 && meta.lastDiscoveryAt) {
    icon = "🔍";
    title = "No suitable matches right now";
    desc = "ApplyMate didn't find any new jobs above your match threshold. Try widening your preferences, or check back later.";
  }

  return (
    <div className="dash-panel p-10 text-center animate-card-enter" style={{ borderStyle: "dashed" }}>
      <p className="text-3xl mb-3">{icon}</p>
      <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>{title}</p>
      <p className="text-[13px] mb-6 max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {desc}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {!isChecking && (
          <button
            id="btn-check-again"
            className="dash-btn dash-btn--outline"
            onClick={onManualCheck}
          >
            {hasFailed ? "Try again" : "↻ Check again"}
          </button>
        )}
        <Link href="/tracker" className="dash-btn dash-btn--outline">
          {t("queue.openTracker")}
        </Link>
        <Link href="/dashboard" className="dash-btn dash-btn--ghost">
          {t("queue.backToControlCenter")}
        </Link>
        <button className="dash-btn dash-btn--ghost" onClick={onReset}>
          {t("demo.reset")}
        </button>
      </div>
    </div>
  );
}

/* ── Discovered Job Card ─────────────────────────────────── */
function DiscoveredJobCard({
  job,
  disabled,
  onApprove,
  onDecline,
  onSkip,
}: {
  job: DiscoveredJob;
  disabled: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onSkip: () => void;
}) {
  const { t } = useI18n();
  const matchColor =
    job.matchLabel === "Strong match" ? "#4ade80" :
    job.matchLabel === "Good match"   ? "#60a5fa" :
    "#fde047";

  const remoteEmoji =
    job.remoteType === "remote"  ? "🌐" :
    job.remoteType === "hybrid"  ? "🏠" :
    job.remoteType === "onsite"  ? "🏢" : "📍";

  return (
    <div className="dash-review-card">
      {/* Header hints */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
          ← {t("common.decline")}
        </span>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={job.isDemo
            ? { background: "rgba(250,204,21,0.08)", color: "#fde047", border: "1px solid rgba(250,204,21,0.2)" }
            : { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }
          }
        >
          {job.isDemo ? "🧪 Demo" : "✓ Live"} · {job.sourceLabel}
        </span>
        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
          Apply with ApplyMate →
        </span>
      </div>

      <p className="text-[12px] text-center mb-4" style={{ color: "var(--text-muted)" }}>
        Swipe right or tap <span style={{ color: "#4ade80", fontWeight: 600 }}>Apply with ApplyMate</span>. We&rsquo;ll prepare the application for you.
      </p>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Job details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}>
              {job.company[0]}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{job.role}</h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {job.company} · {remoteEmoji} {job.location}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {job.employmentType} · {job.salaryRange || "Salary not listed"}
              </p>
            </div>
          </div>

          {/* Why it fits */}
          {job.matchReasons.length > 0 && (
            <div className="rounded-lg p-3.5 mb-4" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#60a5fa" }}>{t("queue.whyFits")}</p>
              <ul className="space-y-1">
                {job.matchReasons.map((r, i) => (
                  <li key={i} className="text-[12px] flex items-start gap-1.5" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "#4ade80", flexShrink: 0 }}>✓</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cautions */}
          {job.cautionReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {job.cautionReasons.map((c, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded-md"
                  style={{ background: "rgba(251,146,60,0.06)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.12)" }}
                >
                  ⚠ {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score ring */}
        <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-subtle)" strokeWidth="9" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={`url(#discovScoreGrad-${job.id.replace(/[^a-z0-9]/gi, "")})`}
                strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52 * (job.matchScore / 100)} ${2 * Math.PI * 52}`}
                className="score-ring"
              />
              <defs>
                <linearGradient id={`discovScoreGrad-${job.id.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold gradient-text leading-none">{job.matchScore}</span>
              <span className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>/ 100</span>
            </div>
          </div>
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: matchColor === "#4ade80" ? "rgba(34,197,94,0.1)" : matchColor === "#60a5fa" ? "rgba(96,165,250,0.1)" : "rgba(250,204,21,0.1)",
              color: matchColor,
              border: `1px solid ${matchColor}26`,
            }}
          >
            {job.matchLabel}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-4 mt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button
          className="text-[11px] font-medium"
          style={{ color: "var(--text-muted)" }}
          onClick={onDecline}
          disabled={disabled}
        >
          {t("queue.declineBtn")}
        </button>
        <div className="flex-1" />
        <button className="dash-btn dash-btn--ghost" onClick={onSkip} disabled={disabled}>{t("queue.skipBtn")}</button>
        {job.applyUrl && job.applyUrl !== "#demo-job" ? (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dash-btn dash-btn--outline"
            style={{ pointerEvents: disabled ? "none" : "auto", opacity: disabled ? 0.5 : 1 }}
          >
            View posting ↗
          </a>
        ) : null}
        <button className="dash-btn dash-btn--primary" onClick={onApprove} disabled={disabled}>Apply with ApplyMate →</button>
      </div>
      <p className="text-[10px] text-center mt-3" style={{ color: "var(--text-muted)" }}>
        🔒 {t("common.nothingSubmitted")}
      </p>
    </div>
  );
}

/* ── Mock Review Card (unchanged from original) ─────────── */
function MockReviewCard({
  job,
  jobIdx,
  wasSkipped,
  disabled,
  onApprove,
  onDecline,
  onSkip,
}: {
  job: ReviewJob;
  jobIdx: number;
  wasSkipped: boolean;
  disabled: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onSkip: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="dash-review-card">
      {/* Swipe direction hints */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
          ← {t("common.decline")}
        </span>
        {wasSkipped && (
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "rgba(250,204,21,0.06)", color: "#fde047", border: "1px solid rgba(250,204,21,0.15)" }}
          >
            {t("queue.skipped")}
          </span>
        )}
        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
          Apply with ApplyMate →
        </span>
      </div>

      <p className="text-[12px] text-center mb-4" style={{ color: "var(--text-muted)" }}>
        Swipe right or tap <span style={{ color: "#4ade80", fontWeight: 600 }}>Apply with ApplyMate</span>. We&rsquo;ll prepare the application for you.
      </p>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Job details */}
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
            <p className="text-[11px] font-semibold mb-1" style={{ color: "#60a5fa" }}>{t("queue.whyFits")}</p>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{job.whyFits}</p>
          </div>

          <div className="flex flex-wrap gap-5 mb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>{t("queue.matches")}</p>
              <div className="flex flex-wrap gap-1.5">
                {job.matches.map((s) => <span key={s} className="skill-chip skill-chip--match">{s}</span>)}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>{t("queue.gaps")}</p>
              <div className="flex flex-wrap gap-1.5">
                {job.gaps.map((s) => <span key={s} className="skill-chip skill-chip--missing">{s}</span>)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {job.materials.map((m) => (
              <span key={m.labelKey} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: "rgba(34,197,94,0.06)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.12)" }}>
                {m.icon} {t(m.labelKey)}
              </span>
            ))}
          </div>
        </div>

        {/* Score ring */}
        <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-subtle)" strokeWidth="9" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#rqScoreGrad)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 52 * (job.score / 100)} ${2 * Math.PI * 52}`} className="score-ring" />
              <defs>
                <linearGradient id="rqScoreGrad" x1="0" y1="0" x2="1" y2="1">
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
            {job.score >= 85 ? t("common.strongMatch") : t("common.goodMatch")}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-4 mt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button
          className="text-[11px] font-medium"
          style={{ color: "var(--text-muted)" }}
          onClick={onDecline}
          disabled={disabled}
        >
          {t("queue.declineBtn")}
        </button>
        <div className="flex-1" />
        <button className="dash-btn dash-btn--ghost" onClick={onSkip} disabled={disabled}>{t("queue.skipBtn")}</button>
        <Link href={`/review?job=${jobIdx}`} className="dash-btn dash-btn--outline" style={{ pointerEvents: disabled ? "none" : "auto", opacity: disabled ? 0.5 : 1 }}>View details</Link>
        <button className="dash-btn dash-btn--primary" onClick={onApprove} disabled={disabled}>Apply with ApplyMate →</button>
      </div>

      <p className="text-[10px] text-center mt-3" style={{ color: "var(--text-muted)" }}>
        🔒 {t("common.nothingSubmitted")}
      </p>
    </div>
  );
}
