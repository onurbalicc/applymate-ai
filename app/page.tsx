/* ─────────────────────────────────────────────────────────
   ApplyMate AI – Landing Page (v4)
   Visual-first · Less text · Platform framing
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
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center"
      style={{
        background: "rgba(6, 13, 26, 0.88)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
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
            { label: "Product",      href: "#product" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Pricing",      href: "#pricing" },
          ].map(({ label, href }) => (
            <a key={label} href={href} className="nav-link text-sm">{label}</a>
          ))}
        </nav>

        <a
          href="/dashboard"
          id="header-start-free-btn"
          className="btn-primary"
          style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}
        >
          Open dashboard →
        </a>
      </div>
    </header>
  );
}

/* ── HERO ──────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      className="relative pt-36 pb-10 px-6 overflow-hidden grid-bg"
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
            color: "#93c5fd",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#60a5fa" }}
          />
          Free beta · No credit card required
        </div>

        <h1
          id="hero-headline"
          className="text-5xl md:text-6xl lg:text-[4rem] font-bold tracking-tight leading-[1.1] mb-5 animate-fade-up-d1"
        >
          Focus on getting better.
          <br className="hidden sm:block" />
          <span className="gradient-text">Let AI handle the applications.</span>
        </h1>

        <p
          className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-up-d2"
          style={{ color: "var(--text-secondary)" }}
        >
          Find high-match jobs, prepare tailored applications, and track every reply —
          from one simple dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up-d3">
          <a href="/dashboard" id="hero-primary-cta" className="btn-primary w-full sm:w-auto justify-center">
            Open dashboard →
          </a>
          <a
            href="/analyze"
            id="hero-secondary-cta"
            className="btn-ghost w-full sm:w-auto justify-center"
          >
            Analyze a job →
          </a>
        </div>
      </div>

      {/* Hero dashboard preview */}
      <HeroPreview />
    </section>
  );
}

