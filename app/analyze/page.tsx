"use client";

import { useState } from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – /analyze  (frontend-only demo)
   ───────────────────────────────────────────────────────── */

export default function AnalyzePage() {
  const [cv, setCv] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [validationMsg, setValidationMsg] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  function handleAnalyze() {
    if (!cv.trim() && !jobDesc.trim()) {
      setValidationMsg("Please paste both your CV and a job description to get started.");
      setShowResults(false);
      return;
    }
    if (!cv.trim()) {
      setValidationMsg("Please paste your CV / resume text above.");
      setShowResults(false);
      return;
    }
    if (!jobDesc.trim()) {
      setValidationMsg("Please paste the job description above.");
      setShowResults(false);
      return;
    }

    setValidationMsg("");
    setIsAnalyzing(true);

    // Simulate a short loading delay for realism
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 1200);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnalyzeHeader />

      <main className="flex-1 pt-28 pb-20 px-6">
        {/* ── Page title ─────────────────────── */}
        <div className="max-w-3xl mx-auto text-center mb-12 animate-fade-up">
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4"
            id="analyze-headline"
          >
            Analyze your next{" "}
            <span className="gradient-text">job application</span>
          </h1>
          <p
            className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Paste your CV and a job description to preview your match score,
            skill gaps, and application kit.
          </p>
        </div>

        {/* ── Input section ──────────────────── */}
        <div className="max-w-4xl mx-auto animate-fade-up-d1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* CV Textarea */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="cv-input"
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                  style={{
                    background: "var(--blue-dim)",
                    border: "1px solid rgba(59,130,246,0.25)",
                  }}
                >
                  📄
                </span>
                CV / Resume
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

            {/* Job Description Textarea */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="jd-input"
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                  style={{
                    background: "var(--cyan-dim)",
                    border: "1px solid rgba(34,211,238,0.25)",
                  }}
                >
                  💼
                </span>
                Job Description
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
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2.5 animate-fade-up"
              style={{
                background: "rgba(251,146,60,0.08)",
                border: "1px solid rgba(251,146,60,0.2)",
                color: "#fb923c",
              }}
            >
              <span>⚠️</span>
              {validationMsg}
            </div>
          )}

          {/* Analyze button */}
          <div className="flex justify-center">
            <button
              id="analyze-btn"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="btn-primary"
              style={{
                padding: "0.875rem 2.5rem",
                fontSize: "1rem",
                opacity: isAnalyzing ? 0.7 : 1,
                cursor: isAnalyzing ? "wait" : "pointer",
              }}
            >
              {isAnalyzing ? (
                <>
                  <span className="analyze-spinner" />
                  Analyzing…
                </>
              ) : (
                "Analyze job →"
              )}
            </button>
          </div>
        </div>

        {/* ── Results section ────────────────── */}
        {showResults && (
          <div className="max-w-4xl mx-auto mt-14 animate-fade-up">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-8">
              <div
                className="h-px flex-1"
                style={{ background: "var(--border-subtle)" }}
              />
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "#60a5fa" }}
              >
                Analysis Results
              </span>
              <div
                className="h-px flex-1"
                style={{ background: "var(--border-subtle)" }}
              />
            </div>

            {/* ── Row 1: Match score + Skills ──── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              {/* Match score */}
              <ResultCard title="Match Score" icon="🎯">
                <div className="flex flex-col items-center py-3">
                  <div className="relative w-28 h-28 mb-3">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60" cy="60" r="52"
                        fill="none"
                        stroke="var(--border-subtle)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="60" cy="60" r="52"
                        fill="none"
                        stroke="url(#scoreGrad)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 52 * 0.84} ${2 * Math.PI * 52}`}
                        className="score-ring"
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold gradient-text">84%</span>
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(34,197,94,0.12)",
                      color: "#4ade80",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    Strong match
                  </span>
                </div>
              </ResultCard>

              {/* Matching skills */}
              <ResultCard title="Matching Skills" icon="✅">
                <div className="flex flex-wrap gap-2 mt-1">
                  {matchingSkills.map((skill) => (
                    <span key={skill} className="skill-chip skill-chip--match">
                      {skill}
                    </span>
                  ))}
                </div>
                <p
                  className="text-xs mt-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  4 of 7 required skills found in your CV.
                </p>
              </ResultCard>

              {/* Missing skills */}
              <ResultCard title="Missing Skills" icon="⚠️">
                <div className="flex flex-wrap gap-2 mt-1">
                  {missingSkills.map((skill) => (
                    <span key={skill} className="skill-chip skill-chip--missing">
                      {skill}
                    </span>
                  ))}
                </div>
                <p
                  className="text-xs mt-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  Consider adding these to your profile to boost your score.
                </p>
              </ResultCard>
            </div>

            {/* ── Row 2: Improvements + Cover letter ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Suggested improvements */}
              <ResultCard title="Suggested Improvements" icon="💡">
                <ul className="flex flex-col gap-3 mt-1">
                  {improvements.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{
                          background: "var(--blue-dim)",
                          color: "#60a5fa",
                          border: "1px solid rgba(59,130,246,0.2)",
                        }}
                      >
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </ResultCard>

              {/* Cover letter */}
              <ResultCard title="Cover Letter Draft" icon="✉️">
                <p
                  className="text-sm leading-relaxed mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {coverLetterDraft}
                </p>
                <button
                  className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{
                    background: "var(--blue-dim)",
                    color: "#93c5fd",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  📋 Copy to clipboard
                </button>
              </ResultCard>
            </div>

            {/* ── Row 3: Recruiter msg + Interview questions ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Recruiter message */}
              <ResultCard title="Recruiter Message" icon="💬">
                <p
                  className="text-sm leading-relaxed mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {recruiterMessage}
                </p>
                <button
                  className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{
                    background: "var(--blue-dim)",
                    color: "#93c5fd",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  📋 Copy to clipboard
                </button>
              </ResultCard>

              {/* Interview questions */}
              <ResultCard title="Interview Questions" icon="🎤">
                <ul className="flex flex-col gap-3 mt-1">
                  {interviewQuestions.map((q, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{
                          background: "rgba(34,211,238,0.1)",
                          color: "#22d3ee",
                          border: "1px solid rgba(34,211,238,0.2)",
                        }}
                      >
                        {i + 1}
                      </span>
                      {q}
                    </li>
                  ))}
                </ul>
              </ResultCard>
            </div>

            {/* ── Application readiness banner ── */}
            <div
              className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5"
              style={{
                background:
                  "linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(14,165,233,0.06) 100%)",
                border: "1px solid rgba(59,130,246,0.25)",
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  background: "var(--blue-dim)",
                  border: "1px solid rgba(59,130,246,0.25)",
                }}
              >
                🚀
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p
                  className="text-lg font-bold mb-0.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  Application Readiness:{" "}
                  <span className="gradient-text">Ready to review</span>
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Your application kit is ready. Review the materials above,
                  fine-tune if needed, and apply with confidence.
                </p>
              </div>
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
                style={{
                  background: "rgba(34,197,94,0.12)",
                  color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                ✓ Ready
              </span>
            </div>

            {/* Demo notice */}
            <p
              className="text-center text-xs mt-8"
              style={{ color: "var(--text-muted)" }}
            >
              This is a demo preview. Real AI-powered analysis is coming soon.
            </p>
          </div>
        )}
      </main>

      <AnalyzeFooter />
    </div>
  );
}

