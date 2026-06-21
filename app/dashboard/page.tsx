"use client";

import { useState } from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Dashboard  (frontend-only prototype v2)
   Cleaner, more focused, less visual noise.
   ───────────────────────────────────────────────────────── */

type NavItem =
  | "auto-apply"
  | "review"
  | "matches"
  | "inbox"
  | "preferences"
  | "tracker"
  | "saved";

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState<NavItem>("auto-apply");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────── */}
      <aside
        className={`dash-sidebar ${sidebarOpen ? "dash-sidebar--open" : ""}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
              }}
            >
              A
            </div>
            <span
              className="font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              ApplyMate{" "}
              <span className="gradient-text">AI</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
          <p
            className="text-[10px] font-semibold tracking-widest uppercase px-3 pt-3 pb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            Workflow
          </p>
          {navItems.slice(0, 4).map((item) => (
            <SidebarLink
              key={item.id}
              item={item}
              active={activeNav === item.id}
              onClick={() => {
                setActiveNav(item.id);
                setSidebarOpen(false);
              }}
            />
          ))}
          <p
            className="text-[10px] font-semibold tracking-widest uppercase px-3 pt-5 pb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            Manage
          </p>
          {navItems.slice(4).map((item) => (
            <SidebarLink
              key={item.id}
              item={item}
              active={activeNav === item.id}
              onClick={() => {
                setActiveNav(item.id);
                setSidebarOpen(false);
              }}
            />
          ))}
        </nav>

        {/* Pricing hint */}
        <div
          className="mx-3 mb-2 px-3 py-2.5 rounded-lg text-center"
          style={{
            background: "rgba(59,130,246,0.04)",
            border: "1px dashed var(--border-mid)",
          }}
        >
          <p className="text-xs font-medium" style={{ color: "#93c5fd" }}>
            Free beta
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Pro plans later · No card needed
          </p>
        </div>

        {/* User footer */}
        <div
          className="px-4 py-3 mx-3 mb-3 rounded-xl flex items-center gap-3"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
            }}
          >
            OB
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              Onur Balic
            </p>
            <p
              className="text-[11px] truncate"
              style={{ color: "var(--text-muted)" }}
            >
              Beta user
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main content area ────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="h-14 flex items-center px-6 flex-shrink-0"
          style={{
            background: "rgba(6, 13, 26, 0.8)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {/* Mobile menu toggle */}
          <button
            className="mr-3 md:hidden text-lg"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1
              className="text-base font-bold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {navItems.find((n) => n.id === activeNav)?.label ?? "Dashboard"}
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(34,197,94,0.08)",
                color: "#4ade80",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#4ade80" }}
              />
              Scanning for matches
            </span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          <div className="max-w-5xl mx-auto flex flex-col gap-5">
            {/* ── Compact stats row ──────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="dash-stat-card">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{s.icon}</span>
                    <div className="min-w-0">
                      <p
                        className="text-lg font-bold leading-tight"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {s.value}
                      </p>
                      <p
                        className="text-[11px] truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {s.label}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Review Queue (main focus) ───── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2
                    className="text-sm font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Next to review
                  </h2>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--blue-dim)",
                      color: "#93c5fd",
                      border: "1px solid rgba(59,130,246,0.18)",
                    }}
                  >
                    8 in queue
                  </span>
                </div>
                <p
                  className="text-[11px] hidden sm:block"
                  style={{ color: "var(--text-muted)" }}
                >
                  Review only the jobs worth your time.
                </p>
              </div>

              <ReviewCard />
            </section>

            {/* ── Job Matches ─────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2
                    className="text-sm font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Job Matches
                  </h2>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(34,197,94,0.08)",
                      color: "#4ade80",
                      border: "1px solid rgba(34,197,94,0.15)",
                    }}
                  >
                    75%+ only
                  </span>
                </div>
                <div className="hidden sm:flex gap-2">
                  {["Remote", "Germany"].map((f) => (
                    <span key={f} className="dash-filter-pill">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <JobMatchesTable />
            </section>

            {/* ── Application Tracker ─────────── */}
            <section>
              <h2
                className="text-sm font-bold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Active Applications
              </h2>

              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {trackerItems.map((t, i) => (
                  <div
                    key={t.role}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom:
                        i < trackerItems.length - 1
                          ? "1px solid var(--border-subtle)"
                          : "none",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, #2563eb, #0ea5e9)",
                        opacity: 0.8,
                      }}
                    >
                      {t.company[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {t.role}
                        <span
                          className="font-normal ml-1.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          · {t.company}
                        </span>
                      </p>
                    </div>
                    <span
                      className="text-[11px] hidden sm:block flex-shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {t.time}
                    </span>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={t.statusStyle}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Manual Analyze link ─────────── */}
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: "rgba(59,130,246,0.03)",
                border: "1px dashed var(--border-mid)",
              }}
            >
              <span className="text-sm">🔬</span>
              <p
                className="flex-1 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Paste a specific CV and job description →{" "}
                <Link
                  href="/analyze"
                  className="font-medium"
                  style={{ color: "#93c5fd" }}
                >
                  Manual Analyzer
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── SIDEBAR LINK ───────────────────────────────────────── */
function SidebarLink({
  item,
  active,
  onClick,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`dash-nav-link ${active ? "dash-nav-link--active" : ""}`}
    >
      <span className="text-sm w-5 text-center">{item.icon}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
            color: "#fff",
          }}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
}

/* ── REVIEW CARD ────────────────────────────────────────── */
function ReviewCard() {
  return (
    <div className="dash-review-card">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: job info */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
              }}
            >
              E
            </div>
            <div className="min-w-0">
              <h3
                className="text-base font-bold mb-0.5"
                style={{ color: "var(--text-primary)" }}
              >
                AI Engineer Working Student
              </h3>
              <p
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                ExampleTech GmbH · Berlin / Remote
              </p>
            </div>
          </div>

          {/* Why this fits */}
          <div
            className="rounded-lg p-3.5 mb-4"
            style={{
              background: "rgba(59,130,246,0.04)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p
              className="text-[11px] font-semibold mb-1"
              style={{ color: "#60a5fa" }}
            >
              Why this fits
            </p>
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Strong overlap with Python, SQL, and ML requirements. Your
              LLM projects and data analytics background match the
              team&apos;s applied AI focus.
            </p>
          </div>

          {/* Skills row */}
          <div className="flex flex-wrap gap-5 mb-4">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Matches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Python", "SQL", "Machine Learning", "Data Analytics"].map(
                  (s) => (
                    <span key={s} className="skill-chip skill-chip--match">
                      {s}
                    </span>
                  )
                )}
              </div>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Gaps
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["FastAPI", "Docker"].map((s) => (
                  <span key={s} className="skill-chip skill-chip--missing">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Prepared materials */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { icon: "✉️", label: "Cover letter" },
              { icon: "💬", label: "Recruiter message" },
              { icon: "🎤", label: "Interview prep" },
            ].map((m) => (
              <span
                key={m.label}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md"
                style={{
                  background: "rgba(34,197,94,0.06)",
                  color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.12)",
                }}
              >
                {m.icon} {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: score ring */}
        <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="9"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#dashScoreGrad)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52 * 0.86} ${2 * Math.PI * 52}`}
                className="score-ring"
              />
              <defs>
                <linearGradient
                  id="dashScoreGrad"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold gradient-text leading-none">
                86
              </span>
              <span
                className="text-[9px] font-medium mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                / 100
              </span>
            </div>
          </div>
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(34,197,94,0.1)",
              color: "#4ade80",
              border: "1px solid rgba(34,197,94,0.15)",
            }}
          >
            Strong match
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="flex flex-wrap items-center gap-2 pt-4 mt-4"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <button className="dash-btn dash-btn--ghost">✕ Decline</button>
        <button className="dash-btn dash-btn--ghost">⏭ Skip</button>
        <div className="flex-1" />
        <button className="dash-btn dash-btn--outline">
          Review application →
        </button>
        <button className="dash-btn dash-btn--primary">
          ✓ Approve &amp; apply
        </button>
      </div>

      {/* Trust note */}
      <p
        className="text-[11px] text-center mt-3"
        style={{ color: "var(--text-muted)" }}
      >
        🔒 Nothing is submitted without your approval.
      </p>
    </div>
  );
}

