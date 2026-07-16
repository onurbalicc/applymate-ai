"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/app/lib/i18n";
import { useMasterCv, clearMasterCv } from "@/app/lib/master-cv-store";
import { generateMasterCvNow } from "@/app/lib/automation/orchestrator";

/* ─────────────────────────────────────────────────────────
   Master CV Preview — automation-first.

   The Master CV is an internal background capability: the
   automation orchestrator prepares it automatically the first
   time the user applies to a job (swipe right), and reuses
   the cached result afterwards.

   This component only shows its status and preview.
   "Prepare now" / "Regenerate" exist as secondary actions for
   advanced users — they are not the main flow.
   ───────────────────────────────────────────────────────── */

function ScoreRing({ pct, size = 72 }: { pct: number; size?: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const fill = (pct / 100) * circ;
  const color = pct >= 80 ? "#4ade80" : pct >= 65 ? "#60a5fa" : "#fb923c";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${fill} ${circ}`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

function PreviewLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
      {label}
    </p>
  );
}

export default function MasterCvPreview() {
  const { t } = useI18n();
  const masterCv = useMasterCv();

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expanded, setExpanded] = useState(false);

  async function handleRegenerate() {
    setBusy(true);
    setErrorMsg("");
    try {
      await generateMasterCvNow();
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setBusy(false);
    }
  }

  /* ── Busy state ── */
  if (busy) {
    return (
      <section>
        <h2 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          {t("profile.cvPreview.title")}
        </h2>
        <div className="dash-panel p-5 flex items-center gap-4">
          <span className="analyze-spinner" style={{ width: 24, height: 24 }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Preparing Master CV…</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Analysing your profile and structuring your CV foundation
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ── No cached CV — passive automation-first card ── */
  if (!masterCv) {
    return (
      <section>
        <h2 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          {t("profile.cvPreview.title")}
        </h2>
        <p className="text-[12px] leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
          {t("profile.cvPreview.intro")}
        </p>

        <div className="dash-panel p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl"
               style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)" }}>
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Prepared automatically — no action needed
            </p>
            <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              ApplyMate prepares your Master CV automatically the first time you apply to a job,
              and reuses it for every application afterwards. Swipe right on a job in the Review
              Queue and it happens in the background.
            </p>
            {errorMsg && (
              <p className="text-[12px] mb-2" style={{ color: "#f87171" }}>
                Preparation failed: {errorMsg}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/review-queue" className="dash-btn dash-btn--primary text-[12px]">
                Open Review Queue
              </Link>
              <button
                id="cv-preview-generate-btn"
                className="dash-btn dash-btn--ghost text-[12px]"
                style={{ color: "var(--text-muted)" }}
                onClick={handleRegenerate}
              >
                Prepare now (optional)
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── Cached CV — status + preview ── */
  const result = masterCv.result;

  return (
    <section>
      <h2 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        {t("profile.cvPreview.title")}
      </h2>
      <p className="text-[12px] leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
        {t("profile.cvPreview.intro")}
      </p>

      <div className="flex flex-col gap-4">

        {/* Status / source + last prepared date */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] flex-wrap"
             style={masterCv.isMock
               ? { background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.15)", color: "#ca8a04" }
               : { background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", color: "#4ade80" }
             }>
          <span>{masterCv.isMock ? "⚡" : "✓"}</span>
          <span>
            {masterCv.isMock ? "Demo fallback. " : "Generated by Gemini AI. "}
            Prepared automatically and reused for all your applications.
            {masterCv.generatedAt && ` Last prepared ${new Date(masterCv.generatedAt).toLocaleDateString()}.`}
          </span>
        </div>

        {errorMsg && (
          <div className="px-4 py-3 rounded-xl text-[12px]"
               style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
            <span className="font-semibold">Regeneration failed: </span>{errorMsg}
          </div>
        )}

        {/* CV Readiness Score — the compact default view */}
        <div className="dash-panel p-4 flex items-start gap-4">
          <ScoreRing pct={result.readinessScore} />
          <div className="flex-1 min-w-0">
            <PreviewLabel label={t("profile.cvPreview.readinessTitle")} />
            <p className="text-sm font-bold mb-1"
               style={{ color: result.readinessScore >= 80 ? "#4ade80" : result.readinessScore >= 65 ? "#60a5fa" : "#fb923c" }}>
              {result.readinessScore >= 80
                ? "Strong — ready to apply"
                : result.readinessScore >= 65
                ? "Good — a few improvements will help"
                : "Needs work — address key gaps first"}
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {result.headline}
            </p>
          </div>
        </div>

        <button
          id="cv-preview-view-toggle"
          className="dash-btn dash-btn--outline text-[12px] self-start"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide preview" : "View preview"}
        </button>

        {expanded && (
          <div className="flex flex-col gap-4">
            {/* Professional Summary */}
            <div className="dash-panel p-4">
              <PreviewLabel label={t("profile.cvPreview.summaryTitle")} />
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {result.professionalSummary}
              </p>
            </div>

            {/* Experience Bullets */}
            {result.experienceBullets.length > 0 && (
              <div className="dash-panel p-4">
                <PreviewLabel label={t("profile.cvPreview.experienceTitle")} />
                <ul className="flex flex-col gap-2">
                  {result.experienceBullets.flatMap((eb) =>
                    eb.bullets.map((bullet, i) => (
                      <li key={`${eb.experienceId}-${i}`} className="flex items-start gap-2.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        <span className="flex-shrink-0 w-1 h-1 rounded-full mt-[7px]" style={{ background: "#60a5fa" }} />
                        {bullet}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}

            {/* Project Bullets */}
            {result.projectBullets.length > 0 && (
              <div className="dash-panel p-4">
                <PreviewLabel label="Projects" />
                <ul className="flex flex-col gap-2">
                  {result.projectBullets.flatMap((pb) =>
                    pb.bullets.map((bullet, i) => (
                      <li key={`${pb.projectId}-${i}`} className="flex items-start gap-2.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        <span className="flex-shrink-0 w-1 h-1 rounded-full mt-[7px]" style={{ background: "#22d3ee" }} />
                        {bullet}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}

            {/* Grouped Skills */}
            {(result.skills.languages.length > 0 ||
              result.skills.dataAndAI.length > 0 ||
              result.skills.toolsAndPlatforms.length > 0 ||
              result.skills.other.length > 0) && (
              <div className="dash-panel p-4">
                <PreviewLabel label={t("profile.cvPreview.skillsTitle")} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { category: "Programming Languages", skills: result.skills.languages },
                    { category: "Data & AI", skills: result.skills.dataAndAI },
                    { category: "Tools & Platforms", skills: result.skills.toolsAndPlatforms },
                    { category: "Other", skills: result.skills.other },
                  ]
                    .filter((g) => g.skills.length > 0)
                    .map((group) => (
                      <div key={group.category}>
                        <p className="text-[10px] font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
                          {group.category}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {group.skills.map((s) => (
                            <span key={s} className="skill-chip skill-chip--match text-[10px]">{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Profile Gaps */}
            {result.gaps.length > 0 && (
              <div className="dash-panel p-4">
                <PreviewLabel label={t("profile.cvPreview.gapsTitle")} />
                <div className="flex flex-col gap-2">
                  {result.gaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                      <span className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold mt-0.5"
                            style={{ background: "rgba(251,146,60,0.07)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.15)" }}>!</span>
                      {gap}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Improvements */}
            {result.improvementSuggestions.length > 0 && (
              <div className="dash-panel p-4">
                <PreviewLabel label={t("profile.cvPreview.improvementsTitle")} />
                <ol className="flex flex-col gap-2.5">
                  {result.improvementSuggestions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                      <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}>
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
             style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-[12px] leading-relaxed flex-1" style={{ color: "var(--text-secondary)" }}>
            {t("profile.cvPreview.relationshipNote")}
          </p>
          <Link href="/review-queue" id="cv-preview-open-queue"
                className="dash-btn dash-btn--primary text-[12px] flex-shrink-0">
            {t("profile.cvPreview.openQueue")}
          </Link>
        </div>

        {/* Regenerate / Reset — subtle, secondary, plain text links */}
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <button id="cv-preview-regenerate-btn" style={{ color: "var(--text-muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                  onClick={handleRegenerate}>
            {t("profile.cvPreview.regenerateBtn")}
          </button>
          <span style={{ color: "var(--border-mid)" }}>·</span>
          <button id="cv-preview-reset-btn" style={{ color: "var(--text-muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                  onClick={() => clearMasterCv()}>
            {t("profile.cvPreview.resetBtn")}
          </button>
        </div>

      </div>
    </section>
  );
}
