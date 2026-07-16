"use client";

import { useSyncExternalStore } from "react";
import type { CandidateProfile } from "./ai/contracts";

/* ─────────────────────────────────────────────────────────
   Candidate Profile — client-side localStorage store.

   The structured profile is the single source of truth sent
   to AI generation endpoints. It is never read server-side
   directly — the client serialises it into POST bodies.

   Pre-populated with the ApplyMate demo profile so the AI
   generation flow works before a full profile editor is built.

   Profile editing UI (form fields) comes in a future sprint.
   ───────────────────────────────────────────────────────── */

export const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  // Personal
  fullName: "Onur Balic",
  email: "onur@example.com",
  phone: "",
  city: "Hildesheim",
  country: "Germany",
  linkedIn: "",
  gitHub: "",
  portfolio: "",

  // Professional
  headline: "Data Analytics M.Sc. Student | Python · SQL · dbt · ML · AI Engineering",
  professionalSummary:
    "Data Analytics M.Sc. candidate at the University of Hildesheim with a strong technical foundation in Python, SQL, and dbt, combined with hands-on experience in machine learning, LLM-based systems, and business intelligence. Skilled at translating raw data into actionable insights and building end-to-end pipelines. Actively pursuing working student and junior roles in applied AI and data engineering — primarily in Germany and remote-friendly environments.",
  workExperience: [
    {
      id: "exp-1",
      role: "Data Analytics & AI Engineering — Coursework and Projects",
      company: "University of Hildesheim",
      period: "2022 – present",
      bullets: [
        "Designed and maintained modular dbt data models and transformation pipelines for analytical reporting use cases.",
        "Built and evaluated machine learning models (classification, regression, NLP) using Python, Scikit-learn, and PyTorch.",
        "Developed interactive dashboards and BI reports translating complex datasets into business-readable insights.",
        "Explored LLM and Retrieval-Augmented Generation (RAG) architectures as part of applied AI engineering coursework.",
        "Managed end-to-end data workflows including ingestion, cleaning, validation, and delivery to downstream consumers.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "M.Sc. Data Analytics",
      institution: "University of Hildesheim",
      period: "2022 – present",
      notes: "Focus on machine learning, data engineering, and applied AI.",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "LLM-based Job Matching System (ApplyMate AI)",
      stack: ["Next.js", "TypeScript", "Gemini API", "Tailwind CSS"],
      description:
        "Built an AI-powered job application assistant that generates application packages from candidate profiles and job descriptions using structured LLM outputs.",
    },
    {
      id: "proj-2",
      name: "RAG Pipeline for Document Q&A",
      stack: ["Python", "LangChain", "FAISS", "OpenAI"],
      description:
        "Implemented a retrieval-augmented generation pipeline enabling semantic search and Q&A over large document collections.",
    },
    {
      id: "proj-3",
      name: "dbt Analytics Pipeline",
      stack: ["dbt", "SQL", "Python", "BigQuery"],
      description:
        "Designed and built modular dbt models with testing and documentation for an analytical data layer serving BI reporting.",
    },
  ],
  technicalSkills: [
    "Python",
    "SQL",
    "dbt",
    "Machine Learning",
    "Data Analytics",
    "Git",
    "LLMs",
    "RAG",
    "Scikit-learn",
    "PyTorch",
    "Jupyter",
    "GitHub",
  ],
  languages: [
    { language: "English", level: "C1" },
    { language: "German", level: "B2" },
    { language: "Turkish", level: "Native" },
  ],
  certifications: [],

  // Application preferences
  targetJobTitles: [
    "Data Analyst",
    "AI Engineer",
    "Data Scientist",
    "Analytics Engineer",
    "Machine Learning Engineer",
    "Working Student AI/Data",
  ],
  preferredLocations: ["Germany", "Remote"],
  remotePreference: "hybrid",
  employmentTypes: ["Working student", "Internship", "Junior", "Entry-level"],
  salaryExpectation: "",
  noticePeriod: "Immediately available",
  earliestStartDate: "",
  workAuthorization: "",
  visaSponsorshipRequired: false,
  willingToRelocate: false,
  preferredApplicationLanguage: "English",

  // Reusable answers
  whyInterestedInRoleTemplate:
    "I am drawn to applied AI and data engineering roles where I can build systems that create real business value. I enjoy working across the full data stack — from pipelines and transformations to ML models and AI-powered features.",
  availabilityNote: "Available as a working student; open to internships and junior roles.",
};

/* ── Store ───────────────────────────────────────────────── */

const LS_KEY = "applymate-candidate-profile";

let cache: CandidateProfile | null = null;
const listeners = new Set<() => void>();

function readProfile(): CandidateProfile {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CandidateProfile>;
      // Merge with defaults to handle schema additions across versions
      return { ...DEFAULT_CANDIDATE_PROFILE, ...parsed };
    }
  } catch {
    /* storage unavailable or corrupted */
  }
  return DEFAULT_CANDIDATE_PROFILE;
}

export function saveProfile(updates: Partial<CandidateProfile>) {
  const current = cache ?? DEFAULT_CANDIDATE_PROFILE;
  const next: CandidateProfile = { ...current, ...updates };
  cache = next;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep in-memory */
  }
  listeners.forEach((cb) => cb());
}

const store = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot(): CandidateProfile {
    if (cache === null) cache = readProfile();
    return cache;
  },
  getServerSnapshot: (): CandidateProfile => DEFAULT_CANDIDATE_PROFILE,
};

export function useCandidateProfile(): CandidateProfile {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
}

/** Read the current profile without subscribing (one-shot, client only). */
export function getProfileSnapshot(): CandidateProfile {
  if (typeof window === "undefined") return DEFAULT_CANDIDATE_PROFILE;
  return store.getSnapshot();
}
