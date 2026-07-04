/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Landing Page (v5)
   Premium platform framing · "Job application operating system"
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
  return (
    <header className="landing-header fixed top-0 left-0 right-0 z-50 h-16 flex items-center">
      <div className="max-w-6xl mx-auto w-full px-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5" aria-label="ApplyMate AI home">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white animate-glow-pulse"
            style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
          >
            A
          </div>
          <span className="font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            ApplyMate <span className="gradient-text">AI</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {[
            { label: "How it works", href: "#how-it-works" },
            { label: "Product",      href: "#product" },
            { label: "Why ApplyMate", href: "#why" },
            { label: "Pricing",      href: "#pricing" },
          ].map(({ label, href }) => (
            <a key={label} href={href} className="nav-link text-sm">{label}</a>
          ))}
        </nav>

        <a
          href="/profile"
          id="header-start-free-btn"
          className="btn-primary"
          style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}
        >
          Get started →
        </a>
      </div>
    </header>
  );
}

/* ── HERO ──────────────────────────────────────────────── */
function HeroSection() {
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
          Free beta · No credit card required
        </div>

        <h1
          id="hero-headline"
          className="text-5xl md:text-6xl lg:text-[4rem] font-bold tracking-tight leading-[1.08] mb-5 animate-fade-up-d1"
        >
          Your AI job application{" "}
          <br className="hidden sm:block" />
          <span className="gradient-text">operating system.</span>
        </h1>

        <p
          className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-up-d2"
          style={{ color: "var(--text-secondary)" }}
        >
          Set up one profile. ApplyMate scans trusted job sources, hides low-fit roles,
          prepares each application — and waits for your approval before anything is sent.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up-d3">
          <a href="/profile" id="hero-primary-cta" className="btn-primary w-full sm:w-auto justify-center">
            Set up your profile →
          </a>
          <a
            href="/dashboard"
            id="hero-secondary-cta"
            className="btn-ghost w-full sm:w-auto justify-center"
          >
            See the dashboard →
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
          <span className="font-bold" style={{ color: "#60a5fa" }}>91% match</span> — Junior Data Analyst
        </span>
      </div>
      <div className="float-card animate-float-d1 hidden lg:flex" style={{ top: "70px", right: "-185px" }}>
        <span aria-hidden="true">🔒</span>
        <span>Waiting for <span className="font-semibold" style={{ color: "var(--text-primary)" }}>your approval</span></span>
      </div>
      <div className="float-card animate-float-d2 hidden lg:flex" style={{ bottom: "36px", left: "-165px" }}>
        <span aria-hidden="true">📬</span>
        <span>Reply received — <span className="font-semibold" style={{ color: "#4ade80" }}>interview invite</span></span>
      </div>
      <div className="float-card animate-float hidden lg:flex" style={{ bottom: "-14px", right: "-150px" }}>
        <span aria-hidden="true">🚫</span>
        <span>45 low-fit jobs hidden</span>
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
            <div key={s.label} className="text-center">
              <p className="text-sm font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Job list */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              High-match jobs
            </span>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full"
              style={{
                background: "var(--blue-dim)",
                color: "var(--blue)",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              75%+ match only
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {jobs.map((job) => (
              <JobRow key={job.role} job={job} compact />
            ))}
          </div>

          <p className="text-[11px] text-center pt-3" style={{ color: "var(--text-muted)" }}>
            🔒 Nothing is submitted without your approval
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
        {job.status}
      </span>
    </div>
  );
}

/* ── TRUST STRIP ───────────────────────────────────────── */
function TrustStrip() {
  return (
    <div
      className="py-5 px-6"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-center flex-wrap gap-2.5">
        {trustPills.map(({ icon, label }) => (
          <div key={label} className="trust-pill">
            <span aria-hidden="true">{icon}</span>
            {label}
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
  return (
    <section
      id="how-it-works"
      className="py-24 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="workflow-heading"
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="How it works"
          title="One profile. One repeatable workflow."
          subtitle="The same five steps run for every job — you only step in where your judgment matters."
          headingId="workflow-heading"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {workflowSteps.map((step, i) => (
            <div key={step.title} className="workflow-step flex flex-col gap-4">
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
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {step.description}
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
  return (
    <section
      id="product"
      className="py-20 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="dashboard-heading"
    >
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          eyebrow="Platform preview"
          title="Your whole job search, one dashboard"
          subtitle="Scanning, matching, prepared applications, and reply tracking — without switching tools."
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
                  Job Matches
                  <span
                    className="ml-2 font-normal text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    49 found today
                  </span>
                </p>
                <div className="flex gap-2">
                  {["75%+ match", "Germany / Remote"].map((f) => (
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
                45 low-fit jobs hidden automatically ·{" "}
                <span style={{ color: "var(--blue)" }}>Show all</span>
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
                Applications
                <span
                  className="ml-2 font-normal text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  4 active
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
                    {entry.status}
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
                  ✋ Approval required
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Every application waits in your review queue until you approve it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── BEFORE / AFTER ────────────────────────────────────── */
function CompareSection() {
  return (
    <section
      className="py-20 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="compare-heading"
    >
      <div className="max-w-4xl mx-auto">
        <SectionHeading
          eyebrow="The difference"
          title="Job searching is a workflow. Treat it like one."
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
              Without ApplyMate
            </p>
            <div className="flex flex-col gap-3.5">
              {beforeItems.map((item) => (
                <div key={item} className="compare-row">
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
                  {item}
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
              With ApplyMate
            </p>
            <div className="flex flex-col gap-3.5">
              {afterItems.map((item) => (
                <div key={item} className="compare-row" style={{ color: "var(--text-primary)" }}>
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
                  {item}
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
  return (
    <section
      id="why"
      className="py-20 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="why-heading"
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="Why ApplyMate"
          title="Built for quality, not application volume"
          subtitle="Mass auto-apply tools spray hundreds of weak applications. ApplyMate sends fewer, better ones — and only with your sign-off."
          headingId="why-heading"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {differentiators.map((d) => (
            <div key={d.title} className="feature-card">
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
                {d.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {d.description}
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
  return (
    <section
      id="pricing"
      className="py-20 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-4xl mx-auto">
        <SectionHeading
          eyebrow="Pricing"
          title="Free while we build."
          subtitle="Full product access during beta. Transparent pricing before anything changes."
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
              Active now
            </div>
            <h3
              className="text-xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Free Beta
            </h3>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-bold gradient-text">$0</span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                /month
              </span>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              No credit card. Full access. No catch.
            </p>
            <ul className="space-y-2.5 mb-8">
              {freePlanFeatures.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span style={{ color: "#60a5fa" }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="/profile"
              id="pricing-free-btn"
              className="btn-primary w-full justify-center"
            >
              Get started free
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
              Coming soon
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
              Beta users get early access at a discounted rate when Pro launches.
            </p>
            <ul className="space-y-2.5 mb-8">
              {proPlanFeatures.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              id="pricing-pro-btn"
              disabled
              className="w-full py-3 rounded-xl text-sm font-semibold cursor-not-allowed opacity-40"
              style={{
                border: "1px solid var(--border-mid)",
                color: "var(--text-muted)",
              }}
            >
              Notify me when available
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA BANNER ────────────────────────────────────────── */
function CtaBanner() {
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
            Build your profile once.
          </h2>
          <p
            className="relative text-base mb-8 max-w-xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Let ApplyMate handle the repetitive workflow — scanning, filtering, and drafting —
            while you make the decisions that matter.
          </p>
          <a href="/profile" id="cta-banner-btn" className="btn-primary inline-flex">
            Set up your profile →
          </a>
          <p
            className="relative mt-5 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            Free beta · No credit card · You approve every application
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER ────────────────────────────────────────────── */
function Footer() {
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

/* ── DATA ──────────────────────────────────────────────── */

/** Shared job data — used in hero preview and dashboard mockup */
const jobs = [
  {
    role: "Junior Data Analyst",
    company: "DataCorp",
    match: 91,
    barClass: "animate-bar-91",
    status: "Ready",
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
    status: "Draft ready",
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
    status: "Low fit · Hidden",
    statusStyle: {
      background: "var(--bg-overlay)",
      color: "var(--text-muted)",
      border: "1px solid var(--border-subtle)",
    },
  },
];

const heroStats = [
  { value: "1,240", label: "Jobs scanned", color: "var(--text-primary)" },
  { value: "49", label: "High-match", color: "#60a5fa" },
  { value: "45", label: "Low-fit hidden", color: "var(--text-muted)" },
  { value: "4", label: "Awaiting approval", color: "#4ade80" },
];

const trustPills = [
  { icon: "🎯", label: "High-match jobs only" },
  { icon: "✋", label: "You approve every application" },
  { icon: "🚫", label: "No mass auto-apply" },
  { icon: "🇪🇺", label: "Germany & Europe aware" },
  { icon: "📬", label: "Reply & follow-up tracking" },
];

const workflowSteps = [
  {
    icon: "🔭",
    title: "Scan",
    description:
      "ApplyMate watches trusted sources — LinkedIn, StepStone, Indeed, and company career pages.",
  },
  {
    icon: "🎯",
    title: "Match",
    description:
      "Every job is scored against your profile. Roles under your 75% threshold are hidden automatically.",
  },
  {
    icon: "✍️",
    title: "Prepare",
    description:
      "A tailored cover letter, recruiter message, CV notes, and interview prep — drafted per role.",
  },
  {
    icon: "✋",
    title: "Approve",
    description:
      "Nothing is submitted without you. Review the full package, then approve, skip, or decline.",
  },
  {
    icon: "📊",
    title: "Track",
    description:
      "Every application, reply, and follow-up reminder lives in one tracker — no spreadsheet needed.",
  },
];

const sidebarIcons = [
  { icon: "🚀", active: false },
  { icon: "🎯", active: true },
  { icon: "📋", active: false },
  { icon: "⚙️", active: false },
];

const trackerEntries = [
  {
    role: "Junior Data Analyst",
    company: "DataCorp",
    time: "Applied · 2d ago",
    status: "Applied",
    statusStyle: {
      background: "var(--blue-dim)",
      color: "var(--blue)",
      border: "1px solid rgba(59,130,246,0.2)",
    },
  },
  {
    role: "Analytics Engineer",
    company: "FinStack",
    time: "Sent · 5d ago",
    status: "Reply pending",
    statusStyle: {
      background: "rgba(250,204,21,0.1)",
      color: "#eab308",
      border: "1px solid rgba(250,204,21,0.2)",
    },
  },
  {
    role: "AI Engineer",
    company: "ExampleTech",
    time: "Follow-up in 2d",
    status: "Follow-up due",
    statusStyle: {
      background: "rgba(251,146,60,0.1)",
      color: "#f97316",
      border: "1px solid rgba(251,146,60,0.2)",
    },
  },
  {
    role: "Data Scientist Intern",
    company: "BioML Labs",
    time: "Interview · Tomorrow",
    status: "Interview",
    statusStyle: {
      background: "rgba(34,197,94,0.12)",
      color: "#4ade80",
      border: "1px solid rgba(34,197,94,0.2)",
    },
  },
];

const beforeItems = [
  "Manually searching five job boards every day",
  "Saving random links in tabs, notes, and bookmarks",
  "Rewriting the same cover letter for every role",
  "Applying to jobs that were never a realistic fit",
  "Forgetting who replied and when to follow up",
];

const afterItems = [
  "ApplyMate scans trusted sources continuously",
  "Low-fit roles are hidden before they waste your time",
  "Tailored drafts prepared for every high-match job",
  "You review and approve before anything is sent",
  "Replies and follow-up reminders tracked in one inbox",
];

const differentiators = [
  {
    icon: "🎯",
    title: "High-match only",
    description:
      "A 75%+ match threshold keeps weak applications out of your queue. Quality over spray-and-pray.",
  },
  {
    icon: "✋",
    title: "You approve everything",
    description:
      "Every application waits for your explicit sign-off. ApplyMate prepares — you decide.",
  },
  {
    icon: "🇪🇺",
    title: "Germany & Europe aware",
    description:
      "Visa and work-authorization awareness, German language filtering, and regional boards like StepStone.",
  },
  {
    icon: "🛡️",
    title: "Quality & risk analysis",
    description:
      "Each application gets a quality score and risk flags — skill gaps, language level, authorization — before you approve.",
  },
  {
    icon: "📬",
    title: "Reply tracking",
    description:
      "Interview invites, pending replies, and follow-up reminders organized automatically.",
  },
  {
    icon: "🧠",
    title: "Profile that compounds",
    description:
      "Improve your profile once and every future match, draft, and score gets better with it.",
  },
];

const freePlanFeatures = [
  "Job matching & fit scores",
  "Low-fit filtering & skill gap analysis",
  "Tailored cover letters & recruiter messages",
  "Application review & approval queue",
  "Application tracker",
  "Unlimited use during beta",
];

const proPlanFeatures = [
  "Everything in Free",
  "Priority AI processing",
  "Multiple CV profiles",
  "Email reply tracking",
  "Team workspace",
];
