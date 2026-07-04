"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";
import { reviewJobs, type ReviewJob } from "@/app/lib/mock-data";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Review Queue
   Dedicated page for reviewing prepared applications.
   Job data comes from the shared mock-data module.
   ───────────────────────────────────────────────────────── */

const reviewQueue = reviewJobs;

export default function ReviewQueuePage() {
  const [reviewIdx, setReviewIdx] = useState(0);
  const [swipeAnim, setSwipeAnim] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; color: string } | null>(null);
  const [cardKey, setCardKey] = useState(0);

  const currentReview = reviewIdx < reviewQueue.length ? reviewQueue[reviewIdx] : null;
  const total = reviewQueue.length;
  const isAnimating = !!swipeAnim;

  const advanceToNext = useCallback((action: "declined" | "skipped" | "approved") => {
    if (isAnimating) return;

    const animClass =
      action === "declined" ? "animate-swipe-left" :
      action === "approved" ? "animate-swipe-right" :
      "animate-swipe-down";

    const msgs = {
      declined: { text: "Declined · Next match loading", color: "#f87171" },
      skipped:  { text: "Skipped · Saved for later", color: "#fde047" },
      approved: { text: "Approved · Added to tracker", color: "#4ade80" },
    };

    setSwipeAnim(animClass);
    setStatusMsg(msgs[action]);

    // Wait for exit animation, then show next card
    setTimeout(() => {
      setSwipeAnim(null);
      setReviewIdx((i) => i + 1);
      setCardKey((k) => k + 1);
    }, 500);

    // Clear status message after a bit
    setTimeout(() => setStatusMsg(null), 2200);
  }, [isAnimating]);

  function resetQueue() {
    setReviewIdx(0);
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
    <DashboardLayout activeNavId="review" pageTitle="Review Queue">
      <div className="max-w-3xl mx-auto">

        {/* ── Page intro ─────────────────── */}
        <div className="mb-6">
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Approve, skip, or decline prepared applications before anything is submitted.
          </p>
        </div>

        {/* ── Progress ───────────────────── */}
        {currentReview && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[12px] font-medium tabular-nums" style={{ color: "var(--text-secondary)" }}>
              {reviewIdx + 1} of {total} applications
            </span>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((reviewIdx + 1) / total) * 100}%`,
                  background: "linear-gradient(90deg, #2563eb, #22d3ee)",
                }}
              />
            </div>
            <div className="flex gap-1">
              {reviewQueue.map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: i < reviewIdx ? "#4ade80" : i === reviewIdx ? "#60a5fa" : "var(--border-mid)",
                    transform: i === reviewIdx ? "scale(1.4)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Keyboard hints ─────────────── */}
        {currentReview && (
          <div
            className="hidden sm:flex items-center justify-center gap-4 mb-4 py-1.5 rounded-lg text-[11px]"
            style={{ background: "rgba(59,130,246,0.03)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <span>← <span className="font-medium" style={{ color: "#f87171" }}>Decline</span></span>
            <span className="opacity-30">|</span>
            <span>↓ / S  <span className="font-medium" style={{ color: "#fde047" }}>Skip</span></span>
            <span className="opacity-30">|</span>
            <span>→ <span className="font-medium" style={{ color: "#4ade80" }}>Approve</span></span>
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

        {/* ── Card ───────────────────────── */}
        {currentReview ? (
          <div key={cardKey} className={swipeAnim ?? "animate-card-enter"}>
            <ReviewCard
              job={currentReview}
              jobIdx={reviewIdx}
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
            <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Review queue complete</p>
            <p className="text-[13px] mb-6 max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
              ApplyMate will keep scanning for new high-match roles. You&apos;ll be notified when new applications are ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/dashboard" className="dash-btn dash-btn--primary">
                ← Back to Auto Apply
              </Link>
              <button className="dash-btn dash-btn--outline" onClick={resetQueue}>
                ↺ Review again
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
  disabled,
  onApprove,
  onDecline,
  onSkip,
}: {
  job: ReviewJob;
  jobIdx: number;
  disabled: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="dash-review-card">
      {/* Swipe direction hints */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
          ← Decline
        </span>
        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
          Approve →
        </span>
      </div>

      {/* AI context */}
      <div className="rounded-lg px-3 py-2 mb-4 flex items-center gap-2" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)" }}>
        <span className="text-sm">🤖</span>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          AI prepared this application because it <span className="font-semibold" style={{ color: "#60a5fa" }}>passed your {job.threshold}% match threshold</span>.
        </p>
      </div>

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
            {job.score >= 85 ? "Strong match" : "Good match"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-4 mt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button className="dash-btn dash-btn--ghost" onClick={onDecline} disabled={disabled}>✕ Decline</button>
        <button className="dash-btn dash-btn--ghost" onClick={onSkip} disabled={disabled}>⏭ Skip</button>
        <div className="flex-1" />
        <Link href={`/review?job=${jobIdx}`} className="dash-btn dash-btn--outline" style={{ pointerEvents: disabled ? "none" : "auto", opacity: disabled ? 0.5 : 1 }}>Review application →</Link>
        <button className="dash-btn dash-btn--primary" onClick={onApprove} disabled={disabled}>✓ Approve &amp; apply</button>
      </div>

      <p className="text-[10px] text-center mt-3 flex items-center justify-center gap-3" style={{ color: "var(--text-muted)" }}>
        <span>🔒 Nothing is submitted without your approval</span>
        <span>·</span>
        <span>Review before approving</span>
      </p>
    </div>
  );
}

