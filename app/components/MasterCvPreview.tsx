"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useI18n } from "@/app/lib/i18n";

/* ─────────────────────────────────────────────────────────
   Master CV Preview — frontend-only mock.
   State persisted in localStorage under "applymate-cv-preview".

   Uses the same useSyncExternalStore pattern as lib/i18n and
   lib/application-state: the server snapshot returns false,
   so prerendered HTML hydrates cleanly (un-generated state),
   then re-renders to the stored client value right after
   hydration — no hydration mismatch, no setState-in-effect.

   Real AI generation will be connected in a future step.
   ───────────────────────────────────────────────────────── */

const LS_KEY = "applymate-cv-preview";

interface CvPreviewState {
  generated: boolean;
  generatedAt: string;
}

/* ── Module-level store (same shape as i18n / application-state) ── */

let cachedGenerated: boolean | null = null;
const cvListeners = new Set<() => void>();

function readGenerated(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<CvPreviewState>;
    return parsed.generated === true;
  } catch {
    return false;
  }
}

function writeGenerated(value: boolean) {
  cachedGenerated = value;
  try {
    if (value) {
      const state: CvPreviewState = { generated: true, generatedAt: new Date().toISOString() };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  } catch {
    /* localStorage unavailable — keep in-memory value */
  }
  cvListeners.forEach((cb) => cb());
}

const cvStore = {
  subscribe(cb: () => void) {
    cvListeners.add(cb);
    return () => cvListeners.delete(cb);
  },
  getSnapshot(): boolean {
    if (cachedGenerated === null) cachedGenerated = readGenerated();
    return cachedGenerated;
  },
  /** Server snapshot — always false so SSR/prerender matches un-generated state */
  getServerSnapshot: (): boolean => false,
};

/* ── Mock CV content (English — stays English like all mock AI output) ── */

const MOCK_SUMMARY =
  "Data Analytics M.Sc. candidate with a strong technical foundation in Python, SQL, and dbt, combined with hands-on experience in machine learning, LLM-based systems, and business intelligence. Skilled at translating raw data into actionable insights and building end-to-end pipelines. Actively pursuing working student and junior roles in applied AI and data engineering — primarily in Germany and remote-friendly environments.";

const MOCK_EXPERIENCE_BULLETS = [
  "Designed and maintained modular dbt data models and transformation pipelines for analytical reporting use cases.",
  "Built and evaluated machine learning models (classification, regression, NLP) using Python, Scikit-learn, and PyTorch.",
  "Developed interactive dashboards and BI reports translating complex datasets into business-readable insights.",
  "Explored LLM and Retrieval-Augmented Generation (RAG) architectures as part of applied AI engineering coursework.",
  "Managed end-to-end data workflows including ingestion, cleaning, validation, and delivery to downstream consumers.",
];

const MOCK_SKILLS_GROUPED = [
  { category: "Core Technical",        skills: ["Python", "SQL", "dbt", "Git"] },
  { category: "Machine Learning & AI", skills: ["Scikit-learn", "PyTorch", "LLMs", "RAG", "NLP"] },
  { category: "Data & Analytics",      skills: ["Data Analytics", "Machine Learning", "Data Pipelines", "BI Reporting"] },
  { category: "Tools & Ecosystem",     skills: ["Jupyter", "VS Code", "GitHub", "dbt Cloud"] },
];

const MOCK_GAPS = [
  { gap: "Work authorization details not specified",   impact: "Reduces visibility in Germany-filtered job searches.",             severity: "High"   as const },
  { gap: "Docker / FastAPI experience not documented", impact: "Limits match score for AI Engineering and backend-adjacent roles.", severity: "Medium" as const },
  { gap: "German language level not clarified",        impact: "ApplyMate cannot filter roles requiring fluent German correctly.",  severity: "Medium" as const },
];

const MOCK_IMPROVEMENTS = [
  "Add a short paragraph about your most technically complex project — describe the problem, the stack used, and a measurable outcome.",
  "Specify your work authorization status (EU citizen, visa required, etc.) to unlock 12 additional job matches in Germany.",
  "Add any API or backend experience (FastAPI, REST, Flask) — even minimal exposure strengthens AI Engineer match scores.",
  "Clarify your German language level (A2, B1, B2, C1) so ApplyMate can filter roles requiring fluent German accurately.",
];

const READINESS_SCORE = 74;
const SCORE_BREAKDOWN = [
  { label: "Profile completeness", pct: 78 },
  { label: "Skills depth",         pct: 82 },
  { label: "Role alignment",       pct: 86 },
];

/* ── Sub-components ───────────────────────────────────────── */

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

/* ── Main component ──────────────────────────────────────── */

export default function MasterCvPreview() {
  const { t } = useI18n();
  // useSyncExternalStore: server snapshot = false (pre-generated), client snapshot = localStorage value.
  // React prerender matches the false/un-generated state, then reconciles to stored state after hydration.
  const generated = useSyncExternalStore(cvStore.subscribe, cvStore.getSnapshot, cvStore.getServerSnapshot);

  function handleGenerate() {
    writeGenerated(true);
  }

  function handleReset() {
    writeGenerated(false);
  }

  return (
    <section>
      <h2 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        {t("profile.cvPreview.title")}
      </h2>
      <p className="text-[12px] leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
        {t("profile.cvPreview.intro")}
      </p>

      {!generated ? (
        /* ── Pre-generation card ── */
        <div className="dash-panel p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl"
               style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)" }}>
            📄
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              {t("profile.cvPreview.preGenNote")}
            </p>
            <button
              id="cv-preview-generate-btn"
              className="dash-btn dash-btn--primary text-[12px]"
              onClick={handleGenerate}
            >
              {t("profile.cvPreview.generateBtn")}
            </button>
          </div>
        </div>
      ) : (
        /* ── Generated preview ── */
        <div className="flex flex-col gap-4">

          {/* Demo disclaimer */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
               style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.15)", color: "#ca8a04" }}>
            <span>⚡</span>
            <span>{t("profile.cvPreview.demoNote")}</span>
          </div>

          {/* CV Readiness Score */}
          <div className="dash-panel p-4 flex items-start gap-4">
            <ScoreRing pct={READINESS_SCORE} />
            <div className="flex-1 min-w-0">
              <PreviewLabel label={t("profile.cvPreview.readinessTitle")} />
              <p className="text-sm font-bold mb-3"
                 style={{ color: READINESS_SCORE >= 80 ? "#4ade80" : "#60a5fa" }}>
                Good — a few improvements will help
              </p>
              <div className="grid grid-cols-3 gap-3">
                {SCORE_BREAKDOWN.map((item) => (
                  <div key={item.label}>
                    <p className="text-[9px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                      <div className="h-full rounded-full"
                           style={{ width: `${item.pct}%`, background: "linear-gradient(90deg, #2563eb, #22d3ee)" }} />
                    </div>
                    <p className="text-[9px] tabular-nums mt-0.5" style={{ color: "var(--text-muted)" }}>{item.pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="dash-panel p-4">
            <PreviewLabel label={t("profile.cvPreview.summaryTitle")} />
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {MOCK_SUMMARY}
            </p>
          </div>

          {/* Experience Bullets */}
          <div className="dash-panel p-4">
            <PreviewLabel label={t("profile.cvPreview.experienceTitle")} />
            <ul className="flex flex-col gap-2">
              {MOCK_EXPERIENCE_BULLETS.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <span className="flex-shrink-0 w-1 h-1 rounded-full mt-[7px]" style={{ background: "#60a5fa" }} />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Grouped Skills */}
          <div className="dash-panel p-4">
            <PreviewLabel label={t("profile.cvPreview.skillsTitle")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MOCK_SKILLS_GROUPED.map((group) => (
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

          {/* Profile Gaps */}
          <div className="dash-panel p-4">
            <PreviewLabel label={t("profile.cvPreview.gapsTitle")} />
            <div className="flex flex-col gap-2.5">
              {MOCK_GAPS.map((item) => (
                <div key={item.gap} className="flex items-start gap-2.5">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                    style={{
                      background: item.severity === "High" ? "rgba(248,113,113,0.08)" : "rgba(251,146,60,0.07)",
                      color:      item.severity === "High" ? "#f87171" : "#fb923c",
                      border: `1px solid ${item.severity === "High" ? "rgba(248,113,113,0.18)" : "rgba(251,146,60,0.15)"}`,
                    }}
                  >
                    {item.severity}
                  </span>
                  <div>
                    <p className="text-[12px] font-medium leading-tight" style={{ color: "var(--text-primary)" }}>{item.gap}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{item.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Improvements */}
          <div className="dash-panel p-4">
            <PreviewLabel label={t("profile.cvPreview.improvementsTitle")} />
            <ol className="flex flex-col gap-2.5">
              {MOCK_IMPROVEMENTS.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}
                  >
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>

          {/* Relationship note + CTA */}
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

          {/* Regenerate / Reset */}
          <div className="flex items-center gap-3 flex-wrap">
            <button id="cv-preview-regenerate-btn" className="dash-btn dash-btn--outline text-[12px]"
                    onClick={handleGenerate}>
              {t("profile.cvPreview.regenerateBtn")}
            </button>
            <button id="cv-preview-reset-btn" className="dash-btn dash-btn--ghost text-[12px]"
                    style={{ color: "var(--text-muted)" }} onClick={handleReset}>
              {t("profile.cvPreview.resetBtn")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