/* ── JOB MATCHES TABLE ──────────────────────────────────── */
function JobMatchesTable() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Table header */}
      <div
        className="hidden md:grid px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
        style={{
          gridTemplateColumns: "1fr 130px 80px 130px",
          color: "var(--text-muted)",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-raised)",
        }}
      >
        <span>Role</span>
        <span>Location</span>
        <span className="text-center">Score</span>
        <span className="text-right">Status</span>
      </div>

      {/* Rows */}
      {jobMatches.map((job) => (
        <div
          key={job.role}
          className="dash-job-row"
          style={{ opacity: job.match < 70 ? 0.35 : 1 }}
        >
          {/* Role + company */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{
                background:
                  job.match >= 75
                    ? "linear-gradient(135deg, #2563eb, #0ea5e9)"
                    : "var(--bg-overlay)",
              }}
            >
              {job.company[0]}
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {job.role}
              </p>
              <p
                className="text-[11px] truncate md:hidden"
                style={{ color: "var(--text-muted)" }}
              >
                {job.location}
              </p>
            </div>
          </div>

          {/* Location */}
          <span
            className="hidden md:block text-xs truncate"
            style={{ color: "var(--text-secondary)", width: "130px" }}
          >
            {job.location}
          </span>

          {/* Score */}
          <div
            className="flex items-center justify-center"
            style={{ width: "80px" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-1 rounded-full overflow-hidden"
                style={{ background: "var(--border-subtle)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${job.match}%`,
                    background:
                      job.match >= 75
                        ? "linear-gradient(90deg, #2563eb, #22d3ee)"
                        : "#f87171",
                  }}
                />
              </div>
              <span
                className="text-xs font-bold tabular-nums"
                style={{
                  color:
                    job.match >= 85
                      ? "#60a5fa"
                      : job.match >= 75
                        ? "#93c5fd"
                        : "var(--text-muted)",
                }}
              >
                {job.match}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-end" style={{ width: "130px" }}>
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={job.statusStyle}
            >
              {job.status}
            </span>
          </div>
        </div>
      ))}

      {/* Low-fit notice */}
      <div
        className="px-4 py-2.5 text-[11px] text-center flex items-center justify-center gap-1.5"
        style={{
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-raised)",
        }}
      >
        <span>🚫</span>
        45 low-match jobs hidden automatically
        <span className="mx-1">·</span>
        <span
          style={{ color: "#60a5fa", cursor: "pointer" }}
        >
          Show all
        </span>
      </div>
    </div>
  );
}

