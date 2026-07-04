/* ─────────────────────────────────────────────────────────
   Shared mock data for review queue + review detail.
   Single source of truth. Used by /review-queue and /review.
   ───────────────────────────────────────────────────────── */

export interface ReviewJob {
  role: string;
  company: string;
  location: string;
  score: number;
  threshold: number;
  whyFits: string;
  matches: string[];
  gaps: string[];
  materials: { icon: string; label: string }[];
  // Review detail fields
  source: string;
  found: string;
  workType: string;
  salary: string;
  qualityScore: number;
  qualityLabel: string;
  qualityBreakdown: { label: string; pct: number }[];
  riskLevel: string;
  whyFitsBullets: string[];
  risks: { label: string; severity: "High" | "Medium" | "Low" }[];
  recommendation: string;
  coverLetter: string;
  recruiterMessage: string;
  cvImprovements: string[];
  interviewQuestions: string[];
}

export const reviewJobs: ReviewJob[] = [
  // ── Job 0: ExampleTech GmbH ──
  {
    role: "AI Engineer Working Student",
    company: "ExampleTech GmbH",
    location: "Berlin / Remote",
    score: 86,
    threshold: 75,
    whyFits: "Strong overlap with Python, SQL, and ML requirements. Your LLM projects and data analytics background match the team's applied AI focus.",
    matches: ["Python", "SQL", "Machine Learning", "Data Analytics"],
    gaps: ["FastAPI", "Docker"],
    materials: [
      { icon: "✉️", label: "Cover letter" },
      { icon: "💬", label: "Recruiter message" },
      { icon: "🎤", label: "Interview prep" },
    ],
    source: "StepStone",
    found: "12 minutes ago",
    workType: "Working student",
    salary: "Not listed",
    qualityScore: 82,
    qualityLabel: "Ready with minor improvements",
    qualityBreakdown: [
      { label: "Job fit", pct: 86 },
      { label: "CV alignment", pct: 82 },
      { label: "Cover letter quality", pct: 84 },
    ],
    riskLevel: "Medium",
    whyFitsBullets: [
      "Python and SQL match the core technical requirements.",
      "Machine learning and data analytics background fit the applied AI focus.",
      "LLM/RAG portfolio direction supports the AI engineering angle.",
      "Remote-friendly working student setup matches your preferences.",
    ],
    risks: [
      { label: "Missing FastAPI experience", severity: "Medium" },
      { label: "Missing Docker proof", severity: "Medium" },
      { label: "German level should be clarified", severity: "Low" },
      { label: "Work authorization details incomplete", severity: "High" },
    ],
    recommendation: "Apply, but strengthen the application with a short project paragraph about backend/API experience.",
    coverLetter: `Dear Hiring Team,

I am writing to express my interest in the AI Engineer Working Student position at ExampleTech GmbH. I am currently pursuing my M.Sc. in Data Analytics at the University of Hildesheim, with a focus on machine learning and applied AI.

During my studies, I have built projects using Python, SQL, and dbt for data pipeline work, and have recently been exploring AI engineering with LLMs and retrieval-augmented generation (RAG). I am drawn to applied AI — building systems that create real business value rather than staying theoretical.

I would welcome the opportunity to contribute to your team's work in applied AI while continuing to grow as an engineer. I am available as a working student and based in Germany.

Thank you for your consideration.

Best regards,
Onur Balic`,
    recruiterMessage: `Hi! I saw the AI Engineer Working Student role at ExampleTech and wanted to reach out. I'm currently doing my M.Sc. in Data Analytics with a focus on Python, SQL, and machine learning. I've been building projects with LLMs and RAG recently and am very interested in applied AI work.

I'm based in Germany and available as a working student. Would you be open to a quick chat about the role?`,
    cvImprovements: [
      "Add a FastAPI or API-focused project to demonstrate backend engineering skills relevant to the role.",
      "Mention Docker if used in any portfolio or coursework projects, even briefly.",
      "Clarify your German language level and work authorization status explicitly in your CV header.",
    ],
    interviewQuestions: [
      "Why are you interested in this AI Engineer Working Student role at ExampleTech?",
      "How would you approach building a small LLM-based job matching feature from scratch?",
      "Tell us about a Python/SQL project you worked on — what was the problem and how did you solve it?",
      "How would you evaluate whether an AI-generated application is good enough to send?",
    ],
  },

  // ── Job 1: DataCorp ──
  {
    role: "Junior Data Analyst",
    company: "DataCorp",
    location: "Berlin",
    score: 91,
    threshold: 75,
    whyFits: "Your SQL and data analytics skills are a direct match. Python experience and dashboard projects align perfectly with the role requirements.",
    matches: ["SQL", "Python", "Data Analytics", "Tableau"],
    gaps: ["Looker"],
    materials: [
      { icon: "✉️", label: "Cover letter" },
      { icon: "💬", label: "Recruiter message" },
    ],
    source: "LinkedIn",
    found: "34 minutes ago",
    workType: "Junior full-time",
    salary: "€42,000 – €48,000",
    qualityScore: 90,
    qualityLabel: "Strong application",
    qualityBreakdown: [
      { label: "Job fit", pct: 91 },
      { label: "CV alignment", pct: 89 },
      { label: "Cover letter quality", pct: 88 },
    ],
    riskLevel: "Low",
    whyFitsBullets: [
      "SQL is the core requirement and your strongest technical skill.",
      "Data analytics coursework and projects directly match the role.",
      "Python experience adds value for automation and advanced analysis.",
      "Berlin-based position aligns with your location preferences.",
    ],
    risks: [
      { label: "Missing Looker experience", severity: "Low" },
      { label: "No prior industry data analyst experience", severity: "Medium" },
      { label: "Salary expectation alignment unknown", severity: "Low" },
    ],
    recommendation: "Strong fit. Apply with confidence. Mention Tableau experience as evidence of BI tool proficiency to offset Looker gap.",
    coverLetter: `Dear DataCorp Hiring Team,

I am applying for the Junior Data Analyst position. I am pursuing my M.Sc. in Data Analytics at the University of Hildesheim, where I have developed strong skills in SQL, Python, and data visualization.

Through coursework and personal projects, I have built interactive dashboards using Tableau and worked with large datasets to extract actionable insights. I enjoy turning messy data into clear stories that help teams make better decisions.

I am excited about the opportunity to bring my analytical skills to DataCorp and contribute to your data-driven culture. I am based in Berlin and available to start at your earliest convenience.

Best regards,
Onur Balic`,
    recruiterMessage: `Hi! I came across the Junior Data Analyst role at DataCorp on LinkedIn. I'm finishing my M.Sc. in Data Analytics and have strong experience with SQL, Python, and Tableau. I'd love to learn more about the role and how the data team is structured.

I'm based in Berlin and ready to start. Would you be open to a brief call?`,
    cvImprovements: [
      "Add a section highlighting specific SQL projects with quantifiable results (e.g., 'Optimized queries reducing report generation time by 40%').",
      "Mention any Looker or similar BI tool exposure, even from tutorials or certifications.",
      "Include a brief portfolio link with 2–3 dashboard screenshots if available.",
    ],
    interviewQuestions: [
      "Walk us through how you would approach a data quality issue in a production dataset.",
      "Describe a Tableau dashboard you built. What was the business question it answered?",
      "How comfortable are you writing complex SQL joins and window functions?",
      "How would you communicate a data insight to a non-technical stakeholder?",
    ],
  },

  // ── Job 2: BioML Labs ──
  {
    role: "Data Scientist Intern",
    company: "BioML Labs",
    location: "Munich",
    score: 79,
    threshold: 75,
    whyFits: "Your ML coursework and Python projects cover the core requirements. Statistics background helps. Some gaps in bioinformatics domain knowledge.",
    matches: ["Python", "Machine Learning", "Statistics"],
    gaps: ["R", "Bioinformatics", "TensorFlow"],
    materials: [
      { icon: "✉️", label: "Cover letter" },
      { icon: "🎤", label: "Interview prep" },
    ],
    source: "Indeed",
    found: "2 hours ago",
    workType: "Internship (6 months)",
    salary: "€1,800/month",
    qualityScore: 72,
    qualityLabel: "Needs strengthening",
    qualityBreakdown: [
      { label: "Job fit", pct: 79 },
      { label: "CV alignment", pct: 68 },
      { label: "Cover letter quality", pct: 76 },
    ],
    riskLevel: "Medium-High",
    whyFitsBullets: [
      "Python and ML coursework cover the core technical foundation.",
      "Statistics background is relevant for biomedical data analysis.",
      "Academic research mindset aligns with the lab environment.",
      "Internship format is realistic for your current study phase.",
    ],
    risks: [
      { label: "No bioinformatics domain knowledge", severity: "High" },
      { label: "Missing R experience (used heavily in the lab)", severity: "Medium" },
      { label: "No TensorFlow experience (team uses TF, not PyTorch)", severity: "Medium" },
      { label: "Munich relocation may be needed", severity: "Low" },
    ],
    recommendation: "Apply, but address the domain gap directly. Mention any biology-adjacent coursework or willingness to learn bioinformatics fundamentals. Consider highlighting PyTorch experience as transferable to TensorFlow.",
    coverLetter: `Dear BioML Labs Team,

I am writing to apply for the Data Scientist Intern position. I am currently completing my M.Sc. in Data Analytics at the University of Hildesheim, with coursework in machine learning and statistics.

While my background is in data analytics rather than bioinformatics specifically, I have a strong foundation in Python, statistical modeling, and ML experimentation. I am eager to apply these skills in a biomedical context and am committed to quickly building domain knowledge in bioinformatics.

I am excited about the opportunity to contribute to meaningful research at BioML Labs while growing as a data scientist.

Best regards,
Onur Balic`,
    recruiterMessage: `Hi! I noticed the Data Scientist Intern role at BioML Labs on Indeed. I'm doing my M.Sc. in Data Analytics with a focus on ML and statistics. While I'm new to bioinformatics, I'm very interested in applying ML to biomedical problems and learn quickly.

Would you be open to a quick chat about the role and the team's work?`,
    cvImprovements: [
      "Add any biology, chemistry, or health-related coursework to show cross-domain interest.",
      "Highlight any experience with large scientific datasets or research methodology.",
      "Mention willingness to learn R and TensorFlow explicitly in your cover letter or CV summary.",
    ],
    interviewQuestions: [
      "What interests you about applying machine learning to biomedical data?",
      "How would you handle a dataset with many missing values in a clinical trial context?",
      "Describe a machine learning model you trained. How did you evaluate its performance?",
      "How quickly can you pick up a new programming language or framework? Give an example.",
    ],
  },

  // ── Job 3: FinStack ──
  {
    role: "Analytics Engineer",
    company: "FinStack",
    location: "Remote — Germany",
    score: 84,
    threshold: 75,
    whyFits: "Your dbt and SQL experience directly match the core stack. Data pipeline work aligns with the team's analytics engineering focus.",
    matches: ["SQL", "dbt", "Python", "Git"],
    gaps: ["Airflow", "Snowflake"],
    materials: [
      { icon: "✉️", label: "Cover letter" },
      { icon: "💬", label: "Recruiter message" },
      { icon: "🎤", label: "Interview prep" },
    ],
    source: "Company career page",
    found: "1 hour ago",
    workType: "Working student / Part-time",
    salary: "Not listed",
    qualityScore: 85,
    qualityLabel: "Ready to submit",
    qualityBreakdown: [
      { label: "Job fit", pct: 84 },
      { label: "CV alignment", pct: 86 },
      { label: "Cover letter quality", pct: 85 },
    ],
    riskLevel: "Low",
    whyFitsBullets: [
      "dbt is the core tool and your experience maps directly to the requirements.",
      "SQL proficiency is the foundation of analytics engineering.",
      "Git workflow experience matches the team's engineering culture.",
      "Remote-friendly setup from Germany fits your situation perfectly.",
    ],
    risks: [
      { label: "No Airflow experience for pipeline orchestration", severity: "Medium" },
      { label: "No Snowflake experience (team's primary warehouse)", severity: "Medium" },
      { label: "FinTech domain knowledge not demonstrated", severity: "Low" },
    ],
    recommendation: "Strong fit for the core stack. Apply with confidence. Mention any data pipeline orchestration experience as transferable to Airflow.",
    coverLetter: `Dear FinStack Team,

I am applying for the Analytics Engineer position. I am pursuing my M.Sc. in Data Analytics at the University of Hildesheim, with hands-on experience in dbt, SQL, and Python for data transformation and pipeline work.

I have used dbt to build modular data models and SQL to create analytical layers from raw data sources. I enjoy the engineering side of analytics — writing clean, tested, version-controlled transformations that teams can rely on.

The opportunity to work remotely with a FinTech analytics team is exciting to me. I am confident my skills align well with your stack and am ready to contribute.

Best regards,
Onur Balic`,
    recruiterMessage: `Hi! I found the Analytics Engineer role on FinStack's career page. I have hands-on experience with dbt, SQL, and Python for data pipeline work. I'm currently doing my M.Sc. in Data Analytics and am looking for a remote working student role in Germany.

I'd love to learn more about the analytics engineering team. Open to a quick call?`,
    cvImprovements: [
      "Add a dbt project case study showing model structure, testing approach, and data quality checks.",
      "Mention any exposure to cloud data warehouses (BigQuery, Redshift) as transferable to Snowflake.",
      "Highlight Git workflow habits (branch strategy, PR reviews) to demonstrate engineering discipline.",
    ],
    interviewQuestions: [
      "How do you structure a dbt project for a growing analytics team?",
      "Describe how you would test a data transformation to ensure accuracy.",
      "What's the difference between a view, a table, and an incremental model in dbt?",
      "How would you handle a situation where raw data from a source changes schema unexpectedly?",
    ],
  },
];
