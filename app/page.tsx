"use client";

import WaitlistButton from "@/app/components/WaitlistButton";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import { useI18n } from "@/app/lib/i18n";
import type { TKey } from "@/app/lib/translations";

/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Landing Page (v6, approved layout)
   v6.1: multilingual (EN/TR/DE) — structure unchanged.
───────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TrustStrip />
        <WorkflowSection />
        <DashboardSection />
        <ControlRoomSection />
        <CompareSection />
        <DifferentiationSection />
        <PricingSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}

/* ── HEADER ────────────────────────────────────────────── */
function Header() {
  const { t } = useI18n();
  const links: { labelKey: TKey; href: string }[] = [
    { labelKey: "landing.nav.how", href: "#how-it-works" },
    { labelKey: "landing.nav.product", href: "#product" },
    { labelKey: "landing.nav.why", href: "#why" },
    { labelKey: "landing.nav.pricing", href: "#pricing" },
  ];

  return (
    <header className="landing-header fixed top-0 left-0 right-0 z-50 h-16 flex items-center">
      <div className="max-w-6xl mx-auto w-full px-6 flex items-center justify-between gap-3">
        <a href="#" className="flex items-center gap-2.5" aria-label="ApplyMate AI home">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white animate-glow-pulse"
            style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
          >
            A
          </div>
          <span className="font-semibold tracking-tight hidden sm:inline" style={{ color: "var(--text-primary)" }}>
            ApplyMate <span className="gradient-text">AI</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {links.map(({ labelKey, href }) => (
            <a key={labelKey} href={href} className="nav-link text-sm">{t(labelKey)}</a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a
            href="/profile"
            id="header-start-free-btn"
            className="btn-primary"
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}
          >
            {t("common.getStarted")}
          </a>
        </div>
      </div>
    </header>
  );
}

/* ── HERO ──────────────────────────────────────────────── */
function HeroSection() {
  const { t } = useI18n();
  return (
    <section
      className="relative pt-36 pb-16 px-6 overflow-hidden grid-bg"
      aria-labelledby="hero-headline"
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[540px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(37,99,235,0.14) 0%, transparent 65%)",
        }}
      />

      {/* Text block */}
      <div className="relative max-w-3xl mx-auto text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 animate-fade-up"
          style={{
            border: "1px solid rgba(59,130,246,0.3)",
            background: "rgba(59,130,246,0.07)",
            color: "var(--blue)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "var(--blue)" }}
          />
          {t("common.freeBetaBadge")}
        </div>

        <h1
          id="hero-headline"
          className="text-5xl md:text-6xl lg:text-[4rem] font-bold tracking-tight leading-[1.08] mb-5 animate-fade-up-d1"
        >
          {t("landing.hero.h1a")}{" "}
          <br className="hidden sm:block" />
          <span className="gradient-text">{t("landing.hero.h1b")}</span>
        </h1>

        {/* Core ApplyMate motto (line 2) + supporting explainer */}
        <p
          className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-up-d2"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {t("landing.hero.sub")}
          </span>{" "}
          {t("landing.hero.support")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up-d3">
          <a href="/profile" id="hero-primary-cta" className="btn-primary w-full sm:w-auto justify-center">
            {t("landing.hero.ctaPrimary")}
          </a>
          <a
            href="/dashboard"
            id="hero-secondary-cta"
            className="btn-ghost w-full sm:w-auto justify-center"
          >
            {t("landing.hero.ctaSecondary")}
          </a>
        </div>
      </div>

      {/* Hero dashboard preview */}
      <HeroPreview />
    </section>
  );
}

/* ── HERO PREVIEW (stats + job list + floating signals) ── */
function HeroPreview() {
  const { t } = useI18n();

  const heroStats: { value: string; labelKey: TKey; color: string }[] = [
    { value: "1,240", labelKey: "common.jobsScanned", color: "var(--text-primary)" },
    { value: "49", labelKey: "landing.stats.highMatch", color: "#60a5fa" },
    { value: "45", labelKey: "common.lowFitHidden", color: "var(--text-muted)" },
    { value: "4", labelKey: "landing.stats.awaiting", color: "#4ade80" },
  ];

  return (
    <div className="relative max-w-2xl mx-auto mt-16 animate-fade-up-d3">
      {/* Glow under frame */}
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-16 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(37,99,235,0.22) 0%, transparent 70%)",
          filter: "blur(18px)",
        }}
      />

      {/* Floating signal cards (desktop only) */}
      <div className="float-card animate-float hidden lg:flex" style={{ top: "-18px", left: "-190px" }}>
        <span aria-hidden="true">🎯</span>
        <span>
          <span className="font-bold" style={{ color: "#60a5fa" }}>{t("landing.float.match")}</span> — Junior Data Analyst
        </span>
      </div>
      <div className="float-card animate-float-d1 hidden lg:flex" style={{ top: "70px", right: "-185px" }}>
        <span aria-hidden="true">🔒</span>
        <span>{t("landing.float.waitingA")} <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("landing.float.waitingB")}</span></span>
      </div>
      <div className="float-card animate-float-d2 hidden lg:flex" style={{ bottom: "36px", left: "-165px" }}>
        <span aria-hidden="true">📬</span>
        <span>{t("landing.float.replyA")} <span className="font-semibold" style={{ color: "#4ade80" }}>{t("landing.float.replyB")}</span></span>
      </div>
      <div className="float-card animate-float hidden lg:flex" style={{ bottom: "-14px", right: "-150px" }}>
        <span aria-hidden="true">🚫</span>
        <span>{t("landing.float.lowFit")}</span>
      </div>

      {/* Browser frame */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: "1px solid var(--border-mid)",
          background: "var(--bg-surface)",
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.55), 0 0 40px rgba(37,99,235,0.08)",
        }}
      >
        <BrowserChrome url="app.applymate.ai/dashboard" />

        {/* Scan stats strip */}
        <div
          className="grid grid-cols-4 px-4 py-3 gap-2"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {heroStats.map((s) => (
            <div key={s.labelKey} className="text-center">
              <p className="text-sm font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{t(s.labelKey)}</p>
            </div>
          ))}
        </div>

        {/* Job list */}
        <div className="p-4 relative overflow-hidden">
          {/* Animated scanning sweep */}
          <div className="scan-sweep" aria-hidden="true" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold inline-flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22d3ee" }} />
              {t("landing.scanning")}
            </span>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full"
              style={{
                background: "var(--blue-dim)",
                color: "var(--blue)",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              {t("landing.match75")}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {jobs.map((job) => (
              <JobRow key={job.role} job={job} compact />
            ))}
          </div>

          <p className="text-[11px] text-center pt-3" style={{ color: "var(--text-muted)" }}>
            🔒 {t("common.nothingSubmitted")}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Shared: browser chrome bar ────────────────────────── */
function BrowserChrome({ url }: { url: string }) {
  return (
    <div
      className="flex items-center gap-2 px-4 h-9"
      style={{
        background: "var(--bg-overlay)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex gap-1.5">
        {["#f87171", "#facc15", "#4ade80"].map((c) => (
          <span
            key={c}
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: c, opacity: 0.65 }}
          />
        ))}
      </div>
      <div
        className="flex-1 mx-3 rounded flex items-center px-2.5 text-xs"
        style={{
          height: "20px",
          background: "var(--bg-raised)",
          color: "var(--text-muted)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {url}
      </div>
    </div>
  );
}

/* ── Shared: job row ───────────────────────────────────── */
function JobRow({ job, compact }: { job: (typeof jobs)[number]; compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="job-row" style={{ opacity: job.match < 70 ? 0.35 : 1 }}>
      <div
        className={`${compact ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm"} rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0`}
        style={{
          background:
            job.match >= 75
              ? "linear-gradient(135deg, #2563eb, #0ea5e9)"
              : "var(--bg-overlay)",
        }}
      >
        {job.company[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-xs font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {job.role}
            </span>
            <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
              · {job.company}
            </span>
          </div>
          <span
            className="text-xs font-bold ml-2 flex-shrink-0"
            style={{
              color:
                job.match >= 85 ? "#60a5fa" : job.match >= 75 ? "var(--blue)" : "var(--text-muted)",
            }}
          >
            {job.match}%
          </span>
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: "var(--border-subtle)" }}
        >
          <div
            className={`h-full rounded-full ${job.barClass}`}
            style={{
              background:
                job.match >= 75
                  ? "linear-gradient(90deg, #2563eb, #22d3ee)"
                  : "#f87171",
            }}
          />
        </div>
      </div>

      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
        style={job.statusStyle}
      >
        {t(job.statusKey)}
      </span>
    </div>
  );
}

/* ── TRUST STRIP ───────────────────────────────────────── */
function TrustStrip() {
  const { t } = useI18n();
  return (
    <div
      className="py-5 px-6"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-center flex-wrap gap-2.5">
        {trustPills.map(({ icon, labelKey }) => (
          <div key={labelKey} className="trust-pill">
            <span aria-hidden="true">{icon}</span>
            {t(labelKey)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Shared: section heading ───────────────────────────── */
function SectionHeading({
  eyebrow,
  title,
  subtitle,
  headingId,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  headingId: string;
}) {
  return (
    <div className="text-center mb-12">
      <p
        className="text-xs font-semibold tracking-widest uppercase mb-3"
        style={{ color: "var(--blue)" }}
      >
        {eyebrow}
      </p>
      <h2 id={headingId} className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ── WORKFLOW ──────────────────────────────────────────── */
function WorkflowSection() {
  const { t } = useI18n();
  return (
    <section
      id="how-it-works"
      className="py-24 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="workflow-heading"
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow={t("landing.wf.eyebrow")}
          title={t("landing.wf.title")}
          subtitle={t("landing.wf.sub")}
          headingId="workflow-heading"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {workflowSteps.map((step, i) => (
            <div key={step.titleKey} className="workflow-step flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{
                    background: "var(--bg-raised)",
                    border: "1px solid var(--border-mid)",
                  }}
                >
                  {step.icon}
                </div>
                <span
                  className="text-sm font-bold gradient-text"
                  style={{ opacity: 0.7 }}
                >
                  0{i + 1}
                </span>
              </div>

              <div>
                <h3
                  className="text-base font-semibold mb-1.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t(step.titleKey)}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t(step.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── DASHBOARD MOCKUP ──────────────────────────────────── */
function DashboardSection() {
  const { t } = useI18n();
  return (
    <section
      id="product"
      className="py-20 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="dashboard-heading"
    >
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          eyebrow={t("landing.dash.eyebrow")}
          title={t("landing.dash.title")}
          subtitle={t("landing.dash.sub")}
          headingId="dashboard-heading"
        />

        {/* Browser frame */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: "1px solid var(--border-mid)",
            background: "var(--bg-surface)",
            boxShadow:
              "0 0 0 1px var(--border-subtle), 0 32px 80px rgba(0,0,0,0.55), 0 0 60px rgba(37,99,235,0.07)",
          }}
        >
          <BrowserChrome url="app.applymate.ai/dashboard" />

          {/* Dashboard body */}
          <div className="flex" style={{ minHeight: "400px" }}>
            {/* Sidebar */}
            <div
              className="hidden md:flex flex-col items-center gap-3 py-5 px-3 flex-shrink-0"
              style={{
                width: "52px",
                background: "var(--bg-overlay)",
                borderRight: "1px solid var(--border-subtle)",
              }}
            >
              {sidebarIcons.map(({ icon, active }) => (
                <div
                  key={icon}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{
                    background: active ? "var(--blue-dim)" : "transparent",
                    border: active
                      ? "1px solid rgba(59,130,246,0.3)"
                      : "1px solid transparent",
                  }}
                >
                  {icon}
                </div>
              ))}
            </div>

            {/* Job list panel */}
            <div
              className="flex-1 flex flex-col p-5 gap-3"
              style={{ borderRight: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("landing.dash.jobMatches")}
                  <span
                    className="ml-2 font-normal text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t("landing.dash.foundToday")}
                  </span>
                </p>
                <div className="flex gap-2">
                  {[t("landing.dash.filterMatch"), t("landing.dash.filterGeo")].map((f) => (
                    <span
                      key={f}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--bg-raised)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {jobs.map((job) => (
                <JobRow key={job.role} job={job} />
              ))}

              <p
                className="text-xs text-center pt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {t("landing.dash.hiddenAuto")}{" "}
                <span style={{ color: "var(--blue)" }}>{t("common.showAll")}</span>
              </p>
            </div>

            {/* Application tracker panel */}
            <div
              className="hidden md:flex flex-col p-5 gap-3 flex-shrink-0"
              style={{ width: "272px" }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {t("landing.dash.applications")}
                <span
                  className="ml-2 font-normal text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t("landing.dash.active")}
                </span>
              </p>

              {trackerEntries.map((entry) => (
                <div key={entry.role} className="tracker-entry">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                      opacity: 0.85,
                    }}
                  >
                    {entry.company[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {entry.role}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {entry.time}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={entry.statusStyle}
                  >
                    {t(entry.statusKey)}
                  </span>
                </div>
              ))}

              {/* Approval note */}
              <div
                className="mt-1 p-3 rounded-xl"
                style={{
                  background: "rgba(59,130,246,0.04)",
                  border: "1px dashed var(--border-mid)",
                }}
              >
                <p
                  className="text-xs font-medium mb-0.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("landing.dash.approvalRequired")}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("landing.dash.approvalRequiredDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CONTROL ROOM (approval + inbox previews) ──────────── */
function ControlRoomSection() {
  const { t } = useI18n();
  return (
    <section
      className="py-20 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="control-heading"
    >
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          eyebrow={t("landing.ctrl.eyebrow")}
          title={t("landing.ctrl.title")}
          subtitle={t("landing.ctrl.sub")}
          headingId="control-heading"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
          {/* Approval card mock */}
          <div
            className="rounded-2xl p-6 flex flex-col"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--blue)" }}>
              {t("landing.ctrl.reviewQueue")}
            </p>
            <div
              className="rounded-xl p-4 flex-1"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border-mid)" }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
                >
                  E
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    AI Engineer Working Student
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>ExampleTech GmbH · Berlin / Remote</p>
                </div>
                <span className="text-sm font-bold flex-shrink-0" style={{ color: "#60a5fa" }}>86%</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {materialKeys.map((m) => (
                  <span
                    key={m.labelKey}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                    style={{ background: "rgba(34,197,94,0.06)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.12)" }}
                  >
                    {m.icon} {t(m.labelKey)}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ color: "var(--text-muted)", border: "1px solid var(--border-mid)" }}
                >
                  {t("landing.ctrl.decline")}
                </span>
                <span className="flex-1" />
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                  style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
                >
                  {t("common.approveApply")}
                </span>
              </div>
            </div>
            <p className="text-xs mt-4" style={{ color: "var(--text-secondary)" }}>
              {t("landing.ctrl.packageNote")}
            </p>
          </div>

          {/* Inbox reply mock */}
          <div
            className="rounded-2xl p-6 flex flex-col"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--blue)" }}>
              {t("landing.ctrl.inbox")}
            </p>
            <div
              className="rounded-xl p-4 flex-1"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border-mid)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
                <p className="text-sm font-bold flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                  {t("landing.ctrl.interviewSubject")}
                </p>
                <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>2h</span>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                &ldquo;We&rsquo;d like to invite you to a 45-minute video interview tomorrow at 14:00…&rdquo;
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}
                >
                  {t("type.interview")}
                </span>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--blue-dim)", color: "var(--blue)", border: "1px solid rgba(59,130,246,0.18)" }}
                >
                  {t("landing.ctrl.prepChip")}
                </span>
              </div>
              <div
                className="rounded-lg px-3 py-2 text-[11px]"
                style={{ background: "rgba(59,130,246,0.05)", border: "1px dashed var(--border-mid)", color: "var(--text-secondary)" }}
              >
                {t("landing.ctrl.aiPrep")}
              </div>
            </div>
            <p className="text-xs mt-4" style={{ color: "var(--text-secondary)" }}>
              {t("landing.ctrl.triaged")}
            </p>
          </div>
        </div>

        {/* Small supporting cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className="rounded-xl px-5 py-4 flex items-center gap-3"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <span className="text-xl" aria-hidden="true">🚫</span>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("landing.ctrl.lowFitTitle")}</span>{" "}
              {t("landing.ctrl.lowFitDesc")}
            </p>
          </div>
          <div
            className="rounded-xl px-5 py-4 flex items-center gap-3"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <span className="text-xl" aria-hidden="true">⏰</span>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("landing.ctrl.followTitle")}</span>{" "}
              {t("landing.ctrl.followDesc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── BEFORE / AFTER ────────────────────────────────────── */
function CompareSection() {
  const { t } = useI18n();
  return (
    <section
      className="py-20 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="compare-heading"
    >
      <div className="max-w-4xl mx-auto">
        <SectionHeading
          eyebrow={t("landing.cmp.eyebrow")}
          title={t("landing.cmp.title")}
          headingId="compare-heading"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Before */}
          <div
            className="rounded-2xl p-7"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-5"
              style={{ color: "var(--text-muted)" }}
            >
              {t("landing.cmp.without")}
            </p>
            <div className="flex flex-col gap-3.5">
              {beforeKeys.map((key) => (
                <div key={key} className="compare-row">
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{
                      background: "rgba(248,113,113,0.08)",
                      color: "#f87171",
                      border: "1px solid rgba(248,113,113,0.15)",
                    }}
                  >
                    ✕
                  </span>
                  {t(key)}
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div
            className="rounded-2xl p-7"
            style={{
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.09), rgba(14,165,233,0.05))",
              border: "1px solid rgba(59,130,246,0.3)",
            }}
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-5"
              style={{ color: "var(--blue)" }}
            >
              {t("landing.cmp.with")}
            </p>
            <div className="flex flex-col gap-3.5">
              {afterKeys.map((key) => (
                <div key={key} className="compare-row" style={{ color: "var(--text-primary)" }}>
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      color: "#4ade80",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    ✓
                  </span>
                  {t(key)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── DIFFERENTIATION ───────────────────────────────────── */
function DifferentiationSection() {
  const { t } = useI18n();
  return (
    <section
      id="why"
      className="py-20 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="why-heading"
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow={t("landing.why.eyebrow")}
          title={t("landing.why.title")}
          subtitle={t("landing.why.sub")}
          headingId="why-heading"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {differentiators.map((d) => (
            <div key={d.titleKey} className="feature-card">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3"
                style={{
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border-mid)",
                }}
              >
                {d.icon}
              </div>
              <h3 className="text-base font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                {t(d.titleKey)}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {t(d.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PRICING ───────────────────────────────────────────── */
function PricingSection() {
  const { t } = useI18n();
  return (
    <section
      id="pricing"
      className="py-20 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-4xl mx-auto">
        <SectionHeading
          eyebrow={t("landing.price.eyebrow")}
          title={t("landing.price.title")}
          subtitle={t("landing.price.sub")}
          headingId="pricing-heading"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Free card */}
          <div
            className="rounded-2xl p-8 relative"
            style={{
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(14,165,233,0.06))",
              border: "1px solid rgba(59,130,246,0.35)",
            }}
          >
            <div
              className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
            >
              {t("landing.price.activeNow")}
            </div>
            <h3
              className="text-xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {t("landing.price.freeBeta")}
            </h3>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-bold gradient-text">$0</span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {t("landing.price.perMonth")}
              </span>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {t("landing.price.noCatch")}
            </p>
            <ul className="space-y-2.5 mb-8">
              {freeFeatureKeys.map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span style={{ color: "#60a5fa" }}>✓</span>
                  {t(key)}
                </li>
              ))}
            </ul>
            <a
              href="/profile"
              id="pricing-free-btn"
              className="btn-primary w-full justify-center"
            >
              {t("landing.price.getStartedFree")}
            </a>
          </div>

          {/* Pro card */}
          <div
            className="rounded-2xl p-8 relative"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                color: "var(--text-muted)",
                border: "1px solid var(--border-mid)",
              }}
            >
              {t("landing.price.comingSoon")}
            </div>
            <h3
              className="text-xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Pro
            </h3>
            <div className="flex items-baseline gap-1 mb-3">
              <span
                className="text-4xl font-bold"
                style={{ color: "var(--text-muted)" }}
              >
                TBD
              </span>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {t("landing.price.proSub")}
            </p>
            <ul className="space-y-2.5 mb-8">
              {proFeatureKeys.map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>✓</span>
                  {t(key)}
                </li>
              ))}
            </ul>
            <WaitlistButton />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA BANNER ────────────────────────────────────────── */
function CtaBanner() {
  const { t } = useI18n();
  return (
    <section
      className="py-20 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <div
          className="rounded-3xl p-12 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.13) 0%, rgba(14,165,233,0.07) 100%)",
            border: "1px solid rgba(59,130,246,0.22)",
          }}
        >
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% -10%, rgba(37,99,235,0.22) 0%, transparent 60%)",
            }}
          />
          <h2 className="relative text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t("landing.cta.title")}
          </h2>
          <p
            className="relative text-base mb-8 max-w-xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("common.motto")}
          </p>
          <a href="/profile" id="cta-banner-btn" className="btn-primary inline-flex">
            {t("landing.hero.ctaPrimary")}
          </a>
          <p
            className="relative mt-5 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {t("landing.cta.foot")}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER ────────────────────────────────────────────── */
function Footer() {
  const { t } = useI18n();
  return (
    <footer
      className="py-10 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
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
          {t("landing.footer.builtBy")}{" "}
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            Onur Balic
          </span>
        </p>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} ApplyMate AI · {t("landing.footer.rights")}
        </p>
      </div>
    </footer>
  );
}

/* ── DATA (companies, roles, and layout constants stay in
      English — surrounding UI text is translated) ───────── */

const jobs: {
  role: string;
  company: string;
  match: number;
  barClass: string;
  statusKey: TKey;
  statusStyle: React.CSSProperties;
}[] = [
  {
    role: "Junior Data Analyst",
    company: "DataCorp",
    match: 91,
    barClass: "animate-bar-91",
    statusKey: "status.ready",
    statusStyle: {
      background: "rgba(34,197,94,0.12)",
      color: "#4ade80",
      border: "1px solid rgba(34,197,94,0.2)",
    },
  },
  {
    role: "AI Engineer (Working Student)",
    company: "ExampleTech",
    match: 86,
    barClass: "animate-bar-86",
    statusKey: "status.draftReady",
    statusStyle: {
      background: "var(--blue-dim)",
      color: "var(--blue)",
      border: "1px solid rgba(59,130,246,0.2)",
    },
  },
  {
    role: "Marketing Analyst",
    company: "SocialMetrics",
    match: 52,
    barClass: "animate-bar-52",
    statusKey: "status.lowFitHiddenChip",
    statusStyle: {
      background: "var(--bg-overlay)",
      color: "var(--text-muted)",
      border: "1px solid var(--border-subtle)",
    },
  },
];

const trustPills: { icon: string; labelKey: TKey }[] = [
  { icon: "🎯", labelKey: "landing.trust.highMatch" },
  { icon: "✋", labelKey: "landing.trust.approve" },
  { icon: "🚫", labelKey: "landing.trust.noMass" },
  { icon: "🇪🇺", labelKey: "landing.trust.eu" },
  { icon: "📬", labelKey: "landing.trust.replies" },
];

const workflowSteps: { icon: string; titleKey: TKey; descKey: TKey }[] = [
  { icon: "🔭", titleKey: "landing.wf.scan", descKey: "landing.wf.scanDesc" },
  { icon: "🎯", titleKey: "landing.wf.match", descKey: "landing.wf.matchDesc" },
  { icon: "✍️", titleKey: "landing.wf.prepare", descKey: "landing.wf.prepareDesc" },
  { icon: "✋", titleKey: "landing.wf.approve", descKey: "landing.wf.approveDesc" },
  { icon: "📊", titleKey: "landing.wf.track", descKey: "landing.wf.trackDesc" },
];

const sidebarIcons = [
  { icon: "🚀", active: false },
  { icon: "🎯", active: true },
  { icon: "📋", active: false },
  { icon: "⚙️", active: false },
];

const trackerEntries: {
  role: string;
  company: string;
  time: string;
  statusKey: TKey;
  statusStyle: React.CSSProperties;
}[] = [
  {
    role: "Junior Data Analyst",
    company: "DataCorp",
    time: "2d",
    statusKey: "stage.applied",
    statusStyle: {
      background: "var(--blue-dim)",
      color: "var(--blue)",
      border: "1px solid rgba(59,130,246,0.2)",
    },
  },
  {
    role: "Analytics Engineer",
    company: "FinStack",
    time: "5d",
    statusKey: "stage.reply",
    statusStyle: {
      background: "rgba(250,204,21,0.1)",
      color: "#eab308",
      border: "1px solid rgba(250,204,21,0.2)",
    },
  },
  {
    role: "AI Engineer",
    company: "ExampleTech",
    time: "2d →",
    statusKey: "stage.followUp",
    statusStyle: {
      background: "rgba(251,146,60,0.1)",
      color: "#f97316",
      border: "1px solid rgba(251,146,60,0.2)",
    },
  },
  {
    role: "Data Scientist Intern",
    company: "BioML Labs",
    time: "14:00",
    statusKey: "stage.interview",
    statusStyle: {
      background: "rgba(34,197,94,0.12)",
      color: "#4ade80",
      border: "1px solid rgba(34,197,94,0.2)",
    },
  },
];

const materialKeys: { icon: string; labelKey: TKey }[] = [
  { icon: "✉️", labelKey: "material.coverLetter" },
  { icon: "💬", labelKey: "material.recruiterMessage" },
  { icon: "🎤", labelKey: "material.interviewPrep" },
];

const beforeKeys: TKey[] = [
  "landing.cmp.b1",
  "landing.cmp.b2",
  "landing.cmp.b3",
  "landing.cmp.b4",
  "landing.cmp.b5",
];

const afterKeys: TKey[] = [
  "landing.cmp.a1",
  "landing.cmp.a2",
  "landing.cmp.a3",
  "landing.cmp.a4",
  "landing.cmp.a5",
];

const differentiators: { icon: string; titleKey: TKey; descKey: TKey }[] = [
  { icon: "🎯", titleKey: "landing.why.d1", descKey: "landing.why.d1Desc" },
  { icon: "✋", titleKey: "landing.why.d2", descKey: "landing.why.d2Desc" },
  { icon: "🇪🇺", titleKey: "landing.why.d3", descKey: "landing.why.d3Desc" },
  { icon: "🛡️", titleKey: "landing.why.d4", descKey: "landing.why.d4Desc" },
  { icon: "📬", titleKey: "landing.why.d5", descKey: "landing.why.d5Desc" },
  { icon: "🧠", titleKey: "landing.why.d6", descKey: "landing.why.d6Desc" },
];

const freeFeatureKeys: TKey[] = [
  "landing.price.f1",
  "landing.price.f2",
  "landing.price.f3",
  "landing.price.f4",
  "landing.price.f5",
  "landing.price.f6",
];

const proFeatureKeys: TKey[] = [
  "landing.price.p1",
  "landing.price.p2",
  "landing.price.p3",
  "landing.price.p4",
  "landing.price.p5",
];