/* ── DATA ───────────────────────────────────────────────── */

const navItems: {
  id: NavItem;
  icon: string;
  label: string;
  badge?: string;
}[] = [
  { id: "auto-apply", icon: "🚀", label: "Auto Apply", badge: "8" },
  { id: "review", icon: "📋", label: "Review Queue", badge: "3" },
  { id: "matches", icon: "🎯", label: "Job Matches" },
  { id: "inbox", icon: "📬", label: "Inbox" },
  { id: "preferences", icon: "⚙️", label: "Job Preferences" },
  { id: "tracker", icon: "📊", label: "Application Tracker" },
  { id: "saved", icon: "⭐", label: "Saved Jobs" },
];

const stats = [
  { icon: "🎯", label: "High-match jobs", value: "49" },
  { icon: "📋", label: "Ready to review", value: "8" },
  { icon: "✅", label: "Approved", value: "12" },
  { icon: "💬", label: "Replies pending", value: "5" },
];

const jobMatches = [
  {
    role: "Junior Data Analyst",
    company: "DataCorp",
    location: "Berlin",
    match: 91,
    status: "Ready",
    statusStyle: {
      background: "rgba(34,197,94,0.1)",
      color: "#4ade80",
      border: "1px solid rgba(34,197,94,0.15)",
    },
  },
  {
    role: "AI Engineer Working Student",
    company: "ExampleTech GmbH",
    location: "Remote — Germany",
    match: 86,
    status: "Draft prepared",
    statusStyle: {
      background: "var(--blue-dim)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.18)",
    },
  },
  {
    role: "Data Scientist Intern",
    company: "BioML Labs",
    location: "Munich",
    match: 79,
    status: "Needs review",
    statusStyle: {
      background: "rgba(250,204,21,0.06)",
      color: "#fde047",
      border: "1px solid rgba(250,204,21,0.15)",
    },
  },
  {
    role: "Marketing Analyst",
    company: "SocialMetrics",
    location: "Hamburg",
    match: 52,
    status: "Hidden · Low fit",
    statusStyle: {
      background: "var(--bg-overlay)",
      color: "var(--text-muted)",
      border: "1px solid var(--border-subtle)",
    },
  },
];

const trackerItems = [
  {
    role: "Data Analyst",
    company: "Google",
    time: "2d ago",
    status: "Applied",
    statusStyle: {
      background: "var(--blue-dim)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.18)",
    },
  },
  {
    role: "Product Manager",
    company: "Notion",
    time: "5d ago",
    status: "Reply pending",
    statusStyle: {
      background: "rgba(250,204,21,0.06)",
      color: "#fde047",
      border: "1px solid rgba(250,204,21,0.15)",
    },
  },
  {
    role: "UX Designer",
    company: "Figma",
    time: "Follow-up in 2d",
    status: "Follow-up due",
    statusStyle: {
      background: "rgba(251,146,60,0.06)",
      color: "#fb923c",
      border: "1px solid rgba(251,146,60,0.15)",
    },
  },
  {
    role: "AI Engineer",
    company: "Anthropic",
    time: "Tomorrow 14:00",
    status: "Interview",
    statusStyle: {
      background: "rgba(34,197,94,0.08)",
      color: "#4ade80",
      border: "1px solid rgba(34,197,94,0.15)",
    },
  },
];