/* ── HERO PREVIEW (compact job list) ───────────────────── */
function HeroPreview() {
  return (
    <div className="relative max-w-2xl mx-auto mt-14 animate-fade-up-d3">
      {/* Glow under frame */}
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-16 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(37,99,235,0.22) 0%, transparent 70%)",
          filter: "blur(18px)",
        }}
      />

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
        {/* Chrome bar */}
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
            app.applymate.ai/jobs
          </div>
        </div>

        {/* Job list */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Job matches
            </span>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full"
              style={{
                background: "var(--blue-dim)",
                color: "#93c5fd",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              75%+ match only
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {jobs.map((job) => (
              <div
                key={job.role}
                className="job-row"
                style={{ opacity: job.match < 70 ? 0.35 : 1 }}
              >
                {/* Logo */}
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

                {/* Info + bar */}
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
                          job.match >= 85
                            ? "#60a5fa"
                            : job.match >= 75
                            ? "#93c5fd"
                            : "var(--text-muted)",
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

                {/* Status chip */}
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                  style={job.statusStyle}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
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

/* ── WORKFLOW ──────────────────────────────────────────── */
function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      className="py-24 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      aria-labelledby="workflow-heading"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "#60a5fa" }}
          >
            How it works
          </p>
          <h2
            id="workflow-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight"
          >
            Your complete job search workflow
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((step, i) => (
            <div key={step.title} className="workflow-step flex flex-col gap-4">
              {/* Icon + step number */}
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
        {/* Header */}
        <div className="text-center mb-10">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "#60a5fa" }}
          >
            Platform preview
          </p>
          <h2
            id="dashboard-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            Everything in one dashboard
          </h2>
          <p
            className="text-base max-w-md mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Find jobs, check your fit, prepare applications, and track replies —
            without switching tools.
          </p>
        </div>

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
          {/* Chrome */}
          <div
            className="flex items-center gap-2 px-4 h-10"
            style={{
              background: "var(--bg-overlay)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex gap-1.5">
              {["#f87171", "#facc15", "#4ade80"].map((c) => (
                <span
                  key={c}
                  className="w-3 h-3 rounded-full"
                  style={{ background: c, opacity: 0.65 }}
                />
              ))}
            </div>
            <div
              className="flex-1 mx-4 h-5 rounded-md flex items-center px-3 text-xs"
              style={{
                background: "var(--bg-raised)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              app.applymate.ai/dashboard
            </div>
          </div>

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
              {/* Panel header */}
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
                    12 found
                  </span>
                </p>
                <div className="flex gap-2">
                  {["75%+ match", "Remote"].map((f) => (
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

              {/* Job rows */}
              {jobs.map((job) => (
                <div
                  key={job.role}
                  className="job-row"
                  style={{ opacity: job.match < 70 ? 0.32 : 1 }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
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
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {job.role}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          · {job.company}
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold ml-2 flex-shrink-0"
                        style={{
                          color:
                            job.match >= 85
                              ? "#60a5fa"
                              : job.match >= 75
                              ? "#93c5fd"
                              : "var(--text-muted)",
                        }}
                      >
                        {job.match}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
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
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={job.statusStyle}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <p
                className="text-xs text-center pt-1"
                style={{ color: "var(--text-muted)" }}
              >
                3 low-fit jobs hidden ·{" "}
                <span style={{ color: "#60a5fa" }}>Show all</span>
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

              {/* Reply tracking teaser */}
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
                  📬 Email reply tracking
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Coming soon — auto-detect replies and set follow-up reminders.
                </p>
              </div>
            </div>
          </div>
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
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "#60a5fa" }}
          >
            Pricing
          </p>
          <h2
            id="pricing-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            Free while we build.
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            Full product access during beta. Transparent pricing before anything changes.
          </p>
        </div>

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
              href="/dashboard"
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
            Ready to apply smarter?
          </h2>
          <p
            className="relative text-base mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            Join the beta. High-fit jobs, tailored applications, full control.
          </p>
          <a href="/dashboard" id="cta-banner-btn" className="btn-primary inline-flex">
            Start free today →
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

/** Shared job data — used in hero preview and dashboard */
const jobs = [
  {
    role: "Data Analyst",
    company: "Google",
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
    role: "AI Engineer",
    company: "OpenAI",
    match: 84,
    barClass: "animate-bar-84",
    status: "Draft ready",
    statusStyle: {
      background: "var(--blue-dim)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.2)",
    },
  },
  {
    role: "Mktg Analyst",
    company: "Meta",
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

const trustPills = [
  { icon: "🎯", label: "High-match jobs only" },
  { icon: "✋", label: "User-approved applications" },
  { icon: "🚫", label: "No mass auto-apply" },
  { icon: "📊", label: "Application tracking" },
  { icon: "🔔", label: "Follow-up reminders" },
];

const workflowSteps = [
  {
    icon: "🔍",
    title: "Find",
    description:
      "Discover relevant jobs from trusted sources, matched to your skills and experience.",
  },
  {
    icon: "🎯",
    title: "Match",
    description:
      "See your fit score instantly. Jobs under 75% are hidden so you focus on real opportunities.",
  },
  {
    icon: "✍️",
    title: "Apply",
    description:
      "Generate a tailored cover letter, CV notes, and recruiter message. You review before sending.",
  },
  {
    icon: "📊",
    title: "Track",
    description:
      "Monitor every application — status, replies, and follow-up reminders in one place.",
  },
];

const sidebarIcons = [
  { icon: "🏠", active: false },
  { icon: "🔍", active: true },
  { icon: "📋", active: false },
  { icon: "⚙️", active: false },
];

const trackerEntries = [
  {
    role: "Data Analyst",
    company: "Google",
    time: "Applied · 2d ago",
    status: "Applied",
    statusStyle: {
      background: "var(--blue-dim)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.2)",
    },
  },
  {
    role: "Product Manager",
    company: "Notion",
    time: "Sent · 5d ago",
    status: "Reply pending",
    statusStyle: {
      background: "rgba(250,204,21,0.1)",
      color: "#fde047",
      border: "1px solid rgba(250,204,21,0.2)",
    },
  },
  {
    role: "UX Designer",
    company: "Figma",
    time: "Follow-up in 2d",
    status: "Follow-up due",
    statusStyle: {
      background: "rgba(251,146,60,0.1)",
      color: "#fb923c",
      border: "1px solid rgba(251,146,60,0.2)",
    },
  },
  {
    role: "AI Engineer",
    company: "Anthropic",
    time: "Interview · Tomorrow",
    status: "Interview",
    statusStyle: {
      background: "rgba(34,197,94,0.12)",
      color: "#4ade80",
      border: "1px solid rgba(34,197,94,0.2)",
    },
  },
];

const freePlanFeatures = [
  "Job matching & fit scores",
  "Skill gap analysis",
  "Tailored cover letters",
  "Recruiter outreach messages",
  "Application tracker",
  "Unlimited analyses during beta",
];

const proPlanFeatures = [
  "Everything in Free",
  "Priority AI processing",
  "Multiple CV profiles",
  "Email reply tracking",
  "Team workspace",
];
