/* ─────────────────────────────────────────────────────────
   Job Discovery — Demo provider.

   Always available; produces clearly labelled demo jobs so
   the review queue and ranking pipeline have something to
   work with when no live provider is configured or reachable.

   PROVIDER HONESTY:
   - isDemo: true on every job — never presented as live data.
   - Real providers (Greenhouse, Lever) live in
     app/lib/job-discovery/providers/ and are called
     server-side from app/api/discover/route.ts.
   ───────────────────────────────────────────────────────── */

import type { DiscoveryQuery, ProviderResult } from "./contracts";

export function demoProvider(query: DiscoveryQuery): ProviderResult {
  const now = new Date();
  const daysAgo = (d: number) =>
    new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

  const pool = [
    {
      id: "demo:demo-001",
      provider: "demo",
      sourceLabel: "Demo",
      isDemo: true,
      role: "Data Analytics Working Student",
      company: "NordAI GmbH",
      location: "Hamburg, Germany",
      remoteType: "hybrid" as const,
      employmentType: "Working student",
      salaryRange: "€520/month",
      postedAt: daysAgo(1),
      applyUrl: "#demo-job",
      jobDescription: `We are looking for a Data Analytics Working Student to join our growing team.
You will work with Python, SQL, and dbt to build data pipelines and analytics dashboards.
Requirements: Python, SQL, dbt, data visualization, analytical thinking.
Nice to have: Machine Learning, Jupyter, pandas.
Employment: Working student (20h/week), hybrid (Hamburg).`,
    },
    {
      id: "demo:demo-002",
      provider: "demo",
      sourceLabel: "Demo",
      isDemo: true,
      role: "AI Engineer Intern",
      company: "TechVenture Berlin",
      location: "Berlin / Remote",
      remoteType: "remote" as const,
      employmentType: "Internship",
      salaryRange: "€1,200/month",
      postedAt: daysAgo(2),
      applyUrl: "#demo-job",
      jobDescription: `Join our AI team as an intern and contribute to LLM-based features and data pipelines.
Requirements: Python, LLMs, familiarity with APIs. Nice to have: RAG, vector databases, FastAPI.
We are open to candidates with strong project portfolios even without direct industry experience.
Location: Fully remote or Berlin office.`,
    },
    {
      id: "demo:demo-003",
      provider: "demo",
      sourceLabel: "Demo",
      isDemo: true,
      role: "Junior Data Scientist",
      company: "FinData GmbH",
      location: "Munich, Germany",
      remoteType: "hybrid" as const,
      employmentType: "Junior",
      salaryRange: "€42,000–€48,000/year",
      postedAt: daysAgo(5),
      applyUrl: "#demo-job",
      jobDescription: `We are seeking a Junior Data Scientist to support our analytics team.
Requirements: Python, Scikit-learn, SQL, statistics. Nice to have: PyTorch, NLP, A/B testing.
This is an entry-level role suitable for recent graduates or working students transitioning to full-time.`,
    },
    {
      id: "demo:demo-004",
      provider: "demo",
      sourceLabel: "Demo",
      isDemo: true,
      role: "Machine Learning Engineer Working Student",
      company: "DeepStack Labs",
      location: "Remote",
      remoteType: "remote" as const,
      employmentType: "Working student",
      salaryRange: "€480/month",
      postedAt: daysAgo(3),
      applyUrl: "#demo-job",
      jobDescription: `Looking for an ML Engineering working student to help productionise ML models.
Requirements: Python, PyTorch or TensorFlow, Git. Experience with LLMs or RAG is a strong plus.
We work fully remotely — strong written communication is important.`,
    },
    {
      id: "demo:demo-005",
      provider: "demo",
      sourceLabel: "Demo",
      isDemo: true,
      role: "Analytics Engineer (dbt)",
      company: "CloudMetrics AG",
      location: "Zurich / Remote",
      remoteType: "hybrid" as const,
      employmentType: "Junior",
      salaryRange: "€55,000–€65,000/year",
      postedAt: daysAgo(7),
      applyUrl: "#demo-job",
      jobDescription: `We are hiring an Analytics Engineer to own our dbt data transformation layer.
Requirements: dbt, SQL, BigQuery or Snowflake, data modeling, Git. Nice to have: Python, Airflow.
Fully bilingual team (English + German). B2 German preferred.`,
    },
  ];

  // Relevance pre-filter: only apply when the profile expresses a clear
  // data/AI focus — otherwise (empty or unrelated target roles) return the
  // full demo pool so the pipeline still has something to rank.
  const targetRolesText = query.targetRoles.join(", ").toLowerCase();
  const isDataFocused = targetRolesText.includes("data") || targetRolesText.includes("analyt");
  const isAiFocused   = targetRolesText.includes("ai") || targetRolesText.includes("machine") || targetRolesText.includes("ml");
  const hasFocus = isDataFocused || isAiFocused;

  const relevant = hasFocus
    ? pool.filter((j) => {
        const text = (j.role + " " + j.jobDescription).toLowerCase();
        return (
          (isDataFocused && text.includes("data")) ||
          (isAiFocused && (text.includes("ai") || text.includes("ml") || text.includes("machine") || text.includes("llm")))
        );
      })
    : pool;

  // Exclude by query excluded keywords
  const filtered = relevant.filter((j) => {
    const text = (j.role + " " + j.jobDescription).toLowerCase();
    return !query.excludedKeywords.some((kw) => text.includes(kw.toLowerCase()));
  });

  return {
    jobs: filtered,
    provider: "demo",
    providerLabel: "Demo",
    isDemo: true,
    error: null,
  };
}