/* ── HEADER (consistent with landing page) ──────────────── */
function AnalyzeHeader() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center"
      style={{
        background: "rgba(6, 13, 26, 0.88)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="max-w-6xl mx-auto w-full px-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="ApplyMate AI home"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white animate-glow-pulse"
            style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
          >
            A
          </div>
          <span
            className="font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            ApplyMate <span className="gradient-text">AI</span>
          </span>
        </Link>

        <nav
          className="hidden md:flex items-center gap-7"
          aria-label="Main navigation"
        >
          <Link href="/#product" className="nav-link text-sm">
            Product
          </Link>
          <Link href="/#how-it-works" className="nav-link text-sm">
            How it works
          </Link>
          <Link href="/#pricing" className="nav-link text-sm">
            Pricing
          </Link>
        </nav>

        <Link
          href="/analyze"
          id="header-analyze-btn"
          className="btn-primary"
          style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}
        >
          Analyze a job →
        </Link>
      </div>
    </header>
  );
}

/* ── FOOTER ─────────────────────────────────────────────── */
function AnalyzeFooter() {
  return (
    <footer
      className="py-10 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
            }}
          >
            A
          </div>
          <span
            className="font-semibold text-sm tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            ApplyMate <span className="gradient-text">AI</span>
          </span>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Built by{" "}
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            Onur Balic
          </span>
        </p>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} ApplyMate AI · All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ── RESULT CARD COMPONENT ──────────────────────────────── */
function ResultCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="result-card">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-mid)",
          }}
        >
          {icon}
        </span>
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/* ── MOCK DATA ──────────────────────────────────────────── */

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
