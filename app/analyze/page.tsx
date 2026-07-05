"use client";

import { useState } from "react";
import DashboardLayout from "@/app/components/DashboardLayout";
import { useI18n } from "@/app/lib/i18n";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Manual Analyzer
   Shared sidebar layout. Multilingual UI labels; mock result
   content stays English (represents AI-generated output).
   ───────────────────────────────────────────────────────── */

export default function AnalyzePage() {
  const [cv, setCv] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [validationMsg, setValidationMsg] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { t } = useI18n();

  function handleAnalyze() {
    if (!cv.trim() && !jobDesc.trim()) {
      setValidationMsg(t("analyze.needBoth"));
      setShowResults(false);
      return;
    }
    if (!cv.trim()) { setValidationMsg(t("analyze.needCv")); setShowResults(false); return; }
    if (!jobDesc.trim()) { setValidationMsg(t("analyze.needJd")); setShowResults(false); return; }

    setValidationMsg("");
    setIsAnalyzing(true);
    setTimeout(() => { setIsAnalyzing(false); setShowResults(true); }, 1200);
  }

  return (
    <DashboardLayout activeNavId="analyzer">
      <div className="max-w-4xl mx-auto">

        {/* ── Page title ─────────────────── */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-3" style={{ color: "var(--text-primary)" }}>
            {t("analyze.titlePre")} <span className="gradient-text">{t("analyze.titleHi")}</span>
          </h2>
          <p className="text-sm md:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            {t("analyze.sub")}
          </p>
        </div>

        {/* ── Input section ──────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="cv-input" className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs" style={{ background: "var(--blue-dim)", border: "1px solid rgba(59,130,246,0.25)" }}>📄</span>
              {t("analyze.cvLabel")}
            </label>
            <textarea
              id="cv-input"
              value={cv}
              onChange={(e) => setCv(e.target.value)}
              placeholder={"Paste your CV or resume text here…\n\nExample:\nJohn Doe — Data Analyst\n3+ years of experience in Python, SQL, and data visualization.\nSkills: Python, SQL, Tableau, Machine Learning, pandas…"}
              className="analyze-textarea"
              rows={10}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="jd-input" className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs" style={{ background: "var(--cyan-dim)", border: "1px solid rgba(34,211,238,0.25)" }}>💼</span>
              {t("analyze.jdLabel")}
            </label>
            <textarea
              id="jd-input"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder={"Paste the job description here…\n\nExample:\nWe are looking for a Data Analyst with strong SQL and Python skills.\nResponsibilities include building dashboards, running A/B tests…\nRequirements: Python, SQL, FastAPI, Docker, German B1…"}
              className="analyze-textarea"
              rows={10}
            />
          </div>
        </div>

        {/* Validation message */}
        {validationMsg && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2.5 animate-fade-up" style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)", color: "#fb923c" }}>
            <span>⚠️</span>{validationMsg}
          </div>
        )}

        {/* Analyze button */}
        <div className="flex justify-center">
          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="btn-primary"
            style={{ padding: "0.875rem 2.5rem", fontSize: "1rem", opacity: isAnalyzing ? 0.7 : 1, cursor: isAnalyzing ? "wait" : "pointer" }}
          >
            {isAnalyzing ? (<><span className="analyze-spinner" /> {t("analyze.analyzing")}</>) : t("analyze.analyzeBtn")}
          </button>
        </div>

        {/* ── Results ────────────────────── */}
        {showResults && (
          <div className="mt-14 animate-fade-up">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#60a5fa" }}>{t("analyze.results")}</span>
              <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
            </div>

            {/* Row 1: Match + Skills */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <ResultCard title={t("analyze.matchScore")} icon="🎯">
                <div className="flex flex-col items-center py-3">
                  <div className="relative w-28 h-28 mb-3">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 52 * 0.84} ${2 * Math.PI * 52}`} className="score-ring" />
                      <defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold gradient-text">84%</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>{t("common.strongMatch")}</span>
                </div>
              </ResultCard>

              <ResultCard title={t("analyze.matchingSkills")} icon="✅">
                <div className="flex flex-wrap gap-2 mt-1">
                  {matchingSkills.map((skill) => <span key={skill} className="skill-chip skill-chip--match">{skill}</span>)}
                </div>
                <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>{t("analyze.skillsFound")}</p>
              </ResultCard>

              <ResultCard title={t("analyze.missingSkills")} icon="⚠️">
                <div className="flex flex-wrap gap-2 mt-1">
                  {missingSkills.map((skill) => <span key={skill} className="skill-chip skill-chip--missing">{skill}</span>)}
                </div>
                <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>{t("analyze.considerAdding")}</p>
              </ResultCard>
            </div>

            {/* Row 2: Improvements + Cover letter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <ResultCard title={t("analyze.improvements")} icon="💡">
                <ul className="flex flex-col gap-3 mt-1">
                  {improvements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: "var(--blue-dim)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </ResultCard>

              <ResultCard title={t("review.coverLetterDraft")} icon="✉️">
                <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>{coverLetterDraft}</p>
                <button className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" }}>{t("common.copyToClipboard")}</button>
              </ResultCard>
            </div>

            {/* Row 3: Recruiter msg + Interview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <ResultCard title={t("material.recruiterMessage")} icon="💬">
                <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>{recruiterMessage}</p>
                <button className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--blue-dim)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" }}>{t("common.copyToClipboard")}</button>
              </ResultCard>

              <ResultCard title={t("analyze.interviewQuestions")} icon="🎤">
                <ul className="flex flex-col gap-3 mt-1">
                  {interviewQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.2)" }}>{i + 1}</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </ResultCard>
            </div>

            {/* Readiness banner */}
            <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(14,165,233,0.06) 100%)", border: "1px solid rgba(59,130,246,0.25)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "var(--blue-dim)", border: "1px solid rgba(59,130,246,0.25)" }}>🚀</div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-lg font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{t("analyze.readiness")} <span className="gradient-text">{t("analyze.readyToReview")}</span></p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("analyze.readinessDesc")}</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>{t("analyze.readyBadge")}</span>
            </div>

            <p className="text-center text-xs mt-8" style={{ color: "var(--text-muted)" }}>
              {t("analyze.demoNote")}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ── Result Card ─────────────────────────────────────────── */
function ResultCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="result-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: "var(--bg-raised)", border: "1px solid var(--border-mid)" }}>{icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ── MOCK DATA (represents AI output — stays English) ───── */

const matchingSkills = ["Python", "SQL", "Data Analytics", "Machine Learning"];
const missingSkills = ["FastAPI", "Docker", "German B1"];

const improvements = [
  "Add a project or work example demonstrating REST API development (e.g. FastAPI) to strengthen your backend profile.",
  "Include any experience with containerization tools like Docker or Kubernetes, even from personal projects.",
  "Mention your German language level explicitly — even A2/B1 in progress shows commitment to the local market.",
];

const coverLetterDraft = `Dear Hiring Team, I am writing to express my strong interest in the Data Analyst position. With over three years of hands-on experience in Python, SQL, and machine learning, I have developed and deployed data pipelines and dashboards that directly impacted business decisions. My recent work on predictive churn models reduced customer attrition by 18%, and I am eager to bring this analytical mindset to your team. I am particularly drawn to your company's mission and believe my skill set in data analytics and visualization would be a strong addition. I look forward to discussing how I can contribute to your goals.`;

const recruiterMessage = `Hi! I came across the Data Analyst role at your company and wanted to reach out. With 3+ years in Python, SQL, and ML-driven analytics, I've built pipelines and dashboards that directly shaped product decisions. I'd love to learn more about the team and explore how my background could be a fit. Would you be open to a quick chat this week?`;

const interviewQuestions = [
  "Can you describe a time you used data analysis to influence a business decision? What tools did you use and what was the outcome?",
  "How would you approach building a real-time dashboard for monitoring key business metrics? Walk us through your technical choices.",
  "Tell us about a challenging dataset you worked with. How did you clean, transform, and extract insights from it?",
];
