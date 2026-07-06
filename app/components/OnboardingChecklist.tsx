"use client";

import Link from "next/link";
import { useI18n } from "@/app/lib/i18n";
import { useApplicationState } from "@/app/lib/application-state";
import { useCvPreviewGenerated } from "@/app/lib/cv-preview-state";
import type { TKey } from "@/app/lib/translations";

/* ─────────────────────────────────────────────────────────
   Control Center onboarding checklist.
   Fully derived from existing state — no new storage:
   1. Profile      → complete by default (demo profile, 82%)
   2. Master CV    → applymate-cv-preview generated
   3. First review → any queue decision or skip exists
   4. Approve      → approved count > 0
   5. Tracker      → approved count > 0
   Collapses to a one-line strip when everything is done.
   ───────────────────────────────────────────────────────── */

export default function OnboardingChecklist() {
  const { t } = useI18n();
  const { state, handledCount, approvedCount } = useApplicationState();
  const cvGenerated = useCvPreviewGenerated();

  const reviewedAny = handledCount > 0 || state.skipped.length > 0;
  const approvedAny = approvedCount > 0;

  const steps: { labelKey: TKey; href: string; done: boolean; detail?: string }[] = [
    { labelKey: "onboard.step1", href: "/profile", done: true, detail: "82%" },
    { labelKey: "onboard.step2", href: "/profile", done: cvGenerated },
    { labelKey: "onboard.step3", href: "/review-queue", done: reviewedAny },
    { labelKey: "onboard.step4", href: "/review-queue", done: approvedAny },
    { labelKey: "onboard.step5", href: "/tracker", done: approvedAny },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const nextIdx = steps.findIndex((s) => !s.done);

  /* All done → compact success strip */
  if (nextIdx === -1) {
    return (
      <div
        className="rounded-lg px-4 py-2.5 flex items-center gap-2.5 text-[12px]"
        style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)", color: "#4ade80" }}
      >
        <span aria-hidden="true">✅</span>
        <span className="font-semibold">{t("onboard.done")}</span>
      </div>
    );
  }

  return (
    <section className="dash-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {t("onboard.title")}
        </h2>
        <span className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
          {doneCount}/{steps.length}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {steps.map((step, i) => {
          const isNext = i === nextIdx;
          return (
            <Link
              key={step.labelKey}
              href={step.href}
              className="flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors"
              style={{
                background: isNext ? "var(--blue-dim)" : "transparent",
                border: isNext ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
              }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={
                  step.done
                    ? { background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }
                    : { background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border-mid)" }
                }
              >
                {step.done ? "✓" : i + 1}
              </span>
              <span
                className="flex-1 text-[12px] font-medium"
                style={{ color: step.done ? "var(--text-muted)" : "var(--text-primary)" }}
              >
                {t(step.labelKey)}
                {step.detail && (
                  <span className="ml-1.5 font-bold" style={{ color: "#60a5fa" }}>{step.detail}</span>
                )}
              </span>
              {isNext && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)", color: "#fff" }}
                >
                  {t("onboard.next")}
                </span>
              )}
              <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>→</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
