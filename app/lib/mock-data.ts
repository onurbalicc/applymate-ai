/* ─────────────────────────────────────────────────────────
   Shared mock data — single source of truth.
   Review flow:  /review-queue, /review
   Inbox:        /inbox, dashboard inbox panel
   Tracker:      /tracker, dashboard applications panel
   ───────────────────────────────────────────────────────── */

import type { TKey } from "./translations";

export interface ReviewJob {
  role: string;
  company: string;
  location: string;
  score: number;
  threshold: number;
  whyFits: string;
  matches: string[];
  gaps: string[];
  materials: { icon: string; labelKey: TKey }[];
  // Review detail fields
  source: string;
  found: string;
  workType: string;
  salary: string;
  qualityScore: number;
  qualityLabel: string;
  qualityBreakdown: { labelKey: TKey; pct: number }[];
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
      { icon: "✉️", labelKey: "material.coverLetter" },
      { icon: "💬", labelKey: "material.recruiterMessage" },
      { icon: "🎤", labelKey: "material.interviewPrep" },
    ],
    source: "StepStone",
    found: "12 minutes ago",
    workType: "Working student",
    salary: "Not listed",
    qualityScore: 82,
    qualityLabel: "Ready with minor improvements",
    qualityBreakdown: [
      { labelKey: "quality.jobFit", pct: 86 },
      { labelKey: "quality.cvAlignment", pct: 82 },
      { labelKey: "quality.coverLetter", pct: 84 },
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
      { icon: "✉️", labelKey: "material.coverLetter" },
      { icon: "💬", labelKey: "material.recruiterMessage" },
    ],
    source: "LinkedIn",
    found: "34 minutes ago",
    workType: "Junior full-time",
    salary: "€42,000 – €48,000",
    qualityScore: 90,
    qualityLabel: "Strong application",
    qualityBreakdown: [
      { labelKey: "quality.jobFit", pct: 91 },
      { labelKey: "quality.cvAlignment", pct: 89 },
      { labelKey: "quality.coverLetter", pct: 88 },
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
      { icon: "✉️", labelKey: "material.coverLetter" },
      { icon: "🎤", labelKey: "material.interviewPrep" },
    ],
    source: "Indeed",
    found: "2 hours ago",
    workType: "Internship (6 months)",
    salary: "€1,800/month",
    qualityScore: 72,
    qualityLabel: "Needs strengthening",
    qualityBreakdown: [
      { labelKey: "quality.jobFit", pct: 79 },
      { labelKey: "quality.cvAlignment", pct: 68 },
      { labelKey: "quality.coverLetter", pct: 76 },
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
      { icon: "✉️", labelKey: "material.coverLetter" },
      { icon: "💬", labelKey: "material.recruiterMessage" },
      { icon: "🎤", labelKey: "material.interviewPrep" },
    ],
    source: "Company career page",
    found: "1 hour ago",
    workType: "Working student / Part-time",
    salary: "Not listed",
    qualityScore: 85,
    qualityLabel: "Ready to submit",
    qualityBreakdown: [
      { labelKey: "quality.jobFit", pct: 84 },
      { labelKey: "quality.cvAlignment", pct: 86 },
      { labelKey: "quality.coverLetter", pct: 85 },
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

/* ─────────────────────────────────────────────────────────
   Inbox — application reply center
   ───────────────────────────────────────────────────────── */

export type InboxType = "interview" | "reply" | "follow-up" | "rejection" | "new";

export interface InboxMessage {
  id: number;
  type: InboxType;
  company: string;
  role: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  actionKey: TKey;
}

/** Visual metadata per inbox message type (shared by /inbox and dashboard panel) */
export const inboxTypeMeta: Record<InboxType, { labelKey: TKey; color: string; bg: string; border: string }> = {
  interview:   { labelKey: "type.interview", color: "#4ade80",           bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.15)" },
  reply:       { labelKey: "type.reply", color: "#fde047",           bg: "rgba(250,204,21,0.06)",  border: "rgba(250,204,21,0.15)" },
  "follow-up": { labelKey: "type.followUp", color: "#fb923c",           bg: "rgba(251,146,60,0.06)",  border: "rgba(251,146,60,0.15)" },
  rejection:   { labelKey: "type.rejection", color: "var(--text-muted)", bg: "var(--bg-overlay)",      border: "var(--border-subtle)" },
  new:         { labelKey: "type.new", color: "#93c5fd",           bg: "var(--blue-dim)",        border: "rgba(59,130,246,0.18)" },
};

export const inboxMessages: InboxMessage[] = [
  {
    id: 1,
    type: "interview",
    company: "BioML Labs",
    role: "Data Scientist Intern",
    from: "talent@bioml-labs.de",
    subject: "Interview invitation — Data Scientist Intern",
    preview: "Hi Onur, thank you for your application. We'd like to invite you to a 45-minute video interview tomorrow at 14:00…",
    time: "2h ago",
    unread: true,
    actionKey: "action.prepareInterview",
  },
  {
    id: 2,
    type: "reply",
    company: "FinStack",
    role: "Analytics Engineer",
    from: "recruiting@finstack.io",
    subject: "Re: Analytics Engineer application",
    preview: "Thanks for reaching out! Your dbt background looks interesting. Would you have time for a short call this week?",
    time: "6h ago",
    unread: true,
    actionKey: "action.draftReply",
  },
  {
    id: 3,
    type: "new",
    company: "DataCorp",
    role: "Junior Data Analyst",
    from: "careers@datacorp.de",
    subject: "Your application has been received",
    preview: "Dear applicant, this is a confirmation that your application for Junior Data Analyst has entered our review process…",
    time: "1d ago",
    unread: true,
    actionKey: "action.classify",
  },
  {
    id: 4,
    type: "follow-up",
    company: "ExampleTech GmbH",
    role: "AI Engineer Working Student",
    from: "you → jobs@exampletech.de",
    subject: "Follow-up due — no reply after 7 days",
    preview: "A polite follow-up draft is ready for your review. It references your original application from last week…",
    time: "Due in 2d",
    unread: false,
    actionKey: "action.sendFollowUp",
  },
  {
    id: 5,
    type: "rejection",
    company: "SocialMetrics",
    role: "Marketing Analyst",
    from: "no-reply@socialmetrics.com",
    subject: "Update on your application",
    preview: "Thank you for your interest. We have decided to move forward with other candidates for this position…",
    time: "3d ago",
    unread: false,
    actionKey: "action.archive",
  },
];

/** Draft reply shown in the inbox suggested-reply card (for message id 2). */
export const suggestedReply = {
  forMessageId: 2,
  to: "recruiting@finstack.io",
  subject: "Re: Analytics Engineer application",
  body: `Hi, thanks a lot for getting back to me!

I'd be glad to have a short call this week. I'm generally available Tuesday to Thursday between 10:00 and 16:00 — happy to adapt to whatever suits your schedule.

Looking forward to speaking about the Analytics Engineer role and the team's dbt setup.

Best regards,
Onur Balic`,
};

/* ─────────────────────────────────────────────────────────
   Tracker — application pipeline
   ───────────────────────────────────────────────────────── */

export type TrackerStage = "applied" | "reply" | "follow-up" | "interview" | "archived";

export interface TrackerApp {
  role: string;
  company: string;
  stage: TrackerStage;
  score: number;
  lastEvent: string;
  nextAction: string;
}

/** Visual + label metadata per pipeline stage (shared by /tracker and dashboard panel) */
export const trackerStageMeta: Record<TrackerStage, { labelKey: TKey; color: string; bg: string; border: string; dot: string }> = {
  applied:     { labelKey: "stage.applied", color: "#93c5fd",           bg: "var(--blue-dim)",        border: "rgba(59,130,246,0.18)", dot: "#60a5fa" },
  reply:       { labelKey: "type.reply", color: "#fde047",           bg: "rgba(250,204,21,0.06)",  border: "rgba(250,204,21,0.15)", dot: "#fde047" },
  "follow-up": { labelKey: "stage.followUp", color: "#fb923c",           bg: "rgba(251,146,60,0.06)",  border: "rgba(251,146,60,0.15)", dot: "#fb923c" },
  interview:   { labelKey: "stage.interview", color: "#4ade80",           bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.15)",  dot: "#4ade80" },
  archived:    { labelKey: "stage.archived", color: "var(--text-muted)", bg: "var(--bg-overlay)",      border: "var(--border-subtle)",  dot: "var(--text-muted)" },
};

export const trackerStageOrder: TrackerStage[] = ["applied", "reply", "follow-up", "interview", "archived"];

export const trackerApps: TrackerApp[] = [
  {
    role: "Junior Data Analyst",
    company: "DataCorp",
    stage: "applied",
    score: 91,
    lastEvent: "Applied 2d ago · confirmation received",
    nextAction: "Wait — follow-up scheduled in 5d",
  },
  {
    role: "Analytics Engineer",
    company: "FinStack",
    stage: "reply",
    score: 84,
    lastEvent: "Recruiter replied 6h ago",
    nextAction: "Draft reply ready for your review",
  },
  {
    role: "AI Engineer Working Student",
    company: "ExampleTech GmbH",
    stage: "follow-up",
    score: 86,
    lastEvent: "No reply after 7 days",
    nextAction: "Approve follow-up draft",
  },
  {
    role: "Data Scientist Intern",
    company: "BioML Labs",
    stage: "interview",
    score: 79,
    lastEvent: "Interview tomorrow · 14:00",
    nextAction: "Open interview prep",
  },
  {
    role: "Marketing Analyst",
    company: "SocialMetrics",
    stage: "archived",
    score: 52,
    lastEvent: "Rejected 3d ago · position filled",
    nextAction: "No action — archived",
  },
];
