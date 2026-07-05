"use client";

import { useState } from "react";
import { useI18n } from "@/app/lib/i18n";

/* ─────────────────────────────────────────────────────────
   Pro waitlist button (landing page).
   Demo-only: records interest locally, no backend involved.
   ───────────────────────────────────────────────────────── */

export default function WaitlistButton() {
  const [joined, setJoined] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <button
        id="pricing-pro-btn"
        onClick={() => setJoined(true)}
        disabled={joined}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
        style={
          joined
            ? {
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
                color: "#4ade80",
                cursor: "default",
              }
            : {
                border: "1px solid var(--border-mid)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }
        }
      >
        {joined ? t("landing.price.interestNoted") : t("landing.price.joinWaitlist")}
      </button>
      <p className="mt-2 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
        {joined ? t("landing.price.waitlistDemo") : t("landing.price.noCommitment")}
      </p>
    </>
  );
}
