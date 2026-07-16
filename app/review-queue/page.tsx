"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";
import { reviewJobs, type ReviewJob } from "@/app/lib/mock-data";
import { useI18n } from "@/app/lib/i18n";
import { useApplicationState } from "@/app/lib/application-state";
import { startAutomation } from "@/app/lib/automation/orchestrator";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Review Queue (automation-first)

   Swipe right / "Apply with ApplyMate" approves the job AND
   starts the background application pipeline — the user does
   not generate anything manually afterwards.

   Queue order and decisions live in the shared demo state
   (localStorage): approve/decline remove the job from the
   queue, skip moves it to the back. The card shown is
   always queue[0].
   ───────────────────────────────────────────────────────── */

const SWIPE_THRESHOLD = 90;

export default function ReviewQueuePage() {
  const [swipeAnim, setSwipeAnim] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; color: string } | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [automationStarted, setAutomationStarted] = useState<{ role: string; company: string } | null>(null);
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const { t } = useI18n();
  const { state, approve, decline, skip, reset, handledCount, totalCount } = useApplicationState();

  const currentJobId = state.queue.length > 0 ? state.queue[0] : null;
  const currentReview = currentJobId !== null ? reviewJobs[currentJobId] : null;
  const isAnimating = !!swipeAnim;

  const advanceToNext = useCallback((action: "declined" | "skipped" | "approved") => {
    if (isAnimating || currentJobId === null) return;

    const animClass =
      action === "declined" ? "animate-swipe-left" :
      action === "approved" ? "animate-swipe-right" :
      "animate-swipe-down";

    const msgs = {
      declined: { text: t("queue.declined"), color: "#f87171" },
      skipped:  { text: t("queue.skipped"), color: "#fde047" },
      approved: null, // the persistent "automationStarted" banner covers this — avoid showing two messages at once
    };

    setSwipeAnim(animClass);
    if (msgs[action]) setStatusMsg(msgs[action]);

    // Wait for exit animation, then apply the decision — the
    // store update swaps in the next card (queue[0] changes).
    setTimeout(() => {
      if (action === "approved") {
        const job = reviewJobs[currentJobId];
        approve(currentJobId);
        // Swipe right = start the full background application pipeline.
        startAutomation(currentJobId);
        setAutomationStarted({ role: job.role, company: job.company });
      } else if (action === "declined") decline(currentJobId);
      else skip(currentJobId);
      setSwipeAnim(null);
      setCardKey((k) => k + 1);
    }, 500);

    // Clear status message after a bit
    setTimeout(() => setStatusMsg(null), 2600);
  }, [isAnimating, currentJobId, approve, decline, skip, t]);

  /* ── Touch swipe gesture ──
     dragXRef mirrors dragX state: touchend must read the latest
     delta even when React batches the final touchmove update. */
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
    reset();
    setCardKey((k) => k + 1);
    setStatusMsg(null);
    setSwipeAnim(null);
  }

  /* Keyboard shortcuts */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (isAnimating || !currentReview) return;
      // Don't capture when user is typing in a textarea/input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowLeft")  { e.preventDefault(); advanceToNext("declined"); }
      if (e.key === "ArrowRight") { e.preventDefault(); advanceToNext("approved"); }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { e.preventDefault(); advanceToNext("skipped"); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isAnimating, currentReview, advanceToNext]);

  return (
    <DashboardLayout activeNavId="review">
      <div className="max-w-3xl mx-auto">

        {/* ── Page intro ─────────────────── */}
        <div className="mb-6">
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {t("queue.intro")}
          </p>
        </div>

        {/* ── Progress ───────────────────── */}
        {currentReview && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[12px] font-medium tabular-nums" style={{ color: "var(--text-secondary)" }}>
              {t("queue.progress", { i: Math.min(handledCount + 1, totalCount), n: totalCount })}
            </span>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(Math.min(handledCount + 1, totalCount) / totalCount) * 100}%`,
                  background: "linear-gradient(90deg, #2563eb, #22d3ee)",
                }}
              />
            </div>
            <div className="flex gap-1">
              {reviewJobs.map((_, i) => {
                const dotColor = state.approved.includes(i)
                  ? "#4ade80"
                  : state.declined.includes(i)
                  ? "#f87171"
                  : i === currentJobId
                  ? "#60a5fa"
                  : "var(--border-mid)";
                return (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      background: dotColor,
                      transform: i === currentJobId ? "scale(1.4)" : "scale(1)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── Keyboard hints ─────────────── */}
        {currentReview && (
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

        {/* ── Status feedback pill ────────── */}
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

        {/* ── Automation-started banner ───── */}
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

        {/* ── Card ───────────────────────── */}
        {currentReview && currentJobId !== null ? (
          <div
            key={cardKey}
            /* animate-card-enter uses fill-mode:forwards whose transform would
               override the drag transform — drop the class while dragging */
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
            {/* Swipe direction feedback overlay */}
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
            <ReviewCard
              job={currentReview}
              jobIdx={currentJobId}
              wasSkipped={state.skipped.includes(currentJobId)}
              disabled={isAnimating}
              onApprove={() => advanceToNext("approved")}
              onDecline={() => advanceToNext("declined")}
              onSkip={() => advanceToNext("skipped")}
            />
          </div>
        ) : (
          <div
            className="dash-panel p-10 text-center animate-card-enter"
            style={{ borderStyle: "dashed" }}
          >
            <p className="text-3xl mb-3">✅</p>
            <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>{t("queue.complete")}</p>
            <p className="text-[13px] mb-6 max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {t("queue.completeDesc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/tracker" className="dash-btn dash-btn--primary">
                {t("queue.openTracker")}
              </Link>
              <Link href="/dashboard" className="dash-btn dash-btn--outline">
                {t("queue.backToControlCenter")}
              </Link>
              <button className="dash-btn dash-btn--ghost" onClick={resetQueue}>
                {t("demo.reset")}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ── Review Card ─────────────────────────────────────────── */
function ReviewCard({
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

      {/* Helper copy — single line, no boxed banners */}
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

      {/* Actions — three clear choices: Skip, View details, Apply with ApplyMate.
          Decline stays available as a subtle text action so it isn't lost, but
          doesn't compete visually with the primary three. */}
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
