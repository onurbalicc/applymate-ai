"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/app/components/DashboardLayout";
import { useI18n } from "@/app/lib/i18n";
import type { TKey } from "@/app/lib/translations";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Profile Setup
   Uses shared layout. Save confirmation. Multilingual UI.
   ───────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    "Data Analyst", "AI Engineer", "Data Scientist", "Analytics Engineer",
  ]);
  const [saved, setSaved] = useState(false);
  const [cvClicked, setCvClicked] = useState(false);
  const { t } = useI18n();

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <DashboardLayout activeNavId="profile">
      <div className="max-w-4xl mx-auto flex flex-col gap-5">

        {/* ── Page intro ─────────────────── */}
        <div>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {t("profile.intro")}
          </p>
        </div>

        {/* ── Profile readiness ──────────── */}
        <div className="dash-panel p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#profileGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50 * 0.82} ${2 * Math.PI * 50}`} className="score-ring" />
                <defs><linearGradient id="profileGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold gradient-text">82%</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>{t("profile.readiness")}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {readinessItems.map((item) => (
                  <span key={item.labelKey} className="flex items-center gap-1.5 text-[12px]">
                    <span style={{ color: item.done ? "#4ade80" : "#fb923c" }}>{item.done ? "✓" : "○"}</span>
                    <span style={{ color: item.done ? "var(--text-secondary)" : "#fb923c" }}>{t(item.labelKey)}</span>
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[11px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>{t("profile.betterData")}</p>
          </div>
        </div>

        {/* ── Profile Impact Preview ────── */}
        <section>
          <SectionHeader title={t("profile.impactTitle")} />

          <div className="rounded-lg px-4 py-2.5 mb-4 text-[12px]" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            {t("profile.aiNoteA")}{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("profile.aiNoteB")}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
            <div className="lg:col-span-2 dash-panel p-4 flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="url(#impactGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50 * 0.82} ${2 * Math.PI * 50}`} className="score-ring" />
                  <defs><linearGradient id="impactGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold gradient-text">82%</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{t("profile.matchPotential")}</p>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}>{t("profile.strongFoundation")}</span>
                <p className="text-[11px] mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>{t("profile.readyForRoles")}</p>
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {impactMetrics.map((m) => (
                <div key={m.labelKey} className="dash-stat-card">
                  <p className="text-lg font-bold leading-tight" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[10px] leading-snug mt-0.5" style={{ color: "var(--text-muted)" }}>{t(m.labelKey)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {recommendations.map((rec) => (
              <div key={rec.title} className="dash-panel p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>{rec.icon}</span>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{rec.title}</p>
                </div>
                <p className="text-[11px] leading-relaxed mb-2 flex-1" style={{ color: "var(--text-muted)" }}>{rec.reason}</p>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full self-start" style={{ background: "rgba(34,197,94,0.06)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.12)" }}>{rec.impact}</span>
              </div>
            ))}
          </div>

          <div className="dash-panel overflow-hidden">
            <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", background: "var(--bg-raised)", borderBottom: "1px solid var(--border-subtle)" }}>{t("profile.roleReadiness")}</div>
            {roleReadiness.map((r, i) => (
              <div key={r.role} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: i < roleReadiness.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>{r.role}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.pct >= 85 ? "linear-gradient(90deg, #2563eb, #22d3ee)" : r.pct >= 75 ? "#93c5fd" : "#fb923c" }} />
                  </div>
                  <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: r.pct >= 85 ? "#60a5fa" : r.pct >= 75 ? "#93c5fd" : "#fb923c" }}>{r.pct}%</span>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full w-[72px] text-center" style={r.badgeStyle}>{t(r.badgeKey)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Your Profile ───────────────── */}
        <section>
          <SectionHeader title={t("profile.yourProfile")} />
          <div className="dash-panel p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}>OB</div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>Onur Balic</p>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>M.Sc. Data Analytics student with experience in Python, SQL, dbt, machine learning, data analytics, and AI engineering projects.</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{t("profile.skills")}</p>
              <div className="flex flex-wrap gap-1.5">
                {profileSkills.map((s) => <span key={s} className="skill-chip skill-chip--match">{s}</span>)}
              </div>
            </div>
            <button className="dash-btn dash-btn--outline text-[12px]">{t("profile.updateProfile")}</button>
          </div>
        </section>

        {/* ── Master CV Builder teaser ───────────────── */}
        <section>
          <SectionHeader title={t("profile.cvBuilder.title")} />
          <div className="dash-panel p-4 flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)" }}>
              📋
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t("profile.cvBuilder.title")}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(250,204,21,0.08)", color: "#eab308", border: "1px solid rgba(250,204,21,0.18)" }}>
                  {t("profile.cvBuilder.badge")}
                </span>
              </div>
              <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>{t("profile.cvBuilder.desc")}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  id="cv-builder-cta"
                  className="dash-btn dash-btn--outline text-[12px]"
                  onClick={() => setCvClicked(true)}
                >
                  {t("profile.cvBuilder.cta")}
                </button>
                {cvClicked && (
                  <span className="text-[12px] font-medium" style={{ color: "#60a5fa" }}>
                    {t("profile.cvBuilder.clicked")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Target Roles ───────────────── */}
        <section>
          <SectionHeader title={t("profile.targetRoles")} />
          <div className="dash-panel p-4">
            <div className="flex flex-wrap gap-2">
              {allRoles.map((role) => {
                const isActive = selectedRoles.includes(role);
                return (
                  <button key={role} onClick={() => toggleRole(role)} className="profile-role-chip" style={{ background: isActive ? "var(--blue-dim)" : "var(--bg-raised)", color: isActive ? "#93c5fd" : "var(--text-muted)", borderColor: isActive ? "rgba(59,130,246,0.3)" : "var(--border-subtle)" }}>
                    {isActive && <span style={{ color: "#60a5fa" }}>✓</span>}
                    {role}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
              {selectedRoles.length} {t("profile.roleWord")} {t("profile.rolesSelected")}
            </p>
          </div>
        </section>

        {/* ── Job Preferences ────────────── */}
        <section id="preferences">
          <SectionHeader title={t("profile.jobPreferences")} />
          <div className="dash-panel p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobPreferences.map((pref) => (
                <PreferenceField key={pref.labelKey} labelKey={pref.labelKey} value={pref.value} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Dealbreakers ───────────────── */}
        <section>
          <SectionHeader title={t("profile.dealbreakers")} />
          <div className="dash-panel p-4">
            <div className="flex flex-col gap-2">
              {dealbreakerKeys.map((key) => (
                <div key={key} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] flex-shrink-0" style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.15)" }}>✕</span>
                  <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{t(key)}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>{t("profile.dbNote")}</p>
          </div>
        </section>

        {/* ── Application Preferences ────── */}
        <section>
          <SectionHeader title={t("profile.appPreferences")} />
          <div className="dash-panel p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {appPreferences.map((pref) => (
                <div key={pref.labelKey} className="flex items-center justify-between py-1.5">
                  <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{t(pref.labelKey)}</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}>{t(pref.valueKey)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button className="dash-btn dash-btn--primary w-full sm:w-auto justify-center" onClick={handleSave}>
            {saved ? t("profile.profileSaved") : t("profile.saveProfile")}
          </button>
          <Link href="/review-queue" className="dash-btn dash-btn--outline w-full sm:w-auto justify-center text-center">
            {t("common.openReviewQueue")}
          </Link>
          <Link href="/dashboard" className="dash-btn dash-btn--ghost w-full sm:w-auto justify-center text-center">
            {t("profile.goToDashboard")}
          </Link>
        </div>

        {/* ── Save confirmation toast ────── */}
        {saved && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold animate-fade-up"
            style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", backdropFilter: "blur(12px)" }}
          >
            {t("profile.savedToast")}
          </div>
        )}

        <p className="text-[11px] text-center pb-4" style={{ color: "var(--text-muted)" }}>
          {t("profile.demoNote")}
        </p>
      </div>
    </DashboardLayout>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>{title}</h2>;
}

function PreferenceField({ labelKey, value }: { labelKey: TKey; value: string | string[] }) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>{t(labelKey)}</p>
      {Array.isArray(value) ? (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => (
            <span key={v} className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" }}>{v}</span>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{value}</p>
      )}
    </div>
  );
}

/* ── DATA (roles, skills, and mock recommendation content
      stay in English; labels are translated) ─────────────── */

const readinessItems: { labelKey: TKey; done: boolean }[] = [
  { labelKey: "profile.cvAdded", done: true },
  { labelKey: "profile.prefsSet", done: true },
  { labelKey: "profile.rulesActive", done: true },
  { labelKey: "profile.workAuth", done: false },
];

const profileSkills = ["Python", "SQL", "dbt", "Machine Learning", "Data Analytics", "Git", "LLMs", "RAG"];

const allRoles = ["Data Analyst", "AI Engineer", "Data Scientist", "Analytics Engineer", "Machine Learning Engineer", "Working Student AI/Data"];

const jobPreferences: { labelKey: TKey; value: string | string[] }[] = [
  { labelKey: "dash.location", value: "Germany / Remote" },
  { labelKey: "dash.workType", value: ["Working student", "Internship", "Junior", "Entry-level"] },
  { labelKey: "profile.language", value: "English + German" },
  { labelKey: "profile.minMatchScore", value: "75%" },
  { labelKey: "profile.remotePref", value: "Hybrid / Remote" },
  { labelKey: "profile.jobSources", value: ["LinkedIn", "StepStone", "Indeed", "Company pages"] },
];

const dealbreakerKeys: TKey[] = [
  "profile.db1",
  "profile.db2",
  "profile.db3",
  "profile.db4",
  "profile.db5",
];

const appPreferences: { labelKey: TKey; valueKey: TKey }[] = [
  { labelKey: "profile.tone", valueKey: "profile.vTone" },
  { labelKey: "material.coverLetter", valueKey: "profile.vCover" },
  { labelKey: "material.recruiterMessage", valueKey: "profile.vRecruiter" },
  { labelKey: "profile.approvalMode", valueKey: "profile.vApproval" },
  { labelKey: "profile.followUpReminder", valueKey: "profile.vFollowUp" },
];

const impactMetrics: { value: string; labelKey: TKey; color: string }[] = [
  { value: "49", labelKey: "profile.m1", color: "#60a5fa" },
  { value: "12", labelKey: "profile.m2", color: "#fb923c" },
  { value: "18", labelKey: "profile.m3", color: "#fde047" },
  { value: "9", labelKey: "profile.m4", color: "#93c5fd" },
];

/* Mock AI recommendations — stay English like other generated content */
const recommendations = [
  { icon: "📋", title: "Add work authorization", reason: "Improves filtering for Germany-based jobs.", impact: "Unlocks 12 hidden jobs" },
  { icon: "🐳", title: "Add Docker / FastAPI project", reason: "Strengthens AI Engineer and backend-related matches.", impact: "+9 stronger AI matches" },
  { icon: "🇩🇪", title: "Clarify German level", reason: "Helps hide jobs requiring fluent German and prioritize realistic roles.", impact: "Better Germany filtering" },
];

const roleReadiness: { role: string; pct: number; badgeKey: TKey; badgeStyle: React.CSSProperties }[] = [
  { role: "Data Analyst", pct: 91, badgeKey: "profile.badgeStrong", badgeStyle: { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" } },
  { role: "Analytics Engineer", pct: 84, badgeKey: "profile.badgeGood", badgeStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
  { role: "AI Engineer", pct: 82, badgeKey: "profile.badgeGood", badgeStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
  { role: "Data Scientist", pct: 78, badgeKey: "profile.badgeGood", badgeStyle: { background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.18)" } },
  { role: "ML Engineer", pct: 69, badgeKey: "profile.badgeNeedsWork", badgeStyle: { background: "rgba(251,146,60,0.06)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.15)" } },
];
